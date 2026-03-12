-- Migration 009: Create Command Center tables

-- 1. cc_api_keys: API provider keys + spend tracking
CREATE TABLE IF NOT EXISTS cc_api_keys (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  name TEXT NOT NULL,
  key_masked TEXT DEFAULT '',
  status TEXT DEFAULT 'connected',
  spent NUMERIC(10,2) DEFAULT 0,
  budget NUMERIC(10,2) DEFAULT 0,
  position INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_cc_api_keys_user_id ON cc_api_keys(user_id);
ALTER TABLE cc_api_keys ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own cc_api_keys" ON cc_api_keys FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 2. cc_models: AI model stack
CREATE TABLE IF NOT EXISTS cc_models (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  name TEXT NOT NULL,
  provider TEXT DEFAULT '',
  status TEXT DEFAULT 'available',
  position INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_cc_models_user_id ON cc_models(user_id);
ALTER TABLE cc_models ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own cc_models" ON cc_models FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 3. cc_cron_jobs: Automated cron job definitions
CREATE TABLE IF NOT EXISTS cc_cron_jobs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  name TEXT NOT NULL,
  schedule TEXT DEFAULT '',
  status TEXT DEFAULT 'active',
  position INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_cc_cron_jobs_user_id ON cc_cron_jobs(user_id);
ALTER TABLE cc_cron_jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own cc_cron_jobs" ON cc_cron_jobs FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 4. cc_tasks: Kanban tasks
CREATE TABLE IF NOT EXISTS cc_tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  title TEXT NOT NULL,
  priority TEXT DEFAULT 'med',
  task_status TEXT DEFAULT 'backlog',
  position INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_cc_tasks_user_id ON cc_tasks(user_id);
ALTER TABLE cc_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own cc_tasks" ON cc_tasks FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 5. cc_channels: Connected communication channels
CREATE TABLE IF NOT EXISTS cc_channels (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  name TEXT NOT NULL,
  subtitle TEXT DEFAULT '',
  status TEXT DEFAULT 'connected',
  position INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_cc_channels_user_id ON cc_channels(user_id);
ALTER TABLE cc_channels ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own cc_channels" ON cc_channels FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 6. cc_integrations: 3rd party integrations
CREATE TABLE IF NOT EXISTS cc_integrations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  name TEXT NOT NULL,
  key_masked TEXT DEFAULT '',
  position INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_cc_integrations_user_id ON cc_integrations(user_id);
ALTER TABLE cc_integrations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own cc_integrations" ON cc_integrations FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 7. cc_features: Key feature tags
CREATE TABLE IF NOT EXISTS cc_features (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  name TEXT NOT NULL,
  position INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_cc_features_user_id ON cc_features(user_id);
ALTER TABLE cc_features ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own cc_features" ON cc_features FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
