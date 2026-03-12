-- Team Board tables: projects and tasks

CREATE TABLE IF NOT EXISTS team_projects (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#6366f1',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS team_tasks (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  project_id BIGINT REFERENCES team_projects(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  status TEXT DEFAULT 'inbox',        -- inbox, assigned, in_progress, review, done
  priority TEXT DEFAULT 'medium',     -- high, medium, low
  tags TEXT[] DEFAULT '{}',
  progress INTEGER DEFAULT 0,
  assignee TEXT DEFAULT '',
  start_date DATE,
  due_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_team_projects_user_id ON team_projects(user_id);
CREATE INDEX IF NOT EXISTS idx_team_tasks_user_id ON team_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_team_tasks_project_id ON team_tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_team_tasks_status ON team_tasks(status);
