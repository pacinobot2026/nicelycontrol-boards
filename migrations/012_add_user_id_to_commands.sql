-- Migration 012: Add user_id to commands table for per-user isolation

ALTER TABLE commands ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_commands_user_id ON commands(user_id);

-- Enable RLS
ALTER TABLE commands ENABLE ROW LEVEL SECURITY;

-- Users can only access their own commands
CREATE POLICY "Users can manage own commands" ON commands
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
