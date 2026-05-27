-- STG Core Discord Sync Tables
-- Created: 2026-05-27
-- Purpose: Store synchronized Discord data as single source of truth

-- Discord Guilds
CREATE TABLE IF NOT EXISTS discord_guilds (
  id BIGSERIAL PRIMARY KEY,
  guild_id BIGINT UNIQUE NOT NULL,
  guild_name VARCHAR(255) NOT NULL,
  icon_url TEXT,
  owner_id BIGINT,
  member_count INT DEFAULT 0,
  human_members INT DEFAULT 0,
  bot_members INT DEFAULT 0,
  online_members INT DEFAULT 0,
  channels_total INT DEFAULT 0,
  text_channels INT DEFAULT 0,
  voice_channels INT DEFAULT 0,
  roles_count INT DEFAULT 0,
  emojis INT DEFAULT 0,
  boosts INT DEFAULT 0,
  premium_tier INT DEFAULT 0,
  latency_ms FLOAT,
  uptime_seconds BIGINT,
  last_sync_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_discord_guilds_guild_id ON discord_guilds(guild_id);
CREATE INDEX IF NOT EXISTS idx_discord_guilds_updated_at ON discord_guilds(updated_at);

-- Discord Members
CREATE TABLE IF NOT EXISTS discord_members (
  id BIGSERIAL PRIMARY KEY,
  guild_id BIGINT NOT NULL,
  discord_id BIGINT NOT NULL,
  user_id BIGINT,
  username VARCHAR(255),
  discord_username VARCHAR(255),
  global_name VARCHAR(255),
  display_name VARCHAR(255),
  nick VARCHAR(255),
  avatar_url TEXT,
  joined_at TIMESTAMP WITH TIME ZONE,
  role_ids JSONB DEFAULT '[]',
  roles_json JSONB DEFAULT '{}',
  is_bot BOOLEAN DEFAULT FALSE,
  status VARCHAR(50),
  is_admin BOOLEAN DEFAULT FALSE,
  is_moderator BOOLEAN DEFAULT FALSE,
  can_access_dashboard BOOLEAN DEFAULT FALSE,
  last_discord_sync_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(guild_id, discord_id),
  FOREIGN KEY(guild_id) REFERENCES discord_guilds(guild_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_discord_members_guild_id ON discord_members(guild_id);
CREATE INDEX IF NOT EXISTS idx_discord_members_discord_id ON discord_members(discord_id);
CREATE UNIQUE INDEX IF NOT EXISTS ux_discord_members_discord_id ON discord_members(discord_id);
CREATE INDEX IF NOT EXISTS idx_discord_members_is_admin ON discord_members(is_admin);
CREATE INDEX IF NOT EXISTS idx_discord_members_is_moderator ON discord_members(is_moderator);
CREATE INDEX IF NOT EXISTS idx_discord_members_can_access_dashboard ON discord_members(can_access_dashboard);
CREATE INDEX IF NOT EXISTS idx_discord_members_updated_at ON discord_members(updated_at);

-- Discord Roles
CREATE TABLE IF NOT EXISTS discord_roles (
  id BIGSERIAL PRIMARY KEY,
  guild_id BIGINT NOT NULL,
  role_id BIGINT NOT NULL,
  name VARCHAR(255) NOT NULL,
  color INT,
  position INT,
  permissions BIGINT,
  mentionable BOOLEAN DEFAULT FALSE,
  last_sync_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(guild_id, role_id),
  FOREIGN KEY(guild_id) REFERENCES discord_guilds(guild_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_discord_roles_guild_id ON discord_roles(guild_id);
CREATE INDEX IF NOT EXISTS idx_discord_roles_role_id ON discord_roles(role_id);
CREATE UNIQUE INDEX IF NOT EXISTS ux_discord_roles_role_id ON discord_roles(role_id);
CREATE INDEX IF NOT EXISTS idx_discord_roles_updated_at ON discord_roles(updated_at);

-- Discord Channels
CREATE TABLE IF NOT EXISTS discord_channels (
  id BIGSERIAL PRIMARY KEY,
  guild_id BIGINT NOT NULL,
  channel_id BIGINT NOT NULL,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50),
  position INT,
  category_id BIGINT,
  nsfw BOOLEAN DEFAULT FALSE,
  last_sync_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(guild_id, channel_id),
  FOREIGN KEY(guild_id) REFERENCES discord_guilds(guild_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_discord_channels_guild_id ON discord_channels(guild_id);
CREATE INDEX IF NOT EXISTS idx_discord_channels_channel_id ON discord_channels(channel_id);
CREATE UNIQUE INDEX IF NOT EXISTS ux_discord_channels_channel_id ON discord_channels(channel_id);
CREATE INDEX IF NOT EXISTS idx_discord_channels_updated_at ON discord_channels(updated_at);

-- Discord Bot Status
CREATE TABLE IF NOT EXISTS discord_bot_status (
  id BIGSERIAL PRIMARY KEY,
  bot_id BIGINT NOT NULL,
  bot_name VARCHAR(255),
  guild_id BIGINT,
  status VARCHAR(50),
  latency_ms FLOAT,
  uptime_seconds BIGINT,
  guild_count INT,
  version VARCHAR(50),
  last_sync_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(guild_id) REFERENCES discord_guilds(guild_id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_discord_bot_status_bot_id ON discord_bot_status(bot_id);
CREATE INDEX IF NOT EXISTS idx_discord_bot_status_guild_id ON discord_bot_status(guild_id);
CREATE INDEX IF NOT EXISTS idx_discord_bot_status_created_at ON discord_bot_status(created_at);

-- Discord Metrics (Time-series data)
CREATE TABLE IF NOT EXISTS discord_metrics (
  id BIGSERIAL PRIMARY KEY,
  guild_id BIGINT NOT NULL,
  metrics_json JSONB NOT NULL DEFAULT '{}',
  last_sync_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(guild_id) REFERENCES discord_guilds(guild_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_discord_metrics_guild_id ON discord_metrics(guild_id);
CREATE INDEX IF NOT EXISTS idx_discord_metrics_created_at ON discord_metrics(created_at);

-- Discord Events (Audit log style)
CREATE TABLE IF NOT EXISTS discord_events (
  id BIGSERIAL PRIMARY KEY,
  guild_id BIGINT NOT NULL,
  event_type VARCHAR(100) NOT NULL,
  discord_id BIGINT,
  channel_id BIGINT,
  payload_json JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(guild_id) REFERENCES discord_guilds(guild_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_discord_events_guild_id ON discord_events(guild_id);
CREATE INDEX IF NOT EXISTS idx_discord_events_event_type ON discord_events(event_type);
CREATE INDEX IF NOT EXISTS idx_discord_events_created_at ON discord_events(created_at);
