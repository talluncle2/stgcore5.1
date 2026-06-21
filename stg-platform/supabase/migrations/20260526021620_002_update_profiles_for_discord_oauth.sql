DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'discord_avatar_url'
  ) THEN
    ALTER TABLE profiles ADD COLUMN discord_avatar_url text;
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  discord_username text;
  discord_id text;
  discord_avatar text;
  username_to_use text;
BEGIN
  discord_username := NEW.raw_user_meta_data->>'full_name';
  discord_id := NEW.raw_user_meta_data->>'provider_id';
  discord_avatar := NEW.raw_user_meta_data->>'avatar_url';

  IF discord_username IS NOT NULL AND discord_username != '' THEN
    username_to_use := discord_username;
  ELSE
    username_to_use := COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1));
  END IF;

  WHILE EXISTS (SELECT 1 FROM profiles WHERE username = username_to_use AND id != NEW.id) LOOP
    username_to_use := username_to_use || '_' || substr(md5(random()::text), 1, 4);
  END LOOP;

  INSERT INTO public.profiles (id, email, username, discord_id, avatar_url, discord_avatar_url, role, xp, level, coins)
  VALUES (
    NEW.id,
    NEW.email,
    username_to_use,
    discord_id,
    discord_avatar,
    discord_avatar,
    'user',
    0,
    1,
    100
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON COLUMN profiles.avatar_url IS 'User avatar URL (either uploaded or from Discord)';
COMMENT ON COLUMN profiles.discord_avatar_url IS 'Specific Discord avatar URL for OAuth users';
