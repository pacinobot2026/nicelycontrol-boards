process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const { Client } = require('pg');

const CHAD_USER_ID = '08dee908-d31b-4c19-ae7d-227ccbb068cf';
const DB_URL = 'postgres://postgres.jqqvqdjxviqnsgpxcgfs:HUxTv6nSBmk9y1Qm@aws-1-us-east-1.pooler.supabase.com:5432/postgres?sslmode=require';

const MEMBERS = {
  chad:   '71d97163-8f2f-4e92-afe4-17ac6a38504c',
  pacino: '7d5f2f98-fdb9-4f56-92e4-2b9395d3c22b',
  gaurav: '9544ed1a-d65d-4319-b209-f323df830083',
  pranay: 'c59a6cd0-e933-411a-af53-7b42ad2bd637',
};

const tasks = [
  // INBOX
  {
    id: 'task-seed-001',
    title: 'Fix PopLinks clone button not working in Safari',
    description: 'Users reporting the clone button doesn\'t respond on Safari browsers. Need to investigate webkit event handling and test across versions.',
    priority: 'High',
    status: 'inbox',
    project: 'poplinks',
    assignee: MEMBERS.pranay,
    tags: ['bug', 'browser-compatibility', 'urgent'],
    createdAt: '2026-02-28T09:00:00.000Z',
    dueDate: '2026-03-03',
    updatedAt: '2026-02-28T09:00:00.000Z',
  },
  {
    id: 'task-seed-002',
    title: 'Review Course Sprout API rate limiting settings',
    description: 'Chad mentioned we need to review and possibly increase rate limits for premium users. Current limits may be too restrictive.',
    priority: 'Med',
    status: 'inbox',
    project: 'coursesprout',
    assignee: MEMBERS.gaurav,
    tags: ['api', 'performance'],
    createdAt: '2026-02-28T10:00:00.000Z',
    dueDate: null,
    updatedAt: '2026-02-28T10:00:00.000Z',
  },
  {
    id: 'task-seed-003',
    title: 'Update SSL certificates for mintbird.com',
    description: 'SSL cert expires in 7 days. Renew via Let\'s Encrypt and update Cloudflare DNS settings to avoid downtime.',
    priority: 'High',
    status: 'inbox',
    project: 'mintbird',
    assignee: MEMBERS.pacino,
    tags: ['infrastructure', 'security'],
    createdAt: '2026-02-28T11:00:00.000Z',
    dueDate: '2026-03-06',
    updatedAt: '2026-02-28T11:00:00.000Z',
  },
  {
    id: 'task-seed-004',
    title: 'Test',
    description: '',
    priority: 'Med',
    status: 'inbox',
    project: 'mintbird',
    assignee: null,
    statusLabel: 'ON TRACK',
    tags: [],
    createdAt: '2026-03-04T08:00:00.000Z',
    dueDate: null,
    updatedAt: '2026-03-04T08:00:00.000Z',
  },
  // ASSIGNED
  {
    id: 'task-seed-005',
    title: 'Build Letterman batch publish feature',
    description: 'Allow users to select multiple articles and publish them all at once. Need UI + API endpoint.',
    priority: 'Med',
    status: 'assigned',
    project: 'letterman',
    assignee: MEMBERS.pacino,
    tags: ['feature', 'ui', 'batch-operations'],
    createdAt: '2026-02-26T09:00:00.000Z',
    dueDate: '2026-03-08',
    updatedAt: '2026-02-26T09:00:00.000Z',
  },
  {
    id: 'task-seed-006',
    title: 'Migrate Global Control Center database to AWS RDS',
    description: 'Performance improvements needed. Moving from current hosting to AWS RDS PostgreSQL for better reliability and scaling.',
    priority: 'High',
    status: 'assigned',
    project: 'globalcontrol',
    assignee: MEMBERS.gaurav,
    tags: ['database', 'migration', 'aws'],
    createdAt: '2026-02-24T09:00:00.000Z',
    dueDate: '2026-03-11',
    updatedAt: '2026-02-24T09:00:00.000Z',
  },
  // IN PROGRESS
  {
    id: 'task-seed-007',
    title: 'Deploy OpenClaw Docker container support',
    description: 'Building Docker images for OpenClaw gateway + agents. Simplifies deployment for customers.',
    priority: 'High',
    status: 'in-progress',
    project: 'openclaw',
    assignee: MEMBERS.gaurav,
    progress: 80,
    tags: ['docker', 'devops', 'deployment'],
    createdAt: '2026-02-17T09:00:00.000Z',
    dueDate: '2026-03-05',
    updatedAt: '2026-02-17T09:00:00.000Z',
  },
  {
    id: 'task-seed-008',
    title: 'Fix Quizforma conditional logic bugs',
    description: 'Skip logic not working correctly when user selects specific answers. Debugging flow and fixing branching conditions.',
    priority: 'High',
    status: 'in-progress',
    project: 'openclaw',
    assignee: MEMBERS.pranay,
    progress: 40,
    tags: ['bug', 'logic', 'quiz-engine'],
    createdAt: '2026-02-25T09:00:00.000Z',
    dueDate: '2026-03-03',
    updatedAt: '2026-02-25T09:00:00.000Z',
  },
  // REVIEW
  {
    id: 'task-seed-009',
    title: 'Add dark mode to MintBird dashboard',
    description: 'Multiple users requested dark mode. Implement theme switcher with localStorage persistence.',
    priority: 'Low',
    status: 'review',
    project: 'mintbird',
    assignee: MEMBERS.pacino,
    tags: ['ui', 'theme', 'ux'],
    createdAt: '2026-02-22T09:00:00.000Z',
    dueDate: null,
    updatedAt: '2026-02-22T09:00:00.000Z',
  },
  {
    id: 'task-seed-010',
    title: 'Optimize PopLinks video embed loading time',
    description: 'Videos taking 3-5s to load. Implement lazy loading and CDN caching. Target <1s load time.',
    priority: 'High',
    status: 'review',
    project: 'poplinks',
    assignee: MEMBERS.chad,
    progress: 65,
    tags: ['performance', 'optimization', 'video'],
    createdAt: '2026-02-21T09:00:00.000Z',
    dueDate: '2026-03-04',
    updatedAt: '2026-02-21T09:00:00.000Z',
  },
  // DONE
  {
    id: 'task-seed-011',
    title: 'Implement Global Control broadcast email analytics',
    description: 'Added open rates, click rates, and bounce tracking to email campaigns dashboard.',
    priority: 'Med',
    status: 'done',
    project: 'globalcontrol',
    assignee: MEMBERS.pranay,
    tags: ['analytics', 'email', 'dashboard'],
    createdAt: '2026-02-15T09:00:00.000Z',
    dueDate: null,
    updatedAt: '2026-02-15T09:00:00.000Z',
  },
  {
    id: 'task-seed-012',
    title: 'Add CSV export to Course Sprout student reports',
    description: 'Teachers can now export student progress data as CSV for external analysis.',
    priority: 'Low',
    status: 'done',
    project: 'coursesprout',
    assignee: MEMBERS.gaurav,
    tags: ['export', 'reports', 'csv'],
    createdAt: '2026-02-19T09:00:00.000Z',
    dueDate: null,
    updatedAt: '2026-02-19T09:00:00.000Z',
  },
  {
    id: 'task-seed-013',
    title: 'Deploy Letterman v2.3.1 hotfix',
    description: 'Fixed image upload bug causing 500 errors. Deployed to production.',
    priority: 'High',
    status: 'done',
    project: 'letterman',
    assignee: MEMBERS.pacino,
    tags: ['hotfix', 'deploy', 'production'],
    createdAt: '2026-02-27T09:00:00.000Z',
    dueDate: null,
    updatedAt: '2026-02-27T09:00:00.000Z',
  },
  {
    id: 'task-seed-014',
    title: 'Configure backup server in Singapore',
    description: 'Set up Singapore AWS region for disaster recovery and faster APAC response times.',
    priority: 'Med',
    status: 'done',
    project: 'openclaw',
    assignee: MEMBERS.chad,
    tags: ['infrastructure', 'aws', 'backup'],
    createdAt: '2026-02-14T09:00:00.000Z',
    dueDate: null,
    updatedAt: '2026-02-14T09:00:00.000Z',
  },
];

async function run() {
  const client = new Client({ connectionString: DB_URL });
  await client.connect();

  // Clear existing tasks for Chad
  await client.query(`DELETE FROM kanban_tasks WHERE user_id=$1`, [CHAD_USER_ID]);
  console.log('Cleared existing kanban tasks');

  // Insert all tasks
  for (const task of tasks) {
    await client.query(
      `INSERT INTO kanban_tasks (id, user_id, task_data, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5)`,
      [task.id, CHAD_USER_ID, JSON.stringify(task), task.createdAt, task.updatedAt]
    );
  }

  console.log(`Seeded ${tasks.length} kanban tasks`);

  // Verify
  const res = await client.query('SELECT count(*) FROM kanban_tasks WHERE user_id=$1', [CHAD_USER_ID]);
  console.log('Total kanban tasks in DB:', res.rows[0].count);

  await client.end();
}

run().catch(e => { console.error(e.message); process.exit(1); });
