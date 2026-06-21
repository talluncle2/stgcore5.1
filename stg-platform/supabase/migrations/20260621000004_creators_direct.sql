-- Creator profiles are managed directly by the frontend through Supabase RLS.
-- External platform secrets must never be exposed to the browser.

ALTER TABLE public.content_creators
  ADD COLUMN IF NOT EXISTS banner_url text,
  ADD COLUMN IF NOT EXISTS is_verified boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS last_checked_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_check_status text;

CREATE UNIQUE INDEX IF NOT EXISTS ux_content_creators_discord_id
  ON public.content_creators(discord_id);

CREATE INDEX IF NOT EXISTS idx_content_creators_public
  ON public.content_creators(is_active, is_featured, sort_order);

CREATE INDEX IF NOT EXISTS idx_creator_channels_creator_active
  ON public.creator_channels(creator_id, is_active, platform);

CREATE INDEX IF NOT EXISTS idx_creator_content_creator_active
  ON public.creator_content(creator_id, is_active, published_at DESC);

DROP TRIGGER IF EXISTS set_content_creators_updated_at ON public.content_creators;
CREATE TRIGGER set_content_creators_updated_at
  BEFORE UPDATE ON public.content_creators
  FOR EACH ROW EXECUTE FUNCTION public.stg_set_updated_at();

DROP TRIGGER IF EXISTS set_creator_channels_updated_at ON public.creator_channels;
CREATE TRIGGER set_creator_channels_updated_at
  BEFORE UPDATE ON public.creator_channels
  FOR EACH ROW EXECUTE FUNCTION public.stg_set_updated_at();

DROP TRIGGER IF EXISTS set_creator_content_updated_at ON public.creator_content;
CREATE TRIGGER set_creator_content_updated_at
  BEFORE UPDATE ON public.creator_content
  FOR EACH ROW EXECUTE FUNCTION public.stg_set_updated_at();

CREATE OR REPLACE FUNCTION public.stg_is_creator_owner(target_creator_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.content_creators creator
    WHERE creator.id = target_creator_id
      AND creator.discord_id = auth.jwt() ->> 'discord_id'
  );
$$;

ALTER TABLE public.content_creators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creator_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creator_content ENABLE ROW LEVEL SECURITY;

REVOKE SELECT ON public.creator_content FROM anon, authenticated;
GRANT SELECT (
  id,
  creator_id,
  channel_id,
  platform,
  external_id,
  content_type,
  title,
  description,
  thumbnail_url,
  content_url,
  embed_url,
  published_at,
  started_at,
  ended_at,
  is_live,
  is_active,
  created_at,
  updated_at
) ON public.creator_content TO anon, authenticated;

DROP POLICY IF EXISTS "Public reads active creators" ON public.content_creators;
CREATE POLICY "Public reads active creators"
  ON public.content_creators FOR SELECT TO anon, authenticated
  USING (is_active OR public.stg_can_manage_content());

DROP POLICY IF EXISTS "Creators create own profile" ON public.content_creators;
CREATE POLICY "Creators create own profile"
  ON public.content_creators FOR INSERT TO authenticated
  WITH CHECK (
    (
      discord_id = auth.jwt() ->> 'discord_id'
      AND COALESCE(auth.jwt() ->> 'is_content_creator', 'false') = 'true'
      AND is_featured = false
      AND is_verified = false
    )
    OR COALESCE(auth.jwt() ->> 'is_admin', 'false') = 'true'
  );

DROP POLICY IF EXISTS "Admins update creator profiles" ON public.content_creators;
CREATE POLICY "Admins update creator profiles"
  ON public.content_creators FOR UPDATE TO authenticated
  USING (COALESCE(auth.jwt() ->> 'is_admin', 'false') = 'true')
  WITH CHECK (COALESCE(auth.jwt() ->> 'is_admin', 'false') = 'true');

DROP POLICY IF EXISTS "Admins manage creator profiles" ON public.content_creators;
CREATE POLICY "Admins manage creator profiles"
  ON public.content_creators FOR DELETE TO authenticated
  USING (COALESCE(auth.jwt() ->> 'is_admin', 'false') = 'true');

DROP POLICY IF EXISTS "Public reads active creator channels" ON public.creator_channels;
CREATE POLICY "Public reads active creator channels"
  ON public.creator_channels FOR SELECT TO anon, authenticated
  USING (
    (
      is_active
      AND EXISTS (
        SELECT 1 FROM public.content_creators creator
        WHERE creator.id = creator_id AND creator.is_active
      )
    )
    OR public.stg_can_manage_content()
  );

DROP POLICY IF EXISTS "Creators insert own channels" ON public.creator_channels;
CREATE POLICY "Creators insert own channels"
  ON public.creator_channels FOR INSERT TO authenticated
  WITH CHECK (
    public.stg_is_creator_owner(creator_id)
    OR COALESCE(auth.jwt() ->> 'is_admin', 'false') = 'true'
  );

DROP POLICY IF EXISTS "Creators update own channels" ON public.creator_channels;
CREATE POLICY "Creators update own channels"
  ON public.creator_channels FOR UPDATE TO authenticated
  USING (
    public.stg_is_creator_owner(creator_id)
    OR COALESCE(auth.jwt() ->> 'is_admin', 'false') = 'true'
  )
  WITH CHECK (
    public.stg_is_creator_owner(creator_id)
    OR COALESCE(auth.jwt() ->> 'is_admin', 'false') = 'true'
  );

DROP POLICY IF EXISTS "Creators delete own channels" ON public.creator_channels;
CREATE POLICY "Creators delete own channels"
  ON public.creator_channels FOR DELETE TO authenticated
  USING (
    public.stg_is_creator_owner(creator_id)
    OR COALESCE(auth.jwt() ->> 'is_admin', 'false') = 'true'
  );

DROP POLICY IF EXISTS "Public reads active creator content" ON public.creator_content;
CREATE POLICY "Public reads active creator content"
  ON public.creator_content FOR SELECT TO anon, authenticated
  USING (
    (
      is_active
      AND EXISTS (
        SELECT 1 FROM public.content_creators creator
        WHERE creator.id = creator_id AND creator.is_active
      )
    )
    OR public.stg_can_manage_content()
  );

DROP POLICY IF EXISTS "Admins manage creator content" ON public.creator_content;
CREATE POLICY "Admins manage creator content"
  ON public.creator_content FOR ALL TO authenticated
  USING (COALESCE(auth.jwt() ->> 'is_admin', 'false') = 'true')
  WITH CHECK (COALESCE(auth.jwt() ->> 'is_admin', 'false') = 'true');
