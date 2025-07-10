import { SwaggerOptions } from 'swagger-ui-express';

export const swaggerOptions: SwaggerOptions = {
  definition: {
    openapi: '3.1.0',
    info: {
      title: 'Customer Service RAG API',
      version: '1.0.0',
      description: 'API for searching and retrieving customer service reviews',
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server',
      },
    ],
    paths: {
      '/search': {
        post: {
          summary: 'Search reviews',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['query'],
                  properties: {
                    query: {
                      type: 'string',
                      description: 'Search query string',
                    },
                    limit: {
                      type: 'number',
                      description: 'Maximum number of results to return',
                      default: 5,
                    },
                    searchUseful: {
                      type: 'boolean',
                      description: 'Whether to search in useful reviews',
                      default: true,
                    },
                  },
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'Successful search results',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      answer: {
                        type: 'string',
                        description: 'Generated answer based on relevant reviews',
                      },
                      relevantReviews: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            title: {
                              type: 'string',
                            },
                            text: {
                              type: 'string',
                            },
                            rating: {
                              type: 'number',
                            },
                            date: {
                              type: 'string',
                            },
                            category: {
                              type: 'string',
                            },
                            useful: {
                              type: 'boolean',
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
            '500': {
              description: 'Server error',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      error: {
                        type: 'string',
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
  apis: ['./src/routes/*.ts'],
}; 