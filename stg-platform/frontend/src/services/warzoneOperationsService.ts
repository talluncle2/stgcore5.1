import { isSupabaseEnabled, supabase } from "../lib/supabase";
import {
  WarzoneMetrics,
  WarzoneOperation,
  WarzoneOperationResult,
  WarzoneParticipation,
} from "../types/warzone";

const OPERATIONS_KEY = "stg_warzone_operations";
const PARTICIPATIONS_KEY = "stg_warzone_participations";
const now = new Date().toISOString();

type WarzoneOperationRow = {
  id: string;
  title: string;
  codename?: string | null;
  description: string;
  image_url?: string | null;
  mode: WarzoneOperation["mode"];
  map?: string | null;
  status: WarzoneOperation["status"];
  allowed_clans: string[];
  start_date?: string | null;
  end_date?: string | null;
  prize?: string | null;
  entry_fee?: string | null;
  rules?: string | null;
  score_rule?: string | null;
  registration_url?: string | null;
  max_teams?: number | null;
  participants: number;
  is_active: boolean;
  is_featured: boolean;
  priority: number;
  result?: WarzoneOperationResult | null;
  created_at: string;
  updated_at: string;
};

type WarzoneParticipationRow = {
  operation_id: string;
  discord_id: string;
  clan_tag: string;
  registered_at: string;
};

export const defaultWarzoneOperations: WarzoneOperation[] = [
  {
    id: "op-eclipse",
    title: "STG vs GHOST - Noite da Revanche",
    codename: "Operacao Eclipse",
    description: "Partida personalizada cla x cla para operadores STG e GHOST.",
    imageUrl: "/assets/stg-elite-league.png",
    mode: "resurgence_squad",
    map: "Rebirth Island",
    status: "em_andamento",
    allowedClans: ["STG", "GHOST"],
    startDate: "2026-06-28T21:00:00",
    prize: "Trofeu digital + destaque Hall da Fama",
    entryFee: "Gratuito",
    rules: "Lobby privado com pontuacao por kills, colocacao final e bonus por vitoria.",
    scoreRule: "Kills + colocacao final + bonus por vitoria",
    maxTeams: 10,
    participants: 8,
    isActive: true,
    isFeatured: true,
    priority: 10,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "op-vanguard",
    title: "Liga Resurgence Multi-Clas",
    codename: "Operacao Vanguarda",
    description: "Operacao restrita aos clas definidos pela organizacao com permissao automatica pela tag.",
    mode: "resurgence_trio",
    map: "Fortune's Keep",
    status: "inscricoes_abertas",
    allowedClans: ["STG", "GHOST", "FOX"],
    startDate: "2026-07-05T20:30:00",
    prize: "Ranking de temporada + medalhas",
    entryFee: "R$ 5,00 por operador",
    rules: "Sistema acumulativo em tres quedas.",
    scoreRule: "Sistema acumulativo em 3 quedas",
    maxTeams: 15,
    participants: 6,
    isActive: true,
    isFeatured: false,
    priority: 8,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "op-openzone",
    title: "Open Zone STG",
    codename: "Operacao Zona Aberta",
    description: "Evento aberto para operadores de qualquer cla cadastrado.",
    mode: "battle_royale_squad",
    map: "Urzikstan",
    status: "em_breve",
    allowedClans: ["ALL"],
    startDate: "2026-07-12T21:30:00",
    prize: "Premiacao a definir",
    entryFee: "A definir",
    rules: "Pontuacao por colocacao, kills e vitoria.",
    scoreRule: "Pontuacao por colocacao, kills e vitoria",
    maxTeams: 25,
    participants: 0,
    isActive: true,
    isFeatured: false,
    priority: 6,
    createdAt: now,
    updatedAt: now,
  },
];

function readLocal<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeLocal<T>(key: string, value: T): T {
  localStorage.setItem(key, JSON.stringify(value));
  return value;
}

function rowToOperation(row: WarzoneOperationRow): WarzoneOperation {
  return {
    id: row.id,
    title: row.title,
    codename: row.codename || undefined,
    description: row.description,
    imageUrl: row.image_url || undefined,
    mode: row.mode,
    map: row.map || undefined,
    status: row.status,
    allowedClans: row.allowed_clans,
    startDate: row.start_date || undefined,
    endDate: row.end_date || undefined,
    prize: row.prize || undefined,
    entryFee: row.entry_fee || undefined,
    rules: row.rules || undefined,
    scoreRule: row.score_rule || undefined,
    registrationUrl: row.registration_url || undefined,
    maxTeams: row.max_teams ?? undefined,
    participants: row.participants,
    isActive: row.is_active,
    isFeatured: row.is_featured,
    priority: row.priority,
    result: row.result || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function operationToRow(payload: Partial<WarzoneOperation>) {
  return {
    title: payload.title,
    codename: payload.codename || null,
    description: payload.description || "",
    image_url: payload.imageUrl || null,
    mode: payload.mode || "custom_lobby",
    map: payload.map || null,
    status: payload.status || "em_breve",
    allowed_clans: (payload.allowedClans?.length ? payload.allowedClans : ["ALL"]).map((clan) =>
      clan.trim().toUpperCase()
    ),
    start_date: payload.startDate || null,
    end_date: payload.endDate || null,
    prize: payload.prize || null,
    entry_fee: payload.entryFee || null,
    rules: payload.rules || null,
    score_rule: payload.scoreRule || null,
    registration_url: payload.registrationUrl || null,
    max_teams: payload.maxTeams ?? null,
    participants: payload.participants ?? 0,
    is_active: payload.isActive !== false,
    is_featured: payload.isFeatured === true,
    priority: payload.priority ?? 0,
    result: payload.result ?? null,
  };
}

function rowToParticipation(row: WarzoneParticipationRow): WarzoneParticipation {
  return {
    operationId: row.operation_id,
    userId: row.discord_id,
    clanTag: row.clan_tag,
    registeredAt: row.registered_at,
  };
}

export async function getWarzoneOperations(): Promise<WarzoneOperation[]> {
  if (!isSupabaseEnabled || !supabase) {
    return readLocal(OPERATIONS_KEY, defaultWarzoneOperations);
  }

  const { data, error } = await supabase
    .from("warzone_operations")
    .select("*")
    .order("priority", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Falha ao carregar operacoes Warzone: ${error.message}`);
  return (data as WarzoneOperationRow[]).map(rowToOperation);
}

export async function saveWarzoneOperation(
  payload: Partial<WarzoneOperation> & { id?: string }
): Promise<WarzoneOperation> {
  if (!payload.title?.trim()) throw new Error("O titulo da operacao e obrigatorio.");

  if (!isSupabaseEnabled || !supabase) {
    const operations = readLocal(OPERATIONS_KEY, defaultWarzoneOperations);
    const current = payload.id ? operations.find((operation) => operation.id === payload.id) : undefined;
    const timestamp = new Date().toISOString();
    const operation = {
      ...current,
      ...payload,
      id: payload.id || `warzone-${Date.now()}`,
      title: payload.title.trim(),
      description: payload.description || current?.description || "",
      mode: payload.mode || current?.mode || "custom_lobby",
      status: payload.status || current?.status || "em_breve",
      allowedClans: payload.allowedClans || current?.allowedClans || ["ALL"],
      participants: payload.participants ?? current?.participants ?? 0,
      isActive: payload.isActive ?? current?.isActive ?? true,
      isFeatured: payload.isFeatured ?? current?.isFeatured ?? false,
      priority: payload.priority ?? current?.priority ?? 0,
      createdAt: current?.createdAt || timestamp,
      updatedAt: timestamp,
    } as WarzoneOperation;
    writeLocal(
      OPERATIONS_KEY,
      current
        ? operations.map((item) => (item.id === operation.id ? operation : item))
        : [operation, ...operations]
    );
    return operation;
  }

  const row = operationToRow({ ...payload, title: payload.title.trim() });
  const query = payload.id
    ? supabase.from("warzone_operations").update(row).eq("id", payload.id)
    : supabase.from("warzone_operations").insert(row);
  const { data, error } = await query.select("*").single();

  if (error) throw new Error(`Falha ao salvar a operacao: ${error.message}`);
  return rowToOperation(data as WarzoneOperationRow);
}

export async function registerForWarzoneOperation(
  operationId: string,
  discordId: string,
  clanTag: string
): Promise<WarzoneParticipation> {
  if (!isSupabaseEnabled || !supabase) {
    const participations = readLocal<WarzoneParticipation[]>(PARTICIPATIONS_KEY, []);
    const existing = participations.find(
      (participation) =>
        participation.operationId === operationId && participation.userId === discordId
    );
    if (existing) return existing;

    const participation: WarzoneParticipation = {
      operationId,
      userId: discordId,
      clanTag,
      registeredAt: new Date().toISOString(),
    };
    writeLocal(PARTICIPATIONS_KEY, [participation, ...participations]);
    return participation;
  }

  const { data, error } = await supabase
    .from("warzone_participations")
    .insert({
      operation_id: operationId,
      discord_id: discordId,
      clan_tag: clanTag.trim().toUpperCase(),
    })
    .select("operation_id, discord_id, clan_tag, registered_at")
    .single();

  if (error) {
    if (error.code === "23505") {
      const existing = await getWarzoneParticipations(discordId);
      const participation = existing.find((item) => item.operationId === operationId);
      if (participation) return participation;
    }
    throw new Error(`Falha ao registrar participacao: ${error.message}`);
  }
  return rowToParticipation(data as WarzoneParticipationRow);
}

export async function getWarzoneParticipations(discordId?: string): Promise<WarzoneParticipation[]> {
  if (!isSupabaseEnabled || !supabase) {
    const participations = readLocal<WarzoneParticipation[]>(PARTICIPATIONS_KEY, []);
    return discordId
      ? participations.filter((participation) => participation.userId === discordId)
      : participations;
  }

  let query = supabase
    .from("warzone_participations")
    .select("operation_id, discord_id, clan_tag, registered_at")
    .order("registered_at", { ascending: false });
  if (discordId) query = query.eq("discord_id", discordId);
  const { data, error } = await query;

  if (error) throw new Error(`Falha ao carregar participacoes: ${error.message}`);
  return (data as WarzoneParticipationRow[]).map(rowToParticipation);
}

export async function closeWarzoneOperation(
  operationId: string,
  result: Omit<WarzoneOperationResult, "closedAt">
): Promise<WarzoneOperation> {
  const current = (await getWarzoneOperations()).find((operation) => operation.id === operationId);
  if (!current) throw new Error("Operacao Warzone nao encontrada.");
  return saveWarzoneOperation({
    ...current,
    id: operationId,
    status: "encerrado",
    result: { ...result, closedAt: new Date().toISOString() },
  });
}

export function calculateWarzoneMetrics(operations: WarzoneOperation[]): WarzoneMetrics {
  const history = operations
    .filter((operation) => operation.status === "encerrado" && operation.result)
    .sort((a, b) => (b.result?.closedAt || "").localeCompare(a.result?.closedAt || ""));

  const clans = new Map<string, { wins: number; kills: number; points: number }>();
  let totalKills = 0;

  for (const operation of history) {
    const result = operation.result;
    if (!result) continue;
    totalKills += result.totalKills;

    const winner = result.winnerClan.toUpperCase();
    const winnerStats = clans.get(winner) || { wins: 0, kills: 0, points: 0 };
    winnerStats.wins += 1;
    winnerStats.points += 100;
    clans.set(winner, winnerStats);

    for (const standing of result.finalStandings) {
      const clan = standing.clan.toUpperCase();
      const stats = clans.get(clan) || { wins: 0, kills: 0, points: 0 };
      stats.kills += standing.kills;
      stats.points += Math.max(0, 60 - (standing.position - 1) * 10) + standing.kills;
      clans.set(clan, stats);
    }
  }

  const ranking = Array.from(clans.entries())
    .map(([clan, stats]) => ({ clan, ...stats }))
    .sort((a, b) => b.points - a.points || b.wins - a.wins || b.kills - a.kills);

  return {
    totalEvents: history.length,
    totalKills,
    totalMvps: history.filter((operation) => Boolean(operation.result?.mvp)).length,
    clanWins: ranking
      .filter((entry) => entry.wins > 0)
      .map(({ clan, wins }) => ({ clan, wins }))
      .sort((a, b) => b.wins - a.wins),
    ranking,
    history,
  };
}
