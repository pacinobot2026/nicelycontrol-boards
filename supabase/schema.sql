-- ============================================================
-- Full Database Schema
--
-- SETUP INSTRUCTIONS:
-- 1. Create a new project at https://supabase.com
-- 2. Go to SQL Editor in your Supabase dashboard
-- 3. Paste this entire file and click Run
-- 4. Copy your Project URL and service_role key from
--    Settings > API and add them to your .env.local file:
--      SUPABASE_URL=https://your-project.supabase.co
--      SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
--
-- This script is idempotent — safe to run multiple times.
-- ============================================================


-- ============================================================
-- 1. CLIPS
-- ============================================================
CREATE TABLE IF NOT EXISTS clips (
  id                 SERIAL PRIMARY KEY,
  clip_id            TEXT UNIQUE NOT NULL,
  user_id            UUID REFERENCES auth.users(id),
  title              TEXT NOT NULL,
  duration_seconds   INTEGER,
  viral_score        TEXT,
  source_video       TEXT,
  vizard_project_id  TEXT,
  status             TEXT DEFAULT 'pending_review',
  post_status        TEXT DEFAULT 'not_posted',
  category           TEXT,
  category_emoji     TEXT,
  clip_url           TEXT NOT NULL,
  suggested_caption  TEXT,
  transcript         TEXT,
  postbridge_post_id TEXT,
  created_at         TIMESTAMP DEFAULT NOW(),
  updated_at         TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_clips_clip_id    ON clips(clip_id);
CREATE INDEX IF NOT EXISTS idx_clips_user_id    ON clips(user_id);
CREATE INDEX IF NOT EXISTS idx_clips_status     ON clips(status);
CREATE INDEX IF NOT EXISTS idx_clips_post_status ON clips(post_status);


-- ============================================================
-- 2. VAULT ITEMS
-- ============================================================
CREATE TABLE IF NOT EXISTS vault_items (
  id           SERIAL PRIMARY KEY,
  user_id      UUID REFERENCES auth.users(id),
  title        TEXT NOT NULL,
  category     TEXT NOT NULL,
  type         TEXT NOT NULL,
  resource_url TEXT,
  file_path    TEXT,
  notes        TEXT,
  tags         TEXT[],
  created_at   TIMESTAMP DEFAULT NOW(),
  updated_at   TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vault_items_user_id ON vault_items(user_id);
CREATE INDEX IF NOT EXISTS idx_vault_category      ON vault_items(category);
CREATE INDEX IF NOT EXISTS idx_vault_type          ON vault_items(type);
CREATE INDEX IF NOT EXISTS idx_vault_created       ON vault_items(created_at DESC);


-- ============================================================
-- 3. IDEAS
-- ============================================================
CREATE TABLE IF NOT EXISTS ideas (
  id          BIGSERIAL PRIMARY KEY,
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title       TEXT NOT NULL,
  description TEXT,
  category    TEXT,
  status      TEXT DEFAULT 'active',   -- urgent, active, someday, completed
  priority    TEXT DEFAULT 'medium',   -- high, medium, low
  tags        TEXT[] DEFAULT '{}',
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ideas_user_id ON ideas(user_id);

ALTER TABLE ideas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_ideas" ON ideas
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);


-- ============================================================
-- 4. BOOKMARKS
-- ============================================================
CREATE TABLE IF NOT EXISTS bookmarks (
  id          BIGSERIAL PRIMARY KEY,
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title       TEXT NOT NULL,
  url         TEXT NOT NULL,
  description TEXT,
  category    TEXT,
  status      TEXT DEFAULT 'read-later', -- read-later, favorites, archived
  tags        TEXT[] DEFAULT '{}',
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bookmarks_user_id ON bookmarks(user_id);

ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_bookmarks" ON bookmarks
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);


-- ============================================================
-- 5. PROJECTS
-- ============================================================
CREATE TABLE IF NOT EXISTS projects (
  id          BIGSERIAL PRIMARY KEY,
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title       TEXT NOT NULL,
  description TEXT,
  category    TEXT,
  status      TEXT DEFAULT 'active', -- active, planning, completed
  tags        TEXT[] DEFAULT '{}',
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_projects" ON projects
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);


-- ============================================================
-- 6. SHOPPING ITEMS
-- ============================================================
CREATE TABLE IF NOT EXISTS shopping_items (
  id          BIGSERIAL PRIMARY KEY,
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title       TEXT NOT NULL,
  url         TEXT,
  description TEXT,
  category    TEXT,
  status      TEXT DEFAULT 'to-buy', -- to-buy, watching, archived
  price       TEXT,
  image       TEXT,
  tags        TEXT[] DEFAULT '{}',
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_shopping_items_user_id ON shopping_items(user_id);

ALTER TABLE shopping_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_shopping_items" ON shopping_items
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);


-- ============================================================
-- 7. SETTINGS (per-user key/value, e.g. API keys)
-- ============================================================
CREATE TABLE IF NOT EXISTS settings (
  id         BIGSERIAL PRIMARY KEY,
  user_id    UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  key        TEXT NOT NULL,
  value      TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, key)
);

ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_settings" ON settings
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);


-- ============================================================
-- 8. ARTICLES (Letterman)
-- ============================================================
CREATE TABLE IF NOT EXISTS articles (
  id               TEXT PRIMARY KEY,
  user_id          UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title            TEXT NOT NULL,
  publication      TEXT NOT NULL,
  publication_id   TEXT NOT NULL,
  status           TEXT DEFAULT 'draft',
  image_url        TEXT,
  seo_title        TEXT,
  seo_description  TEXT,
  url_path         TEXT,
  content          TEXT,
  letterman_data   JSONB,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_articles_user_id        ON articles(user_id);
CREATE INDEX IF NOT EXISTS idx_articles_publication_id ON articles(publication_id);
CREATE INDEX IF NOT EXISTS idx_articles_status         ON articles(status);
CREATE INDEX IF NOT EXISTS idx_articles_created_at     ON articles(created_at DESC);

ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_articles" ON articles
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);


-- ============================================================
-- 9. BUSINESSES (Kanban board)
-- ============================================================
CREATE TABLE IF NOT EXISTS businesses (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    UUID REFERENCES auth.users(id) NOT NULL,
  name       TEXT NOT NULL,
  columns    JSONB DEFAULT '["Marketing","Follow-up","Research","Delivery"]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_businesses_user_id ON businesses(user_id);

ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own businesses"   ON businesses FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own businesses" ON businesses FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own businesses" ON businesses FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own businesses" ON businesses FOR DELETE USING (auth.uid() = user_id);


-- ============================================================
-- 10. BUSINESS CARDS
-- ============================================================
CREATE TABLE IF NOT EXISTS business_cards (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID REFERENCES auth.users(id) NOT NULL,
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
  title       TEXT NOT NULL,
  description TEXT DEFAULT '',
  column_name TEXT NOT NULL,
  labels      JSONB DEFAULT '[]'::jsonb,
  due_date    DATE,
  position    INT DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_business_cards_user_id     ON business_cards(user_id);
CREATE INDEX IF NOT EXISTS idx_business_cards_business_id ON business_cards(business_id);

ALTER TABLE business_cards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own business cards"   ON business_cards FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own business cards" ON business_cards FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own business cards" ON business_cards FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own business cards" ON business_cards FOR DELETE USING (auth.uid() = user_id);


-- ============================================================
-- 11. BUSINESS RESOURCES
-- ============================================================
CREATE TABLE IF NOT EXISTS business_resources (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID REFERENCES auth.users(id) NOT NULL,
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
  title       TEXT NOT NULL,
  url         TEXT DEFAULT '',
  type        TEXT DEFAULT 'link',
  created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_business_resources_user_id     ON business_resources(user_id);
CREATE INDEX IF NOT EXISTS idx_business_resources_business_id ON business_resources(business_id);

ALTER TABLE business_resources ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own business resources"   ON business_resources FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own business resources" ON business_resources FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own business resources" ON business_resources FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own business resources" ON business_resources FOR DELETE USING (auth.uid() = user_id);


-- ============================================================
-- 12. TEAM PROJECTS
-- ============================================================
CREATE TABLE IF NOT EXISTS team_projects (
  id         BIGSERIAL PRIMARY KEY,
  user_id    UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name       TEXT NOT NULL,
  color      TEXT DEFAULT '#6366f1',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_team_projects_user_id ON team_projects(user_id);


-- ============================================================
-- 13. TEAM TASKS
-- ============================================================
CREATE TABLE IF NOT EXISTS team_tasks (
  id          BIGSERIAL PRIMARY KEY,
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  project_id  BIGINT REFERENCES team_projects(id) ON DELETE SET NULL,
  title       TEXT NOT NULL,
  description TEXT DEFAULT '',
  status      TEXT DEFAULT 'inbox',   -- inbox, assigned, in_progress, review, done
  priority    TEXT DEFAULT 'medium',  -- high, medium, low
  tags        TEXT[] DEFAULT '{}',
  progress    INTEGER DEFAULT 0,
  assignee    TEXT DEFAULT '',
  start_date  DATE,
  due_date    DATE,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_team_tasks_user_id    ON team_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_team_tasks_project_id ON team_tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_team_tasks_status     ON team_tasks(status);


-- ============================================================
-- 14. TEAM MEMBERS
-- ============================================================
CREATE TABLE IF NOT EXISTS team_members (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name       TEXT NOT NULL,
  avatar     TEXT DEFAULT '👤',
  created_at TIMESTAMPTZ DEFAULT NOW()
);


-- ============================================================
-- 15. KANBAN TASKS
-- ============================================================
CREATE TABLE IF NOT EXISTS kanban_tasks (
  id         TEXT PRIMARY KEY,
  user_id    UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  task_data  JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS kanban_tasks_user_id ON kanban_tasks(user_id);


-- ============================================================
-- 16. COMMANDS
-- ============================================================
CREATE TABLE IF NOT EXISTS commands (
  id            SERIAL PRIMARY KEY,
  user_id       UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name          TEXT NOT NULL UNIQUE,
  category      TEXT NOT NULL,
  command_group TEXT NOT NULL,
  description   TEXT NOT NULL,
  steps         JSONB NOT NULL DEFAULT '[]',
  shortcut      TEXT,
  logo          TEXT,
  sort_order    INT DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_commands_user_id ON commands(user_id);

ALTER TABLE commands ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own commands" ON commands
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);


-- ============================================================
-- 17. COMMAND CENTER (cc_* tables)
-- ============================================================

CREATE TABLE IF NOT EXISTS cc_api_keys (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    UUID REFERENCES auth.users(id) NOT NULL,
  name       TEXT NOT NULL,
  key_masked TEXT DEFAULT '',
  status     TEXT DEFAULT 'connected',
  spent      NUMERIC(10,2) DEFAULT 0,
  budget     NUMERIC(10,2) DEFAULT 0,
  position   INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_cc_api_keys_user_id ON cc_api_keys(user_id);
ALTER TABLE cc_api_keys ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own cc_api_keys" ON cc_api_keys
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS cc_models (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    UUID REFERENCES auth.users(id) NOT NULL,
  name       TEXT NOT NULL,
  provider   TEXT DEFAULT '',
  status     TEXT DEFAULT 'available',
  position   INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_cc_models_user_id ON cc_models(user_id);
ALTER TABLE cc_models ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own cc_models" ON cc_models
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS cc_cron_jobs (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    UUID REFERENCES auth.users(id) NOT NULL,
  name       TEXT NOT NULL,
  schedule   TEXT DEFAULT '',
  status     TEXT DEFAULT 'active',
  position   INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_cc_cron_jobs_user_id ON cc_cron_jobs(user_id);
ALTER TABLE cc_cron_jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own cc_cron_jobs" ON cc_cron_jobs
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS cc_tasks (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID REFERENCES auth.users(id) NOT NULL,
  title       TEXT NOT NULL,
  priority    TEXT DEFAULT 'med',
  task_status TEXT DEFAULT 'backlog',
  position    INT DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_cc_tasks_user_id ON cc_tasks(user_id);
ALTER TABLE cc_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own cc_tasks" ON cc_tasks
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS cc_channels (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    UUID REFERENCES auth.users(id) NOT NULL,
  name       TEXT NOT NULL,
  subtitle   TEXT DEFAULT '',
  status     TEXT DEFAULT 'connected',
  position   INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_cc_channels_user_id ON cc_channels(user_id);
ALTER TABLE cc_channels ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own cc_channels" ON cc_channels
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS cc_integrations (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    UUID REFERENCES auth.users(id) NOT NULL,
  name       TEXT NOT NULL,
  key_masked TEXT DEFAULT '',
  position   INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_cc_integrations_user_id ON cc_integrations(user_id);
ALTER TABLE cc_integrations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own cc_integrations" ON cc_integrations
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS cc_features (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    UUID REFERENCES auth.users(id) NOT NULL,
  name       TEXT NOT NULL,
  position   INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_cc_features_user_id ON cc_features(user_id);
ALTER TABLE cc_features ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own cc_features" ON cc_features
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
