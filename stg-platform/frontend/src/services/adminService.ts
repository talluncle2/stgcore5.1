import { authedApiRequest } from "./api";
import { assertAdmin } from "./adminGuard";
import { AdminSettings, AuthUser, DiscordMetrics } from "../types/api";

export type DiscordGuildInfo = {
  guild_id?: string | number;
  guild_name?: string;
  icon_url?: string;
  owner_id?: string | number;
  member_count?: number;
  human_members?: number;
  bot_members?: number;
  online_members?: number;
  channels_total?: number;
  text_channels?: number;
  voice_channels?: number;
  roles_count?: number;
  emojis?: number;
  boosts?: number;
  premium_tier?: number;
  latency_ms?: number;
  uptime_seconds?: number;
  last_sync_at?: string;
};

export type DiscordMember = {
  id?: string | number;
  guild_id?: string | number;
  discord_id: string | number;
  user_id?: string | number;
  username?: string;
  discord_username?: string;
  global_name?: string;
  display_name?: string;
  nick?: string;
  avatar_url?: string;
  joined_at?: string;
  role_ids?: Array<string | number>;
  roles_json?: Array<{ id?: string | number; name?: string }> | Record<string, unknown>;
  is_bot?: boolean;
  status?: string;
  is_admin?: boolean;
  is_moderator?: boolean;
  can_access_dashboard?: boolean;
  is_content_creator?: boolean;
  last_discord_sync_at?: string;
  xp?: number;
  level?: number;
  coins?: number;
};

export type DiscordRole = {
  id?: string | number;
  guild_id?: string | number;
  role_id: string | number;
  name: string;
  color?: string;
  position?: number;
  permissions?: string[];
  mentionable?: boolean;
  last_sync_at?: string;
};

export type DiscordChannel = {
  id?: string | number;
  guild_id?: string | number;
  channel_id: string | number;
  name: string;
  type?: string;
  position?: number;
  category_id?: string | number;
  nsfw?: boolean;
  last_sync_at?: string;
};

export type DiscordEvent = {
  id?: string | number;
  event_type?: string;
  discord_id?: string | number;
  channel_id?: string | number;
  payload_json?: Record<string, unknown>;
  created_at?: string;
};

export type DiscordStats = {
  guild_found: boolean;
  stats: Record<string, unknown>;
};

/**
 * Get Discord Bot Status
 */
export async function getDiscordStatus(): Promise<DiscordMetrics | null> {
  try {
    return await authedApiRequest<DiscordMetrics>("/admin/discord/status");
  } catch (error) {
    console.error("Failed to fetch Discord status:", error);
    return null;
  }
}

/**
 * Get Discord Metrics
 */
export async function getDiscordMetrics(): Promise<{ metrics: Record<string, unknown>[] } | null> {
  try {
    return await authedApiRequest<{ metrics: Record<string, unknown>[] }>("/admin/discord/metrics");
  } catch (error) {
    console.error("Failed to fetch Discord metrics:", error);
    return null;
  }
}

/**
 * Get Guild Information
 */
export async function getDiscordGuild(): Promise<DiscordGuildInfo | null> {
  try {
    return await authedApiRequest<DiscordGuildInfo>("/admin/discord/guild");
  } catch (error) {
    console.error("Failed to fetch guild:", error);
    return null;
  }
}

/**
 * Get Discord Members
 */
export async function getDiscordMembers(
  options?: {
    is_admin?: boolean;
    is_moderator?: boolean;
    is_bot?: boolean;
    limit?: number;
    offset?: number;
  }
): Promise<DiscordMember[] | null> {
  try {
    const params = new URLSearchParams();
    if (options?.is_admin !== undefined) params.append("is_admin", String(options.is_admin));
    if (options?.is_moderator !== undefined) params.append("is_moderator", String(options.is_moderator));
    if (options?.is_bot !== undefined) params.append("is_bot", String(options.is_bot));
    if (options?.limit) params.append("limit", String(options.limit));
    if (options?.offset) params.append("offset", String(options.offset));

    const query = params.toString() ? `?${params.toString()}` : "";
    return await authedApiRequest<DiscordMember[]>(`/admin/discord/members${query}`);
  } catch (error) {
    console.error("Failed to fetch members:", error);
    return null;
  }
}

/**
 * Get Specific Discord Member
 */
export async function getDiscordMember(discord_id: number): Promise<DiscordMember | null> {
  try {
    return await authedApiRequest<DiscordMember>(`/admin/discord/members/${discord_id}`);
  } catch (error) {
    console.error(`Failed to fetch member ${discord_id}:`, error);
    return null;
  }
}

/**
 * Get Discord Roles
 */
export async function getDiscordRoles(options?: { limit?: number; offset?: number }): Promise<DiscordRole[] | null> {
  try {
    const params = new URLSearchParams();
    if (options?.limit) params.append("limit", String(options.limit));
    if (options?.offset) params.append("offset", String(options.offset));

    const query = params.toString() ? `?${params.toString()}` : "";
    return await authedApiRequest<DiscordRole[]>(`/admin/discord/roles${query}`);
  } catch (error) {
    console.error("Failed to fetch roles:", error);
    return null;
  }
}

/**
 * Get Specific Discord Role
 */
export async function getDiscordRole(role_id: number): Promise<DiscordRole | null> {
  try {
    return await authedApiRequest<DiscordRole>(`/admin/discord/roles/${role_id}`);
  } catch (error) {
    console.error(`Failed to fetch role ${role_id}:`, error);
    return null;
  }
}

/**
 * Get Discord Channels
 */
export async function getDiscordChannels(options?: { limit?: number; offset?: number }): Promise<DiscordChannel[] | null> {
  try {
    const params = new URLSearchParams();
    if (options?.limit) params.append("limit", String(options.limit));
    if (options?.offset) params.append("offset", String(options.offset));

    const query = params.toString() ? `?${params.toString()}` : "";
    return await authedApiRequest<DiscordChannel[]>(`/admin/discord/channels${query}`);
  } catch (error) {
    console.error("Failed to fetch channels:", error);
    return null;
  }
}

/**
 * Get Specific Discord Channel
 */
export async function getDiscordChannel(channel_id: number): Promise<DiscordChannel | null> {
  try {
    return await authedApiRequest<DiscordChannel>(`/admin/discord/channels/${channel_id}`);
  } catch (error) {
    console.error(`Failed to fetch channel ${channel_id}:`, error);
    return null;
  }
}

/**
 * Get Discord Events
 */
export async function getDiscordEvents(options?: {
  event_type?: string;
  limit?: number;
  offset?: number;
}): Promise<{ events: DiscordEvent[] } | null> {
  try {
    const params = new URLSearchParams();
    if (options?.event_type) params.append("event_type", options.event_type);
    if (options?.limit) params.append("limit", String(options.limit));
    if (options?.offset) params.append("offset", String(options.offset));

    const query = params.toString() ? `?${params.toString()}` : "";
    return await authedApiRequest<{ events: DiscordEvent[] }>(`/admin/discord/events${query}`);
  } catch (error) {
    console.error("Failed to fetch events:", error);
    return null;
  }
}

/**
 * Get Discord Statistics
 */
export async function getDiscordStats(): Promise<DiscordStats | null> {
  try {
    return await authedApiRequest<DiscordStats>("/admin/discord/stats");
  } catch (error) {
    console.error("Failed to fetch Discord stats:", error);
    return null;
  }
}

/**
 * Get Admin Settings (legacy)
 */
export async function getAdminSettings(): Promise<AdminSettings | null> {
  try {
    return await authedApiRequest<AdminSettings>("/admin/settings");
  } catch {
    return null;
  }
}

/**
 * Update Admin Settings (legacy)
 */
export async function updateAdminSettings(payload: AdminSettings, currentUser: AuthUser | null): Promise<AdminSettings> {
  assertAdmin(currentUser);
  return authedApiRequest<AdminSettings>("/admin/settings", {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}
