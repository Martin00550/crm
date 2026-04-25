/**
 * OpenAPI/Swagger Documentation Generator
 * Automatically generates API documentation from route definitions
 */

export const openAPIDocument = {
  openapi: '3.0.0',
  info: {
    title: 'BookGuard CRM API',
    version: '1.0.0',
    description: 'API for BookGuard CRM - Executive Command Center for Insurance Agencies',
    contact: {
      name: 'BookGuard Support',
      email: 'support@bookguard.tech',
    },
  },
  servers: [
    {
      url: 'http://localhost:3000',
      description: 'Development server',
    },
    {
      url: 'https://api.bookguard.tech',
      description: 'Production server',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
    schemas: {
      Error: {
        type: 'object',
        properties: {
          error: {
            type: 'object',
            properties: {
              type: { type: 'string', enum: ['validation', 'authentication', 'authorization', 'not_found', 'conflict', 'rate_limit', 'server'] },
              message: { type: 'string' },
              statusCode: { type: 'number' },
              requestId: { type: 'string' },
              timestamp: { type: 'string', format: 'date-time' },
            },
          },
        },
      },
      Client: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          name: { type: 'string' },
          email: { type: 'string', format: 'email' },
          phone: { type: 'string' },
          address: { type: 'string' },
          industry: { type: 'string' },
          portalAccessEnabled: { type: 'boolean' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      Policy: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          policyNumber: { type: 'string' },
          carrier: { type: 'string' },
          policyType: { type: 'string' },
          premium: { type: 'string' },
          effectiveDate: { type: 'string', format: 'date' },
          expirationDate: { type: 'string', format: 'date' },
          status: { type: 'string', enum: ['active', 'expired', 'cancelled', 'pending'] },
          healthScore: { type: 'number' },
          healthStatus: { type: 'string', enum: ['healthy', 'warning', 'at-risk'] },
        },
      },
    },
  },
  paths: {
    '/api/clients': {
      get: {
        summary: 'List clients',
        tags: ['Clients'],
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'List of clients',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    clients: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/Client' },
                    },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        summary: 'Create client',
        tags: ['Clients'],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'email'],
                properties: {
                  name: { type: 'string' },
                  email: { type: 'string', format: 'email' },
                  phone: { type: 'string' },
                  address: { type: 'string' },
                  industry: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Client created successfully',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Client',
                },
              },
            },
          },
        },
      },
    },
    '/api/clients/{id}': {
      get: {
        summary: 'Get client by ID',
        tags: ['Clients'],
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        responses: {
          '200': {
            description: 'Client details',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Client' },
              },
            },
          },
          '404': {
            description: 'Client not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },
      put: {
        summary: 'Update client',
        tags: ['Clients'],
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  email: { type: 'string', format: 'email' },
                  phone: { type: 'string' },
                  address: { type: 'string' },
                  industry: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Client updated successfully',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Client' },
              },
            },
          },
        },
      },
      delete: {
        summary: 'Delete client',
        tags: ['Clients'],
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        responses: {
          '200': {
            description: 'Client deleted successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/policies': {
      get: {
        summary: 'List policies',
        tags: ['Policies'],
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'agencyId',
            in: 'query',
            schema: { type: 'string', format: 'uuid' },
          },
          {
            name: 'status',
            in: 'query',
            schema: { type: 'string', enum: ['active', 'expired', 'cancelled', 'pending'] },
          },
        ],
        responses: {
          '200': {
            description: 'List of policies',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    policies: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/Policy' },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/policies/{id}': {
      get: {
        summary: 'Get policy by ID',
        tags: ['Policies'],
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        responses: {
          '200': {
            description: 'Policy details',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Policy' },
              },
            },
          },
        },
      },
      put: {
        summary: 'Update policy',
        tags: ['Policies'],
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  policyNumber: { type: 'string' },
                  carrier: { type: 'string' },
                  policyType: { type: 'string' },
                  premium: { type: 'string' },
                  effectiveDate: { type: 'string', format: 'date' },
                  expirationDate: { type: 'string', format: 'date' },
                  status: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Policy updated successfully',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Policy' },
              },
            },
          },
        },
      },
      delete: {
        summary: 'Delete policy',
        tags: ['Policies'],
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        responses: {
          '200': {
            description: 'Policy deleted successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/dashboard/stats': {
      get: {
        summary: 'Get dashboard statistics',
        tags: ['Dashboard'],
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'agencyId',
            in: 'query',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        responses: {
          '200': {
            description: 'Dashboard statistics',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    totalBookOfBusiness: { type: 'string' },
                    renewalsAtRisk: {
                      type: 'object',
                      properties: {
                        count: { type: 'number' },
                        volume: { type: 'string' },
                      },
                    },
                    totalPolicies: { type: 'number' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/import': {
      post: {
        summary: 'Import policies from CSV',
        tags: ['Import'],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                required: ['file'],
                properties: {
                  file: {
                    type: 'string',
                    format: 'binary',
                  },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Import completed',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    imported: { type: 'number' },
                    errors: { type: 'array', items: { type: 'string' } },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
  tags: [
    {
      name: 'Clients',
      description: 'Client management operations',
    },
    {
      name: 'Policies',
      description: 'Policy management operations',
    },
    {
      name: 'Dashboard',
      description: 'Dashboard statistics and analytics',
    },
    {
      name: 'Import',
      description: 'CSV import operations',
    },
  ],
};
