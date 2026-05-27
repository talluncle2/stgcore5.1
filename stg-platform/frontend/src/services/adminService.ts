import { authedApiRequest, ApiError } from "./api";
import { assertAdmin } from "./adminGuard";
import { AdminSettings, AuthUser, DiscordMetrics } from "../types/api";

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
export async function getDiscordMetrics(): Promise<{ metrics: any[] } | null> {
  try {
    return await authedApiRequest<{ metrics: any[] }>("/admin/discord/metrics");
  } catch (error) {
    console.error("Failed to fetch Discord metrics:", error);
    return null;
  }
}

/**
 * Get Guild Information
 */
export async function getDiscordGuild(): Promise<any | null> {
  try {
    return await authedApiRequest<any>("/admin/discord/guild");
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
): Promise<any[] | null> {
  try {
    const params = new URLSearchParams();
    if (options?.is_admin !== undefined) params.append("is_admin", String(options.is_admin));
    if (options?.is_moderator !== undefined) params.append("is_moderator", String(options.is_moderator));
    if (options?.is_bot !== undefined) params.append("is_bot", String(options.is_bot));
    if (options?.limit) params.append("limit", String(options.limit));
    if (options?.offset) params.append("offset", String(options.offset));

    const query = params.toString() ? `?${params.toString()}` : "";
    return await authedApiRequest<any[]>(`/admin/discord/members${query}`);
  } catch (error) {
    console.error("Failed to fetch members:", error);
    return null;
  }
}

/**
 * Get Specific Discord Member
 */
export async function getDiscordMember(discord_id: number): Promise<any | null> {
  try {
    return await authedApiRequest<any>(`/admin/discord/members/${discord_id}`);
  } catch (error) {
    console.error(`Failed to fetch member ${discord_id}:`, error);
    return null;
  }
}

/**
 * Get Discord Roles
 */
export async function getDiscordRoles(options?: { limit?: number; offset?: number }): Promise<any[] | null> {
  try {
    const params = new URLSearchParams();
    if (options?.limit) params.append("limit", String(options.limit));
    if (options?.offset) params.append("offset", String(options.offset));

    const query = params.toString() ? `?${params.toString()}` : "";
    return await authedApiRequest<any[]>(`/admin/discord/roles${query}`);
  } catch (error) {
    console.error("Failed to fetch roles:", error);
    return null;
  }
}

/**
 * Get Specific Discord Role
 */
export async function getDiscordRole(role_id: number): Promise<any | null> {
  try {
    return await authedApiRequest<any>(`/admin/discord/roles/${role_id}`);
  } catch (error) {
    console.error(`Failed to fetch role ${role_id}:`, error);
    return null;
  }
}

/**
 * Get Discord Channels
 */
export async function getDiscordChannels(options?: { limit?: number; offset?: number }): Promise<any[] | null> {
  try {
    const params = new URLSearchParams();
    if (options?.limit) params.append("limit", String(options.limit));
    if (options?.offset) params.append("offset", String(options.offset));

    const query = params.toString() ? `?${params.toString()}` : "";
    return await authedApiRequest<any[]>(`/admin/discord/channels${query}`);
  } catch (error) {
    console.error("Failed to fetch channels:", error);
    return null;
  }
}

/**
 * Get Specific Discord Channel
 */
export async function getDiscordChannel(channel_id: number): Promise<any | null> {
  try {
    return await authedApiRequest<any>(`/admin/discord/channels/${channel_id}`);
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
}): Promise<{ events: any[] } | null> {
  try {
    const params = new URLSearchParams();
    if (options?.event_type) params.append("event_type", options.event_type);
    if (options?.limit) params.append("limit", String(options.limit));
    if (options?.offset) params.append("offset", String(options.offset));

    const query = params.toString() ? `?${params.toString()}` : "";
    return await authedApiRequest<{ events: any[] }>(`/admin/discord/events${query}`);
  } catch (error) {
    console.error("Failed to fetch events:", error);
    return null;
  }
}

/**
 * Get Discord Statistics
 */
export async function getDiscordStats(): Promise<{ guild_found: boolean; stats: any } | null> {
  try {
    return await authedApiRequest<{ guild_found: boolean; stats: any }>("/admin/discord/stats");
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
