-- Settings table for per-user key/value configuration (e.g. API keys)
CREATE TABLE IF NOT EXISTS settings (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  key TEXT NOT NULL,
  value TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, key)
);

ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_own_settings" ON settings
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
