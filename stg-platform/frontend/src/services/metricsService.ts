import { apiRequest } from "./api";
import { DiscordMetrics } from "../types/api";

function emptyMetrics(): DiscordMetrics {
  return {
    bot_online: false,
    bot_latency_ms: 0,
    uptime_seconds: 0,
    commands_executed: 0,
    member_count: 0,
    online_count: 0,
    offline_count: 0,
    bots_count: 0,
    roles_count: 0,
    channels_count: 0,
    text_channels_count: 0,
    voice_channels_count: 0,
    bans_count: 0,
    active_events: 0,
    active_tournaments: 0,
    tickets_count: 0,
    reports_count: 0,
    logs_count: 0,
    last_sync: "",
  };
}

export async function getDiscordMetrics(): Promise<DiscordMetrics> {
  try {
    const data = await apiRequest<DiscordMetrics>("/public/discord/status");
    return { ...emptyMetrics(), ...data };
  } catch {
    return emptyMetrics();
  }
}
