-- Add user_id to articles table for per-user data isolation
ALTER TABLE articles ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_articles_user_id ON articles(user_id);
