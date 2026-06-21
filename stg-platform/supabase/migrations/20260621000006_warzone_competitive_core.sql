-- STG Warzone competitive core.
-- Discord remains the identity source; competitive data is stored in Supabase.

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
  SELECT
    COALESCE((SELECT auth.jwt() ->> 'is_admin'), 'false') = 'true'
    OR lower(COALESCE((SELECT auth.jwt() ->> 'app_role'), '')) = 'admin';
$$;

CREATE OR REPLACE FUNCTION public.is_moderator()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
  SELECT
    public.is_admin()
    OR COALESCE((SELECT auth.jwt() ->> 'is_moderator'), 'false') = 'true'
    OR lower(COALESCE((SELECT auth.jwt() ->> 'app_role'), '')) IN ('moderator', 'moderador');
$$;

CREATE OR REPLACE FUNCTION public.has_dashboard_access()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
  SELECT
    public.is_moderator()
    OR COALESCE((SELECT auth.jwt() ->> 'can_access_dashboard'), 'false') = 'true'
    OR lower(COALESCE((SELECT auth.jwt() ->> 'app_role'), '')) = 'staff';
$$;

CREATE OR REPLACE FUNCTION public.owns_profile(target_profile_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
  SELECT target_profile_id = (SELECT auth.uid());
$$;

REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_moderator() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.has_dashboard_access() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.owns_profile(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_moderator() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.has_dashboard_access() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.owns_profile(uuid) TO authenticated;

-- Preserve existing content-management behavior outside the competitive module.
CREATE OR REPLACE FUNCTION public.stg_can_manage_content()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
  SELECT public.has_dashboard_access();
$$;

REVOKE ALL ON FUNCTION public.stg_can_manage_content() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.stg_can_manage_content() TO anon, authenticated;

ALTER FUNCTION public.stg_set_updated_at()
  SET search_path = public, pg_temp;
REVOKE ALL ON FUNCTION public.stg_set_updated_at() FROM PUBLIC, anon, authenticated;

ALTER FUNCTION public.stg_refresh_operation_participants()
  SET search_path = public, pg_temp;
REVOKE ALL ON FUNCTION public.stg_refresh_operation_participants() FROM PUBLIC, anon, authenticated;

ALTER FUNCTION public.stg_is_creator_owner(uuid)
  SET search_path = public, pg_temp;
REVOKE ALL ON FUNCTION public.stg_is_creator_owner(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.stg_is_creator_owner(uuid) TO authenticated;

CREATE TABLE IF NOT EXISTS public.warzone_seasons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  starts_at timestamptz,
  ends_at timestamptz,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.warzone_clans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  tag text NOT NULL UNIQUE CHECK (tag = upper(tag) AND tag ~ '^[A-Z0-9_-]{2,12}$'),
  logo_url text,
  leader_discord_id text,
  description text,
  participations integer NOT NULL DEFAULT 0 CHECK (participations >= 0),
  wins integer NOT NULL DEFAULT 0 CHECK (wins >= 0),
  titles integer NOT NULL DEFAULT 0 CHECK (titles >= 0),
  kills integer NOT NULL DEFAULT 0 CHECK (kills >= 0),
  ranking_points integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.warzone_operators (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  discord_id text NOT NULL UNIQUE,
  nickname text NOT NULL,
  activision_id text,
  platform text CHECK (platform IS NULL OR platform IN ('battle_net', 'playstation', 'xbox', 'steam', 'other')),
  clan_id uuid REFERENCES public.warzone_clans(id) ON DELETE SET NULL,
  clan_tag text CHECK (clan_tag IS NULL OR (clan_tag = upper(clan_tag) AND clan_tag ~ '^[A-Z0-9_-]{2,12}$')),
  kd numeric(8, 3) NOT NULL DEFAULT 0 CHECK (kd >= 0),
  participations integer NOT NULL DEFAULT 0 CHECK (participations >= 0),
  wins integer NOT NULL DEFAULT 0 CHECK (wins >= 0),
  kills integer NOT NULL DEFAULT 0 CHECK (kills >= 0),
  mvp_count integer NOT NULL DEFAULT 0 CHECK (mvp_count >= 0),
  ranking_points integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.warzone_operations
  ADD COLUMN IF NOT EXISTS season_id uuid REFERENCES public.warzone_seasons(id) ON DELETE SET NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'warzone_operations_mode_check'
      AND conrelid = 'public.warzone_operations'::regclass
  ) THEN
    ALTER TABLE public.warzone_operations
      ADD CONSTRAINT warzone_operations_mode_check CHECK (
        mode IN (
          'battle_royale_solo',
          'battle_royale_duo',
          'battle_royale_trio',
          'battle_royale_squad',
          'resurgence_duo',
          'resurgence_trio',
          'resurgence_squad',
          'custom_lobby'
        )
      ) NOT VALID;
    ALTER TABLE public.warzone_operations
      VALIDATE CONSTRAINT warzone_operations_mode_check;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'warzone_operations_status_check'
      AND conrelid = 'public.warzone_operations'::regclass
  ) THEN
    ALTER TABLE public.warzone_operations
      ADD CONSTRAINT warzone_operations_status_check CHECK (
        status IN ('em_breve', 'inscricoes_abertas', 'em_andamento', 'encerrado', 'cancelado')
      ) NOT VALID;
    ALTER TABLE public.warzone_operations
      VALIDATE CONSTRAINT warzone_operations_status_check;
  END IF;
END
$$;

ALTER TABLE public.warzone_participations
  ADD COLUMN IF NOT EXISTS operator_id uuid REFERENCES public.warzone_operators(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS clan_id uuid REFERENCES public.warzone_clans(id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS public.warzone_operation_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  operation_id uuid NOT NULL UNIQUE REFERENCES public.warzone_operations(id) ON DELETE CASCADE,
  winner_clan_id uuid REFERENCES public.warzone_clans(id) ON DELETE SET NULL,
  winner_clan_tag text NOT NULL,
  mvp_operator_id uuid REFERENCES public.warzone_operators(id) ON DELETE SET NULL,
  mvp_name text NOT NULL,
  total_kills integer NOT NULL DEFAULT 0 CHECK (total_kills >= 0),
  matches_played integer NOT NULL DEFAULT 0 CHECK (matches_played >= 0),
  final_standings jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(final_standings) = 'array'),
  admin_notes text,
  closed_by_discord_id text NOT NULL,
  closed_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.warzone_operator_event_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  operation_id uuid NOT NULL REFERENCES public.warzone_operations(id) ON DELETE CASCADE,
  operator_id uuid NOT NULL REFERENCES public.warzone_operators(id) ON DELETE CASCADE,
  clan_id uuid REFERENCES public.warzone_clans(id) ON DELETE SET NULL,
  placement integer CHECK (placement IS NULL OR placement > 0),
  kills integer NOT NULL DEFAULT 0 CHECK (kills >= 0),
  wins integer NOT NULL DEFAULT 0 CHECK (wins >= 0),
  is_mvp boolean NOT NULL DEFAULT false,
  ranking_points integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(operation_id, operator_id)
);

CREATE TABLE IF NOT EXISTS public.warzone_hall_of_fame (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL CHECK (
    category IN ('champion', 'mvp', 'record_holder', 'elite_operator', 'champion_clan')
  ),
  operation_id uuid REFERENCES public.warzone_operations(id) ON DELETE SET NULL,
  operator_id uuid REFERENCES public.warzone_operators(id) ON DELETE SET NULL,
  clan_id uuid REFERENCES public.warzone_clans(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text,
  metrics jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_featured boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  awarded_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(category, operation_id, title)
);

CREATE INDEX IF NOT EXISTS idx_warzone_operations_season
  ON public.warzone_operations(season_id, status, start_date DESC);
CREATE INDEX IF NOT EXISTS idx_warzone_clans_ranking
  ON public.warzone_clans(is_active, ranking_points DESC, wins DESC, kills DESC);
CREATE INDEX IF NOT EXISTS idx_warzone_operators_ranking
  ON public.warzone_operators(is_active, ranking_points DESC, wins DESC, kills DESC);
CREATE INDEX IF NOT EXISTS idx_warzone_operators_clan
  ON public.warzone_operators(clan_id, clan_tag);
CREATE INDEX IF NOT EXISTS idx_warzone_operation_results_closed
  ON public.warzone_operation_results(closed_at DESC);
CREATE INDEX IF NOT EXISTS idx_warzone_operator_event_stats_operation
  ON public.warzone_operator_event_stats(operation_id, ranking_points DESC);
CREATE INDEX IF NOT EXISTS idx_warzone_hall_of_fame_public
  ON public.warzone_hall_of_fame(is_active, category, awarded_at DESC);

DROP TRIGGER IF EXISTS set_warzone_seasons_updated_at ON public.warzone_seasons;
CREATE TRIGGER set_warzone_seasons_updated_at
  BEFORE UPDATE ON public.warzone_seasons
  FOR EACH ROW EXECUTE FUNCTION public.stg_set_updated_at();

DROP TRIGGER IF EXISTS set_warzone_clans_updated_at ON public.warzone_clans;
CREATE TRIGGER set_warzone_clans_updated_at
  BEFORE UPDATE ON public.warzone_clans
  FOR EACH ROW EXECUTE FUNCTION public.stg_set_updated_at();

DROP TRIGGER IF EXISTS set_warzone_operators_updated_at ON public.warzone_operators;
CREATE TRIGGER set_warzone_operators_updated_at
  BEFORE UPDATE ON public.warzone_operators
  FOR EACH ROW EXECUTE FUNCTION public.stg_set_updated_at();

DROP TRIGGER IF EXISTS set_warzone_operation_results_updated_at ON public.warzone_operation_results;
CREATE TRIGGER set_warzone_operation_results_updated_at
  BEFORE UPDATE ON public.warzone_operation_results
  FOR EACH ROW EXECUTE FUNCTION public.stg_set_updated_at();

DROP TRIGGER IF EXISTS set_warzone_operator_event_stats_updated_at ON public.warzone_operator_event_stats;
CREATE TRIGGER set_warzone_operator_event_stats_updated_at
  BEFORE UPDATE ON public.warzone_operator_event_stats
  FOR EACH ROW EXECUTE FUNCTION public.stg_set_updated_at();

DROP TRIGGER IF EXISTS set_warzone_hall_of_fame_updated_at ON public.warzone_hall_of_fame;
CREATE TRIGGER set_warzone_hall_of_fame_updated_at
  BEFORE UPDATE ON public.warzone_hall_of_fame
  FOR EACH ROW EXECUTE FUNCTION public.stg_set_updated_at();

CREATE OR REPLACE FUNCTION public.stg_prepare_operator_identity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
DECLARE
  canonical_tag text;
BEGIN
  IF public.is_moderator() OR current_user IN ('postgres', 'service_role') THEN
    NEW.clan_tag := NULLIF(upper(trim(NEW.clan_tag)), '');
  ELSE
    NEW.profile_id := (SELECT auth.uid());
    NEW.discord_id := (SELECT auth.jwt() ->> 'discord_id');
    NEW.clan_tag := NULLIF(upper(trim((SELECT auth.jwt() ->> 'clan_tag'))), '');
  END IF;

  canonical_tag := NEW.clan_tag;
  IF canonical_tag IS NOT NULL THEN
    SELECT clan.id
    INTO NEW.clan_id
    FROM public.warzone_clans clan
    WHERE clan.tag = canonical_tag
      AND clan.is_active
    LIMIT 1;
  ELSE
    NEW.clan_id := NULL;
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.stg_prepare_operator_identity() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS prepare_operator_identity ON public.warzone_operators;
CREATE TRIGGER prepare_operator_identity
  BEFORE INSERT ON public.warzone_operators
  FOR EACH ROW EXECUTE FUNCTION public.stg_prepare_operator_identity();

CREATE OR REPLACE FUNCTION public.stg_protect_operator_competitive_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF public.is_moderator() OR current_user IN ('postgres', 'service_role') THEN
    NEW.clan_tag := NULLIF(upper(trim(NEW.clan_tag)), '');
    RETURN NEW;
  END IF;

  NEW.discord_id := OLD.discord_id;
  NEW.profile_id := OLD.profile_id;
  NEW.clan_id := OLD.clan_id;
  NEW.clan_tag := OLD.clan_tag;
  NEW.kd := OLD.kd;
  NEW.participations := OLD.participations;
  NEW.wins := OLD.wins;
  NEW.kills := OLD.kills;
  NEW.mvp_count := OLD.mvp_count;
  NEW.ranking_points := OLD.ranking_points;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.stg_protect_operator_competitive_fields() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS protect_operator_competitive_fields ON public.warzone_operators;
CREATE TRIGGER protect_operator_competitive_fields
  BEFORE UPDATE ON public.warzone_operators
  FOR EACH ROW EXECUTE FUNCTION public.stg_protect_operator_competitive_fields();

CREATE OR REPLACE FUNCTION public.current_operator_clan_tag()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT COALESCE(
    (
      SELECT operator.clan_tag
      FROM public.warzone_operators operator
      WHERE operator.discord_id = (SELECT auth.jwt() ->> 'discord_id')
        AND operator.is_active
      LIMIT 1
    ),
    NULLIF(upper(trim((SELECT auth.jwt() ->> 'clan_tag'))), '')
  );
$$;

REVOKE ALL ON FUNCTION public.current_operator_clan_tag() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.current_operator_clan_tag() TO authenticated;

CREATE OR REPLACE FUNCTION public.stg_prepare_warzone_participation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
DECLARE
  current_operator public.warzone_operators%ROWTYPE;
  canonical_tag text;
BEGIN
  IF NEW.discord_id <> (SELECT auth.jwt() ->> 'discord_id') AND NOT public.is_moderator() THEN
    RAISE EXCEPTION 'Discord identity mismatch';
  END IF;

  SELECT *
  INTO current_operator
  FROM public.warzone_operators operator
  WHERE operator.discord_id = NEW.discord_id
    AND operator.is_active
  LIMIT 1;

  canonical_tag := COALESCE(
    current_operator.clan_tag,
    NULLIF(upper(trim((SELECT auth.jwt() ->> 'clan_tag'))), '')
  );

  NEW.operator_id := current_operator.id;
  NEW.clan_id := current_operator.clan_id;
  NEW.clan_tag := COALESCE(canonical_tag, 'ALL');
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.stg_prepare_warzone_participation() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS prepare_warzone_participation ON public.warzone_participations;
CREATE TRIGGER prepare_warzone_participation
  BEFORE INSERT OR UPDATE ON public.warzone_participations
  FOR EACH ROW EXECUTE FUNCTION public.stg_prepare_warzone_participation();

-- Existing participations receive canonical operator/clan references when possible.
UPDATE public.warzone_participations participation
SET
  operator_id = operator.id,
  clan_id = operator.clan_id,
  clan_tag = COALESCE(operator.clan_tag, participation.clan_tag)
FROM public.warzone_operators operator
WHERE operator.discord_id = participation.discord_id
  AND participation.operator_id IS NULL;

ALTER TABLE public.warzone_seasons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.warzone_clans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.warzone_operators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.warzone_operation_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.warzone_operator_event_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.warzone_hall_of_fame ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public reads active Warzone seasons"
  ON public.warzone_seasons FOR SELECT TO anon, authenticated
  USING (is_active OR public.is_moderator());
CREATE POLICY "Moderators manage Warzone seasons"
  ON public.warzone_seasons FOR ALL TO authenticated
  USING (public.is_moderator())
  WITH CHECK (public.is_moderator());

CREATE POLICY "Public reads active Warzone clans"
  ON public.warzone_clans FOR SELECT TO anon, authenticated
  USING (is_active OR public.is_moderator());
CREATE POLICY "Moderators manage Warzone clans"
  ON public.warzone_clans FOR ALL TO authenticated
  USING (public.is_moderator())
  WITH CHECK (public.is_moderator());

CREATE POLICY "Public reads active competitive profiles"
  ON public.warzone_operators FOR SELECT TO anon, authenticated
  USING (
    is_active
    OR discord_id = (SELECT auth.jwt() ->> 'discord_id')
    OR public.is_moderator()
  );
CREATE POLICY "Operators create own competitive profile"
  ON public.warzone_operators FOR INSERT TO authenticated
  WITH CHECK (
    (
      discord_id = (SELECT auth.jwt() ->> 'discord_id')
      AND (
        clan_tag IS NULL
        OR clan_tag = NULLIF(upper(trim((SELECT auth.jwt() ->> 'clan_tag'))), '')
      )
      AND participations = 0
      AND wins = 0
      AND kills = 0
      AND mvp_count = 0
      AND ranking_points = 0
    )
    OR public.is_moderator()
  );
CREATE POLICY "Operators update own competitive profile"
  ON public.warzone_operators FOR UPDATE TO authenticated
  USING (
    discord_id = (SELECT auth.jwt() ->> 'discord_id')
    OR public.is_moderator()
  )
  WITH CHECK (
    discord_id = (SELECT auth.jwt() ->> 'discord_id')
    OR public.is_moderator()
  );
CREATE POLICY "Moderators delete competitive profiles"
  ON public.warzone_operators FOR DELETE TO authenticated
  USING (public.is_moderator());

CREATE POLICY "Public reads operation results"
  ON public.warzone_operation_results FOR SELECT TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.warzone_operations operation
      WHERE operation.id = operation_id
        AND (operation.is_active OR public.is_moderator())
    )
  );
CREATE POLICY "Moderators manage operation results"
  ON public.warzone_operation_results FOR ALL TO authenticated
  USING (public.is_moderator())
  WITH CHECK (public.is_moderator());

CREATE POLICY "Public reads operator event stats"
  ON public.warzone_operator_event_stats FOR SELECT TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.warzone_operations operation
      WHERE operation.id = operation_id
        AND operation.status = 'encerrado'
        AND (operation.is_active OR public.is_moderator())
    )
  );
CREATE POLICY "Moderators manage operator event stats"
  ON public.warzone_operator_event_stats FOR ALL TO authenticated
  USING (public.is_moderator())
  WITH CHECK (public.is_moderator());

CREATE POLICY "Public reads active Hall of Fame"
  ON public.warzone_hall_of_fame FOR SELECT TO anon, authenticated
  USING (is_active OR public.is_moderator());
CREATE POLICY "Moderators manage Hall of Fame"
  ON public.warzone_hall_of_fame FOR ALL TO authenticated
  USING (public.is_moderator())
  WITH CHECK (public.is_moderator());

DROP POLICY IF EXISTS "Staff manages Warzone operations" ON public.warzone_operations;
CREATE POLICY "Moderators manage Warzone operations"
  ON public.warzone_operations FOR ALL TO authenticated
  USING (public.is_moderator())
  WITH CHECK (public.is_moderator());

DROP POLICY IF EXISTS "Operators read own participations" ON public.warzone_participations;
CREATE POLICY "Operators read own participations"
  ON public.warzone_participations FOR SELECT TO authenticated
  USING (
    discord_id = (SELECT auth.jwt() ->> 'discord_id')
    OR public.is_moderator()
  );

DROP POLICY IF EXISTS "Operators register with validated clan tag" ON public.warzone_participations;
CREATE POLICY "Operators register with validated clan tag"
  ON public.warzone_participations FOR INSERT TO authenticated
  WITH CHECK (
    discord_id = (SELECT auth.jwt() ->> 'discord_id')
    AND EXISTS (
      SELECT 1
      FROM public.warzone_operations operation
      WHERE operation.id = operation_id
        AND operation.is_active
        AND operation.status = 'inscricoes_abertas'
        AND (
          'ALL' = ANY(operation.allowed_clans)
          OR EXISTS (
            SELECT 1
            FROM unnest(operation.allowed_clans) AS allowed_clan
            WHERE upper(allowed_clan) = public.current_operator_clan_tag()
              AND upper(clan_tag) = public.current_operator_clan_tag()
          )
        )
    )
  );

DROP POLICY IF EXISTS "Staff manages participations" ON public.warzone_participations;
CREATE POLICY "Moderators manage participations"
  ON public.warzone_participations FOR ALL TO authenticated
  USING (public.is_moderator())
  WITH CHECK (public.is_moderator());

GRANT SELECT ON public.warzone_seasons, public.warzone_clans,
  public.warzone_operation_results, public.warzone_operator_event_stats,
  public.warzone_hall_of_fame TO anon, authenticated;
GRANT SELECT (
  id,
  nickname,
  platform,
  clan_id,
  clan_tag,
  kd,
  participations,
  wins,
  kills,
  mvp_count,
  ranking_points,
  is_active
) ON public.warzone_operators TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.warzone_operators TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.warzone_seasons, public.warzone_clans,
  public.warzone_operation_results, public.warzone_operator_event_stats,
  public.warzone_hall_of_fame TO authenticated;

CREATE OR REPLACE FUNCTION public.close_warzone_operation(
  p_operation_id uuid,
  p_winner_clan_tag text,
  p_mvp_name text,
  p_total_kills integer,
  p_matches_played integer,
  p_final_standings jsonb DEFAULT '[]'::jsonb,
  p_admin_notes text DEFAULT NULL,
  p_operator_stats jsonb DEFAULT '[]'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  target_operation public.warzone_operations%ROWTYPE;
  winner_tag text := upper(trim(p_winner_clan_tag));
  winner_clan_id uuid;
  mvp_operator_id uuid;
  standing jsonb;
  operator_stat jsonb;
  target_operator_id uuid;
  target_clan_id uuid;
  stat_kills integer;
  stat_placement integer;
  stat_is_mvp boolean;
  stat_points integer;
  response_payload jsonb;
BEGIN
  IF NOT public.is_moderator() THEN
    RAISE EXCEPTION 'Moderator access required' USING ERRCODE = '42501';
  END IF;

  IF winner_tag = '' OR trim(COALESCE(p_mvp_name, '')) = '' THEN
    RAISE EXCEPTION 'Winner clan and MVP are required' USING ERRCODE = '22023';
  END IF;

  IF COALESCE(p_total_kills, 0) < 0 OR COALESCE(p_matches_played, 0) < 0 THEN
    RAISE EXCEPTION 'Kills and matches cannot be negative' USING ERRCODE = '22023';
  END IF;

  IF jsonb_typeof(COALESCE(p_final_standings, '[]'::jsonb)) <> 'array'
     OR jsonb_typeof(COALESCE(p_operator_stats, '[]'::jsonb)) <> 'array' THEN
    RAISE EXCEPTION 'Standings and operator stats must be arrays' USING ERRCODE = '22023';
  END IF;

  SELECT *
  INTO target_operation
  FROM public.warzone_operations
  WHERE id = p_operation_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Warzone operation not found' USING ERRCODE = 'P0002';
  END IF;

  IF target_operation.status IN ('encerrado', 'cancelado')
     OR EXISTS (
       SELECT 1 FROM public.warzone_operation_results result
       WHERE result.operation_id = p_operation_id
     ) THEN
    RAISE EXCEPTION 'Warzone operation is already closed' USING ERRCODE = '23505';
  END IF;

  INSERT INTO public.warzone_clans (name, tag)
  VALUES (winner_tag, winner_tag)
  ON CONFLICT (tag) DO UPDATE SET is_active = true
  RETURNING id INTO winner_clan_id;

  SELECT operator.id
  INTO mvp_operator_id
  FROM public.warzone_operators operator
  WHERE operator.is_active
    AND (
      lower(operator.nickname) = lower(trim(p_mvp_name))
      OR lower(COALESCE(operator.activision_id, '')) = lower(trim(p_mvp_name))
    )
  ORDER BY operator.updated_at DESC
  LIMIT 1;

  INSERT INTO public.warzone_operation_results (
    operation_id,
    winner_clan_id,
    winner_clan_tag,
    mvp_operator_id,
    mvp_name,
    total_kills,
    matches_played,
    final_standings,
    admin_notes,
    closed_by_discord_id
  )
  VALUES (
    p_operation_id,
    winner_clan_id,
    winner_tag,
    mvp_operator_id,
    trim(p_mvp_name),
    COALESCE(p_total_kills, 0),
    COALESCE(p_matches_played, 0),
    COALESCE(p_final_standings, '[]'::jsonb),
    NULLIF(trim(COALESCE(p_admin_notes, '')), ''),
    COALESCE((SELECT auth.jwt() ->> 'discord_id'), 'system')
  );

  FOR standing IN
    SELECT value FROM jsonb_array_elements(COALESCE(p_final_standings, '[]'::jsonb))
  LOOP
    IF trim(COALESCE(standing ->> 'clan', '')) <> '' THEN
      INSERT INTO public.warzone_clans (name, tag)
      VALUES (
        upper(trim(standing ->> 'clan')),
        upper(trim(standing ->> 'clan'))
      )
      ON CONFLICT (tag) DO UPDATE SET is_active = true
      RETURNING id INTO target_clan_id;

      UPDATE public.warzone_clans
      SET
        participations = participations + 1,
        kills = kills + GREATEST(COALESCE((standing ->> 'kills')::integer, 0), 0),
        wins = wins + CASE WHEN tag = winner_tag THEN 1 ELSE 0 END,
        titles = titles + CASE WHEN tag = winner_tag THEN 1 ELSE 0 END,
        ranking_points = ranking_points
          + GREATEST(COALESCE((standing ->> 'kills')::integer, 0), 0)
          + CASE WHEN tag = winner_tag THEN 100 ELSE 0 END
          + GREATEST(0, 60 - ((GREATEST(COALESCE((standing ->> 'position')::integer, 1), 1) - 1) * 10))
      WHERE id = target_clan_id;
    END IF;
  END LOOP;

  UPDATE public.warzone_operators operator
  SET
    participations = operator.participations + 1,
    wins = operator.wins + CASE
      WHEN upper(COALESCE(operator.clan_tag, '')) = winner_tag THEN 1 ELSE 0
    END,
    ranking_points = operator.ranking_points + 10 + CASE
      WHEN upper(COALESCE(operator.clan_tag, '')) = winner_tag THEN 100 ELSE 0
    END
  WHERE EXISTS (
    SELECT 1
    FROM public.warzone_participations participation
    WHERE participation.operation_id = p_operation_id
      AND participation.operator_id = operator.id
  );

  FOR operator_stat IN
    SELECT value FROM jsonb_array_elements(COALESCE(p_operator_stats, '[]'::jsonb))
  LOOP
    target_operator_id := NULLIF(operator_stat ->> 'operatorId', '')::uuid;

    IF target_operator_id IS NULL AND NULLIF(operator_stat ->> 'discordId', '') IS NOT NULL THEN
      SELECT operator.id
      INTO target_operator_id
      FROM public.warzone_operators operator
      WHERE operator.discord_id = operator_stat ->> 'discordId'
      LIMIT 1;
    END IF;

    IF target_operator_id IS NOT NULL THEN
      SELECT operator.clan_id
      INTO target_clan_id
      FROM public.warzone_operators operator
      WHERE operator.id = target_operator_id;

      stat_kills := GREATEST(COALESCE((operator_stat ->> 'kills')::integer, 0), 0);
      stat_placement := NULLIF(operator_stat ->> 'placement', '')::integer;
      stat_is_mvp := COALESCE((operator_stat ->> 'isMvp')::boolean, false);
      stat_points := stat_kills
        + CASE WHEN stat_is_mvp THEN 25 ELSE 0 END
        + GREATEST(0, 60 - ((GREATEST(COALESCE(stat_placement, 1), 1) - 1) * 10));

      INSERT INTO public.warzone_operator_event_stats (
        operation_id,
        operator_id,
        clan_id,
        placement,
        kills,
        wins,
        is_mvp,
        ranking_points
      )
      VALUES (
        p_operation_id,
        target_operator_id,
        target_clan_id,
        stat_placement,
        stat_kills,
        CASE WHEN stat_placement = 1 THEN 1 ELSE 0 END,
        stat_is_mvp,
        stat_points
      )
      ON CONFLICT (operation_id, operator_id) DO UPDATE SET
        placement = EXCLUDED.placement,
        kills = EXCLUDED.kills,
        wins = EXCLUDED.wins,
        is_mvp = EXCLUDED.is_mvp,
        ranking_points = EXCLUDED.ranking_points;

      UPDATE public.warzone_operators
      SET
        kills = kills + stat_kills,
        mvp_count = mvp_count + CASE WHEN stat_is_mvp THEN 1 ELSE 0 END,
        ranking_points = ranking_points + stat_points
      WHERE id = target_operator_id;
    END IF;
  END LOOP;

  IF mvp_operator_id IS NOT NULL
     AND NOT EXISTS (
       SELECT 1
       FROM public.warzone_operator_event_stats stat
       WHERE stat.operation_id = p_operation_id
         AND stat.operator_id = mvp_operator_id
         AND stat.is_mvp
     ) THEN
    UPDATE public.warzone_operators
    SET
      mvp_count = mvp_count + 1,
      ranking_points = ranking_points + 25
    WHERE id = mvp_operator_id;
  END IF;

  INSERT INTO public.warzone_hall_of_fame (
    category,
    operation_id,
    clan_id,
    title,
    description,
    metrics
  )
  VALUES (
    'champion_clan',
    p_operation_id,
    winner_clan_id,
    winner_tag,
    'Cla campeao de ' || target_operation.title,
    jsonb_build_object('totalKills', COALESCE(p_total_kills, 0), 'matchesPlayed', COALESCE(p_matches_played, 0))
  );

  INSERT INTO public.warzone_hall_of_fame (
    category,
    operation_id,
    operator_id,
    title,
    description,
    metrics
  )
  VALUES (
    'mvp',
    p_operation_id,
    mvp_operator_id,
    trim(p_mvp_name),
    'MVP de ' || target_operation.title,
    jsonb_build_object('winnerClan', winner_tag)
  );

  UPDATE public.warzone_operations
  SET
    status = 'encerrado',
    end_date = COALESCE(end_date, now()),
    result = jsonb_build_object(
      'winnerClan', winner_tag,
      'mvp', trim(p_mvp_name),
      'totalKills', COALESCE(p_total_kills, 0),
      'matchesPlayed', COALESCE(p_matches_played, 0),
      'finalStandings', COALESCE(p_final_standings, '[]'::jsonb),
      'adminNotes', NULLIF(trim(COALESCE(p_admin_notes, '')), ''),
      'closedAt', now()
    )
  WHERE id = p_operation_id;

  SELECT to_jsonb(operation)
  INTO response_payload
  FROM public.warzone_operations operation
  WHERE operation.id = p_operation_id;

  RETURN response_payload;
END;
$$;

REVOKE ALL ON FUNCTION public.close_warzone_operation(
  uuid, text, text, integer, integer, jsonb, text, jsonb
) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.close_warzone_operation(
  uuid, text, text, integer, integer, jsonb, text, jsonb
) TO authenticated;

CREATE OR REPLACE VIEW public.warzone_public_operators
WITH (security_invoker = true, security_barrier = true)
AS
SELECT
  operator.id,
  operator.nickname,
  operator.platform,
  operator.clan_id,
  operator.clan_tag,
  operator.kd,
  operator.participations,
  operator.wins,
  operator.kills,
  operator.mvp_count,
  operator.ranking_points
FROM public.warzone_operators operator
WHERE operator.is_active;

CREATE OR REPLACE VIEW public.warzone_operator_ranking
WITH (security_invoker = true, security_barrier = true)
AS
SELECT
  operator.id,
  operator.nickname,
  operator.platform,
  operator.clan_tag,
  operator.participations,
  operator.wins,
  operator.kills,
  operator.mvp_count,
  operator.kd,
  operator.ranking_points,
  dense_rank() OVER (
    ORDER BY operator.ranking_points DESC, operator.wins DESC, operator.kills DESC
  ) AS position
FROM public.warzone_operators operator
WHERE operator.is_active;

CREATE OR REPLACE VIEW public.warzone_clan_ranking
WITH (security_invoker = true, security_barrier = true)
AS
SELECT
  clan.id,
  clan.name,
  clan.tag,
  clan.logo_url,
  clan.participations,
  clan.wins,
  clan.titles,
  clan.kills,
  clan.ranking_points,
  dense_rank() OVER (
    ORDER BY clan.ranking_points DESC, clan.titles DESC, clan.wins DESC, clan.kills DESC
  ) AS position
FROM public.warzone_clans clan
WHERE clan.is_active;

CREATE OR REPLACE VIEW public.warzone_mvp_ranking
WITH (security_invoker = true, security_barrier = true)
AS
SELECT
  operator.id,
  operator.nickname,
  operator.clan_tag,
  operator.mvp_count,
  operator.ranking_points,
  dense_rank() OVER (
    ORDER BY operator.mvp_count DESC, operator.ranking_points DESC
  ) AS position
FROM public.warzone_operators operator
WHERE operator.is_active
  AND operator.mvp_count > 0;

CREATE OR REPLACE VIEW public.warzone_events_by_period
WITH (security_invoker = true, security_barrier = true)
AS
SELECT
  date_trunc('month', result.closed_at) AS period,
  count(*)::integer AS events,
  sum(result.total_kills)::bigint AS kills,
  sum(result.matches_played)::bigint AS matches
FROM public.warzone_operation_results result
GROUP BY date_trunc('month', result.closed_at)
ORDER BY period DESC;

CREATE OR REPLACE VIEW public.warzone_kills_by_season
WITH (security_invoker = true, security_barrier = true)
AS
SELECT
  season.id AS season_id,
  season.name AS season,
  count(result.id)::integer AS events,
  COALESCE(sum(result.total_kills), 0)::bigint AS kills
FROM public.warzone_seasons season
LEFT JOIN public.warzone_operations operation ON operation.season_id = season.id
LEFT JOIN public.warzone_operation_results result ON result.operation_id = operation.id
WHERE season.is_active
GROUP BY season.id, season.name
ORDER BY season.starts_at DESC NULLS LAST, season.name;

CREATE OR REPLACE VIEW public.warzone_general_stats
WITH (security_invoker = true, security_barrier = true)
AS
SELECT
  (SELECT count(*)::integer FROM public.warzone_operation_results) AS events_completed,
  (SELECT count(*)::integer FROM public.warzone_operators WHERE is_active) AS operators_registered,
  (SELECT count(*)::integer FROM public.warzone_clans WHERE is_active) AS clans_registered,
  (SELECT COALESCE(sum(total_kills), 0)::bigint FROM public.warzone_operation_results) AS kills_registered,
  (SELECT COALESCE(sum(matches_played), 0)::bigint FROM public.warzone_operation_results) AS matches_registered,
  (SELECT COALESCE(sum(wins), 0)::bigint FROM public.warzone_clans) AS victories_registered,
  (SELECT COALESCE(sum(mvp_count), 0)::bigint FROM public.warzone_operators) AS mvps_registered;

REVOKE ALL ON public.warzone_public_operators, public.warzone_operator_ranking,
  public.warzone_clan_ranking, public.warzone_mvp_ranking,
  public.warzone_events_by_period, public.warzone_kills_by_season,
  public.warzone_general_stats FROM PUBLIC;
GRANT SELECT ON public.warzone_public_operators, public.warzone_operator_ranking,
  public.warzone_clan_ranking, public.warzone_mvp_ranking,
  public.warzone_events_by_period, public.warzone_kills_by_season,
  public.warzone_general_stats TO anon, authenticated;
