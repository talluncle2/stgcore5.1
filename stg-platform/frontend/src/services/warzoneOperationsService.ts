import { API_BASE_URL, authedApiRequest } from "./api";
import {
  WarzoneMetrics,
  WarzoneOperation,
  WarzoneOperationResult,
  WarzoneParticipation,
} from "../types/warzone";

const OPERATIONS_KEY = "stg_warzone_operations";
const PARTICIPATIONS_KEY = "stg_warzone_participations";
const now = new Date().toISOString();

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

async function publicRequest<T>(path: string): Promise<T> {
  if (!API_BASE_URL) throw new Error("API indisponivel");
  const response = await fetch(`${API_BASE_URL}${path}`);
  if (!response.ok) throw new Error(`Endpoint indisponivel: ${response.status}`);
  return response.json() as Promise<T>;
}

function extractOperations(data: unknown): WarzoneOperation[] {
  if (Array.isArray(data)) return data as WarzoneOperation[];
  if (data && typeof data === "object") {
    const source = data as Record<string, unknown>;
    if (Array.isArray(source.operations)) return source.operations as WarzoneOperation[];
    if (Array.isArray(source.data)) return source.data as WarzoneOperation[];
  }
  return [];
}

export async function getWarzoneOperations(): Promise<WarzoneOperation[]> {
  try {
    const operations = extractOperations(await publicRequest<unknown>("/public/warzone/operations"));
    if (operations.length > 0) return operations;
  } catch {
    // Temporary fallback until the Replit API exposes Warzone operation endpoints.
  }
  return readLocal(OPERATIONS_KEY, defaultWarzoneOperations);
}

export async function saveWarzoneOperation(
  payload: Partial<WarzoneOperation> & { id?: string }
): Promise<WarzoneOperation> {
  try {
    return await authedApiRequest<WarzoneOperation>(
      payload.id ? `/admin/warzone/operations/${payload.id}` : "/admin/warzone/operations",
      {
        method: payload.id ? "PUT" : "POST",
        body: JSON.stringify(payload),
      }
    );
  } catch {
    const operations = readLocal(OPERATIONS_KEY, defaultWarzoneOperations);
    const current = payload.id ? operations.find((operation) => operation.id === payload.id) : undefined;
    const timestamp = new Date().toISOString();
    const operation = {
      ...current,
      ...payload,
      id: payload.id || `warzone-${Date.now()}`,
      title: payload.title || current?.title || "Operacao Warzone",
      description: payload.description || current?.description || "",
      codename: payload.codename || current?.codename,
      mode: payload.mode || current?.mode || "custom_lobby",
      map: payload.map || current?.map,
      status: payload.status || current?.status || "em_breve",
      allowedClans: payload.allowedClans || current?.allowedClans || ["ALL"],
      participants: payload.participants ?? current?.participants ?? 0,
      entryFee: payload.entryFee || current?.entryFee,
      scoreRule: payload.scoreRule || current?.scoreRule,
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
}

export async function registerForWarzoneOperation(
  operationId: string,
  userId: string,
  clanTag: string
): Promise<WarzoneParticipation> {
  try {
    return await authedApiRequest<WarzoneParticipation>(
      `/warzone/operations/${operationId}/register`,
      {
        method: "POST",
        body: JSON.stringify({ clanTag }),
      }
    );
  } catch {
    const participations = readLocal<WarzoneParticipation[]>(PARTICIPATIONS_KEY, []);
    const existing = participations.find(
      (participation) => participation.operationId === operationId && participation.userId === userId
    );
    if (existing) return existing;

    const participation: WarzoneParticipation = {
      operationId,
      userId,
      clanTag,
      registeredAt: new Date().toISOString(),
    };
    writeLocal(PARTICIPATIONS_KEY, [participation, ...participations]);
    return participation;
  }
}

export function getLocalWarzoneParticipations(userId?: string): WarzoneParticipation[] {
  const participations = readLocal<WarzoneParticipation[]>(PARTICIPATIONS_KEY, []);
  return userId ? participations.filter((participation) => participation.userId === userId) : participations;
}

export async function closeWarzoneOperation(
  operationId: string,
  result: Omit<WarzoneOperationResult, "closedAt">
): Promise<WarzoneOperation> {
  const finalResult = { ...result, closedAt: new Date().toISOString() };
  try {
    return await authedApiRequest<WarzoneOperation>(
      `/admin/warzone/operations/${operationId}/close`,
      {
        method: "POST",
        body: JSON.stringify(finalResult),
      }
    );
  } catch {
    return saveWarzoneOperation({
      id: operationId,
      status: "encerrado",
      result: finalResult,
    });
  }
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
