-- Restrict anonymous operator reads to public competitive fields.
-- Supabase default table grants can otherwise override column-level intent.

REVOKE SELECT ON TABLE public.warzone_operators FROM anon;

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
