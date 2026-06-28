import { getAuthToken } from "./api";
import { isSupabaseEnabled, publicSupabase, supabase } from "../lib/supabase";
import {
  AuthUser,
  ContentCreator,
  ContentCreatorPayload,
  CreatorChannel,
  CreatorChannelPayload,
  CreatorContent,
  CreatorPlatform,
  MyCreatorResponse,
} from "../types/api";
import { assertSafePublicUrl } from "../utils/safeUrl";

type JwtClaims = {
  discord_id?: string;
  username?: string;
  is_admin?: boolean;
  is_content_creator?: boolean;
};

type CreatorRow = {
  id: string;
  discord_id: string;
  guild_id?: string | null;
  display_name?: string | null;
  username?: string | null;
  avatar_url?: string | null;
  banner_url?: string | null;
  bio?: string | null;
  is_active: boolean;
  is_featured: boolean;
  is_verified?: boolean | null;
  sort_order: number;
  last_checked_at?: string | null;
  last_check_status?: string | null;
  created_at?: string;
  updated_at?: string;
  channels?: ChannelRow[];
  latest_content?: ContentRow[];
};

type ChannelRow = {
  id: string;
  creator_id: string;
  platform: CreatorPlatform;
  channel_id?: string | null;
  channel_url?: string | null;
  channel_name?: string | null;
  handle?: string | null;
  description?: string | null;
  thumbnail_url?: string | null;
  subscriber_count?: number | null;
  video_count?: number | null;
  view_count?: number | null;
  metadata_json?: Record<string, unknown> | null;
  is_active: boolean;
  last_checked_at?: string | null;
  created_at?: string;
  updated_at?: string;
};

type CreatorContentOwner = {
  id: string;
  display_name?: string | null;
  username?: string | null;
  avatar_url?: string | null;
};

type ContentRow = Omit<CreatorContent, "creator"> & {
  creator?: CreatorContentOwner | CreatorContentOwner[] | null;
};

export type ResolvedCreatorProfile = {
  platform: CreatorPlatform;
  canonicalUrl: string;
  handle: string;
  channelId?: string;
  channelName: string;
};

const CONTENT_COLUMNS = `
  id,
  creator_id,
  channel_id,
  platform,
  external_id,
  content_type,
  title,
  description,
  thumbnail_url,
  content_url,
  embed_url,
  published_at,
  started_at,
  ended_at,
  is_live,
  is_active,
  created_at,
  updated_at
`;

const CREATOR_SELECT = `
  id,
  discord_id,
  guild_id,
  display_name,
  username,
  avatar_url,
  banner_url,
  bio,
  is_active,
  is_featured,
  is_verified,
  sort_order,
  last_checked_at,
  last_check_status,
  created_at,
  updated_at,
  channels:creator_channels(*),
  latest_content:creator_content(${CONTENT_COLUMNS})
`;

const PLATFORM_HOSTS: Record<CreatorPlatform, string[]> = {
  youtube: ["youtube.com", "m.youtube.com"],
  twitch: ["twitch.tv", "m.twitch.tv"],
  kick: ["kick.com"],
  tiktok: ["tiktok.com", "m.tiktok.com"],
};

function requireSupabase() {
  if (!isSupabaseEnabled || !supabase) {
    throw new Error("Supabase nao esta configurado para o modulo de criadores.");
  }
  return supabase;
}

function requirePublicSupabase() {
  if (!isSupabaseEnabled || !publicSupabase) {
    throw new Error("Supabase nao esta configurado para o modulo de criadores.");
  }
  return publicSupabase;
}

function creatorServiceError(context: string, error: { message?: string }) {
  const message = String(error.message || "");
  if (
    message.includes("No suitable key") ||
    message.includes("wrong key type") ||
    message.toLowerCase().includes("invalid jwt")
  ) {
    return new Error(
      `${context}: a sessao Discord nao foi aceita pelo Supabase. ` +
        "Configure SUPABASE_JWT_SECRET na API oficial com o Legacy JWT Secret do projeto e entre novamente."
    );
  }
  return new Error(`${context}: ${message || "erro desconhecido"}`);
}

function readClaims(): JwtClaims {
  const token = getAuthToken();
  if (!token) return {};
  try {
    const encoded = token.split(".")[1];
    if (!encoded) return {};
    const normalized = encoded.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
    return JSON.parse(atob(padded)) as JwtClaims;
  } catch {
    return {};
  }
}

function normalizeUrlInput(value: string) {
  const trimmed = value.trim();
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

function cleanHandle(value: string) {
  return decodeURIComponent(value).trim().replace(/^@/, "").replace(/\/+$/, "");
}

export function resolveCreatorProfileLink(value: string): ResolvedCreatorProfile {
  const normalizedInput = normalizeUrlInput(value);
  assertSafePublicUrl(normalizedInput, "Link do perfil");
  const url = new URL(normalizedInput);
  url.hostname = url.hostname.toLowerCase().replace(/^www\./, "");
  url.search = "";
  url.hash = "";

  const platform = (Object.entries(PLATFORM_HOSTS).find(([, hosts]) =>
    hosts.includes(url.hostname)
  )?.[0] || "") as CreatorPlatform;
  if (!platform) {
    throw new Error("Use um perfil publico do YouTube, Twitch, Kick ou TikTok.");
  }

  const parts = url.pathname.split("/").filter(Boolean);
  let handle = "";
  let channelId: string | undefined;

  if (platform === "youtube") {
    if (parts[0]?.toLowerCase() === "channel" && parts[1]) {
      channelId = cleanHandle(parts[1]);
      handle = channelId;
      url.pathname = `/channel/${channelId}`;
    } else if (parts[0]?.startsWith("@")) {
      handle = cleanHandle(parts[0]);
      url.pathname = `/@${handle}`;
    } else if (["c", "user"].includes(parts[0]?.toLowerCase()) && parts[1]) {
      handle = cleanHandle(parts[1]);
      url.pathname = `/${parts[0].toLowerCase()}/${handle}`;
    }
  } else if (platform === "tiktok") {
    if (parts[0]?.startsWith("@")) {
      handle = cleanHandle(parts[0]);
      url.pathname = `/@${handle}`;
    }
  } else if (parts[0]) {
    handle = cleanHandle(parts[0]);
    url.pathname = `/${handle}`;
  }

  if (!handle) {
    throw new Error("O link informado nao identifica um perfil ou canal valido.");
  }

  return {
    platform,
    canonicalUrl: url.toString().replace(/\/+$/, ""),
    handle,
    channelId,
    channelName: handle,
  };
}

function rowToChannel(row: ChannelRow): CreatorChannel {
  return {
    id: row.id,
    creator_id: row.creator_id,
    platform: row.platform,
    channel_id: row.channel_id || undefined,
    channel_url: row.channel_url || undefined,
    channel_name: row.channel_name || undefined,
    handle: row.handle || undefined,
    description: row.description || undefined,
    thumbnail_url: row.thumbnail_url || undefined,
    subscriber_count: row.subscriber_count ?? undefined,
    video_count: row.video_count ?? undefined,
    view_count: row.view_count ?? undefined,
    metadata_json: row.metadata_json || undefined,
    is_active: row.is_active,
    status: String(row.metadata_json?.profile_sync_status || "link_validated"),
    last_checked_at: row.last_checked_at || undefined,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

function rowToContent(row: ContentRow): CreatorContent {
  const creator = Array.isArray(row.creator) ? row.creator[0] : row.creator;
  return {
    ...row,
    creator: creator
      ? {
          id: creator.id,
          display_name: creator.display_name || undefined,
          username: creator.username || undefined,
          avatar_url: creator.avatar_url || undefined,
        }
      : undefined,
  };
}

function rowToCreator(row: CreatorRow): ContentCreator {
  const latestContent = (row.latest_content || [])
    .map(rowToContent)
    .filter((content) => content.is_active)
    .sort((a, b) =>
      String(b.published_at || b.started_at || "").localeCompare(
        String(a.published_at || a.started_at || "")
      )
    );
  return {
    id: row.id,
    discord_id: row.discord_id,
    guild_id: row.guild_id || undefined,
    display_name: row.display_name || undefined,
    username: row.username || undefined,
    avatar_url: row.avatar_url || undefined,
    banner_url: row.banner_url || undefined,
    bio: row.bio || undefined,
    is_active: row.is_active,
    is_featured: row.is_featured,
    is_verified: row.is_verified === true,
    sort_order: row.sort_order,
    last_checked_at: row.last_checked_at || undefined,
    last_check_status: row.last_check_status || undefined,
    created_at: row.created_at,
    updated_at: row.updated_at,
    channels: (row.channels || []).map(rowToChannel),
    latest_content: latestContent,
    latest_contents: latestContent,
  };
}

function creatorPayloadToRow(data: ContentCreatorPayload) {
  return {
    discord_id: data.discord_id,
    guild_id: data.guild_id || null,
    display_name: data.display_name || null,
    username: data.username || null,
    avatar_url: data.avatar_url || null,
    banner_url: data.banner_url || data.public_banner_url || null,
    bio: data.bio || null,
    is_active: data.is_active !== false,
    is_featured: data.is_featured === true,
    sort_order: data.sort_order ?? 0,
  };
}

function channelPayloadFromLink(data: CreatorChannelPayload) {
  if (!data.channel_url) throw new Error("Informe o link publico do perfil.");
  const resolved = resolveCreatorProfileLink(data.channel_url);
  const timestamp = new Date().toISOString();
  return {
    resolved,
    row: {
      platform: resolved.platform,
      channel_id: resolved.channelId || null,
      channel_url: resolved.canonicalUrl,
      channel_name: resolved.channelName,
      handle: resolved.handle,
      is_active: data.is_active !== false,
      last_checked_at: timestamp,
      metadata_json: {
        ...(data.metadata_json || {}),
        source: "profile_link",
        profile_sync_status: "link_validated",
        content_sync_status: "browser_limited",
        detected_platform: resolved.platform,
        synced_at: timestamp,
      },
    },
  };
}

async function loadCreatorByDiscordId(discordId: string): Promise<ContentCreator | null> {
  const client = requirePublicSupabase();
  const { data, error } = await client
    .from("content_creators")
    .select(CREATOR_SELECT)
    .eq("discord_id", discordId)
    .maybeSingle();
  if (error) throw new Error(`Falha ao carregar perfil de criador: ${error.message}`);
  return data ? rowToCreator(data as CreatorRow) : null;
}

export async function getCreators(): Promise<ContentCreator[]> {
  if (!isSupabaseEnabled || !publicSupabase) return [];
  const { data, error } = await publicSupabase
    .from("content_creators")
    .select(CREATOR_SELECT)
    .eq("is_active", true)
    .order("is_featured", { ascending: false })
    .order("sort_order")
    .order("created_at", { ascending: false });
  if (error) throw new Error(`Falha ao carregar criadores: ${error.message}`);
  return (data as CreatorRow[]).map(rowToCreator);
}

export async function getFeaturedCreators(): Promise<ContentCreator[]> {
  const creators = await getCreators();
  const featured = creators.filter((creator) => creator.is_featured);
  return featured.length > 0 ? featured : creators.slice(0, 3);
}

export async function getLiveCreators(): Promise<CreatorContent[]> {
  if (!isSupabaseEnabled || !publicSupabase) return [];
  const { data, error } = await publicSupabase
    .from("creator_content")
    .select(`${CONTENT_COLUMNS}, creator:content_creators(id, display_name, username, avatar_url, banner_url, bio, is_active, is_featured, is_verified, sort_order)`)
    .eq("is_active", true)
    .eq("is_live", true)
    .order("started_at", { ascending: false });
  if (error) throw new Error(`Falha ao carregar lives: ${error.message}`);
  return (data as ContentRow[]).map(rowToContent);
}

export async function getLatestCreatorContent(): Promise<CreatorContent[]> {
  if (!isSupabaseEnabled || !publicSupabase) return [];
  const { data, error } = await publicSupabase
    .from("creator_content")
    .select(`${CONTENT_COLUMNS}, creator:content_creators(id, display_name, username, avatar_url, banner_url, bio, is_active, is_featured, is_verified, sort_order)`)
    .eq("is_active", true)
    .order("published_at", { ascending: false, nullsFirst: false })
    .limit(20);
  if (error) throw new Error(`Falha ao carregar conteudos: ${error.message}`);
  return (data as ContentRow[]).map(rowToContent);
}

export async function getCreatorById(id: string): Promise<ContentCreator | null> {
  if (!isSupabaseEnabled || !publicSupabase) return null;
  const { data, error } = await publicSupabase
    .from("content_creators")
    .select(CREATOR_SELECT)
    .eq("id", id)
    .eq("is_active", true)
    .maybeSingle();
  if (error) throw new Error(`Falha ao carregar o criador: ${error.message}`);
  return data ? rowToCreator(data as CreatorRow) : null;
}

export async function getMyCreatorProfile(): Promise<ContentCreator | null> {
  const discordId = readClaims().discord_id;
  if (!discordId) return null;
  return loadCreatorByDiscordId(discordId);
}

export async function registerMyCreatorProfile(user?: AuthUser): Promise<MyCreatorResponse | null> {
  const claims = readClaims();
  const discordId = String(user?.discord_id || claims.discord_id || "");
  if (!discordId) throw new Error("Entre novamente para validar seu Discord.");
  const existing = await loadCreatorByDiscordId(discordId);
  if (existing) return { is_creator: true, creator: existing, channels: existing.channels };

  const client = requireSupabase();
  const { data, error } = await client
    .from("content_creators")
    .insert({
      discord_id: discordId,
      display_name:
        user?.display_name || user?.global_name || user?.username || claims.username || "Criador STG",
      username: user?.username || user?.discord_username || claims.username || null,
      avatar_url: user?.avatar_url || user?.discord_avatar_url || null,
      is_active: true,
      is_featured: false,
      sort_order: 0,
    })
    .select(CREATOR_SELECT)
    .single();
  if (error) throw creatorServiceError("Falha ao criar perfil de criador", error);
  const creator = rowToCreator(data as CreatorRow);
  return { is_creator: true, creator, channels: creator.channels };
}

export async function syncMyCreatorProfile(): Promise<ContentCreator | null> {
  const creator = await getMyCreatorProfile();
  if (!creator) return null;
  await Promise.all(
    creator.channels
      .filter((channel) => channel.is_active && channel.channel_url)
      .map((channel) =>
        updateChannelFromLink(channel.id, channel.creator_id, {
          channel_url: channel.channel_url,
          is_active: true,
        })
      )
  );
  return getMyCreatorProfile();
}

async function createChannelFromLink(
  creatorId: string,
  data: CreatorChannelPayload
): Promise<CreatorChannel> {
  const client = requireSupabase();
  const { resolved, row } = channelPayloadFromLink(data);
  const { data: existing } = await client
    .from("creator_channels")
    .select("*")
    .eq("creator_id", creatorId)
    .eq("platform", resolved.platform)
    .maybeSingle();

  const query = existing
    ? client.from("creator_channels").update(row).eq("id", existing.id)
    : client.from("creator_channels").insert({ creator_id: creatorId, ...row });
  const { data: saved, error } = await query.select("*").single();
  if (error) throw creatorServiceError("Falha ao vincular perfil", error);
  return rowToChannel(saved as ChannelRow);
}

async function updateChannelFromLink(
  channelId: string,
  creatorId: string,
  data: CreatorChannelPayload
): Promise<CreatorChannel> {
  const client = requireSupabase();
  const { row } = channelPayloadFromLink(data);
  const { data: saved, error } = await client
    .from("creator_channels")
    .update({ creator_id: creatorId, ...row })
    .eq("id", channelId)
    .select("*")
    .single();
  if (error) throw creatorServiceError("Falha ao atualizar perfil vinculado", error);
  return rowToChannel(saved as ChannelRow);
}

export async function addMyCreatorChannel(data: CreatorChannelPayload): Promise<CreatorChannel> {
  const creator = await getMyCreatorProfile();
  if (!creator) throw new Error("Crie seu perfil de criador antes de vincular um canal.");
  return createChannelFromLink(creator.id, data);
}

export async function updateMyCreatorChannel(
  id: string,
  data: CreatorChannelPayload
): Promise<CreatorChannel> {
  const creator = await getMyCreatorProfile();
  if (!creator) throw new Error("Perfil de criador nao encontrado.");
  return updateChannelFromLink(id, creator.id, data);
}

export async function disableMyCreatorChannel(id: string): Promise<void> {
  const client = requireSupabase();
  const { error } = await client
    .from("creator_channels")
    .update({ is_active: false })
    .eq("id", id);
  if (error) throw creatorServiceError("Falha ao desativar o canal", error);
}

export async function adminGetCreators(): Promise<{
  creators: ContentCreator[];
  can_manage: boolean;
}> {
  if (!isSupabaseEnabled || !supabase) return { creators: [], can_manage: false };
  const { data, error } = await supabase
    .from("content_creators")
    .select(CREATOR_SELECT)
    .order("is_active", { ascending: false })
    .order("is_featured", { ascending: false })
    .order("sort_order");
  if (error) throw creatorServiceError("Falha ao carregar gestao de criadores", error);
  const creators = (data as CreatorRow[]).map(rowToCreator);
  return { creators, can_manage: readClaims().is_admin === true };
}

export async function adminCreateCreator(data: ContentCreatorPayload): Promise<ContentCreator> {
  if (!data.discord_id) throw new Error("O Discord ID do criador e obrigatorio.");
  const client = requireSupabase();
  const { data: saved, error } = await client
    .from("content_creators")
    .insert(creatorPayloadToRow(data))
    .select(CREATOR_SELECT)
    .single();
  if (error) throw creatorServiceError("Falha ao criar criador", error);
  return rowToCreator(saved as CreatorRow);
}

export async function adminUpdateCreator(
  id: string,
  data: ContentCreatorPayload
): Promise<ContentCreator> {
  const client = requireSupabase();
  const row = creatorPayloadToRow(data);
  delete (row as Partial<typeof row>).discord_id;
  const { data: saved, error } = await client
    .from("content_creators")
    .update(row)
    .eq("id", id)
    .select(CREATOR_SELECT)
    .single();
  if (error) throw creatorServiceError("Falha ao atualizar criador", error);
  return rowToCreator(saved as CreatorRow);
}

export async function adminDisableCreator(id: string): Promise<void> {
  const client = requireSupabase();
  const { error } = await client
    .from("content_creators")
    .update({ is_active: false })
    .eq("id", id);
  if (error) throw creatorServiceError("Falha ao desativar criador", error);
}

export async function adminAddCreatorChannel(
  creatorId: string,
  data: CreatorChannelPayload
): Promise<CreatorChannel> {
  return createChannelFromLink(creatorId, data);
}

export async function adminUpdateCreatorChannel(
  channelId: string,
  data: CreatorChannelPayload
): Promise<CreatorChannel> {
  const client = requireSupabase();
  const { data: channel, error } = await client
    .from("creator_channels")
    .select("creator_id")
    .eq("id", channelId)
    .single();
  if (error) throw creatorServiceError("Canal nao encontrado", error);
  return updateChannelFromLink(channelId, String(channel.creator_id), data);
}

export async function adminDisableCreatorChannel(channelId: string): Promise<void> {
  const client = requireSupabase();
  const { error } = await client
    .from("creator_channels")
    .update({ is_active: false })
    .eq("id", channelId);
  if (error) throw creatorServiceError("Falha ao desativar canal", error);
}

export async function adminCheckCreatorContent(): Promise<Record<string, unknown>> {
  const creators = await getCreators();
  const channels = creators.flatMap((creator) => creator.channels.filter((channel) => channel.is_active));
  const results = await Promise.allSettled(
    channels
      .filter((channel) => channel.channel_url)
      .map((channel) =>
        updateChannelFromLink(channel.id, channel.creator_id, {
          channel_url: channel.channel_url,
          is_active: true,
        })
      )
  );
  return {
    checked: results.length,
    linked: results.filter((result) => result.status === "fulfilled").length,
    failed: results.filter((result) => result.status === "rejected").length,
    mode: "profile_link",
  };
}
