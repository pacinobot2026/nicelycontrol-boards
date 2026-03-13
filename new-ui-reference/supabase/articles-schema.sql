-- Articles table for storing Letterman articles with metadata
CREATE TABLE IF NOT EXISTS articles (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  publication TEXT NOT NULL,
  publication_id TEXT NOT NULL,
  status TEXT DEFAULT 'draft',
  image_url TEXT,
  seo_title TEXT,
  seo_description TEXT,
  url_path TEXT,
  content TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  letterman_data JSONB -- Store full Letterman response for reference
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_articles_publication_id ON articles(publication_id);
CREATE INDEX IF NOT EXISTS idx_articles_status ON articles(status);
CREATE INDEX IF NOT EXISTS idx_articles_created_at ON articles(created_at DESC);

-- Enable Row Level Security (optional, configure as needed)
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;

-- Policy example (adjust based on your auth setup)
CREATE POLICY "Allow all operations for authenticated users" ON articles
  FOR ALL
  USING (true)
  WITH CHECK (true);
