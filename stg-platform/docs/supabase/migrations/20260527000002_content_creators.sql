ALTER TABLE discord_members
  ADD COLUMN IF NOT EXISTS is_content_creator boolean DEFAULT false;

CREATE TABLE IF NOT EXISTS content_creators (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  discord_id text NOT NULL,
  guild_id text,
  display_name text,
  username text,
  avatar_url text,
  bio text,
  is_active boolean DEFAULT true,
  is_featured boolean DEFAULT false,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS creator_channels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id uuid REFERENCES content_creators(id) ON DELETE CASCADE,
  platform text NOT NULL CHECK (platform IN ('youtube', 'twitch', 'kick', 'tiktok')),
  channel_id text,
  channel_url text,
  channel_name text,
  handle text,
  is_active boolean DEFAULT true,
  last_checked_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS creator_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id uuid REFERENCES content_creators(id) ON DELETE CASCADE,
  channel_id uuid REFERENCES creator_channels(id) ON DELETE CASCADE,
  platform text NOT NULL CHECK (platform IN ('youtube', 'twitch', 'kick', 'tiktok')),
  external_id text NOT NULL,
  content_type text NOT NULL CHECK (content_type IN ('video', 'live', 'short', 'clip')),
  title text,
  description text,
  thumbnail_url text,
  content_url text,
  embed_url text,
  published_at timestamptz,
  started_at timestamptz,
  ended_at timestamptz,
  is_live boolean DEFAULT false,
  is_active boolean DEFAULT true,
  raw_json jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(platform, external_id)
);

CREATE INDEX IF NOT EXISTS idx_discord_members_is_content_creator ON discord_members(is_content_creator);
CREATE INDEX IF NOT EXISTS idx_content_creators_discord_id ON content_creators(discord_id);
CREATE INDEX IF NOT EXISTS idx_creator_channels_platform ON creator_channels(platform);
CREATE INDEX IF NOT EXISTS idx_creator_content_platform ON creator_content(platform);
CREATE INDEX IF NOT EXISTS idx_creator_content_is_live ON creator_content(is_live);
CREATE INDEX IF NOT EXISTS idx_creator_content_published_at ON creator_content(published_at);
