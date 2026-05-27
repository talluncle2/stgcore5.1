import { API_BASE_URL, authedApiRequest } from "./api";
import { ContentCreator, ContentCreatorPayload, CreatorChannel, CreatorChannelPayload, CreatorContent } from "../types/api";

async function publicRequest<T>(path: string, fallback: T): Promise<T> {
  if (!API_BASE_URL) return fallback;
  try {
    const response = await fetch(`${API_BASE_URL}${path}`);
    if (!response.ok) return fallback;
    return (await response.json()) as T;
  } catch {
    return fallback;
  }
}

function extractCreators(data: unknown): ContentCreator[] {
  if (Array.isArray(data)) return data as ContentCreator[];
  if (data && typeof data === "object" && Array.isArray((data as { creators?: unknown[] }).creators)) {
    return (data as { creators: ContentCreator[] }).creators;
  }
  return [];
}

function extractContent(data: unknown): CreatorContent[] {
  if (Array.isArray(data)) return data as CreatorContent[];
  if (data && typeof data === "object" && Array.isArray((data as { content?: unknown[] }).content)) {
    return (data as { content: CreatorContent[] }).content;
  }
  return [];
}

export async function getCreators(): Promise<ContentCreator[]> {
  return extractCreators(await publicRequest("/creators", { creators: [] }));
}

export async function getFeaturedCreators(): Promise<ContentCreator[]> {
  return extractCreators(await publicRequest("/creators/featured", { creators: [] }));
}

export async function getLiveCreators(): Promise<CreatorContent[]> {
  return extractContent(await publicRequest("/creators/live", { content: [] }));
}

export async function getLatestCreatorContent(): Promise<CreatorContent[]> {
  return extractContent(await publicRequest("/creators/latest", { content: [] }));
}

export async function getCreatorById(id: string): Promise<ContentCreator | null> {
  return publicRequest<ContentCreator | null>(`/creators/${id}`, null);
}

export async function adminGetCreators(): Promise<{ creators: ContentCreator[]; can_manage: boolean }> {
  try {
    return await authedApiRequest<{ creators: ContentCreator[]; can_manage: boolean }>("/admin/creators");
  } catch {
    return { creators: [], can_manage: false };
  }
}

export function adminCreateCreator(data: ContentCreatorPayload): Promise<ContentCreator> {
  return authedApiRequest("/admin/creators", { method: "POST", body: JSON.stringify(data) });
}

export function adminUpdateCreator(id: string, data: ContentCreatorPayload): Promise<ContentCreator> {
  return authedApiRequest(`/admin/creators/${id}`, { method: "PUT", body: JSON.stringify(data) });
}

export function adminDisableCreator(id: string): Promise<void> {
  return authedApiRequest(`/admin/creators/${id}`, { method: "DELETE" });
}

export function adminSyncCreatorsFromDiscord(): Promise<{ success: boolean; synced: number }> {
  return authedApiRequest("/admin/creators/sync-from-discord", { method: "POST" });
}

export function adminAddCreatorChannel(creatorId: string, data: CreatorChannelPayload): Promise<CreatorChannel> {
  return authedApiRequest(`/admin/creators/${creatorId}/channels`, { method: "POST", body: JSON.stringify(data) });
}

export function adminUpdateCreatorChannel(channelId: string, data: CreatorChannelPayload): Promise<CreatorChannel> {
  return authedApiRequest(`/admin/creators/channels/${channelId}`, { method: "PUT", body: JSON.stringify(data) });
}

export function adminDisableCreatorChannel(channelId: string): Promise<void> {
  return authedApiRequest(`/admin/creators/channels/${channelId}`, { method: "DELETE" });
}

export function adminCheckCreatorContent(): Promise<Record<string, unknown>> {
  return authedApiRequest("/admin/creators/check-content", { method: "POST" });
}
