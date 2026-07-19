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
        ExpenseCategory: {
          type: 'string',
          enum: [
            'Food',
            'Transport',
            'Rent',
            'Utilities',
            'Entertainment',
            'Shopping',
            'Health',
            'Other',
          ],
        },
        Expense: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            userId: { type: 'string' },
            title: { type: 'string', example: 'Lunch' },
            amount: { type: 'number', example: 12.5 },
            category: { $ref: '#/components/schemas/ExpenseCategory' },
            date: { type: 'string', format: 'date-time' },
            note: { type: 'string', example: 'With coworkers' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        ExpenseInput: {
          type: 'object',
          required: ['amount', 'category', 'date'],
          properties: {
            title: {
              type: 'string',
              example: 'Lunch',
              description: 'Optional — defaults to category if omitted',
            },
            amount: { type: 'number', exclusiveMinimum: 0, example: 100 },
            category: { $ref: '#/components/schemas/ExpenseCategory' },
            date: {
              type: 'string',
              format: 'date-time',
              example: '2026-07-19T12:00:00.000Z',
            },
            note: { type: 'string', example: 'With coworkers' },
          },
        },
        ExpenseBulkInput: {
          type: 'object',
          required: ['expenses'],
          properties: {
            expenses: {
              type: 'array',
              minItems: 1,
              maxItems: 50,
              items: { $ref: '#/components/schemas/ExpenseInput' },
              example: [
                {
                  amount: 100,
                  category: 'Food',
                  date: '2026-07-19T12:00:00.000Z',
                },
                {
                  amount: 50,
                  category: 'Transport',
                  date: '2026-07-19T12:00:00.000Z',
                },
              ],
            },
          },
        },
        ExpenseBulkResponse: {
          type: 'object',
          properties: {
            count: { type: 'integer', example: 2 },
            expenses: {
              type: 'array',
              items: { $ref: '#/components/schemas/Expense' },
            },
          },
        },
        ExpenseUpdateInput: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            amount: { type: 'number', exclusiveMinimum: 0 },
            category: { $ref: '#/components/schemas/ExpenseCategory' },
            date: { type: 'string', format: 'date-time' },
            note: { type: 'string' },
          },
        },
        ExpenseResponse: {
          type: 'object',
          properties: {
            expense: { $ref: '#/components/schemas/Expense' },
          },
        },
        PaginationMeta: {
          type: 'object',
          properties: {
            total: { type: 'integer', example: 42 },
            page: { type: 'integer', example: 1 },
            limit: { type: 'integer', example: 20 },
            totalPages: { type: 'integer', example: 3 },
            hasNextPage: { type: 'boolean' },
            hasPrevPage: { type: 'boolean' },
          },
        },
        ExpenseListResponse: {
          type: 'object',
          properties: {
            expenses: {
              type: 'array',
              items: { $ref: '#/components/schemas/Expense' },
            },
            meta: { $ref: '#/components/schemas/PaginationMeta' },
          },
        },
      },
    },
    tags: [
      { name: 'Auth', description: 'Register, login, and current user' },
      { name: 'Expenses', description: 'Personal expense CRUD' },
    ],
  },
  apis: ['./src/routes/*.js'],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
