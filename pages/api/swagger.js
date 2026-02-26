const spec = {
  openapi: '3.0.3',
  info: {
    title: 'Vizard Clips Dashboard API',
    version: '1.0.0',
    description:
      'REST API for the Vizard Clips Dashboard. Manage clips, articles, bookmarks, ideas, projects, shopping items, vault items, and PostBridge integrations.\n\n' +
      '## Authentication\n' +
      'Most endpoints require a Supabase bearer token. Copy it from **Dashboard → API Access** and click **Authorize** above.\n\n' +
      '```\nAuthorization: Bearer <your_supabase_access_token>\n```',
  },
  servers: [], // injected dynamically in the handler
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Supabase access token. Copy from Dashboard → API Access panel.',
      },
    },
    schemas: {
      Error: {
        type: 'object',
        properties: { error: { type: 'string', example: 'Something went wrong' } },
      },
      Success: {
        type: 'object',
        properties: { success: { type: 'boolean', example: true } },
      },
      Clip: {
        type: 'object',
        properties: {
          clip_id: { type: 'string', example: 'pb_1714000000000_abc123' },
          title: { type: 'string', example: '5 Tips for Better Content' },
          suggested_caption: { type: 'string', example: 'Here are 5 tips that changed my content game 🚀 #contentcreator' },
          clip_url: { type: 'string', example: 'https://cdn.vizard.ai/clips/abc.mp4' },
          source_video: { type: 'string', example: 'https://cdn.vizard.ai/source/abc.mp4' },
          category: { type: 'string', example: 'Tips & Tricks' },
          category_emoji: { type: 'string', example: '💡' },
          status: { type: 'string', enum: ['pending_review', 'approved', 'rejected'], example: 'pending_review' },
          post_status: { type: 'string', enum: ['not_posted', 'published'], example: 'not_posted' },
          duration_seconds: { type: 'integer', example: 45 },
          viral_score: { type: 'string', example: '8.5' },
          transcript: { type: 'string', example: 'Hey everyone, today I want to share five tips...' },
          postbridge_post_id: { type: 'string', example: 'pb_post_xyz789', nullable: true },
          vizard_project_id: { type: 'string', example: 'vz_proj_123', nullable: true },
          scheduled_at: { type: 'string', format: 'date-time', example: '2026-03-01T09:00:00.000Z', nullable: true },
          rejection_note: { type: 'string', example: 'Audio quality too low', nullable: true },
          created_at: { type: 'string', format: 'date-time', example: '2026-02-26T12:00:00.000Z' },
          updated_at: { type: 'string', format: 'date-time', example: '2026-02-26T12:05:00.000Z' },
        },
      },
      Stats: {
        type: 'object',
        properties: {
          total: { type: 'integer', example: 42 },
          pending: { type: 'integer', example: 10 },
          approved: { type: 'integer', example: 8 },
          rejected: { type: 'integer', example: 5 },
          published: { type: 'integer', example: 19 },
          next_scheduled_at: { type: 'string', format: 'date-time', example: '2026-03-01T09:00:00.000Z', nullable: true },
        },
      },
      Bookmark: {
        type: 'object',
        properties: {
          id: { type: 'string', example: '1' },
          title: { type: 'string', example: 'How to grow on TikTok' },
          url: { type: 'string', example: 'https://example.com/article' },
          description: { type: 'string', example: 'Great breakdown of TikTok algorithm changes' },
          category: { type: 'string', example: 'Growth' },
          status: { type: 'string', enum: ['read-later', 'favorites', 'archived'], example: 'read-later' },
          tags: { type: 'array', items: { type: 'string' }, example: ['tiktok', 'growth'] },
          created_at: { type: 'string', format: 'date-time', example: '2026-02-26T12:00:00.000Z' },
          updated_at: { type: 'string', format: 'date-time', example: '2026-02-26T12:05:00.000Z' },
        },
      },
      Idea: {
        type: 'object',
        properties: {
          id: { type: 'string', example: '1' },
          title: { type: 'string', example: 'Video series: Morning routines of creators' },
          description: { type: 'string', example: 'Interview 10 creators about their morning routines' },
          category: { type: 'string', example: 'Content Series' },
          status: { type: 'string', enum: ['urgent', 'active', 'someday', 'completed'], example: 'urgent' },
          priority: { type: 'string', enum: ['high', 'medium', 'low'], example: 'high' },
          tags: { type: 'array', items: { type: 'string' }, example: ['series', 'lifestyle'] },
          created_at: { type: 'string', format: 'date-time', example: '2026-02-26T12:00:00.000Z' },
          updated_at: { type: 'string', format: 'date-time', example: '2026-02-26T12:05:00.000Z' },
        },
      },
      Project: {
        type: 'object',
        properties: {
          id: { type: 'string', example: '1' },
          title: { type: 'string', example: 'Q1 Content Calendar' },
          description: { type: 'string', example: 'Plan and schedule all Q1 content across platforms' },
          category: { type: 'string', example: 'Planning' },
          status: { type: 'string', enum: ['active', 'planning', 'completed'], example: 'active' },
          tags: { type: 'array', items: { type: 'string' }, example: ['q1', 'planning'] },
          created_at: { type: 'string', format: 'date-time', example: '2026-02-26T12:00:00.000Z' },
          updated_at: { type: 'string', format: 'date-time', example: '2026-02-26T12:05:00.000Z' },
        },
      },
      ShoppingItem: {
        type: 'object',
        properties: {
          id: { type: 'string', example: '1' },
          title: { type: 'string', example: 'Sony ZV-E10 Camera' },
          url: { type: 'string', example: 'https://amazon.com/dp/B09BBGPTGF' },
          description: { type: 'string', example: 'Compact vlog camera with flip screen' },
          category: { type: 'string', example: 'Gear' },
          status: { type: 'string', enum: ['to-buy', 'watching', 'archived'], example: 'to-buy' },
          price: { type: 'string', example: '749.99' },
          image: { type: 'string', example: 'https://cdn.example.com/camera.jpg' },
          tags: { type: 'array', items: { type: 'string' }, example: ['camera', 'gear'] },
          created_at: { type: 'string', format: 'date-time', example: '2026-02-26T12:00:00.000Z' },
          updated_at: { type: 'string', format: 'date-time', example: '2026-02-26T12:05:00.000Z' },
        },
      },
      VaultItem: {
        type: 'object',
        properties: {
          id: { type: 'string', example: '1' },
          title: { type: 'string', example: 'Brand Kit v2' },
          category: { type: 'string', enum: ['Sales Pages', 'Guides', 'Emails', 'Product Templates', 'Landing Pages', 'VSL Scripts', 'Social Media', 'Course Content', 'Ad Copy', 'Webinar Slides'], example: 'Guides' },
          type: { type: 'string', enum: ['Image', 'File', 'Screenshot', 'PPT', 'URL', 'Video', 'Text', 'Design Link'], example: 'URL' },
          url: { type: 'string', example: 'https://www.figma.com/file/abc123' },
          notes: { type: 'string', example: 'Updated brand colours and logo files' },
          tags: { type: 'array', items: { type: 'string' }, example: ['branding', 'figma'] },
          createdAt: { type: 'string', format: 'date-time', example: '2026-02-26T12:00:00.000Z' },
        },
      },
      Article: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'ltm_abc123' },
          title: { type: 'string', example: 'Weekly Creator Digest #42' },
          publication: { type: 'string', example: 'Creator Weekly' },
          publication_id: { type: 'string', example: 'pub_xyz' },
          status: { type: 'string', example: 'draft' },
          image_url: { type: 'string', example: 'https://cdn.letterman.ai/img/abc.jpg', nullable: true },
          url_path: { type: 'string', example: '/creator-weekly/issue-42', nullable: true },
          created_at: { type: 'string', format: 'date-time', example: '2026-02-26T12:00:00.000Z' },
          updated_at: { type: 'string', format: 'date-time', example: '2026-02-26T13:00:00.000Z', nullable: true },
        },
      },
      PostBridgeAccount: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'acc_tiktok_abc' },
          name: { type: 'string', example: '@mychannel' },
          platform: { type: 'string', example: 'tiktok' },
          status: { type: 'string', example: 'active' },
        },
      },
      PostBridgeMediaItem: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'media_abc123' },
          type: { type: 'string', example: 'video' },
          url: { type: 'string', example: 'https://cdn.post-bridge.com/media/abc.mp4' },
          thumbnail_url: { type: 'string', example: 'https://cdn.post-bridge.com/thumbs/abc.jpg', nullable: true },
          duration: { type: 'integer', example: 45 },
          created_at: { type: 'string', format: 'date-time', example: '2026-02-26T12:00:00.000Z' },
        },
      },
      Business: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid', example: '28b9cfbf-373a-4d91-a1af-76cb8969ddd5' },
          user_id: { type: 'string', format: 'uuid', example: '08dee908-d31b-4c19-ae7d-227ccbb068cf' },
          name: { type: 'string', example: 'ReviewRush' },
          columns: { type: 'array', items: { type: 'string' }, example: ['Marketing', 'Follow-up', 'Research', 'Delivery'] },
          cards: { type: 'array', items: { $ref: '#/components/schemas/BusinessCard' } },
          resources: { type: 'array', items: { $ref: '#/components/schemas/BusinessResource' } },
          created_at: { type: 'string', format: 'date-time', example: '2026-02-26T04:00:00.000Z' },
          updated_at: { type: 'string', format: 'date-time', example: '2026-02-26T04:00:00.000Z' },
        },
      },
      BusinessCard: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' },
          business_id: { type: 'string', format: 'uuid', example: '28b9cfbf-373a-4d91-a1af-76cb8969ddd5' },
          title: { type: 'string', example: 'VSL Script Written' },
          description: { type: 'string', example: '3-minute sales video script' },
          column_name: { type: 'string', example: 'Marketing' },
          labels: { type: 'array', items: { type: 'string', enum: ['urgent', 'pending', 'done', 'draft', 'review', 'blocked'] }, example: ['done'] },
          due_date: { type: 'string', format: 'date', example: '2026-03-15', nullable: true },
          position: { type: 'integer', example: 0 },
          created_at: { type: 'string', format: 'date-time', example: '2026-02-26T02:30:00.000Z' },
          updated_at: { type: 'string', format: 'date-time', example: '2026-02-26T02:30:00.000Z' },
        },
      },
      BusinessResource: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid', example: 'f1e2d3c4-b5a6-7890-abcd-ef1234567890' },
          business_id: { type: 'string', format: 'uuid', example: '28b9cfbf-373a-4d91-a1af-76cb8969ddd5' },
          title: { type: 'string', example: 'Sales Page (Live)' },
          url: { type: 'string', example: 'https://reviewrush.vercel.app' },
          type: { type: 'string', enum: ['link', 'doc', 'note'], example: 'link' },
          created_at: { type: 'string', format: 'date-time', example: '2026-02-26T03:00:00.000Z' },
        },
      },
    },
  },
  security: [{ bearerAuth: [] }],
  tags: [
    { name: 'Clips', description: 'Video clips review, approval and publishing workflow' },
    { name: 'Articles', description: 'Newsletter articles from Letterman' },
    { name: 'Businesses', description: 'Business Kanban board — businesses, cards, and resources' },
    { name: 'Bookmarks', description: 'Saved bookmark links' },
    { name: 'Ideas', description: 'Content idea backlog' },
    { name: 'Projects', description: 'Project tracker' },
    { name: 'Shopping', description: 'Wishlist / shopping items' },
    { name: 'Vault', description: 'Operator Vault — links, files, notes' },
    { name: 'Settings', description: 'Per-user settings (API keys, preferences)' },
    { name: 'PostBridge', description: 'Proxied PostBridge API endpoints' },
  ],
  paths: {
    // ─── CLIPS ────────────────────────────────────────────────────────────────
    '/clips': {
      get: {
        summary: 'List clips',
        description: 'Returns clips filtered by status, optionally filtered by category and sorted. Also returns aggregate stats and available categories.',
        tags: ['Clips'],
        security: [],
        parameters: [
          {
            name: 'filter',
            in: 'query',
            description: 'Status filter. Defaults to `pending`.',
            schema: { type: 'string', enum: ['pending', 'approved', 'published', 'rejected', 'all'], default: 'pending' },
            example: 'approved',
          },
          {
            name: 'category',
            in: 'query',
            description: 'Filter by category name. Use `all` to skip filtering.',
            schema: { type: 'string' },
            example: 'Tips & Tricks',
          },
          {
            name: 'sortBy',
            in: 'query',
            description: 'Sort order.',
            schema: { type: 'string', enum: ['viral_score', 'duration', 'date_desc', 'date_asc'] },
            example: 'date_desc',
          },
        ],
        responses: {
          200: {
            description: 'Clips list with stats and categories',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    clips: { type: 'array', items: { $ref: '#/components/schemas/Clip' } },
                    stats: { $ref: '#/components/schemas/Stats' },
                    categories: { type: 'array', items: { type: 'string' }, example: ['Tips & Tricks', 'PostBridge', 'Tutorial'] },
                  },
                },
                example: {
                  clips: [
                    {
                      clip_id: 'pb_1714000000000_abc123',
                      title: '5 Tips for Better Content',
                      suggested_caption: 'Here are 5 tips that changed my content game 🚀 #contentcreator',
                      clip_url: 'https://cdn.vizard.ai/clips/abc.mp4',
                      category: 'Tips & Tricks',
                      status: 'pending_review',
                      post_status: 'not_posted',
                      duration_seconds: 45,
                      viral_score: '8.5',
                      postbridge_post_id: 'pb_post_xyz789',
                      scheduled_at: null,
                      created_at: '2026-02-26T12:00:00.000Z',
                    },
                  ],
                  stats: { total: 42, pending: 10, approved: 8, rejected: 5, published: 19, next_scheduled_at: '2026-03-01T09:00:00.000Z' },
                  categories: ['Tips & Tricks', 'PostBridge', 'Tutorial'],
                },
              },
            },
          },
          500: { description: 'Server error', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },

      post: {
        summary: 'Create a clip from a PostBridge media item',
        description: 'Creates a PostBridge draft post and saves a clip record in the database. Requires the user to have a PostBridge API key saved in settings.',
        tags: ['Clips'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['postbridge_media_id'],
                properties: {
                  postbridge_media_id: { type: 'string', description: 'PostBridge media library item ID', example: 'media_abc123' },
                  postbridge_media_url: { type: 'string', description: 'Direct CDN URL of the video', example: 'https://cdn.post-bridge.com/media/abc.mp4' },
                  title: { type: 'string', description: 'Clip title', example: '5 Tips for Better Content' },
                  caption: { type: 'string', description: 'Post caption / suggested caption', example: 'Here are 5 tips that changed my content game 🚀 #contentcreator' },
                  account_ids: { type: 'array', items: { type: 'string' }, description: 'PostBridge social account IDs to post to', example: ['acc_tiktok_abc', 'acc_ig_xyz'] },
                  category: { type: 'string', description: 'Content category label', example: 'Tips & Tricks' },
                },
              },
              example: {
                postbridge_media_id: 'media_abc123',
                postbridge_media_url: 'https://cdn.post-bridge.com/media/abc.mp4',
                title: '5 Tips for Better Content',
                caption: 'Here are 5 tips that changed my content game 🚀 #contentcreator',
                account_ids: ['acc_tiktok_abc', 'acc_ig_xyz'],
                category: 'Tips & Tricks',
              },
            },
          },
        },
        responses: {
          201: {
            description: 'Clip created',
            content: {
              'application/json': {
                schema: { type: 'object', properties: { clip: { $ref: '#/components/schemas/Clip' } } },
                example: { clip: { clip_id: 'pb_1714000000000_abc123', title: '5 Tips for Better Content', status: 'pending_review', postbridge_post_id: 'pb_post_xyz789' } },
              },
            },
          },
          400: { description: 'Missing required field or PostBridge API key not configured', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' }, example: { error: 'postbridge_media_id is required' } } } },
          401: { description: 'Missing or invalid bearer token', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' }, example: { error: 'Unauthorized' } } } },
          500: { description: 'Failed to create PostBridge draft', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' }, example: { error: 'Failed to create draft: Bad request' } } } },
        },
      },

      put: {
        summary: 'Update a clip',
        description: 'Updates clip fields in the database. If the clip has a linked PostBridge post and `caption` or `account_ids` are provided, the PostBridge draft is also patched.',
        tags: ['Clips'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['clip_id'],
                properties: {
                  clip_id: { type: 'string', description: 'Clip ID to update', example: 'pb_1714000000000_abc123' },
                  title: { type: 'string', example: 'Updated Title' },
                  clip_url: { type: 'string', description: 'New video URL (also updates source_video)', example: 'https://cdn.vizard.ai/clips/new.mp4' },
                  category: { type: 'string', example: 'Tutorial' },
                  caption: { type: 'string', description: 'New caption — also PATCHed to PostBridge draft', example: 'New caption for the post 🎯' },
                  account_ids: { type: 'array', items: { type: 'string' }, description: 'Updated social account IDs — also PATCHed to PostBridge draft', example: ['acc_tiktok_abc'] },
                },
              },
              example: {
                clip_id: 'pb_1714000000000_abc123',
                caption: 'New caption for the post 🎯',
                account_ids: ['acc_tiktok_abc', 'acc_ig_xyz'],
                category: 'Tutorial',
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Clip updated',
            content: {
              'application/json': {
                schema: { type: 'object', properties: { clip: { $ref: '#/components/schemas/Clip' } } },
                example: { clip: { clip_id: 'pb_1714000000000_abc123', title: 'Updated Title', status: 'pending_review' } },
              },
            },
          },
          400: { description: 'clip_id is required', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' }, example: { error: 'clip_id is required' } } } },
          500: { description: 'Update failed', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },

      delete: {
        summary: 'Remove a clip',
        description: 'Moves the clip to `rejected` status locally. If the clip has a linked PostBridge post, it reverts that post back to draft (`is_draft: true`) — the media file is NOT deleted.',
        tags: ['Clips'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['clip_id'],
                properties: {
                  clip_id: { type: 'string', example: 'pb_1714000000000_abc123' },
                },
              },
              example: { clip_id: 'pb_1714000000000_abc123' },
            },
          },
        },
        responses: {
          200: { description: 'Clip removed (moved to rejected)', content: { 'application/json': { schema: { $ref: '#/components/schemas/Success' }, example: { success: true } } } },
          400: { description: 'clip_id is required', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' }, example: { error: 'clip_id is required' } } } },
          500: { description: 'Server error', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },

    // ─── APPROVE ──────────────────────────────────────────────────────────────
    '/approve': {
      post: {
        summary: 'Approve a clip',
        description: 'Marks a clip as approved. If the clip has a linked PostBridge post, the post is published immediately (or scheduled if `scheduledAt` is provided). The `scheduledAt` field should be a UTC ISO datetime string.',
        tags: ['Clips'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['clipId'],
                properties: {
                  clipId: { type: 'string', description: 'Clip ID to approve', example: 'pb_1714000000000_abc123' },
                  scheduledAt: { type: 'string', format: 'date-time', description: 'Optional UTC datetime to schedule the post. Omit to publish immediately.', example: '2026-03-01T09:00:00.000Z' },
                },
              },
              examples: {
                immediate: { summary: 'Approve immediately', value: { clipId: 'pb_1714000000000_abc123' } },
                scheduled: { summary: 'Schedule for later', value: { clipId: 'pb_1714000000000_abc123', scheduledAt: '2026-03-01T09:00:00.000Z' } },
              },
            },
          },
        },
        responses: {
          200: { description: 'Clip approved', content: { 'application/json': { schema: { $ref: '#/components/schemas/Success' }, example: { success: true } } } },
          400: { description: 'clipId is required or PostBridge key not configured', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' }, example: { error: 'Clip ID required' } } } },
          401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' }, example: { error: 'Unauthorized' } } } },
          404: { description: 'Clip not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' }, example: { error: 'Clip not found' } } } },
          422: { description: 'PostBridge error (e.g. invalid scheduled time)', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' }, example: { error: 'scheduled_at must be in the future' } } } },
        },
      },
    },

    // ─── REJECT ───────────────────────────────────────────────────────────────
    '/reject': {
      post: {
        summary: 'Reject a clip',
        description: 'Marks a clip as rejected with an optional note explaining the reason.',
        tags: ['Clips'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['clipId'],
                properties: {
                  clipId: { type: 'string', description: 'Clip ID to reject', example: 'pb_1714000000000_abc123' },
                  note: { type: 'string', description: 'Optional rejection reason', example: 'Audio quality too low' },
                },
              },
              examples: {
                withNote: { summary: 'Reject with reason', value: { clipId: 'pb_1714000000000_abc123', note: 'Audio quality too low' } },
                withoutNote: { summary: 'Reject without reason', value: { clipId: 'pb_1714000000000_abc123' } },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Clip rejected',
            content: {
              'application/json': {
                schema: { type: 'object', properties: { success: { type: 'boolean' }, clip: { $ref: '#/components/schemas/Clip' } } },
                example: { success: true, clip: { clip_id: 'pb_1714000000000_abc123', status: 'rejected', rejection_note: 'Audio quality too low' } },
              },
            },
          },
          400: { description: 'clipId is required', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' }, example: { error: 'Clip ID required' } } } },
          500: { description: 'Server error', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },

    // ─── BULK ACTION ──────────────────────────────────────────────────────────
    '/bulk-action': {
      post: {
        summary: 'Bulk approve or reject clips',
        description: 'Applies an action (approve or reject) to multiple clips at once.',
        tags: ['Clips'],
        security: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['clipIds', 'action'],
                properties: {
                  clipIds: { type: 'array', items: { type: 'string' }, minItems: 1, description: 'Array of clip IDs to act on', example: ['pb_111_aaa', 'pb_222_bbb'] },
                  action: { type: 'string', enum: ['approve', 'reject'], description: 'Action to perform', example: 'approve' },
                  note: { type: 'string', description: 'Rejection note — only used when action is `reject`', example: 'Does not meet quality standards' },
                },
              },
              examples: {
                bulkApprove: { summary: 'Bulk approve', value: { clipIds: ['pb_111_aaa', 'pb_222_bbb'], action: 'approve' } },
                bulkReject: { summary: 'Bulk reject with note', value: { clipIds: ['pb_111_aaa', 'pb_222_bbb'], action: 'reject', note: 'Does not meet quality standards' } },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Bulk action result',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    total: { type: 'integer', example: 2 },
                    successful: { type: 'integer', example: 2 },
                    failed: { type: 'integer', example: 0 },
                    results: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: { clip_id: { type: 'string' }, success: { type: 'boolean' } },
                      },
                    },
                  },
                },
                example: { success: true, total: 2, successful: 2, failed: 0, results: [{ clip_id: 'pb_111_aaa', success: true }, { clip_id: 'pb_222_bbb', success: true }] },
              },
            },
          },
          400: { description: 'Validation error', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' }, example: { error: 'Action required (approve/reject)' } } } },
          500: { description: 'Server error', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },

    // ─── PUBLISH ──────────────────────────────────────────────────────────────
    '/publish': {
      post: {
        summary: 'Publish all approved clips via PostBridge',
        description: 'Fetches all approved clips, downloads each video from Vizard, uploads to PostBridge media library, then creates a published post for every active social account. Updates `post_status` to `published` on success.',
        tags: ['Clips'],
        security: [],
        requestBody: {
          required: false,
          content: {
            'application/json': {
              schema: { type: 'object', description: 'No body required — operates on all approved clips.' },
              example: {},
            },
          },
        },
        responses: {
          200: {
            description: 'Publish results',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    published: { type: 'integer', example: 3 },
                    total: { type: 'integer', example: 3 },
                    results: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          clip_id: { type: 'string' },
                          success: { type: 'boolean' },
                          platforms: { type: 'array', items: { type: 'string' } },
                          error: { type: 'string' },
                        },
                      },
                    },
                  },
                },
                example: {
                  success: true,
                  published: 2,
                  total: 3,
                  results: [
                    { clip_id: 'pb_111_aaa', success: true, platforms: ['tiktok', 'instagram'] },
                    { clip_id: 'pb_222_bbb', success: true, platforms: ['tiktok'] },
                    { clip_id: 'pb_333_ccc', success: false, error: 'Video download failed' },
                  ],
                },
              },
            },
          },
          500: { description: 'Server error', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },

    // ─── PROCESSING ───────────────────────────────────────────────────────────
    '/processing': {
      get: {
        summary: 'Get Vizard processing count',
        description: 'Checks how many Vizard projects from the last 24 hours are still in a processing state (up to 5 checked). Used for the dashboard status banner.',
        tags: ['Clips'],
        security: [],
        responses: {
          200: {
            description: 'Processing count',
            content: {
              'application/json': {
                schema: { type: 'object', properties: { processing: { type: 'integer', example: 2 } } },
                example: { processing: 2 },
              },
            },
          },
        },
      },
    },

    // ─── ARTICLES ─────────────────────────────────────────────────────────────
    '/articles': {
      get: {
        summary: 'List newsletter articles from Letterman',
        description: 'Fetches all publications from Letterman, then fetches newsletters for each publication. Uses `letterman_api_key` from user settings or the `LETTERMAN_API_KEY` env var.',
        tags: ['Articles'],
        responses: {
          200: {
            description: 'Articles list',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    articles: { type: 'array', items: { $ref: '#/components/schemas/Article' } },
                    total: { type: 'integer', example: 12 },
                  },
                },
                example: {
                  articles: [
                    {
                      id: 'ltm_abc123',
                      title: 'Weekly Creator Digest #42',
                      publication: 'Creator Weekly',
                      publication_id: 'pub_xyz',
                      status: 'draft',
                      image_url: 'https://cdn.letterman.ai/img/abc.jpg',
                      url_path: '/creator-weekly/issue-42',
                      created_at: '2026-02-26T12:00:00.000Z',
                    },
                  ],
                  total: 1,
                },
              },
            },
          },
          400: { description: 'Letterman API key not configured', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' }, example: { error: 'Letterman API key not configured', noKey: true } } } },
          500: { description: 'Server error', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },

    '/articles/approve': {
      post: {
        summary: 'Approve an article',
        description: 'Updates the Letterman newsletter status to `approved` via the Letterman API.',
        tags: ['Articles'],
        security: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['articleId'],
                properties: {
                  articleId: { type: 'string', description: 'Letterman article/newsletter ID', example: 'ltm_abc123' },
                },
              },
              example: { articleId: 'ltm_abc123' },
            },
          },
        },
        responses: {
          200: { description: 'Article approved', content: { 'application/json': { schema: { $ref: '#/components/schemas/Success' }, example: { success: true } } } },
          400: { description: 'articleId required or API key not configured', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' }, example: { error: 'Article ID required' } } } },
          500: { description: 'Server error', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },

    '/articles/reject': {
      post: {
        summary: 'Reject an article',
        description: 'Updates the Letterman newsletter status to `rejected` via the Letterman API.',
        tags: ['Articles'],
        security: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['articleId'],
                properties: {
                  articleId: { type: 'string', description: 'Letterman article/newsletter ID', example: 'ltm_abc123' },
                },
              },
              example: { articleId: 'ltm_abc123' },
            },
          },
        },
        responses: {
          200: { description: 'Article rejected', content: { 'application/json': { schema: { $ref: '#/components/schemas/Success' }, example: { success: true } } } },
          400: { description: 'articleId required or API key not configured', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' }, example: { error: 'Article ID required' } } } },
          500: { description: 'Server error', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },

    // ─── BUSINESSES ─────────────────────────────────────────────────────────────
    '/businesses': {
      get: {
        summary: 'List businesses',
        description: 'Returns all businesses for the authenticated user with their cards and resources nested.',
        tags: ['Businesses'],
        responses: {
          200: {
            description: 'Businesses list with nested cards and resources',
            content: {
              'application/json': {
                schema: { type: 'object', properties: { businesses: { type: 'array', items: { $ref: '#/components/schemas/Business' } } } },
                example: { businesses: [{ id: '28b9cfbf-...', name: 'ReviewRush', columns: ['Marketing', 'Follow-up', 'Research', 'Delivery'], cards: [], resources: [] }] },
              },
            },
          },
          401: { description: 'Unauthorized' },
        },
      },
      post: {
        summary: 'Create business, card, or resource',
        description: 'Use the `action` field to specify what to create: `add_business`, `add_card`, or `add_resource`.',
        tags: ['Businesses'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['action'],
                properties: {
                  action: { type: 'string', enum: ['add_business', 'add_card', 'add_resource'], example: 'add_business' },
                  name: { type: 'string', description: 'Business name (for add_business)', example: 'My Business' },
                  columns: { type: 'array', items: { type: 'string' }, description: 'Custom columns (for add_business, optional)', example: ['Marketing', 'Sales'] },
                  business_id: { type: 'string', format: 'uuid', description: 'Business ID (for add_card / add_resource)' },
                  title: { type: 'string', description: 'Card or resource title' },
                  description: { type: 'string', description: 'Card description' },
                  column_name: { type: 'string', description: 'Column for the card', example: 'Marketing' },
                  labels: { type: 'array', items: { type: 'string' }, description: 'Card labels', example: ['pending'] },
                  due_date: { type: 'string', format: 'date', description: 'Card due date', nullable: true, example: '2026-03-15' },
                  url: { type: 'string', description: 'Resource URL' },
                  type: { type: 'string', enum: ['link', 'doc', 'note'], description: 'Resource type', example: 'link' },
                },
              },
              examples: {
                add_business: { summary: 'Add a business', value: { action: 'add_business', name: 'My Business' } },
                add_card: { summary: 'Add a card', value: { action: 'add_card', business_id: '28b9cfbf-...', title: 'Write copy', column_name: 'Marketing', labels: ['pending'], due_date: '2026-03-15' } },
                add_resource: { summary: 'Add a resource', value: { action: 'add_resource', business_id: '28b9cfbf-...', title: 'Sales Page', url: 'https://example.com', type: 'link' } },
              },
            },
          },
        },
        responses: {
          201: {
            description: 'Created',
            content: {
              'application/json': {
                schema: {
                  oneOf: [
                    { type: 'object', properties: { business: { $ref: '#/components/schemas/Business' } } },
                    { type: 'object', properties: { card: { $ref: '#/components/schemas/BusinessCard' } } },
                    { type: 'object', properties: { resource: { $ref: '#/components/schemas/BusinessResource' } } },
                  ],
                },
              },
            },
          },
          400: { description: 'Invalid action or missing required fields', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          401: { description: 'Unauthorized' },
        },
      },
      put: {
        summary: 'Update business, card, or resource',
        description: 'Use the `type` field to specify what to update: `business`, `card`, or `resource`. Include `id` of the item to update.',
        tags: ['Businesses'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['type', 'id'],
                properties: {
                  type: { type: 'string', enum: ['business', 'card', 'resource'], example: 'card' },
                  id: { type: 'string', format: 'uuid', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' },
                  name: { type: 'string', description: 'Business name (type=business)' },
                  columns: { type: 'array', items: { type: 'string' }, description: 'Columns array (type=business)' },
                  title: { type: 'string', description: 'Title (type=card or resource)' },
                  description: { type: 'string', description: 'Description (type=card)' },
                  column_name: { type: 'string', description: 'Column (type=card)' },
                  labels: { type: 'array', items: { type: 'string' }, description: 'Labels (type=card)' },
                  due_date: { type: 'string', format: 'date', nullable: true, description: 'Due date (type=card)' },
                  position: { type: 'integer', description: 'Sort position (type=card)' },
                  url: { type: 'string', description: 'URL (type=resource)' },
                },
              },
              examples: {
                update_business: { summary: 'Rename business', value: { type: 'business', id: '28b9cfbf-...', name: 'New Name' } },
                update_card: { summary: 'Move card + set due date', value: { type: 'card', id: 'a1b2c3d4-...', column_name: 'Delivery', due_date: '2026-03-20' } },
                update_columns: { summary: 'Reorder columns', value: { type: 'business', id: '28b9cfbf-...', columns: ['Research', 'Marketing', 'Delivery'] } },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Updated',
            content: {
              'application/json': {
                schema: {
                  oneOf: [
                    { type: 'object', properties: { business: { $ref: '#/components/schemas/Business' } } },
                    { type: 'object', properties: { card: { $ref: '#/components/schemas/BusinessCard' } } },
                    { type: 'object', properties: { resource: { $ref: '#/components/schemas/BusinessResource' } } },
                  ],
                },
              },
            },
          },
          400: { description: 'Invalid type or missing id', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          401: { description: 'Unauthorized' },
        },
      },
      delete: {
        summary: 'Delete business, card, or resource',
        description: 'Use the `type` field to specify what to delete: `business`, `card`, or `resource`. Deleting a business cascades to all its cards and resources.',
        tags: ['Businesses'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['type', 'id'],
                properties: {
                  type: { type: 'string', enum: ['business', 'card', 'resource'], example: 'card' },
                  id: { type: 'string', format: 'uuid', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' },
                },
              },
              examples: {
                delete_business: { summary: 'Delete business (cascades)', value: { type: 'business', id: '28b9cfbf-...' } },
                delete_card: { summary: 'Delete a card', value: { type: 'card', id: 'a1b2c3d4-...' } },
                delete_resource: { summary: 'Delete a resource', value: { type: 'resource', id: 'f1e2d3c4-...' } },
              },
            },
          },
        },
        responses: {
          200: { description: 'Deleted', content: { 'application/json': { schema: { $ref: '#/components/schemas/Success' }, example: { success: true } } } },
          400: { description: 'Invalid type or missing id', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          401: { description: 'Unauthorized' },
        },
      },
    },

    // ─── BOOKMARKS ────────────────────────────────────────────────────────────
    '/bookmarks': {
      get: {
        summary: 'List bookmarks',
        description: 'Returns all bookmarks for the authenticated user, newest first.',
        tags: ['Bookmarks'],
        responses: {
          200: {
            description: 'Bookmarks list',
            content: {
              'application/json': {
                schema: { type: 'object', properties: { bookmarks: { type: 'array', items: { $ref: '#/components/schemas/Bookmark' } } } },
                example: { bookmarks: [{ id: '1', title: 'How to grow on TikTok', url: 'https://example.com/article', category: 'Growth', status: 'read-later', tags: ['tiktok'] }] },
              },
            },
          },
          401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
      post: {
        summary: 'Add a bookmark',
        description: 'Creates a new bookmark for the authenticated user.',
        tags: ['Bookmarks'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['title', 'url'],
                properties: {
                  title: { type: 'string', example: 'How to grow on TikTok' },
                  url: { type: 'string', example: 'https://example.com/article' },
                  description: { type: 'string', example: 'Great breakdown of TikTok algorithm changes' },
                  category: { type: 'string', example: 'Growth' },
                  status: { type: 'string', enum: ['read-later', 'favorites', 'archived'], example: 'read-later' },
                  tags: { type: 'array', items: { type: 'string' }, example: ['tiktok', 'growth'] },
                },
              },
              example: { title: 'How to grow on TikTok', url: 'https://example.com/article', description: 'Great breakdown', category: 'Growth', status: 'read-later', tags: ['tiktok'] },
            },
          },
        },
        responses: {
          201: { description: 'Bookmark created', content: { 'application/json': { schema: { type: 'object', properties: { bookmark: { $ref: '#/components/schemas/Bookmark' } } } } } },
          400: { description: 'title and url are required', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' }, example: { error: 'title and url are required' } } } },
          401: { description: 'Unauthorized' },
        },
      },
      put: {
        summary: 'Update a bookmark',
        description: 'Updates fields of an existing bookmark. All fields except `id` are optional.',
        tags: ['Bookmarks'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['id'],
                properties: {
                  id: { type: 'string', example: '1' },
                  title: { type: 'string', example: 'Updated Title' },
                  url: { type: 'string', example: 'https://example.com/updated' },
                  description: { type: 'string', example: 'Updated description' },
                  category: { type: 'string', example: 'Research' },
                  status: { type: 'string', enum: ['read-later', 'favorites', 'archived'], example: 'favorites' },
                  tags: { type: 'array', items: { type: 'string' }, example: ['tiktok', 'algorithm'] },
                },
              },
              example: { id: '1', status: 'favorites', category: 'Research' },
            },
          },
        },
        responses: {
          200: { description: 'Bookmark updated', content: { 'application/json': { schema: { type: 'object', properties: { bookmark: { $ref: '#/components/schemas/Bookmark' } } } } } },
          400: { description: 'id is required', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' }, example: { error: 'id is required' } } } },
          401: { description: 'Unauthorized' },
        },
      },
      delete: {
        summary: 'Delete a bookmark',
        description: 'Permanently deletes a bookmark owned by the authenticated user.',
        tags: ['Bookmarks'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { type: 'object', required: ['id'], properties: { id: { type: 'string', example: '1' } } },
              example: { id: '1' },
            },
          },
        },
        responses: {
          200: { description: 'Deleted', content: { 'application/json': { schema: { $ref: '#/components/schemas/Success' }, example: { success: true } } } },
          400: { description: 'id is required', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' }, example: { error: 'id is required' } } } },
          401: { description: 'Unauthorized' },
        },
      },
    },

    // ─── IDEAS ────────────────────────────────────────────────────────────────
    '/ideas': {
      get: {
        summary: 'List ideas',
        description: 'Returns all ideas for the authenticated user, newest first.',
        tags: ['Ideas'],
        responses: {
          200: {
            description: 'Ideas list',
            content: {
              'application/json': {
                schema: { type: 'object', properties: { ideas: { type: 'array', items: { $ref: '#/components/schemas/Idea' } } } },
                example: { ideas: [{ id: '1', title: 'Video series: Morning routines', priority: 'high', status: 'urgent', tags: ['series'] }] },
              },
            },
          },
          401: { description: 'Unauthorized' },
        },
      },
      post: {
        summary: 'Add an idea',
        tags: ['Ideas'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['title'],
                properties: {
                  title: { type: 'string', example: 'Video series: Morning routines of creators' },
                  description: { type: 'string', example: 'Interview 10 creators about their morning routines' },
                  category: { type: 'string', example: 'Content Series' },
                  status: { type: 'string', enum: ['urgent', 'active', 'someday', 'completed'], example: 'urgent' },
                  priority: { type: 'string', enum: ['high', 'medium', 'low'], example: 'high' },
                  tags: { type: 'array', items: { type: 'string' }, example: ['series', 'lifestyle'] },
                },
              },
              example: { title: 'Video series: Morning routines', description: 'Interview 10 creators', category: 'Content Series', priority: 'high', status: 'urgent', tags: ['series'] },
            },
          },
        },
        responses: {
          201: { description: 'Idea created', content: { 'application/json': { schema: { type: 'object', properties: { idea: { $ref: '#/components/schemas/Idea' } } } } } },
          400: { description: 'title is required', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' }, example: { error: 'title is required' } } } },
          401: { description: 'Unauthorized' },
        },
      },
      put: {
        summary: 'Update an idea',
        tags: ['Ideas'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['id'],
                properties: {
                  id: { type: 'string', example: '1' },
                  title: { type: 'string', example: 'Updated title' },
                  description: { type: 'string', example: 'Updated description' },
                  category: { type: 'string', example: 'Series' },
                  status: { type: 'string', enum: ['urgent', 'active', 'someday', 'completed'], example: 'active' },
                  priority: { type: 'string', enum: ['high', 'medium', 'low'], example: 'medium' },
                  tags: { type: 'array', items: { type: 'string' }, example: ['updated'] },
                },
              },
              example: { id: '1', status: 'active', priority: 'medium' },
            },
          },
        },
        responses: {
          200: { description: 'Idea updated', content: { 'application/json': { schema: { type: 'object', properties: { idea: { $ref: '#/components/schemas/Idea' } } } } } },
          400: { description: 'id is required', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' }, example: { error: 'id is required' } } } },
          401: { description: 'Unauthorized' },
        },
      },
      delete: {
        summary: 'Delete an idea',
        tags: ['Ideas'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { type: 'object', required: ['id'], properties: { id: { type: 'string', example: '1' } } },
              example: { id: '1' },
            },
          },
        },
        responses: {
          200: { description: 'Deleted', content: { 'application/json': { schema: { $ref: '#/components/schemas/Success' }, example: { success: true } } } },
          400: { description: 'id is required' },
          401: { description: 'Unauthorized' },
        },
      },
    },

    // ─── PROJECTS ─────────────────────────────────────────────────────────────
    '/projects': {
      get: {
        summary: 'List projects',
        description: 'Returns all projects for the authenticated user, newest first.',
        tags: ['Projects'],
        responses: {
          200: {
            description: 'Projects list',
            content: {
              'application/json': {
                schema: { type: 'object', properties: { projects: { type: 'array', items: { $ref: '#/components/schemas/Project' } } } },
                example: { projects: [{ id: '1', title: 'Q1 Content Calendar', status: 'active', tags: ['q1'] }] },
              },
            },
          },
          401: { description: 'Unauthorized' },
        },
      },
      post: {
        summary: 'Add a project',
        tags: ['Projects'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['title'],
                properties: {
                  title: { type: 'string', example: 'Q1 Content Calendar' },
                  description: { type: 'string', example: 'Plan and schedule all Q1 content across platforms' },
                  category: { type: 'string', example: 'Planning' },
                  status: { type: 'string', enum: ['active', 'planning', 'completed'], example: 'active' },
                  tags: { type: 'array', items: { type: 'string' }, example: ['q1', 'planning'] },
                },
              },
              example: { title: 'Q1 Content Calendar', description: 'Plan and schedule all Q1 content', category: 'Planning', status: 'active', tags: ['q1'] },
            },
          },
        },
        responses: {
          201: { description: 'Project created', content: { 'application/json': { schema: { type: 'object', properties: { project: { $ref: '#/components/schemas/Project' } } } } } },
          400: { description: 'title is required', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' }, example: { error: 'title is required' } } } },
          401: { description: 'Unauthorized' },
        },
      },
      put: {
        summary: 'Update a project',
        tags: ['Projects'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['id'],
                properties: {
                  id: { type: 'string', example: '1' },
                  title: { type: 'string', example: 'Updated title' },
                  description: { type: 'string', example: 'Updated description' },
                  category: { type: 'string', example: 'Strategy' },
                  status: { type: 'string', enum: ['active', 'planning', 'completed'], example: 'completed' },
                  tags: { type: 'array', items: { type: 'string' }, example: ['q1', 'done'] },
                },
              },
              example: { id: '1', status: 'completed' },
            },
          },
        },
        responses: {
          200: { description: 'Project updated', content: { 'application/json': { schema: { type: 'object', properties: { project: { $ref: '#/components/schemas/Project' } } } } } },
          400: { description: 'id is required', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' }, example: { error: 'id is required' } } } },
          401: { description: 'Unauthorized' },
        },
      },
      delete: {
        summary: 'Delete a project',
        tags: ['Projects'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { type: 'object', required: ['id'], properties: { id: { type: 'string', example: '1' } } },
              example: { id: '1' },
            },
          },
        },
        responses: {
          200: { description: 'Deleted', content: { 'application/json': { schema: { $ref: '#/components/schemas/Success' }, example: { success: true } } } },
          400: { description: 'id is required' },
          401: { description: 'Unauthorized' },
        },
      },
    },

    // ─── SHOPPING ─────────────────────────────────────────────────────────────
    '/shopping': {
      get: {
        summary: 'List shopping items',
        description: 'Returns all shopping/wishlist items for the authenticated user, newest first.',
        tags: ['Shopping'],
        responses: {
          200: {
            description: 'Shopping items list',
            content: {
              'application/json': {
                schema: { type: 'object', properties: { items: { type: 'array', items: { $ref: '#/components/schemas/ShoppingItem' } } } },
                example: { items: [{ id: '1', title: 'Sony ZV-E10 Camera', price: '749.99', status: 'to-buy', category: 'Gear' }] },
              },
            },
          },
          401: { description: 'Unauthorized' },
        },
      },
      post: {
        summary: 'Add a shopping item',
        tags: ['Shopping'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['title'],
                properties: {
                  title: { type: 'string', example: 'Sony ZV-E10 Camera' },
                  url: { type: 'string', example: 'https://amazon.com/dp/B09BBGPTGF' },
                  description: { type: 'string', example: 'Compact vlog camera with flip screen' },
                  category: { type: 'string', example: 'Gear' },
                  status: { type: 'string', enum: ['to-buy', 'watching', 'archived'], example: 'to-buy' },
                  price: { type: 'string', example: '749.99' },
                  image: { type: 'string', example: 'https://cdn.example.com/camera.jpg' },
                  tags: { type: 'array', items: { type: 'string' }, example: ['camera', 'gear'] },
                },
              },
              example: { title: 'Sony ZV-E10 Camera', url: 'https://amazon.com/dp/B09BBGPTGF', price: '749.99', category: 'Gear', status: 'to-buy', tags: ['camera'] },
            },
          },
        },
        responses: {
          201: { description: 'Item created', content: { 'application/json': { schema: { type: 'object', properties: { item: { $ref: '#/components/schemas/ShoppingItem' } } } } } },
          400: { description: 'title is required', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' }, example: { error: 'title is required' } } } },
          401: { description: 'Unauthorized' },
        },
      },
      put: {
        summary: 'Update a shopping item',
        tags: ['Shopping'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['id'],
                properties: {
                  id: { type: 'string', example: '1' },
                  title: { type: 'string', example: 'Updated title' },
                  url: { type: 'string', example: 'https://example.com/updated' },
                  description: { type: 'string', example: 'Updated description' },
                  category: { type: 'string', example: 'Gear' },
                  status: { type: 'string', enum: ['to-buy', 'watching', 'archived'], example: 'watching' },
                  price: { type: 'string', example: '699.99' },
                  image: { type: 'string', example: 'https://cdn.example.com/new.jpg' },
                  tags: { type: 'array', items: { type: 'string' }, example: ['camera', 'gear'] },
                },
              },
              example: { id: '1', status: 'watching', price: '699.99' },
            },
          },
        },
        responses: {
          200: { description: 'Item updated', content: { 'application/json': { schema: { type: 'object', properties: { item: { $ref: '#/components/schemas/ShoppingItem' } } } } } },
          400: { description: 'id is required', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' }, example: { error: 'id is required' } } } },
          401: { description: 'Unauthorized' },
        },
      },
      delete: {
        summary: 'Delete a shopping item',
        tags: ['Shopping'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { type: 'object', required: ['id'], properties: { id: { type: 'string', example: '1' } } },
              example: { id: '1' },
            },
          },
        },
        responses: {
          200: { description: 'Deleted', content: { 'application/json': { schema: { $ref: '#/components/schemas/Success' }, example: { success: true } } } },
          400: { description: 'id is required' },
          401: { description: 'Unauthorized' },
        },
      },
    },

    // ─── VAULT ────────────────────────────────────────────────────────────────
    '/vault/items': {
      get: {
        summary: 'List vault items',
        description: 'Returns all items in the Operator Vault (links, files, notes), newest first.',
        tags: ['Vault'],
        security: [],
        responses: {
          200: {
            description: 'Vault items',
            content: {
              'application/json': {
                schema: { type: 'object', properties: { items: { type: 'array', items: { $ref: '#/components/schemas/VaultItem' } } } },
                example: { items: [{ id: '1', title: 'Brand Kit v2', category: 'Guides', type: 'URL', url: 'https://figma.com/file/abc123', notes: 'Updated colours', tags: ['branding'] }] },
              },
            },
          },
          500: { description: 'Server error', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },

    '/vault/upload': {
      post: {
        summary: 'Create a vault item',
        description: 'Creates a new vault item (link, file reference, or note).',
        tags: ['Vault'],
        security: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['title', 'category', 'type', 'url'],
                properties: {
                  title: { type: 'string', example: 'Sales Funnel Guide' },
                  category: { type: 'string', enum: ['Sales Pages', 'Guides', 'Emails', 'Product Templates', 'Landing Pages', 'VSL Scripts', 'Social Media', 'Course Content', 'Ad Copy', 'Webinar Slides'], example: 'Guides' },
                  type: { type: 'string', enum: ['Image', 'File', 'Screenshot', 'PPT', 'URL', 'Video', 'Text', 'Design Link'], example: 'URL' },
                  url: { type: 'string', example: 'https://www.figma.com/file/abc123' },
                  notes: { type: 'string', example: 'Updated brand colours and logo files' },
                  tags: { type: 'array', items: { type: 'string' }, example: ['branding', 'figma'] },
                },
              },
              example: { title: 'Sales Funnel Guide', category: 'Guides', type: 'URL', url: 'https://figma.com/file/abc123', notes: 'Step by step funnel breakdown', tags: ['sales', 'funnel'] },
            },
          },
        },
        responses: {
          200: { description: 'Item created', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, item: { $ref: '#/components/schemas/VaultItem' } } }, example: { success: true, item: { id: '1', title: 'Brand Kit v2', type: 'link' } } } } },
          400: { description: 'Missing required fields', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' }, example: { error: 'Missing required fields' } } } },
        },
      },
      put: {
        summary: 'Update a vault item',
        description: 'Updates any field on an existing vault item by ID.',
        tags: ['Vault'],
        security: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['id'],
                properties: {
                  id: { type: 'string', example: '1' },
                  title: { type: 'string', example: 'Sales Funnel Guide v2' },
                  category: { type: 'string', enum: ['Sales Pages', 'Guides', 'Emails', 'Product Templates', 'Landing Pages', 'VSL Scripts', 'Social Media', 'Course Content', 'Ad Copy', 'Webinar Slides'], example: 'Sales Pages' },
                  type: { type: 'string', enum: ['Image', 'File', 'Screenshot', 'PPT', 'URL', 'Video', 'Text', 'Design Link'], example: 'Design Link' },
                  url: { type: 'string', example: 'https://figma.com/file/xyz456' },
                  notes: { type: 'string', example: 'Now includes dark mode variants' },
                  tags: { type: 'array', items: { type: 'string' }, example: ['branding', 'v3'] },
                },
              },
              example: { id: '1', title: 'Brand Kit v3', notes: 'Now includes dark mode variants' },
            },
          },
        },
        responses: {
          200: { description: 'Item updated', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, item: { $ref: '#/components/schemas/VaultItem' } } } } } },
          400: { description: 'Item ID required', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' }, example: { error: 'Item ID required' } } } },
        },
      },
      delete: {
        summary: 'Delete a vault item',
        description: 'Permanently deletes a vault item by ID.',
        tags: ['Vault'],
        security: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { type: 'object', required: ['id'], properties: { id: { type: 'string', example: '1' } } },
              example: { id: '1' },
            },
          },
        },
        responses: {
          200: { description: 'Deleted', content: { 'application/json': { schema: { $ref: '#/components/schemas/Success' }, example: { success: true } } } },
          400: { description: 'Item ID required', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' }, example: { error: 'Item ID required' } } } },
        },
      },
    },

    // ─── SETTINGS ─────────────────────────────────────────────────────────────
    '/settings': {
      get: {
        summary: 'Get all user settings',
        description: 'Returns all key-value settings for the authenticated user. Common keys: `postbridge_api_key`, `letterman_api_key`.',
        tags: ['Settings'],
        responses: {
          200: {
            description: 'Settings map',
            content: {
              'application/json': {
                schema: { type: 'object', properties: { settings: { type: 'object', additionalProperties: { type: 'string' } } } },
                example: { settings: { postbridge_api_key: 'pb_live_abc...', letterman_api_key: 'ltm_key_xyz...' } },
              },
            },
          },
          401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' }, example: { error: 'Unauthorized' } } } },
        },
      },
      post: {
        summary: 'Save a user setting',
        description: 'Upserts a single setting key-value pair for the authenticated user.',
        tags: ['Settings'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['key'],
                properties: {
                  key: { type: 'string', description: 'Setting key', example: 'postbridge_api_key' },
                  value: { type: 'string', description: 'Setting value', example: 'pb_live_abc123xyz' },
                },
              },
              examples: {
                postbridge: { summary: 'Save PostBridge API key', value: { key: 'postbridge_api_key', value: 'pb_live_abc123xyz' } },
                letterman: { summary: 'Save Letterman API key', value: { key: 'letterman_api_key', value: 'ltm_key_xyz789' } },
              },
            },
          },
        },
        responses: {
          200: { description: 'Setting saved', content: { 'application/json': { schema: { $ref: '#/components/schemas/Success' }, example: { success: true } } } },
          400: { description: 'key is required', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' }, example: { error: 'key is required' } } } },
          401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' }, example: { error: 'Unauthorized' } } } },
        },
      },
    },

    // ─── POSTBRIDGE ───────────────────────────────────────────────────────────
    '/postbridge/accounts': {
      get: {
        summary: 'List connected social accounts',
        description: 'Proxies `GET /v1/social-accounts` from PostBridge using the user\'s stored API key. Returns all connected social media accounts (up to 100).',
        tags: ['PostBridge'],
        responses: {
          200: {
            description: 'Social accounts',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: { type: 'array', items: { $ref: '#/components/schemas/PostBridgeAccount' } },
                    total: { type: 'integer', example: 3 },
                  },
                },
                example: {
                  data: [
                    { id: 'acc_tiktok_abc', name: '@mychannel', platform: 'tiktok', status: 'active' },
                    { id: 'acc_ig_xyz', name: '@mychannel', platform: 'instagram', status: 'active' },
                  ],
                  total: 2,
                },
              },
            },
          },
          401: { description: 'PostBridge API key not configured', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' }, example: { error: 'PostBridge API key not configured' } } } },
          500: { description: 'Server error', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },

    '/postbridge/media': {
      get: {
        summary: 'List PostBridge video library',
        description: 'Proxies `GET /v1/media?type=video&limit=50` from PostBridge. Returns up to 50 video items from the user\'s media library.',
        tags: ['PostBridge'],
        responses: {
          200: {
            description: 'Video media items',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: { type: 'array', items: { $ref: '#/components/schemas/PostBridgeMediaItem' } },
                    total: { type: 'integer', example: 10 },
                  },
                },
                example: {
                  data: [
                    { id: 'media_abc123', type: 'video', url: 'https://cdn.post-bridge.com/media/abc.mp4', thumbnail_url: 'https://cdn.post-bridge.com/thumbs/abc.jpg', duration: 45 },
                  ],
                  total: 1,
                },
              },
            },
          },
          401: { description: 'PostBridge API key not configured', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' }, example: { error: 'PostBridge API key not configured' } } } },
          500: { description: 'Server error', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },

    '/postbridge/media/{id}': {
      get: {
        summary: 'Get a single PostBridge media item',
        description: 'Proxies `GET /v1/media/{id}` from PostBridge. Used to resolve `pb://media/{id}` URLs stored in the database to real CDN URLs at load time.',
        tags: ['PostBridge'],
        parameters: [
          { name: 'id', in: 'path', required: true, description: 'PostBridge media item ID', schema: { type: 'string' }, example: 'media_abc123' },
        ],
        responses: {
          200: {
            description: 'Media item details',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/PostBridgeMediaItem' },
                example: { id: 'media_abc123', type: 'video', url: 'https://cdn.post-bridge.com/media/abc.mp4', thumbnail_url: 'https://cdn.post-bridge.com/thumbs/abc.jpg', duration: 45 },
              },
            },
          },
          401: { description: 'PostBridge API key not configured' },
          500: { description: 'Server error' },
        },
      },
    },

    '/postbridge/posts/{id}': {
      get: {
        summary: 'Get a single PostBridge post',
        description: 'Proxies `GET /v1/posts/{id}` from PostBridge. Used when opening the edit modal to pre-populate the currently selected social accounts (`social_accounts` field).',
        tags: ['PostBridge'],
        parameters: [
          { name: 'id', in: 'path', required: true, description: 'PostBridge post ID', schema: { type: 'string' }, example: 'pb_post_xyz789' },
        ],
        responses: {
          200: {
            description: 'Post details',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    id: { type: 'string', example: 'pb_post_xyz789' },
                    caption: { type: 'string', example: 'Here are 5 tips 🚀 #contentcreator' },
                    is_draft: { type: 'boolean', example: true },
                    scheduled_at: { type: 'string', format: 'date-time', example: '2026-03-01T09:00:00.000Z', nullable: true },
                    social_accounts: { type: 'array', items: { type: 'string' }, description: 'Array of social account IDs assigned to this post', example: ['acc_tiktok_abc', 'acc_ig_xyz'] },
                    media: { type: 'array', items: { type: 'string' }, description: 'Array of media IDs attached to this post', example: ['media_abc123'] },
                  },
                },
                example: {
                  id: 'pb_post_xyz789',
                  caption: 'Here are 5 tips 🚀 #contentcreator',
                  is_draft: true,
                  scheduled_at: null,
                  social_accounts: ['acc_tiktok_abc', 'acc_ig_xyz'],
                  media: ['media_abc123'],
                },
              },
            },
          },
          401: { description: 'PostBridge API key not configured' },
          500: { description: 'Server error' },
        },
      },
    },
  },
};

export default function handler(req, res) {
  const host = req.headers.host || 'localhost:3000';
  const proto = req.headers['x-forwarded-proto'] || (host.startsWith('localhost') ? 'http' : 'https');
  const baseUrl = `${proto}://${host}/api`;

  const specWithServer = {
    ...spec,
    servers: [
      { url: baseUrl, description: 'Current server' },
    ],
  };

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');
  res.status(200).json(specWithServer);
}
