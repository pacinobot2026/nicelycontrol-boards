-- Create clips table
CREATE TABLE IF NOT EXISTS clips (
  id SERIAL PRIMARY KEY,
  clip_id TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  duration_seconds INTEGER,
  viral_score TEXT,
  source_video TEXT,
  vizard_project_id TEXT,
  status TEXT DEFAULT 'pending_review',
  post_status TEXT DEFAULT 'not_posted',
  category TEXT,
  category_emoji TEXT,
  clip_url TEXT NOT NULL,
  suggested_caption TEXT,
  transcript TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create index on clip_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_clips_clip_id ON clips(clip_id);

-- Create index on status for filtering
CREATE INDEX IF NOT EXISTS idx_clips_status ON clips(status);

-- Create index on post_status for filtering
CREATE INDEX IF NOT EXISTS idx_clips_post_status ON clips(post_status);
