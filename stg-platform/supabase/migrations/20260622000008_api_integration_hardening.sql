-- Align the Replit API profile contract with the Supabase schema and keep
-- creator-owned updates safe when using API-issued Discord JWTs.

CREATE TABLE IF NOT EXISTS public.user_public_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id bigint,
  discord_id text NOT NULL UNIQUE,
  public_name text,
  public_avatar_url text,
  public_banner_url text,
  bio text,
  public_email text,
  location_optional text,
  pronouns text,
  sexual_orientation text,
  sexual_orientation_visibility text NOT NULL DEFAULT 'private',
  profile_visibility text NOT NULL DEFAULT 'public',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_public_profiles_discord_id
  ON public.user_public_profiles(discord_id);

DROP TRIGGER IF EXISTS set_user_public_profiles_updated_at
  ON public.user_public_profiles;
CREATE TRIGGER set_user_public_profiles_updated_at
  BEFORE UPDATE ON public.user_public_profiles
  FOR EACH ROW EXECUTE FUNCTION public.stg_set_updated_at();

ALTER TABLE public.user_public_profiles ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.user_public_profiles FROM anon, authenticated;

DROP POLICY IF EXISTS "Frontend access denied"
  ON public.user_public_profiles;
CREATE POLICY "Frontend access denied"
  ON public.user_public_profiles
  AS RESTRICTIVE FOR ALL TO anon, authenticated
  USING (false)
  WITH CHECK (false);

CREATE OR REPLACE FUNCTION public.stg_is_creator_owner(target_creator_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.content_creators AS creator
    WHERE creator.id = target_creator_id
      AND creator.discord_id = auth.jwt() ->> 'discord_id'
  );
$$;

REVOKE ALL ON FUNCTION public.stg_is_creator_owner(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.stg_is_creator_owner(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.stg_protect_creator_privileged_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
BEGIN
  IF current_user IN ('postgres', 'service_role')
     OR COALESCE(auth.jwt() ->> 'is_admin', 'false') = 'true' THEN
    RETURN NEW;
  END IF;

  NEW.discord_id := OLD.discord_id;
  NEW.guild_id := OLD.guild_id;
  NEW.is_active := OLD.is_active;
  NEW.is_featured := OLD.is_featured;
  NEW.is_verified := OLD.is_verified;
  NEW.sort_order := OLD.sort_order;
  NEW.last_checked_at := OLD.last_checked_at;
  NEW.last_check_status := OLD.last_check_status;
  NEW.created_at := OLD.created_at;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.stg_protect_creator_privileged_fields() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.stg_protect_creator_privileged_fields()
  FROM anon, authenticated;

DROP TRIGGER IF EXISTS protect_creator_privileged_fields
  ON public.content_creators;
CREATE TRIGGER protect_creator_privileged_fields
  BEFORE UPDATE ON public.content_creators
  FOR EACH ROW EXECUTE FUNCTION public.stg_protect_creator_privileged_fields();

DROP POLICY IF EXISTS "Admins update creator profiles"
  ON public.content_creators;
DROP POLICY IF EXISTS "Creators or admins update creator profiles"
  ON public.content_creators;
CREATE POLICY "Creators or admins update creator profiles"
  ON public.content_creators FOR UPDATE TO authenticated
  USING (
    discord_id = auth.jwt() ->> 'discord_id'
    OR COALESCE(auth.jwt() ->> 'is_admin', 'false') = 'true'
  )
  WITH CHECK (
    discord_id = auth.jwt() ->> 'discord_id'
    OR COALESCE(auth.jwt() ->> 'is_admin', 'false') = 'true'
  );
