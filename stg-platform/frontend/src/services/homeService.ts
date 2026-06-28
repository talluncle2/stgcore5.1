import { apiRequest, authedApiRequest } from "./api";
import { readContent } from "./contentStorage";
import { HomeContentItem } from "../types/api";

const KEY = "home";
const now = new Date().toISOString();

export const defaultHomeItems: HomeContentItem[] = [
  {
    id: "main-hero",
    titleLine1: "SUPREMO",
    titleLine2: "TRIBUNAL GAMER",
    description: "Domine o campo digital com a tropa de elite da STG.",
    backgroundImageUrl: "/assets/premium-theme/IMG/COD-HP_Hero_Desktop_XL.webp",
    primaryLabel: "VER TORNEIOS",
    primaryUrl: "/torneios",
    secondaryLabel: "ENTRAR NA ARENA",
    seasonTitle: "TEMPORADA ATUAL",
    missionTitle: "Venca 5 partidas ranqueadas",
    missionProgress: "3 / 5",
    isActive: true,
    priority: 10,
    createdAt: now,
    updatedAt: now,
  },
];

function normalize(data: unknown): HomeContentItem[] {
  if (Array.isArray(data)) return data as HomeContentItem[];
  if (data && typeof data === "object" && Array.isArray((data as Record<string, unknown>).home)) {
    return (data as Record<string, unknown>).home as HomeContentItem[];
  }
  return [];
}

export async function getHomeContentItems(): Promise<HomeContentItem[]> {
  try {
    const data = await apiRequest<unknown>("/public/home");
    const items = normalize(data);
    if (items.length > 0) return items;
  } catch {
    // TODO: remove fallback after the official /public/home API has production data.
  }
  return readContent<HomeContentItem>(KEY, defaultHomeItems);
}

export async function getActiveHomeContent(): Promise<HomeContentItem> {
  const items = await getHomeContentItems();
  return (
    items
      .filter((item) => item.isActive)
      .sort((a, b) => b.priority - a.priority || b.createdAt.localeCompare(a.createdAt))[0] ||
    defaultHomeItems[0]
  );
}

export async function saveHomeContentItem(payload: Partial<HomeContentItem> & { id?: string }): Promise<HomeContentItem> {
  const path = payload.id ? `/admin/home/${payload.id}` : "/admin/home";
  return authedApiRequest<HomeContentItem>(path, {
    method: payload.id ? "PUT" : "POST",
    body: JSON.stringify(payload),
  });
}

export async function deleteHomeContentItem(id: string): Promise<void> {
  await authedApiRequest<void>(`/admin/home/${id}`, { method: "DELETE" });
}
