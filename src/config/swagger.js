const swaggerJsdoc = require('swagger-jsdoc');
const config = require('./env');

const options = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'Spentra API',
      version: '1.0.0',
      description:
        'Expense Tracker MVP API — auth and personal expense management.',
    },
    servers: [
      {
        url: `http://localhost:${config.port}`,
        description: 'Local development',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT from `/api/auth/login` or `/api/auth/register`',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '6a5a67fa16aff4436e5a8b27' },
            name: { type: 'string', example: 'Test User' },
            email: {
              type: 'string',
              format: 'email',
              example: 'test@example.com',
            },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        AuthResponse: {
          type: 'object',
          properties: {
            token: {
              type: 'string',
              example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
            },
            user: { $ref: '#/components/schemas/User' },
          },
        },
        MeResponse: {
          type: 'object',
          properties: {
            user: { $ref: '#/components/schemas/User' },
          },
        },
        Error: {
          type: 'object',
          properties: {
            message: { type: 'string', example: 'Error message' },
          },
        },
        RegisterInput: {
          type: 'object',
          required: ['name', 'email', 'password'],
          properties: {
            name: { type: 'string', minLength: 2, example: 'Test User' },
            email: {
              type: 'string',
              format: 'email',
              example: 'test@example.com',
            },
            password: { type: 'string', minLength: 6, example: 'secret123' },
          },
        },
        LoginInput: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: {
              type: 'string',
              format: 'email',
              example: 'test@example.com',
            },
            password: { type: 'string', example: 'secret123' },
          },
        },
      },
    },
    tags: [
      { name: 'Auth', description: 'Register, login, and current user' },
    ],
  },
  apis: ['./src/routes/*.js'],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
