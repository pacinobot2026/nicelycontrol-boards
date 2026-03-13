-- Team members table for dynamic assignees

CREATE TABLE IF NOT EXISTS team_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  avatar TEXT DEFAULT '👤',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed with existing team members
INSERT INTO team_members (name, avatar) VALUES
  ('Chad', '👨‍💼'),
  ('Pacino', '🎬'),
  ('Gaurav', '👨‍💻'),
  ('Pranay', '👨‍💻')
ON CONFLICT DO NOTHING;
