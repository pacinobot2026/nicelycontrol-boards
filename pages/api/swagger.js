const spec = {
  openapi: '3.0.0',
  info: {
    title: 'Control Board API',
    version: '2.0.0',
    description:
      'All API routes for the Control Board dashboard. Every route requires a Bearer token — copy it from the Control page → API Access → Copy Token.',
  },
  servers: [{ url: '/api', description: 'Next.js API routes' }],
  components: {
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
    },
  },
  security: [{ bearerAuth: [] }],
  paths: {

    // ─── CLIPS ────────────────────────────────────────────────────────────────
    '/clips': {
      get: {
        tags: ['Clips'],
        summary: 'List clips',
        parameters: [
          { name: 'status', in: 'query', schema: { type: 'string', enum: ['pending_review', 'approved', 'rejected'] } },
          { name: 'post_status', in: 'query', schema: { type: 'string', enum: ['not_posted', 'published'] } },
          { name: 'category', in: 'query', schema: { type: 'string' } },
          { name: 'search', in: 'query', schema: { type: 'string' } },
        ],
        responses: {
          200: { description: 'Array of clips', content: { 'application/json': { schema: { type: 'object', properties: { clips: { type: 'array' } } } } } },
          401: { description: 'Unauthorized' },
        },
      },
    },
    '/approve': {
      post: {
        tags: ['Clips'],
        summary: 'Approve a clip',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { type: 'object', required: ['id'], properties: { id: { type: 'integer' } } } } },
        },
        responses: { 200: { description: 'Clip approved' }, 401: { description: 'Unauthorized' } },
      },
    },
    '/reject': {
      post: {
        tags: ['Clips'],
        summary: 'Reject a clip',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { type: 'object', required: ['id'], properties: { id: { type: 'integer' } } } } },
        },
        responses: { 200: { description: 'Clip rejected' }, 401: { description: 'Unauthorized' } },
      },
    },
    '/publish': {
      post: {
        tags: ['Clips'],
        summary: 'Publish a clip to social accounts via Post Bridge',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { type: 'object', required: ['id'], properties: { id: { type: 'integer' } } } } },
        },
        responses: { 200: { description: 'Published' }, 401: { description: 'Unauthorized' }, 500: { description: 'Error' } },
      },
    },
    '/bulk-action': {
      post: {
        tags: ['Clips'],
        summary: 'Bulk approve or reject clips',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['action', 'ids'],
                properties: {
                  action: { type: 'string', enum: ['approve', 'reject'] },
                  ids: { type: 'array', items: { type: 'integer' } },
                },
              },
            },
          },
        },
        responses: { 200: { description: 'Done' }, 401: { description: 'Unauthorized' } },
      },
    },

    // ─── IDEAS ────────────────────────────────────────────────────────────────
    '/ideas': {
      get: {
        tags: ['Ideas'],
        summary: 'List all ideas',
        responses: { 200: { description: 'Array of ideas', content: { 'application/json': { schema: { type: 'object', properties: { ideas: { type: 'array' } } } } } } },
      },
      post: {
        tags: ['Ideas'],
        summary: 'Create a new idea',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['title'],
                properties: {
                  title: { type: 'string', example: 'Launch YouTube Shorts strategy' },
                  description: { type: 'string' },
                  category: { type: 'string' },
                  status: { type: 'string', enum: ['active', 'urgent', 'someday', 'completed'], default: 'active' },
                  priority: { type: 'string', enum: ['high', 'medium', 'low'], default: 'medium' },
                  tags: { type: 'array', items: { type: 'string' } },
                },
              },
            },
          },
        },
        responses: { 201: { description: 'Idea created' }, 400: { description: 'Missing title' } },
      },
      put: {
        tags: ['Ideas'],
        summary: 'Update an idea',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['id'],
                properties: {
                  id: { type: 'integer' },
                  title: { type: 'string' },
                  description: { type: 'string' },
                  status: { type: 'string' },
                  priority: { type: 'string' },
                  tags: { type: 'array', items: { type: 'string' } },
                },
              },
            },
          },
        },
        responses: { 200: { description: 'Updated' } },
      },
      delete: {
        tags: ['Ideas'],
        summary: 'Delete an idea',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { type: 'object', required: ['id'], properties: { id: { type: 'integer' } } } } },
        },
        responses: { 200: { description: 'Deleted' } },
      },
    },

    // ─── BOOKMARKS ────────────────────────────────────────────────────────────
    '/bookmarks': {
      get: {
        tags: ['Bookmarks'],
        summary: 'List all bookmarks',
        responses: { 200: { description: 'Array of bookmarks' } },
      },
      post: {
        tags: ['Bookmarks'],
        summary: 'Create a bookmark',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['title', 'url'],
                properties: {
                  title: { type: 'string', example: 'Great article on habits' },
                  url: { type: 'string', example: 'https://example.com' },
                  description: { type: 'string' },
                  category: { type: 'string' },
                  status: { type: 'string', enum: ['read-later', 'favorites', 'archived'], default: 'read-later' },
                  tags: { type: 'array', items: { type: 'string' } },
                },
              },
            },
          },
        },
        responses: { 201: { description: 'Created' } },
      },
      put: {
        tags: ['Bookmarks'],
        summary: 'Update a bookmark',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { type: 'object', required: ['id'], properties: { id: { type: 'integer' }, title: { type: 'string' }, url: { type: 'string' }, status: { type: 'string' } } } } },
        },
        responses: { 200: { description: 'Updated' } },
      },
      delete: {
        tags: ['Bookmarks'],
        summary: 'Delete a bookmark',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { type: 'object', required: ['id'], properties: { id: { type: 'integer' } } } } },
        },
        responses: { 200: { description: 'Deleted' } },
      },
    },

    // ─── PROJECTS ─────────────────────────────────────────────────────────────
    '/projects': {
      get: {
        tags: ['Projects'],
        summary: 'List all projects',
        responses: { 200: { description: 'Array of projects' } },
      },
      post: {
        tags: ['Projects'],
        summary: 'Create a project',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['title'],
                properties: {
                  title: { type: 'string', example: 'Q3 Content Calendar' },
                  description: { type: 'string' },
                  category: { type: 'string' },
                  status: { type: 'string', enum: ['active', 'planning', 'completed'], default: 'active' },
                  tags: { type: 'array', items: { type: 'string' } },
                },
              },
            },
          },
        },
        responses: { 201: { description: 'Created' } },
      },
      put: {
        tags: ['Projects'],
        summary: 'Update a project',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { type: 'object', required: ['id'], properties: { id: { type: 'integer' }, title: { type: 'string' }, status: { type: 'string' } } } } },
        },
        responses: { 200: { description: 'Updated' } },
      },
      delete: {
        tags: ['Projects'],
        summary: 'Delete a project',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { type: 'object', required: ['id'], properties: { id: { type: 'integer' } } } } },
        },
        responses: { 200: { description: 'Deleted' } },
      },
    },

    // ─── SHOPPING ─────────────────────────────────────────────────────────────
    '/shopping': {
      get: {
        tags: ['Shopping'],
        summary: 'List shopping items',
        responses: { 200: { description: 'Array of shopping items' } },
      },
      post: {
        tags: ['Shopping'],
        summary: 'Add a shopping item',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['title'],
                properties: {
                  title: { type: 'string', example: 'Sony ZV-1 Camera' },
                  url: { type: 'string' },
                  description: { type: 'string' },
                  category: { type: 'string' },
                  status: { type: 'string', enum: ['to-buy', 'watching', 'archived'], default: 'to-buy' },
                  price: { type: 'string', example: '$349' },
                  tags: { type: 'array', items: { type: 'string' } },
                },
              },
            },
          },
        },
        responses: { 201: { description: 'Created' } },
      },
      put: {
        tags: ['Shopping'],
        summary: 'Update a shopping item',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { type: 'object', required: ['id'], properties: { id: { type: 'integer' }, title: { type: 'string' }, status: { type: 'string' }, price: { type: 'string' } } } } },
        },
        responses: { 200: { description: 'Updated' } },
      },
      delete: {
        tags: ['Shopping'],
        summary: 'Delete a shopping item',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { type: 'object', required: ['id'], properties: { id: { type: 'integer' } } } } },
        },
        responses: { 200: { description: 'Deleted' } },
      },
    },

    // ─── VAULT ────────────────────────────────────────────────────────────────
    '/vault/items': {
      get: {
        tags: ['Vault'],
        summary: 'List vault items',
        responses: {
          200: {
            description: 'Array of vault items',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    items: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          id: { type: 'string' },
                          title: { type: 'string' },
                          category: { type: 'string' },
                          type: { type: 'string' },
                          url: { type: 'string', nullable: true },
                          notes: { type: 'string' },
                          tags: { type: 'array', items: { type: 'string' } },
                          createdAt: { type: 'string' },
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
      post: {
        tags: ['Vault'],
        summary: 'Add a vault item (stores URL only — no file upload)',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['title'],
                properties: {
                  title: { type: 'string', example: 'Cold Email Swipe File' },
                  category: { type: 'string', example: 'Emails', default: 'general' },
                  type: { type: 'string', example: 'URL', default: 'note', enum: ['Image', 'File', 'Screenshot', 'PPT', 'URL', 'Video', 'Text', 'Design Link'] },
                  url: { type: 'string', example: 'https://docs.google.com/...' },
                  notes: { type: 'string' },
                  tags: { type: 'array', items: { type: 'string' } },
                },
              },
            },
          },
        },
        responses: { 201: { description: 'Item created' }, 400: { description: 'Missing title' } },
      },
      put: {
        tags: ['Vault'],
        summary: 'Update a vault item',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['id'],
                properties: {
                  id: { type: 'string' },
                  title: { type: 'string' },
                  category: { type: 'string' },
                  type: { type: 'string' },
                  url: { type: 'string' },
                  notes: { type: 'string' },
                  tags: { type: 'array', items: { type: 'string' } },
                },
              },
            },
          },
        },
        responses: { 200: { description: 'Updated' } },
      },
      delete: {
        tags: ['Vault'],
        summary: 'Delete a vault item',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { type: 'object', required: ['id'], properties: { id: { type: 'string' } } } } },
        },
        responses: { 200: { description: 'Deleted' } },
      },
    },

    // ─── BUSINESSES ───────────────────────────────────────────────────────────
    '/businesses': {
      get: {
        tags: ['Businesses'],
        summary: 'List all business boards with cards and resources',
        responses: { 200: { description: 'Array of businesses with nested cards and resources' } },
      },
      post: {
        tags: ['Businesses'],
        summary: 'Create a business, card, or resource',
        description: 'Use the `action` field to specify what to create.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['action'],
                properties: {
                  action: { type: 'string', enum: ['add_business', 'add_card', 'add_resource'] },
                  name: { type: 'string', description: 'Required for add_business', example: 'Self Mastery Co' },
                  business_id: { type: 'string', description: 'Required for add_card and add_resource' },
                  title: { type: 'string', description: 'Required for add_card and add_resource' },
                  description: { type: 'string', description: 'For add_card' },
                  column_name: { type: 'string', description: 'Required for add_card', example: 'Marketing' },
                  labels: { type: 'array', items: { type: 'string' } },
                  url: { type: 'string', description: 'For add_resource' },
                  type: { type: 'string', description: 'For add_resource', default: 'link' },
                },
              },
              examples: {
                add_business: { value: { action: 'add_business', name: 'Self Mastery Co' } },
                add_card: { value: { action: 'add_card', business_id: 'uuid-here', title: 'Write landing page', column_name: 'Marketing' } },
                add_resource: { value: { action: 'add_resource', business_id: 'uuid-here', title: 'Sales Page', url: 'https://example.com' } },
              },
            },
          },
        },
        responses: { 201: { description: 'Created' }, 400: { description: 'Invalid action or missing fields' } },
      },
    },

    // ─── COMMANDS ─────────────────────────────────────────────────────────────
    '/commands': {
      get: {
        tags: ['Commands'],
        summary: 'List all command shortcuts (sorted by sort_order)',
        responses: { 200: { description: 'Array of command objects' } },
      },
      post: {
        tags: ['Commands'],
        summary: 'Create a command shortcut',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'description'],
                properties: {
                  name: { type: 'string', example: '/morning' },
                  description: { type: 'string', example: 'Run my morning content review routine' },
                  category: { type: 'string', default: 'system', example: 'content' },
                  command_group: { type: 'string', default: 'resources', example: 'automation' },
                  steps: { type: 'array', items: { type: 'object' }, default: [] },
                  shortcut: { type: 'string', example: 'Ctrl+M' },
                  logo: { type: 'string', example: '🌅' },
                },
              },
            },
          },
        },
        responses: { 201: { description: 'Command created' }, 400: { description: 'name and description are required' } },
      },
      put: {
        tags: ['Commands'],
        summary: 'Update a command',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['id'],
                properties: {
                  id: { type: 'integer' },
                  name: { type: 'string' },
                  description: { type: 'string' },
                  category: { type: 'string' },
                  command_group: { type: 'string' },
                  steps: { type: 'array', items: { type: 'object' } },
                  shortcut: { type: 'string' },
                  logo: { type: 'string' },
                  sort_order: { type: 'integer' },
                },
              },
            },
          },
        },
        responses: { 200: { description: 'Updated' } },
      },
      delete: {
        tags: ['Commands'],
        summary: 'Delete a command',
        parameters: [{ name: 'id', in: 'query', required: true, schema: { type: 'integer' } }],
        responses: { 200: { description: 'Deleted' } },
      },
    },

    // ─── CONTROL CENTER ───────────────────────────────────────────────────────
    '/control': {
      get: {
        tags: ['Control'],
        summary: 'Get all Control Center data in one request',
        responses: {
          200: {
            description: 'All cc_ table data',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    apiKeys: { type: 'array' },
                    models: { type: 'array' },
                    cronJobs: { type: 'array' },
                    tasks: { type: 'array' },
                    channels: { type: 'array' },
                    integrations: { type: 'array' },
                    features: { type: 'array' },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        tags: ['Control'],
        summary: 'Create a Control Center item',
        description: 'Set `entity` to the type you want to create.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['entity', 'name'],
                properties: {
                  entity: { type: 'string', enum: ['api_key', 'model', 'cron_job', 'task', 'channel', 'integration', 'feature'] },
                  name: { type: 'string' },
                  key_masked: { type: 'string', description: 'For api_key or integration' },
                  status: { type: 'string', description: 'For api_key, model, cron_job, channel' },
                  provider: { type: 'string', description: 'For model' },
                  schedule: { type: 'string', description: 'For cron_job', example: '0 9 * * *' },
                  priority: { type: 'string', description: 'For task', enum: ['high', 'med', 'low'] },
                  task_status: { type: 'string', description: 'For task', enum: ['backlog', 'in_progress', 'done'] },
                  subtitle: { type: 'string', description: 'For channel' },
                  position: { type: 'integer', default: 0 },
                },
              },
              examples: {
                api_key: { value: { entity: 'api_key', name: 'OpenAI', key_masked: 'sk-****', status: 'connected' } },
                model: { value: { entity: 'model', name: 'GPT-4o', provider: 'OpenAI', status: 'available' } },
                cron_job: { value: { entity: 'cron_job', name: 'Daily Clip Review', schedule: '0 9 * * *', status: 'active' } },
                task: { value: { entity: 'task', name: 'Review pending clips', priority: 'high', task_status: 'backlog' } },
                channel: { value: { entity: 'channel', name: 'YouTube', subtitle: '@mychannel', status: 'connected' } },
                integration: { value: { entity: 'integration', name: 'Zapier', key_masked: 'zap-****' } },
                feature: { value: { entity: 'feature', name: 'Auto-publish clips' } },
              },
            },
          },
        },
        responses: { 201: { description: 'Item created' }, 400: { description: 'Invalid entity' } },
      },
      put: {
        tags: ['Control'],
        summary: 'Update a Control Center item',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['entity', 'id'],
                properties: {
                  entity: { type: 'string', enum: ['api_key', 'model', 'cron_job', 'task', 'channel', 'integration', 'feature'] },
                  id: { type: 'string', format: 'uuid' },
                  name: { type: 'string' },
                  status: { type: 'string' },
                },
              },
            },
          },
        },
        responses: { 200: { description: 'Updated' } },
      },
      delete: {
        tags: ['Control'],
        summary: 'Delete a Control Center item',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['entity', 'id'],
                properties: {
                  entity: { type: 'string', enum: ['api_key', 'model', 'cron_job', 'task', 'channel', 'integration', 'feature'] },
                  id: { type: 'string', format: 'uuid' },
                },
              },
            },
          },
        },
        responses: { 200: { description: 'Deleted' } },
      },
    },

    // ─── SETTINGS ─────────────────────────────────────────────────────────────
    '/settings': {
      get: {
        tags: ['Settings'],
        summary: 'Get all user settings as a key/value map',
        responses: {
          200: {
            description: 'Settings map',
            content: {
              'application/json': {
                schema: { type: 'object', properties: { settings: { type: 'object', example: { letterman_api_key: 'abc123' } } } },
              },
            },
          },
        },
      },
      post: {
        tags: ['Settings'],
        summary: 'Save or update a setting',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['key', 'value'],
                properties: {
                  key: { type: 'string', example: 'letterman_api_key' },
                  value: { type: 'string', example: 'your-api-key-here' },
                },
              },
            },
          },
        },
        responses: { 200: { description: 'Saved' } },
      },
    },

    // ─── KANBAN ───────────────────────────────────────────────────────────────
    '/kanban/tasks': {
      get: {
        tags: ['Kanban'],
        summary: 'Get kanban board task data',
        responses: { 200: { description: 'Kanban task data' } },
      },
      post: {
        tags: ['Kanban'],
        summary: 'Save kanban board task data',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { type: 'object', properties: { tasks: { type: 'object' } } } } },
        },
        responses: { 200: { description: 'Saved' } },
      },
    },
    '/kanban/team-members': {
      get: {
        tags: ['Kanban'],
        summary: 'List team members',
        responses: { 200: { description: 'Array of team members' } },
      },
      post: {
        tags: ['Kanban'],
        summary: 'Add a team member',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name'],
                properties: {
                  name: { type: 'string', example: 'Alice' },
                  avatar: { type: 'string', example: '👩‍💻' },
                },
              },
            },
          },
        },
        responses: { 201: { description: 'Created' } },
      },
      delete: {
        tags: ['Kanban'],
        summary: 'Delete a team member',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { type: 'object', required: ['id'], properties: { id: { type: 'string' } } } } },
        },
        responses: { 200: { description: 'Deleted' } },
      },
    },

    // ─── ARTICLES ─────────────────────────────────────────────────────────────
    '/articles': {
      get: {
        tags: ['Articles'],
        summary: 'Fetch articles from Letterman (requires letterman_api_key saved in Settings)',
        parameters: [
          { name: 'refresh', in: 'query', schema: { type: 'boolean' }, description: 'Force re-fetch from Letterman API' },
        ],
        responses: {
          200: { description: 'Articles and publications' },
          400: { description: 'Letterman API key not configured — save it in Settings first' },
        },
      },
    },

    // ─── MIGRATE ──────────────────────────────────────────────────────────────
    '/migrate': {
      post: {
        tags: ['Setup'],
        summary: 'Run all database migrations (creates all tables)',
        description: 'Safe to run multiple times — uses IF NOT EXISTS throughout. Requires your Supabase personal access token from https://supabase.com/dashboard/account/tokens',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['accessToken'],
                properties: {
                  accessToken: { type: 'string', description: 'Supabase personal access token (starts with sbp_)' },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'All migrations ran successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    results: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          file: { type: 'string' },
                          status: { type: 'string', enum: ['ok', 'skipped', 'error'] },
                          error: { type: 'string' },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          207: { description: 'Some migrations had errors — check the results array' },
          400: { description: 'accessToken is required' },
          500: { description: 'Connection error' },
        },
      },
    },

    // ─── ADMIN ────────────────────────────────────────────────────────────────
    '/admin/users': {
      get: {
        tags: ['Admin'],
        summary: 'List all registered users (admin only)',
        responses: {
          200: {
            description: 'Array of users',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    users: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          id: { type: 'string' },
                          email: { type: 'string' },
                          created_at: { type: 'string' },
                          email_confirmed_at: { type: 'string', nullable: true },
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
    '/admin/confirm-all': {
      post: {
        tags: ['Admin'],
        summary: 'Confirm email for all unconfirmed users (admin only)',
        responses: { 200: { description: 'All users confirmed' } },
      },
    },
  },
};

export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.status(200).json(spec);
}
