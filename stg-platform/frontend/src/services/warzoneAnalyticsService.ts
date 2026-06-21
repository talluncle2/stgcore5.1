import { isSupabaseEnabled, supabase } from "../lib/supabase";
import {
  WarzoneClanRankingEntry,
  WarzoneGeneralStats,
  WarzoneHallOfFameEntry,
  WarzoneOperatorRankingEntry,
  WarzonePeriodMetric,
  WarzoneSeasonMetric,
} from "../types/warzone";

function requireSupabase() {
  if (!isSupabaseEnabled || !supabase) {
    throw new Error("Supabase nao esta configurado para consultar analytics competitivos.");
  }
  return supabase;
}

function numberValue(value: unknown): number {
  return Number(value || 0);
}

export async function getWarzoneGeneralStats(): Promise<WarzoneGeneralStats> {
  const { data, error } = await requireSupabase()
    .from("warzone_general_stats")
    .select("*")
    .single();

  if (error) throw new Error(`Falha ao carregar metricas gerais: ${error.message}`);
  return {
    eventsCompleted: numberValue(data.events_completed),
    operatorsRegistered: numberValue(data.operators_registered),
    clansRegistered: numberValue(data.clans_registered),
    killsRegistered: numberValue(data.kills_registered),
    matchesRegistered: numberValue(data.matches_registered),
    victoriesRegistered: numberValue(data.victories_registered),
    mvpsRegistered: numberValue(data.mvps_registered),
  };
}

export async function getWarzoneOperatorRanking(): Promise<WarzoneOperatorRankingEntry[]> {
  const { data, error } = await requireSupabase()
    .from("warzone_operator_ranking")
    .select("*")
    .order("position");

  if (error) throw new Error(`Falha ao carregar ranking de operadores: ${error.message}`);
  return (data || []).map((row) => ({
    id: row.id,
    nickname: row.nickname,
    platform: row.platform || undefined,
    clanTag: row.clan_tag || undefined,
    participations: numberValue(row.participations),
    wins: numberValue(row.wins),
    kills: numberValue(row.kills),
    mvpCount: numberValue(row.mvp_count),
    kd: numberValue(row.kd),
    rankingPoints: numberValue(row.ranking_points),
    position: numberValue(row.position),
  }));
}

export async function getWarzoneClanRanking(): Promise<WarzoneClanRankingEntry[]> {
  const { data, error } = await requireSupabase()
    .from("warzone_clan_ranking")
    .select("*")
    .order("position");

  if (error) throw new Error(`Falha ao carregar ranking de clas: ${error.message}`);
  return (data || []).map((row) => ({
    id: row.id,
    name: row.name,
    tag: row.tag,
    logoUrl: row.logo_url || undefined,
    participations: numberValue(row.participations),
    wins: numberValue(row.wins),
    titles: numberValue(row.titles),
    kills: numberValue(row.kills),
    rankingPoints: numberValue(row.ranking_points),
    position: numberValue(row.position),
  }));
}

export async function getWarzoneEventsByPeriod(): Promise<WarzonePeriodMetric[]> {
  const { data, error } = await requireSupabase()
    .from("warzone_events_by_period")
    .select("*")
    .order("period", { ascending: true });

  if (error) throw new Error(`Falha ao carregar eventos por periodo: ${error.message}`);
  return (data || []).map((row) => ({
    period: row.period,
    events: numberValue(row.events),
    kills: numberValue(row.kills),
    matches: numberValue(row.matches),
  }));
}

export async function getWarzoneKillsBySeason(): Promise<WarzoneSeasonMetric[]> {
  const { data, error } = await requireSupabase()
    .from("warzone_kills_by_season")
    .select("*");

  if (error) throw new Error(`Falha ao carregar kills por temporada: ${error.message}`);
  return (data || []).map((row) => ({
    seasonId: row.season_id,
    season: row.season,
    events: numberValue(row.events),
    kills: numberValue(row.kills),
  }));
}

export async function getWarzoneHallOfFame(): Promise<WarzoneHallOfFameEntry[]> {
  const { data, error } = await requireSupabase()
    .from("warzone_hall_of_fame")
    .select("*")
    .eq("is_active", true)
    .order("is_featured", { ascending: false })
    .order("awarded_at", { ascending: false });

  if (error) throw new Error(`Falha ao carregar Hall da Fama: ${error.message}`);
  return (data || []).map((row) => ({
    id: row.id,
    category: row.category,
    operationId: row.operation_id || undefined,
    operatorId: row.operator_id || undefined,
    clanId: row.clan_id || undefined,
    title: row.title,
    description: row.description || undefined,
    metrics: row.metrics || {},
    isFeatured: row.is_featured === true,
    awardedAt: row.awarded_at,
  }));
}
