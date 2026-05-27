import { apiRequest, authedApiRequest, getRanking } from "./api";
import { deleteContent, readContent, upsertContent } from "./contentStorage";
import { RankingEntry, RankingItem } from "../types/api";

const KEY = "ranking";
const now = new Date().toISOString();

export const defaultRankingItems: RankingItem[] = [
  {
    id: "operator-alpha",
    playerName: "Operador Alpha",
    nick: "Alpha",
    position: 1,
    points: 12500,
    wins: 42,
    losses: 10,
    kills: 860,
    deaths: 320,
    kd: 2.69,
    level: 45,
    badge: "Elite",
    isActive: true,
    isFeatured: true,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "operator-bravo",
    playerName: "Operador Bravo",
    nick: "Bravo",
    position: 2,
    points: 9800,
    wins: 36,
    losses: 14,
    kills: 740,
    deaths: 350,
    kd: 2.11,
    level: 39,
    badge: "Veterano",
    isActive: true,
    isFeatured: false,
    createdAt: now,
    updatedAt: now,
  },
];

function normalize(data: unknown): RankingItem[] {
  if (Array.isArray(data)) return data as RankingItem[];
  if (data && typeof data === "object" && Array.isArray((data as Record<string, unknown>).ranking)) {
    return (data as Record<string, unknown>).ranking as RankingItem[];
  }
  return [];
}

function entryToRankingItem(entry: RankingEntry, index: number): RankingItem {
  return {
    id: String(entry.discord_id || `ranking-${index + 1}`),
    playerName: entry.username || entry.discord_username || "Operador",
    nick: entry.discord_username || entry.username,
    position: entry.position || index + 1,
    points: entry.xp || 0,
    wins: 0,
    losses: 0,
    kills: 0,
    deaths: 0,
    kd: 0,
    level: entry.level || 1,
    badge: entry.coins ? `${entry.coins} coins` : "",
    isActive: true,
    isFeatured: index < 3,
    createdAt: now,
    updatedAt: now,
  };
}

export function rankingItemToEntry(item: RankingItem): RankingEntry {
  return {
    position: item.position,
    discord_id: item.id,
    discord_username: item.nick || item.playerName,
    username: item.playerName,
    xp: item.points,
    level: item.level,
  };
}

export async function getRankingItems(): Promise<RankingItem[]> {
  try {
    const data = await apiRequest<unknown>("/public/ranking?limit=100");
    const items = normalize(data);
    if (items.length > 0 && "playerName" in items[0]) return items;
  } catch {
    // TODO: integrate with Replit API when ranking write model is available.
  }

  const local = readContent<RankingItem>(KEY, []);
  if (local.length > 0) return local;

  try {
    const entries = await getRanking(100);
    if (entries.length > 0) return entries.map(entryToRankingItem);
  } catch {
    // TODO: remove fallback after API ranking endpoints are complete.
  }

  return defaultRankingItems;
}

export async function saveRankingItem(payload: Partial<RankingItem> & { id?: string }): Promise<RankingItem> {
  try {
    const path = payload.id ? `/admin/ranking/${payload.id}` : "/admin/ranking";
    return await authedApiRequest<RankingItem>(path, {
      method: payload.id ? "PUT" : "POST",
      body: JSON.stringify(payload),
    });
  } catch {
    // TODO: replace local fallback when Replit API exposes /admin/ranking.
  }
  return upsertContent<RankingItem>(KEY, defaultRankingItems, payload);
}

export async function deleteRankingItem(id: string): Promise<void> {
  try {
    await authedApiRequest<void>(`/admin/ranking/${id}`, { method: "DELETE" });
    return;
  } catch {
    // TODO: replace local fallback when Replit API exposes /admin/ranking/:id.
  }
  deleteContent<RankingItem>(KEY, defaultRankingItems, id);
}
