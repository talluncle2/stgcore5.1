-- Support tables for the same-origin Vercel API.
-- They keep editable site content server-side while direct browser access is
-- denied; the API persists and reads these rows through DATABASE_URL.

CREATE TABLE IF NOT EXISTS public.site_content_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type text NOT NULL CHECK (content_type IN ('news', 'home', 'ranking')),
  item_id text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  is_featured boolean NOT NULL DEFAULT false,
  priority integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(content_type, item_id)
);

CREATE INDEX IF NOT EXISTS idx_site_content_items_lookup
  ON public.site_content_items(content_type, priority DESC, created_at DESC);

DROP TRIGGER IF EXISTS set_site_content_items_updated_at
  ON public.site_content_items;
CREATE TRIGGER set_site_content_items_updated_at
  BEFORE UPDATE ON public.site_content_items
  FOR EACH ROW EXECUTE FUNCTION public.stg_set_updated_at();

ALTER TABLE public.site_content_items ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.site_content_items FROM anon, authenticated;

DROP POLICY IF EXISTS "Frontend access denied"
  ON public.site_content_items;
CREATE POLICY "Frontend access denied"
  ON public.site_content_items
  AS RESTRICTIVE FOR ALL TO anon, authenticated
  USING (false)
  WITH CHECK (false);

CREATE TABLE IF NOT EXISTS public.site_settings (
  key text PRIMARY KEY,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS set_site_settings_updated_at
  ON public.site_settings;
CREATE TRIGGER set_site_settings_updated_at
  BEFORE UPDATE ON public.site_settings
  FOR EACH ROW EXECUTE FUNCTION public.stg_set_updated_at();

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.site_settings FROM anon, authenticated;

DROP POLICY IF EXISTS "Frontend access denied"
  ON public.site_settings;
CREATE POLICY "Frontend access denied"
  ON public.site_settings
  AS RESTRICTIVE FOR ALL TO anon, authenticated
  USING (false)
  WITH CHECK (false);
