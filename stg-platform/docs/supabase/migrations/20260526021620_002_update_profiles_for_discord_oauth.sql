/*
  # Update profiles table for Discord OAuth

  1. Changes
    - Add discord_avatar_url (for Discord avatar)
    - Add discord_username field
    - Update handle_new_user function to support Discord OAuth
    - Handle both email signup and Discord OAuth signup

  2. Important Notes
    - Discord OAuth users will have additional metadata
    - User metadata from Discord will be stored in auth.users.raw_user_meta_data
    - Profile is created automatically for both signup methods
*/

-- Add discord_avatar_url column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'discord_avatar_url'
  ) THEN
    ALTER TABLE profiles ADD COLUMN discord_avatar_url text;
  END IF;
END $$;

-- Update handle_new_user function to handle Discord OAuth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  discord_username text;
  discord_id text;
  discord_avatar text;
  username_to_use text;
BEGIN
  -- Extract Discord data from user metadata if available
  discord_username := NEW.raw_user_meta_data->>'full_name';
  discord_id := NEW.raw_user_meta_data->>'provider_id';
  discord_avatar := NEW.raw_user_meta_data->>'avatar_url';
  
  -- Determine username
  IF discord_username IS NOT NULL AND discord_username != '' THEN
    username_to_use := discord_username;
  ELSE
    username_to_use := COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1));
  END IF;
  
  -- Ensure username is unique (append random suffix if needed)
  WHILE EXISTS (SELECT 1 FROM profiles WHERE username = username_to_use AND id != NEW.id) LOOP
    username_to_use := username_to_use || '_' || substr(md5(random()::text), 1, 4);
  END LOOP;
  
  -- Insert profile
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

-- Update avatar_url to support Discord avatars
COMMENT ON COLUMN profiles.avatar_url IS 'User avatar URL (either uploaded or from Discord)';
COMMENT ON COLUMN profiles.discord_avatar_url IS 'Specific Discord avatar URL for OAuth users';
