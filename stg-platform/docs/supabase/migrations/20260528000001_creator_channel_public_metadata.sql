ALTER TABLE creator_channels
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS thumbnail_url text,
  ADD COLUMN IF NOT EXISTS subscriber_count bigint,
  ADD COLUMN IF NOT EXISTS video_count bigint,
  ADD COLUMN IF NOT EXISTS view_count bigint,
  ADD COLUMN IF NOT EXISTS metadata_json jsonb DEFAULT '{}'::jsonb;
