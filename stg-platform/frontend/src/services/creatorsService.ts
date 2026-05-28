import { API_BASE_URL, authedApiRequest } from "./api";
import { ContentCreator, ContentCreatorPayload, CreatorChannel, CreatorChannelPayload, CreatorContent } from "../types/api";
import { assertSafePublicUrl, sanitizeOptionalUrl } from "../utils/safeUrl";

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

function extractCreator(data: unknown): ContentCreator | null {
  if (!data) return null;
  if (typeof data === "object" && "creator" in data) {
    return ((data as { creator?: ContentCreator }).creator ?? null);
  }
  return data as ContentCreator;
}

function validateChannelPayload(data: CreatorChannelPayload): CreatorChannelPayload {
  assertSafePublicUrl(data.channel_url, "URL do canal");
  return {
    ...data,
    channel_url: sanitizeOptionalUrl(data.channel_url),
    channel_id: data.channel_id?.trim() || undefined,
    handle: data.handle?.trim() || undefined,
  };
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
  return extractCreator(await publicRequest<ContentCreator | { creator?: ContentCreator } | null>(`/creators/${id}`, null));
}

export async function getMyCreatorProfile(): Promise<ContentCreator | null> {
  try {
    return extractCreator(await authedApiRequest<ContentCreator | { creator?: ContentCreator }>("/creator/me"));
  } catch {
    return null;
  }
}

export function addMyCreatorChannel(data: CreatorChannelPayload): Promise<CreatorChannel> {
  return authedApiRequest("/creator/me/channels", {
    method: "POST",
    body: JSON.stringify(validateChannelPayload(data)),
  });
}

export function updateMyCreatorChannel(id: string, data: CreatorChannelPayload): Promise<CreatorChannel> {
  return authedApiRequest(`/creator/me/channels/${id}`, {
    method: "PUT",
    body: JSON.stringify(validateChannelPayload(data)),
  });
}

export function disableMyCreatorChannel(id: string): Promise<void> {
  return authedApiRequest(`/creator/me/channels/${id}`, { method: "DELETE" });
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
  return authedApiRequest(`/admin/creators/${creatorId}/channels`, { method: "POST", body: JSON.stringify(validateChannelPayload(data)) });
}

export function adminUpdateCreatorChannel(channelId: string, data: CreatorChannelPayload): Promise<CreatorChannel> {
  return authedApiRequest(`/admin/creators/channels/${channelId}`, { method: "PUT", body: JSON.stringify(validateChannelPayload(data)) });
}

export function adminDisableCreatorChannel(channelId: string): Promise<void> {
  return authedApiRequest(`/admin/creators/channels/${channelId}`, { method: "DELETE" });
}

export function adminCheckCreatorContent(): Promise<Record<string, unknown>> {
  return authedApiRequest("/admin/creators/check-content", { method: "POST" });
}
