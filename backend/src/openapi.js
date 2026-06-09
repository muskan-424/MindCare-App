/**
 * OpenAPI 3.0 specification for the MindCare API.
 * Served at GET /api/docs (Swagger UI) and GET /api/docs/openapi.json.
 */

const swaggerJSDoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'MindCare API',
      version: '1.0.0',
      description: 'REST API for the MindCare mental health application — wellness tracking, therapy, community, and the Tink AI assistant.',
    },
    servers: [{ url: '/api', description: 'API base path' }],
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
            error: { type: 'string' },
            code: { type: 'string' },
            details: { type: 'array', items: { type: 'object' } },
          },
        },
        Goal: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            title: { type: 'string' },
            description: { type: 'string' },
            category: { type: 'string' },
            progress: { type: 'number' },
            status: { type: 'string', enum: ['active', 'paused', 'completed'] },
            milestones: { type: 'array', items: { type: 'object' } },
          },
        },
        ChatResponse: {
          type: 'object',
          properties: {
            reply: { type: 'string' },
            suggestions: { type: 'array', items: { type: 'string' } },
            cards: { type: 'array', items: { type: 'object' } },
            crisis: { type: 'boolean' },
            mood: { type: 'string' },
            intent: { type: 'string' },
            confidence: { type: 'number' },
            sources: { type: 'array', items: { type: 'object' } },
            draft: { type: 'object', nullable: true },
            mode: { type: 'string', enum: ['gemini', 'rule'] },
            verificationNote: { type: 'string' },
            modelTier: { type: 'string' },
            conversationId: { type: 'string', nullable: true },
          },
        },
        Health: {
          type: 'object',
          properties: {
            status: { type: 'string' },
            uptime: { type: 'number' },
            version: { type: 'string' },
          },
        },
      },
    },
    paths: {
      '/health': {
        get: {
          tags: ['Observability'],
          summary: 'Liveness check',
          responses: { 200: { description: 'API is alive', content: { 'application/json': { schema: { $ref: '#/components/schemas/Health' } } } } },
        },
      },
      '/health/ready': {
        get: {
          tags: ['Observability'],
          summary: 'Readiness check (DB + dependencies)',
          responses: { 200: { description: 'Ready' }, 503: { description: 'Not ready' } },
        },
      },
      '/metrics': {
        get: {
          tags: ['Observability'],
          summary: 'Request metrics (JSON or Prometheus)',
          parameters: [{ name: 'format', in: 'query', schema: { type: 'string', enum: ['json', 'prometheus'] } }],
          responses: { 200: { description: 'Metrics snapshot' } },
        },
      },
      '/user': {
        post: {
          tags: ['Identity'],
          summary: 'Register a new user',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['name', 'email', 'password'],
                  properties: {
                    name: { type: 'string' },
                    email: { type: 'string', format: 'email' },
                    password: { type: 'string', minLength: 6 },
                  },
                },
              },
            },
          },
          responses: { 200: { description: 'User created with JWT token' }, 400: { description: 'Validation error' } },
        },
      },
      '/auth': {
        post: {
          tags: ['Identity'],
          summary: 'Login',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['email', 'password'],
                  properties: { email: { type: 'string' }, password: { type: 'string' } },
                },
              },
            },
          },
          responses: { 200: { description: 'JWT token' }, 400: { description: 'Invalid credentials' } },
        },
      },
      '/goals': {
        get: {
          tags: ['Wellness'],
          summary: 'List goals for the logged-in user',
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: 'Goal list', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Goal' } } } } }, 401: { description: 'Unauthorized' } },
        },
        post: {
          tags: ['Wellness'],
          summary: 'Create a goal',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['title'],
                  properties: { title: { type: 'string' }, description: { type: 'string' }, category: { type: 'string' } },
                },
              },
            },
          },
          responses: { 201: { description: 'Goal created' }, 400: { description: 'Validation error' } },
        },
      },
      '/chat': {
        post: {
          tags: ['Tink AI'],
          summary: 'Agentic chat with Tink',
          description: 'Classifies intent, runs tools/RAG, composes a grounded reply. Auth optional (persistence requires login).',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['message'],
                  properties: {
                    message: { type: 'string' },
                    history: { type: 'array', items: { type: 'object' } },
                    conversationId: { type: 'string' },
                    language: { type: 'string' },
                    tone: { type: 'string', enum: ['friendly', 'professional', 'concise'] },
                  },
                },
              },
            },
          },
          responses: { 200: { description: 'Chat reply', content: { 'application/json': { schema: { $ref: '#/components/schemas/ChatResponse' } } } } },
        },
      },
      '/chat/capabilities': {
        get: {
          tags: ['Tink AI'],
          summary: 'Report Tink live capabilities (Gemini vs rule, RAG mode, models)',
          description: 'Includes `websocket: true` when real-time transport is enabled. Connect to `ws(s)://<host>/api/chat/ws?token=<JWT>` (token optional). Client sends `{ type: "chat", message, history?, conversationId?, language?, tone? }`; server replies with `{ type: "reply", ...ChatResponse }` or `{ type: "error", message }`. On connect the server sends `{ type: "ready", authenticated }`. WebSocket is only available on long-lived servers (not Vercel serverless); REST POST /chat is the fallback.',
          responses: { 200: { description: 'Capability snapshot' } },
        },
      },
      '/chat/refine': {
        post: {
          tags: ['Tink AI'],
          summary: 'Rewrite a message (shorter, professional, simpler, steps)',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['text'],
                  properties: { text: { type: 'string' }, mode: { type: 'string' }, language: { type: 'string' } },
                },
              },
            },
          },
          responses: { 200: { description: 'Refined text' } },
        },
      },
      '/chat/conversations': {
        get: {
          tags: ['Tink AI'],
          summary: 'List chat conversations (auth required)',
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: 'Conversation summaries' }, 401: { description: 'Unauthorized' } },
        },
      },
    },
  },
  apis: [], // spec is fully inline above
};

const spec = swaggerJSDoc(options);

module.exports = { spec };
