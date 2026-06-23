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
        adminToken: {
          type: 'apiKey',
          in: 'header',
          name: 'x-admin-token',
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
        AdminDashboardStats: {
          type: 'object',
          properties: {
            totalUsers: { type: 'integer' },
            totalAssessments: { type: 'integer' },
            criticalToday: { type: 'integer' },
            highRiskWeek: { type: 'integer' },
            totalJournals: { type: 'integer' },
            avgMoodWeek: { type: 'number', nullable: true },
          },
        },
        AdminPendingVerification: {
          type: 'object',
          properties: {
            appointmentRequests: { type: 'array', items: { type: 'object' } },
            riskReports: { type: 'array', items: { type: 'object' } },
            wellnessPlans: { type: 'array', items: { type: 'object' } },
            pendingContacts: { type: 'array', items: { type: 'object' } },
            deletionRequests: { type: 'array', items: { type: 'object' } },
            totalPending: { type: 'integer' },
            escalatedCount: { type: 'integer' },
          },
        },
        AdminTherapistDirectoryEntry: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            specialisation: { type: 'string' },
            email: { type: 'string' },
            active: { type: 'boolean' },
            linkedUserEmail: { type: 'string', nullable: true },
            linkedUserName: { type: 'string', nullable: true },
            userId: {
              type: 'object',
              nullable: true,
              properties: { id: { type: 'string' }, name: { type: 'string' }, email: { type: 'string' } },
            },
          },
        },
        FitnessCategoryMap: {
          type: 'object',
          additionalProperties: {
            type: 'object',
            properties: { icon: { type: 'string' } },
          },
          example: { Yoga: { icon: 'https://example.com/yoga.png' } },
        },
        FitnessPlan: {
          type: 'object',
          properties: {
            summary: { type: 'string' },
            weeklySchedule: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  day: { type: 'string' },
                  focus: { type: 'string' },
                  exercises: { type: 'array', items: { type: 'object' } },
                },
              },
            },
          },
        },
        Institution: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            accessCode: { type: 'string' },
            admins: { type: 'array', items: { type: 'string' } },
            members: { type: 'array', items: { type: 'string' } },
          },
        },
        AdminFusionResult: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            riskScore: { type: 'number' },
            riskLevel: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] },
            primaryEmotions: { type: 'array', items: { type: 'string' } },
            aiMarkers: { type: 'array', items: { type: 'string' } },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        AdminAnalytics: {
          type: 'object',
          properties: {
            riskTrend: { type: 'array', items: { type: 'object' } },
            moodHeatmap: { type: 'array', items: { type: 'object' } },
            kpis: {
              type: 'object',
              properties: {
                totalUsers: { type: 'integer' },
                escalatedReports: { type: 'integer' },
                activeTherapists: { type: 'integer' },
                pendingAppointments: { type: 'integer' },
              },
            },
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
      '/fitness/categories': {
        get: {
          tags: ['Wellness'],
          summary: 'Fitness category icons (keyed by name)',
          responses: {
            200: {
              description: 'Category map',
              content: { 'application/json': { schema: { $ref: '#/components/schemas/FitnessCategoryMap' } } },
            },
          },
        },
      },
      '/fitness/plan': {
        post: {
          tags: ['Wellness'],
          summary: 'AI-generated weekly fitness plan (fallback when Gemini unavailable)',
          requestBody: {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    goal: { type: 'string' },
                    concerns: { type: 'array', items: { type: 'string' } },
                    durationMinutes: { type: 'integer' },
                    daysPerWeek: { type: 'integer' },
                    preferredTypes: { type: 'array', items: { type: 'string' } },
                  },
                },
              },
            },
          },
          responses: {
            200: {
              description: 'Personalized plan',
              content: { 'application/json': { schema: { $ref: '#/components/schemas/FitnessPlan' } } },
            },
          },
        },
      },
      '/admin/stats': {
        get: {
          tags: ['Admin'],
          summary: 'Platform dashboard counters',
          security: [{ adminToken: [] }],
          responses: {
            200: {
              description: 'Dashboard stats',
              content: { 'application/json': { schema: { $ref: '#/components/schemas/AdminDashboardStats' } } },
            },
            401: { description: 'Unauthorized' },
          },
        },
      },
      '/admin/pending-verification': {
        get: {
          tags: ['Admin'],
          summary: 'Pending admin verification queue',
          security: [{ adminToken: [] }],
          responses: {
            200: {
              description: 'Pending items',
              content: { 'application/json': { schema: { $ref: '#/components/schemas/AdminPendingVerification' } } },
            },
            401: { description: 'Unauthorized' },
          },
        },
      },
      '/admin/therapists': {
        get: {
          tags: ['Admin'],
          summary: 'Therapist directory with linked user accounts',
          security: [{ adminToken: [] }],
          responses: {
            200: {
              description: 'Therapist list',
              content: {
                'application/json': {
                  schema: { type: 'array', items: { $ref: '#/components/schemas/AdminTherapistDirectoryEntry' } },
                },
              },
            },
            401: { description: 'Unauthorized' },
          },
        },
      },
      '/admin/fusions': {
        get: {
          tags: ['Admin'],
          summary: 'AI intake fusion results (optionally by user)',
          security: [{ adminToken: [] }],
          parameters: [{ name: 'userId', in: 'query', schema: { type: 'string' } }],
          responses: {
            200: {
              description: 'Fusion results (emotions backfilled from feature vectors when missing)',
              content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/AdminFusionResult' } } } },
            },
            401: { description: 'Unauthorized' },
          },
        },
      },
      '/admin/issues': {
        get: {
          tags: ['Admin'],
          summary: 'Risk / issue reports (syncs fusion reports when userId provided)',
          security: [{ adminToken: [] }],
          parameters: [{ name: 'userId', in: 'query', schema: { type: 'string' } }],
          responses: { 200: { description: 'Issue report list' }, 401: { description: 'Unauthorized' } },
        },
      },
      '/admin/issues/{id}/verify': {
        patch: {
          tags: ['Admin'],
          summary: 'Verify or action a risk report',
          security: [{ adminToken: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    adminAction: { type: 'string', enum: ['none', 'contacted', 'referred', 'resolved'] },
                    adminNote: { type: 'string' },
                  },
                },
              },
            },
          },
          responses: { 200: { description: 'Report updated' }, 404: { description: 'Not found' } },
        },
      },
      '/admin/analytics': {
        get: {
          tags: ['Admin'],
          summary: 'Platform KPIs, risk trend, and mood heatmap',
          security: [{ adminToken: [] }],
          responses: {
            200: {
              description: 'Analytics snapshot',
              content: { 'application/json': { schema: { $ref: '#/components/schemas/AdminAnalytics' } } },
            },
            401: { description: 'Unauthorized' },
          },
        },
      },
      '/admin/appointments': {
        get: {
          tags: ['Admin'],
          summary: 'Appointment requests',
          security: [{ adminToken: [] }],
          parameters: [{ name: 'status', in: 'query', schema: { type: 'string', example: 'awaiting_admin' } }],
          responses: { 200: { description: 'Appointment list' }, 401: { description: 'Unauthorized' } },
        },
      },
      '/admin/appointments/{id}/assign': {
        post: {
          tags: ['Admin'],
          summary: 'Assign therapist, date, and slot to a request',
          security: [{ adminToken: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['therapistId', 'date', 'timeSlot'],
                  properties: {
                    therapistId: { type: 'string' },
                    date: { type: 'string', example: '2026-06-25' },
                    timeSlot: { type: 'string', example: '10:00 AM' },
                    adminNote: { type: 'string' },
                  },
                },
              },
            },
          },
          responses: { 200: { description: 'Assigned' }, 400: { description: 'Invalid slot' } },
        },
      },
      '/admin/emergency-contacts/{id}/verify': {
        patch: {
          tags: ['Admin'],
          summary: 'Approve an emergency contact',
          security: [{ adminToken: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: {
            content: { 'application/json': { schema: { type: 'object', properties: { adminNote: { type: 'string' } } } } },
          },
          responses: { 200: { description: 'Verified' } },
        },
      },
      '/admin/emergency-contacts/{id}/reject': {
        patch: {
          tags: ['Admin'],
          summary: 'Reject an emergency contact',
          security: [{ adminToken: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: {
            content: {
              'application/json': {
                schema: { type: 'object', properties: { rejectionReason: { type: 'string' } } },
              },
            },
          },
          responses: { 200: { description: 'Rejected' } },
        },
      },
      '/admin/deletion-requests/{id}/review': {
        patch: {
          tags: ['Admin'],
          summary: 'Approve or reject an account deletion request',
          security: [{ adminToken: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['action'],
                  properties: {
                    action: { type: 'string', enum: ['approve', 'reject'] },
                    adminNote: { type: 'string' },
                  },
                },
              },
            },
          },
          responses: { 200: { description: 'Processed' } },
        },
      },
      '/admin/notifications/broadcast': {
        post: {
          tags: ['Admin'],
          summary: 'Send a broadcast notification',
          security: [{ adminToken: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['title', 'body', 'audience'],
                  properties: {
                    title: { type: 'string' },
                    body: { type: 'string' },
                    audience: { type: 'string', enum: ['all_users', 'therapists'] },
                  },
                },
              },
            },
          },
          responses: { 201: { description: 'Broadcast queued' } },
        },
      },
      '/institutions/join': {
        post: {
          tags: ['Identity'],
          summary: 'Join an institution via access code',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['accessCode'],
                  properties: { accessCode: { type: 'string' } },
                },
              },
            },
          },
          responses: {
            200: { description: 'Joined successfully' },
            404: { description: 'Invalid access code' },
            401: { description: 'Unauthorized' },
          },
        },
      },
    },
  },
  apis: [], // spec is fully inline above
};

const spec = swaggerJSDoc(options);

module.exports = { spec };
