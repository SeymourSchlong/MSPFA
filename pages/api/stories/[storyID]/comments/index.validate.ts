// This file is automatically generated by `scripts/generate-validators`. Do not edit directly.

import { createValidator } from 'lib/server/api';

export default createValidator({
	$schema: 'http://json-schema.org/draft-07/schema#',
	$ref: '#/definitions/RequestMethod',
	definitions: {
		RequestMethod: {
			type: 'string',
			const: 'GET'
		}
	}
}, {
	$schema: 'http://json-schema.org/draft-07/schema#',
	$ref: '#/definitions/Request',
	definitions: {
		Request: {
			type: 'object',
			additionalProperties: false,
			properties: {
				body: {},
				query: {
					type: 'object',
					properties: {
						storyID: {
							type: 'string'
						},
						fromPageID: {
							anyOf: [
								{
									$ref: '#/definitions/StoryPageID'
								},
								{
									type: 'string'
								}
							],
							description: 'The page ID which comments are being requested from.'
						},
						limit: {
							anyOf: [
								{
									$ref: '#/definitions/integer'
								},
								{
									type: 'string'
								}
							],
							description: 'How many results to respond with.'
						},
						before: {
							type: 'string',
							description: 'Filter the results to only include comments posted before the comment with this ID.'
						},
						sort: {
							$ref: '#/definitions/StoryCommentsSortMode'
						}
					},
					required: [
						'storyID',
						'fromPageID'
					],
					additionalProperties: false
				},
				method: {
					type: 'string',
					const: 'GET'
				}
			},
			required: [
				'method',
				'query'
			]
		},
		StoryPageID: {
			$ref: '#/definitions/integer',
			minimum: 1
		},
		integer: {
			type: 'integer'
		},
		StoryCommentsSortMode: {
			type: 'string',
			enum: [
				'pageID',
				'newest',
				'oldest',
				'liked'
			]
		}
	}
});