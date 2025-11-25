/*
  # Facebook Integration Schema

  1. New Tables
    - `user_profiles`
      - `id` (uuid, primary key)
      - `email` (text, unique)
      - `name` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `facebook_accounts`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to user_profiles)
      - `facebook_user_id` (text, unique)
      - `name` (text)
      - `email` (text)
      - `access_token` (text, encrypted)
      - `token_expires_at` (timestamptz)
      - `avatar_url` (text)
      - `is_connected` (boolean, default true)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `facebook_pages`
      - `id` (uuid, primary key)
      - `facebook_account_id` (uuid, foreign key to facebook_accounts)
      - `page_id` (text, unique)
      - `name` (text)
      - `access_token` (text, encrypted)
      - `category` (text)
      - `followers_count` (integer, default 0)
      - `avatar_url` (text)
      - `automation_enabled` (boolean, default false)
      - `ai_instructions` (text)
      - `instagram_account_id` (text)
      - `instagram_username` (text)
      - `instagram_avatar_url` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `scheduled_posts`
      - `id` (uuid, primary key)
      - `facebook_page_id` (uuid, foreign key to facebook_pages)
      - `content` (text)
      - `media_type` (text) - 'text', 'image', 'video'
      - `media_url` (text)
      - `scheduled_time` (timestamptz)
      - `status` (text) - 'queued', 'published', 'failed'
      - `recurrence` (text) - 'once', '30m', '1h', '3h', '6h', '12h', 'daily', 'weekly'
      - `facebook_post_id` (text)
      - `created_at` (timestamptz)
      - `published_at` (timestamptz)
    
    - `api_configurations`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to user_profiles)
      - `provider` (text) - 'openai', 'gemini', 'anthropic', etc.
      - `api_key` (text, encrypted)
      - `is_active` (boolean, default false)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `app_settings`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to user_profiles, unique)
      - `fb_app_id` (text)
      - `fb_app_secret` (text, encrypted)
      - `smtp_host` (text)
      - `smtp_port` (integer)
      - `smtp_user` (text)
      - `smtp_pass` (text, encrypted)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
    - Ensure users can only access their own accounts, pages, and settings

  3. Important Notes
    - All sensitive data (access tokens, API keys, passwords) should be encrypted at application level
    - Facebook tokens have expiration, we store token_expires_at to track validity
    - Automation settings are per page
    - Multiple API providers can be configured per user
*/

-- Create user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  name text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON user_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Create facebook_accounts table
CREATE TABLE IF NOT EXISTS facebook_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  facebook_user_id text UNIQUE NOT NULL,
  name text NOT NULL,
  email text,
  access_token text NOT NULL,
  token_expires_at timestamptz,
  avatar_url text,
  is_connected boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE facebook_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own facebook accounts"
  ON facebook_accounts FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own facebook accounts"
  ON facebook_accounts FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own facebook accounts"
  ON facebook_accounts FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own facebook accounts"
  ON facebook_accounts FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Create facebook_pages table
CREATE TABLE IF NOT EXISTS facebook_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  facebook_account_id uuid NOT NULL REFERENCES facebook_accounts(id) ON DELETE CASCADE,
  page_id text UNIQUE NOT NULL,
  name text NOT NULL,
  access_token text NOT NULL,
  category text,
  followers_count integer DEFAULT 0,
  avatar_url text,
  automation_enabled boolean DEFAULT false,
  ai_instructions text DEFAULT '',
  instagram_account_id text,
  instagram_username text,
  instagram_avatar_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE facebook_pages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own facebook pages"
  ON facebook_pages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM facebook_accounts
      WHERE facebook_accounts.id = facebook_pages.facebook_account_id
      AND facebook_accounts.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own facebook pages"
  ON facebook_pages FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM facebook_accounts
      WHERE facebook_accounts.id = facebook_pages.facebook_account_id
      AND facebook_accounts.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own facebook pages"
  ON facebook_pages FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM facebook_accounts
      WHERE facebook_accounts.id = facebook_pages.facebook_account_id
      AND facebook_accounts.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM facebook_accounts
      WHERE facebook_accounts.id = facebook_pages.facebook_account_id
      AND facebook_accounts.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own facebook pages"
  ON facebook_pages FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM facebook_accounts
      WHERE facebook_accounts.id = facebook_pages.facebook_account_id
      AND facebook_accounts.user_id = auth.uid()
    )
  );

-- Create scheduled_posts table
CREATE TABLE IF NOT EXISTS scheduled_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  facebook_page_id uuid NOT NULL REFERENCES facebook_pages(id) ON DELETE CASCADE,
  content text,
  media_type text NOT NULL DEFAULT 'text',
  media_url text,
  scheduled_time timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'queued',
  recurrence text NOT NULL DEFAULT 'once',
  facebook_post_id text,
  created_at timestamptz DEFAULT now(),
  published_at timestamptz
);

ALTER TABLE scheduled_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own scheduled posts"
  ON scheduled_posts FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM facebook_pages
      JOIN facebook_accounts ON facebook_pages.facebook_account_id = facebook_accounts.id
      WHERE facebook_pages.id = scheduled_posts.facebook_page_id
      AND facebook_accounts.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own scheduled posts"
  ON scheduled_posts FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM facebook_pages
      JOIN facebook_accounts ON facebook_pages.facebook_account_id = facebook_accounts.id
      WHERE facebook_pages.id = scheduled_posts.facebook_page_id
      AND facebook_accounts.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own scheduled posts"
  ON scheduled_posts FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM facebook_pages
      JOIN facebook_accounts ON facebook_pages.facebook_account_id = facebook_accounts.id
      WHERE facebook_pages.id = scheduled_posts.facebook_page_id
      AND facebook_accounts.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM facebook_pages
      JOIN facebook_accounts ON facebook_pages.facebook_account_id = facebook_accounts.id
      WHERE facebook_pages.id = scheduled_posts.facebook_page_id
      AND facebook_accounts.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own scheduled posts"
  ON scheduled_posts FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM facebook_pages
      JOIN facebook_accounts ON facebook_pages.facebook_account_id = facebook_accounts.id
      WHERE facebook_pages.id = scheduled_posts.facebook_page_id
      AND facebook_accounts.user_id = auth.uid()
    )
  );

-- Create api_configurations table
CREATE TABLE IF NOT EXISTS api_configurations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  provider text NOT NULL,
  api_key text NOT NULL,
  is_active boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, provider)
);

ALTER TABLE api_configurations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own api configurations"
  ON api_configurations FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own api configurations"
  ON api_configurations FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own api configurations"
  ON api_configurations FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own api configurations"
  ON api_configurations FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Create app_settings table
CREATE TABLE IF NOT EXISTS app_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  fb_app_id text,
  fb_app_secret text,
  smtp_host text,
  smtp_port integer,
  smtp_user text,
  smtp_pass text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own app settings"
  ON app_settings FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own app settings"
  ON app_settings FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own app settings"
  ON app_settings FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own app settings"
  ON app_settings FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_facebook_accounts_user_id ON facebook_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_facebook_pages_account_id ON facebook_pages(facebook_account_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_posts_page_id ON scheduled_posts(facebook_page_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_posts_status ON scheduled_posts(status);
CREATE INDEX IF NOT EXISTS idx_api_configurations_user_id ON api_configurations(user_id);
CREATE INDEX IF NOT EXISTS idx_app_settings_user_id ON app_settings(user_id);
