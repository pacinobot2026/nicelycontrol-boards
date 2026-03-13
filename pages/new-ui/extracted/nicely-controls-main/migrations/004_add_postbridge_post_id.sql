-- Add PostBridge post ID to clips table
ALTER TABLE clips ADD COLUMN IF NOT EXISTS postbridge_post_id TEXT;
