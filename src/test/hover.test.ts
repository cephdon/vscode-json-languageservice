/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';

import assert = require('assert');
import Parser = require('../parser/jsonParser');
import SchemaService = require('../services/jsonSchemaService');
import JsonSchema = require('../jsonSchema');
import {JSONCompletion} from '../services/jsonCompletion';
import {JSONHover} from '../services/jsonHover';

import {Hover, TextDocument, TextDocumentIdentifier, Range, Position, TextEdit, MarkedString} from 'vscode-languageserver-types';

suite('JSON Hover', () => {

	function testComputeInfo(value: string, schema: JsonSchema.JSONSchema, position: Position): Thenable<Hover> {
		var uri = 'test://test.json';

		var schemaService = new SchemaService.JSONSchemaService(requestService);
		var hoverProvider = new JSONHover(schemaService, [], Promise);
		var id = "http://myschemastore/test1";
		schemaService.registerExternalSchema(id, ["*.json"], schema);

		var document = TextDocument.create(uri, 'json', 0, value);
		var jsonDoc = Parser.parse(value);
		return hoverProvider.doHover(document, position, jsonDoc);
	}

	let requestService = function(uri: string): Promise<string> {
		return Promise.reject<string>('Resource not found');
	}

	test('Simple schema', function(testDone) {

		var content = '{"a": 42, "b": "hello", "c": false}';
		var schema: JsonSchema.JSONSchema = {
			type: 'object',
			description: 'a very special object',
			properties: {
				'a': {
					type: 'number',
					description: 'A'
				},
				'b': {
					type: 'string',
					description: 'B'
				},
				'c': {
					type: 'boolean',
					description: 'C'
				}
			}
		};
		Promise.all([
			testComputeInfo(content, schema, { line: 0, character: 0 }).then((result) => {
				assert.deepEqual(result.contents, [ MarkedString.fromPlainText('a very special object')]);
			}),
			testComputeInfo(content, schema, { line: 0, character: 1 }).then((result) => {
				assert.deepEqual(result.contents, [ MarkedString.fromPlainText('A')]);
			}),
			testComputeInfo(content, schema, { line: 0, character: 32 }).then((result) => {
				assert.deepEqual(result.contents, [ MarkedString.fromPlainText('C')]);
			}),
			testComputeInfo(content, schema, { line: 0, character: 7 }).then((result) => {
				assert.deepEqual(result.contents, [ MarkedString.fromPlainText('A')]);
			})
		]).then(() => testDone(), (error) => testDone(error));
	});

	test('Nested schema', function(testDone) {

		var content = '{"a": 42, "b": "hello"}';
		var schema: JsonSchema.JSONSchema = {
			oneOf: [{
				type: 'object',
				description: 'a very special object',
				properties: {
					'a': {
						type: 'number',
						description: 'A'
					},
					'b': {
						type: 'string',
						description: 'B'
					},
				}
			}, {
					type: 'array'
				}]
		};
		Promise.all([
			testComputeInfo(content, schema, { line: 0, character: 0 }).then((result) => {
				assert.deepEqual(result.contents, [ MarkedString.fromPlainText('a very special object') ]);
			}),
			testComputeInfo(content, schema, { line: 0, character: 1 }).then((result) => {
				assert.deepEqual(result.contents, [ MarkedString.fromPlainText('A') ]);
			})
		]).then(() => testDone(), (error) => testDone(error));
	});
})