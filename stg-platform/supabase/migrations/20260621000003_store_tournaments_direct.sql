-- Store and tournament data are read directly by the Vite frontend through
-- Supabase PostgREST. Never expose the service_role key in the frontend.

CREATE TABLE IF NOT EXISTS public.store_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  category text,
  image_url text,
  price_coins numeric(14, 2) DEFAULT 0,
  sale_price_coins numeric(14, 2),
  price_brl numeric(14, 2) DEFAULT 0,
  sale_price_brl numeric(14, 2),
  discount_percent integer DEFAULT 0 CHECK (discount_percent BETWEEN 0 AND 100),
  stock integer,
  is_active boolean NOT NULL DEFAULT true,
  is_featured boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.tournament_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  image_url text,
  status text NOT NULL DEFAULT 'em_breve',
  start_date timestamptz,
  end_date timestamptz,
  prize text,
  priority integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  is_featured boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.warzone_operations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  codename text,
  description text NOT NULL DEFAULT '',
  image_url text,
  mode text NOT NULL,
  map text,
  status text NOT NULL DEFAULT 'em_breve',
  allowed_clans text[] NOT NULL DEFAULT ARRAY['ALL']::text[],
  start_date timestamptz,
  end_date timestamptz,
  prize text,
  entry_fee text,
  rules text,
  score_rule text,
  registration_url text,
  max_teams integer,
  participants integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  is_featured boolean NOT NULL DEFAULT false,
  priority integer NOT NULL DEFAULT 0,
  result jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.warzone_participations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  operation_id uuid NOT NULL REFERENCES public.warzone_operations(id) ON DELETE CASCADE,
  discord_id text NOT NULL,
  clan_tag text NOT NULL,
  registered_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(operation_id, discord_id)
);

CREATE INDEX IF NOT EXISTS idx_store_items_public
  ON public.store_items(is_active, is_featured, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tournament_items_public
  ON public.tournament_items(is_active, status, priority DESC);
CREATE INDEX IF NOT EXISTS idx_warzone_operations_public
  ON public.warzone_operations(is_active, status, priority DESC);
CREATE INDEX IF NOT EXISTS idx_warzone_participations_operation
  ON public.warzone_participations(operation_id);

CREATE OR REPLACE FUNCTION public.stg_set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_store_items_updated_at ON public.store_items;
CREATE TRIGGER set_store_items_updated_at
  BEFORE UPDATE ON public.store_items
  FOR EACH ROW EXECUTE FUNCTION public.stg_set_updated_at();

DROP TRIGGER IF EXISTS set_tournament_items_updated_at ON public.tournament_items;
CREATE TRIGGER set_tournament_items_updated_at
  BEFORE UPDATE ON public.tournament_items
  FOR EACH ROW EXECUTE FUNCTION public.stg_set_updated_at();

DROP TRIGGER IF EXISTS set_warzone_operations_updated_at ON public.warzone_operations;
CREATE TRIGGER set_warzone_operations_updated_at
  BEFORE UPDATE ON public.warzone_operations
  FOR EACH ROW EXECUTE FUNCTION public.stg_set_updated_at();

CREATE OR REPLACE FUNCTION public.stg_refresh_operation_participants()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_operation_id uuid;
BEGIN
  target_operation_id := CASE
    WHEN TG_OP = 'DELETE' THEN OLD.operation_id
    ELSE NEW.operation_id
  END;
  UPDATE public.warzone_operations
  SET participants = (
    SELECT count(*)
    FROM public.warzone_participations
    WHERE operation_id = target_operation_id
  )
  WHERE id = target_operation_id;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS refresh_operation_participants ON public.warzone_participations;
CREATE TRIGGER refresh_operation_participants
  AFTER INSERT OR DELETE ON public.warzone_participations
  FOR EACH ROW EXECUTE FUNCTION public.stg_refresh_operation_participants();

CREATE OR REPLACE FUNCTION public.stg_can_manage_content()
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT
    COALESCE(auth.jwt() ->> 'is_admin', 'false') = 'true'
    OR COALESCE(auth.jwt() ->> 'is_moderator', 'false') = 'true'
    OR COALESCE(auth.jwt() ->> 'can_access_dashboard', 'false') = 'true';
$$;

ALTER TABLE public.store_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournament_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.warzone_operations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.warzone_participations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public reads active store items" ON public.store_items;
CREATE POLICY "Public reads active store items"
  ON public.store_items FOR SELECT TO anon, authenticated
  USING (is_active OR public.stg_can_manage_content());

DROP POLICY IF EXISTS "Staff manages store items" ON public.store_items;
CREATE POLICY "Staff manages store items"
  ON public.store_items FOR ALL TO authenticated
  USING (public.stg_can_manage_content())
  WITH CHECK (public.stg_can_manage_content());

DROP POLICY IF EXISTS "Public reads active tournaments" ON public.tournament_items;
CREATE POLICY "Public reads active tournaments"
  ON public.tournament_items FOR SELECT TO anon, authenticated
  USING (is_active OR public.stg_can_manage_content());

DROP POLICY IF EXISTS "Staff manages tournaments" ON public.tournament_items;
CREATE POLICY "Staff manages tournaments"
  ON public.tournament_items FOR ALL TO authenticated
  USING (public.stg_can_manage_content())
  WITH CHECK (public.stg_can_manage_content());

DROP POLICY IF EXISTS "Public reads active Warzone operations" ON public.warzone_operations;
CREATE POLICY "Public reads active Warzone operations"
  ON public.warzone_operations FOR SELECT TO anon, authenticated
  USING (is_active OR public.stg_can_manage_content());

DROP POLICY IF EXISTS "Staff manages Warzone operations" ON public.warzone_operations;
CREATE POLICY "Staff manages Warzone operations"
  ON public.warzone_operations FOR ALL TO authenticated
  USING (public.stg_can_manage_content())
  WITH CHECK (public.stg_can_manage_content());

DROP POLICY IF EXISTS "Operators read own participations" ON public.warzone_participations;
CREATE POLICY "Operators read own participations"
  ON public.warzone_participations FOR SELECT TO authenticated
  USING (
    discord_id = auth.jwt() ->> 'discord_id'
    OR public.stg_can_manage_content()
  );

DROP POLICY IF EXISTS "Operators register with validated clan tag" ON public.warzone_participations;
CREATE POLICY "Operators register with validated clan tag"
  ON public.warzone_participations FOR INSERT TO authenticated
  WITH CHECK (
    discord_id = auth.jwt() ->> 'discord_id'
    AND EXISTS (
      SELECT 1
      FROM public.warzone_operations operation
      WHERE operation.id = operation_id
        AND operation.is_active
        AND operation.status = 'inscricoes_abertas'
        AND (
          'ALL' = ANY(operation.allowed_clans)
          OR (
            auth.jwt() ->> 'clan_tag' IS NOT NULL
            AND upper(clan_tag) = upper(auth.jwt() ->> 'clan_tag')
            AND EXISTS (
              SELECT 1
              FROM unnest(operation.allowed_clans) AS allowed_clan
              WHERE upper(allowed_clan) = upper(auth.jwt() ->> 'clan_tag')
            )
          )
        )
    )
  );

DROP POLICY IF EXISTS "Staff manages participations" ON public.warzone_participations;
CREATE POLICY "Staff manages participations"
  ON public.warzone_participations FOR ALL TO authenticated
  USING (public.stg_can_manage_content())
  WITH CHECK (public.stg_can_manage_content());
