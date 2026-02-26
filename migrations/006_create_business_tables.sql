-- Migration 006: Create business tables for Kanban board
-- Tables: businesses, business_cards, business_resources

-- 1. Businesses table
CREATE TABLE IF NOT EXISTS businesses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  name TEXT NOT NULL,
  columns JSONB DEFAULT '["Marketing","Follow-up","Research","Delivery"]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_businesses_user_id ON businesses(user_id);

ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own businesses"
  ON businesses FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own businesses"
  ON businesses FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own businesses"
  ON businesses FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own businesses"
  ON businesses FOR DELETE USING (auth.uid() = user_id);

-- 2. Business cards table
CREATE TABLE IF NOT EXISTS business_cards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  column_name TEXT NOT NULL,
  labels JSONB DEFAULT '[]'::jsonb,
  due_date DATE,
  position INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_business_cards_user_id ON business_cards(user_id);
CREATE INDEX idx_business_cards_business_id ON business_cards(business_id);

ALTER TABLE business_cards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own business cards"
  ON business_cards FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own business cards"
  ON business_cards FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own business cards"
  ON business_cards FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own business cards"
  ON business_cards FOR DELETE USING (auth.uid() = user_id);

-- 3. Business resources table
CREATE TABLE IF NOT EXISTS business_resources (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  url TEXT DEFAULT '',
  type TEXT DEFAULT 'link',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_business_resources_user_id ON business_resources(user_id);
CREATE INDEX idx_business_resources_business_id ON business_resources(business_id);

ALTER TABLE business_resources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own business resources"
  ON business_resources FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own business resources"
  ON business_resources FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own business resources"
  ON business_resources FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own business resources"
  ON business_resources FOR DELETE USING (auth.uid() = user_id);
