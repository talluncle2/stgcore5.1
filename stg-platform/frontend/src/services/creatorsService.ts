import { API_BASE_URL, authedApiRequest } from "./api";
import { ContentCreator, ContentCreatorPayload, CreatorChannel, CreatorChannelPayload, CreatorContent, MyCreatorResponse } from "../types/api";
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
  if (Array.isArray(data)) return data.map(normalizeCreator);
  if (data && typeof data === "object" && Array.isArray((data as { creators?: unknown[] }).creators)) {
    return (data as { creators: ContentCreator[] }).creators.map(normalizeCreator);
  }
  if (data && typeof data === "object" && Array.isArray((data as { featured?: unknown[] }).featured)) {
    return (data as { featured: ContentCreator[] }).featured.map(normalizeCreator);
  }
  if (data && typeof data === "object" && Array.isArray((data as { live?: unknown[] }).live)) {
    return (data as { live: ContentCreator[] }).live.map(normalizeCreator);
  }
  return [];
}

function extractContent(data: unknown): CreatorContent[] {
  if (Array.isArray(data)) return data as CreatorContent[];
  if (data && typeof data === "object" && Array.isArray((data as { content?: unknown[] }).content)) {
    return (data as { content: CreatorContent[] }).content;
  }
  if (data && typeof data === "object" && Array.isArray((data as { contents?: unknown[] }).contents)) {
    return (data as { contents: CreatorContent[] }).contents;
  }
  if (data && typeof data === "object" && Array.isArray((data as { latest?: unknown[] }).latest)) {
    return (data as { latest: CreatorContent[] }).latest;
  }
  if (data && typeof data === "object" && Array.isArray((data as { latest_contents?: unknown[] }).latest_contents)) {
    return (data as { latest_contents: CreatorContent[] }).latest_contents;
  }
  return [];
}

function extractCreator(data: unknown): ContentCreator | null {
  if (!data) return null;
  if (typeof data === "object" && "creator" in data) {
    const response = data as MyCreatorResponse;
    return response.creator
      ? normalizeCreator({
          ...response.creator,
          channels: response.channels ?? response.creator.channels ?? [],
          profile: response.profile ?? response.creator.profile,
        })
      : null;
  }
  return normalizeCreator(data as ContentCreator);
}

function normalizeCreator(raw: ContentCreator): ContentCreator {
  const profile = raw.profile;
  const latestContent = raw.latest_content || raw.latest_contents || [];
  return {
    ...raw,
    display_name: raw.display_name || profile?.public_name || raw.username,
    avatar_url: raw.avatar_url || profile?.public_avatar_url || profile?.avatar_url,
    public_name: raw.public_name || profile?.public_name,
    public_avatar_url: raw.public_avatar_url || profile?.public_avatar_url || profile?.avatar_url,
    public_banner_url: raw.public_banner_url || profile?.public_banner_url,
    bio: raw.bio || profile?.bio,
    public_email: raw.public_email || profile?.public_email,
    location_optional: raw.location_optional || profile?.location_optional,
    pronouns: raw.pronouns || profile?.pronouns,
    profile_visibility: raw.profile_visibility || profile?.profile_visibility,
    sexual_orientation_visibility: raw.sexual_orientation_visibility || profile?.sexual_orientation_visibility,
    channels: raw.channels || [],
    latest_content: latestContent,
    latest_contents: latestContent,
  };
}

function creatorToLiveContent(creator: ContentCreator): CreatorContent | null {
  const normalized = normalizeCreator(creator);
  const liveContent = (normalized.latest_content || normalized.latest_contents || []).find((content) => content.is_live);
  if (liveContent) {
    return { ...liveContent, creator: liveContent.creator || normalized };
  }
  if (!("is_live" in normalized) || !(normalized as unknown as { is_live?: boolean }).is_live) return null;
  const channel = normalized.channels?.[0];
  return {
    id: `live-${normalized.id}`,
    creator_id: normalized.id,
    channel_id: channel?.id || "",
    platform: channel?.platform || "youtube",
    external_id: String(normalized.id),
    content_type: "live",
    title: `${normalized.public_name || normalized.display_name || normalized.username || "Criador STG"} ao vivo`,
    thumbnail_url: normalized.public_banner_url || normalized.banner_url,
    content_url: channel?.channel_url,
    is_live: true,
    is_active: true,
    creator: normalized,
  };
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
  return extractCreators(await publicRequest("/creators/featured", []));
}

export async function getLiveCreators(): Promise<CreatorContent[]> {
  const data = await publicRequest<unknown>("/creators/live", []);
  const directContent = extractContent(data);
  if (directContent.length > 0) return directContent;
  return extractCreators(data).map(creatorToLiveContent).filter(Boolean) as CreatorContent[];
}

export async function getLatestCreatorContent(): Promise<CreatorContent[]> {
  return extractContent(await publicRequest("/creators/latest?limit=20", []));
}

export async function getCreatorById(id: string): Promise<ContentCreator | null> {
  return extractCreator(await publicRequest<ContentCreator | { creator?: ContentCreator } | null>(`/creators/${id}`, null));
}

export async function getMyCreatorProfile(): Promise<ContentCreator | null> {
  try {
    return extractCreator(await authedApiRequest<ContentCreator | MyCreatorResponse>("/creators/me"));
  } catch {
    return null;
  }
}

export async function registerMyCreatorProfile(): Promise<MyCreatorResponse | null> {
  try {
    return await authedApiRequest<MyCreatorResponse>("/creators/me/register", { method: "POST" });
  } catch {
    return null;
  }
}

export function addMyCreatorChannel(data: CreatorChannelPayload): Promise<CreatorChannel> {
  return authedApiRequest("/creators/me/channels", {
    method: "POST",
    body: JSON.stringify(validateChannelPayload(data)),
  });
}

export function updateMyCreatorChannel(id: string, data: CreatorChannelPayload): Promise<CreatorChannel> {
  return authedApiRequest(`/creators/me/channels/${id}`, {
    method: "PUT",
    body: JSON.stringify(validateChannelPayload(data)),
  });
}

export function disableMyCreatorChannel(id: string): Promise<void> {
  return authedApiRequest(`/creators/me/channels/${id}`, { method: "DELETE" });
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
