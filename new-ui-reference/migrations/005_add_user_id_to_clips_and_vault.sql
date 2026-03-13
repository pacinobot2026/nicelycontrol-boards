-- Add user_id to clips table so each clip is scoped to the user who created it
ALTER TABLE clips ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

CREATE INDEX IF NOT EXISTS idx_clips_user_id ON clips(user_id);

-- Add user_id to vault_items table so each item is scoped to its owner
ALTER TABLE vault_items ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

CREATE INDEX IF NOT EXISTS idx_vault_items_user_id ON vault_items(user_id);
