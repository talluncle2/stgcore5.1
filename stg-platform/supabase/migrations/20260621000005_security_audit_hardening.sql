-- Security hardening based on the Supabase database audit.
-- Discord synchronization tables remain private to the API/bot database role.

DO $$
DECLARE
  table_name text;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'discord_bot_status',
    'discord_channels',
    'discord_events',
    'discord_guilds',
    'discord_members',
    'discord_metrics',
    'discord_roles'
  ]
  LOOP
    IF to_regclass(format('public.%I', table_name)) IS NOT NULL THEN
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', table_name);
      EXECUTE format('REVOKE ALL ON TABLE public.%I FROM anon, authenticated', table_name);
      EXECUTE format(
        'DROP POLICY IF EXISTS "Frontend access denied" ON public.%I',
        table_name
      );
      EXECUTE format(
        'CREATE POLICY "Frontend access denied" ON public.%I
         AS RESTRICTIVE FOR ALL TO anon, authenticated
         USING (false) WITH CHECK (false)',
        table_name
      );
    END IF;
  END LOOP;
END
$$;

-- Trigger functions are internal implementation details, not public RPCs.
ALTER FUNCTION public.handle_new_user()
  SET search_path = public, pg_temp;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM anon, authenticated;

ALTER FUNCTION public.handle_updated_at()
  SET search_path = public, pg_temp;
REVOKE ALL ON FUNCTION public.handle_updated_at() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.handle_updated_at() FROM anon, authenticated;

-- Profiles are private by default. The frontend currently reads and writes
-- profile data through the authenticated API, while direct database access is
-- limited to the record owner or a real admin claim.
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles are readable" ON public.profiles;
DROP POLICY IF EXISTS "Profiles owner or admin reads" ON public.profiles;
DROP POLICY IF EXISTS "Profiles owner or admin inserts" ON public.profiles;
DROP POLICY IF EXISTS "Profiles owner or admin updates" ON public.profiles;
DROP POLICY IF EXISTS "Profiles admin deletes" ON public.profiles;

CREATE POLICY "Profiles owner or admin reads"
  ON public.profiles FOR SELECT TO authenticated
  USING (
    id = (SELECT auth.uid())
    OR COALESCE((SELECT auth.jwt() ->> 'is_admin'), 'false') = 'true'
  );

CREATE POLICY "Profiles owner or admin inserts"
  ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (
    id = (SELECT auth.uid())
    OR COALESCE((SELECT auth.jwt() ->> 'is_admin'), 'false') = 'true'
  );

CREATE POLICY "Profiles owner or admin updates"
  ON public.profiles FOR UPDATE TO authenticated
  USING (
    id = (SELECT auth.uid())
    OR COALESCE((SELECT auth.jwt() ->> 'is_admin'), 'false') = 'true'
  )
  WITH CHECK (
    id = (SELECT auth.uid())
    OR COALESCE((SELECT auth.jwt() ->> 'is_admin'), 'false') = 'true'
  );

CREATE POLICY "Profiles admin deletes"
  ON public.profiles FOR DELETE TO authenticated
  USING (COALESCE((SELECT auth.jwt() ->> 'is_admin'), 'false') = 'true');

-- RLS controls rows, while this trigger prevents an owner from promoting
-- themselves or editing economy/Discord-controlled fields in their own row.
CREATE OR REPLACE FUNCTION public.stg_protect_profile_privileged_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF current_user IN ('postgres', 'service_role')
     OR COALESCE((SELECT auth.jwt() ->> 'is_admin'), 'false') = 'true' THEN
    RETURN NEW;
  END IF;

  NEW.role := OLD.role;
  NEW.xp := OLD.xp;
  NEW.level := OLD.level;
  NEW.coins := OLD.coins;
  NEW.discord_id := OLD.discord_id;
  NEW.email := OLD.email;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.stg_protect_profile_privileged_fields() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.stg_protect_profile_privileged_fields() FROM anon, authenticated;

DROP TRIGGER IF EXISTS protect_profile_privileged_fields ON public.profiles;
CREATE TRIGGER protect_profile_privileged_fields
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.stg_protect_profile_privileged_fields();
