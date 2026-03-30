CREATE TABLE IF NOT EXISTS vault_items (
  id           SERIAL PRIMARY KEY,
  user_id      UUID REFERENCES auth.users(id),
  title        TEXT NOT NULL,
  category     TEXT NOT NULL DEFAULT 'general',
  type         TEXT NOT NULL DEFAULT 'note',
  resource_url TEXT,
  notes        TEXT DEFAULT '',
  tags         TEXT[] DEFAULT '{}',
  created_at   TIMESTAMP DEFAULT NOW(),
  updated_at   TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vault_items_user_id ON vault_items(user_id);
CREATE INDEX IF NOT EXISTS idx_vault_category      ON vault_items(category);
CREATE INDEX IF NOT EXISTS idx_vault_type          ON vault_items(type);
