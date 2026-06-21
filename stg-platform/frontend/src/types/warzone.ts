export const WARZONE_MODES = [
  "battle_royale_solo",
  "battle_royale_duo",
  "battle_royale_trio",
  "battle_royale_squad",
  "resurgence_duo",
  "resurgence_trio",
  "resurgence_squad",
  "custom_lobby",
] as const;

export type WarzoneMode = (typeof WARZONE_MODES)[number];

export const WARZONE_STATUSES = [
  "em_breve",
  "inscricoes_abertas",
  "em_andamento",
  "encerrado",
  "cancelado",
] as const;

export type WarzoneOperationStatus = (typeof WARZONE_STATUSES)[number];

export interface WarzoneFinalStanding {
  position: number;
  clan: string;
  kills: number;
}

export interface WarzoneOperationResult {
  winnerClan: string;
  mvp: string;
  totalKills: number;
  matchesPlayed: number;
  finalStandings: WarzoneFinalStanding[];
  adminNotes?: string;
  closedAt: string;
}

export type WarzonePlatform =
  | "battle_net"
  | "playstation"
  | "xbox"
  | "steam"
  | "other";

export interface WarzoneSeason {
  id: string;
  name: string;
  slug: string;
  startsAt?: string;
  endsAt?: string;
  isActive: boolean;
}

export interface WarzoneClan {
  id: string;
  name: string;
  tag: string;
  logoUrl?: string;
  leaderDiscordId?: string;
  description?: string;
  participations: number;
  wins: number;
  titles: number;
  kills: number;
  rankingPoints: number;
  isActive: boolean;
}

export interface WarzoneOperator {
  id: string;
  profileId?: string;
  discordId?: string;
  nickname: string;
  activisionId?: string;
  platform?: WarzonePlatform;
  clanId?: string;
  clanTag?: string;
  kd: number;
  participations: number;
  wins: number;
  kills: number;
  mvpCount: number;
  rankingPoints: number;
  isActive: boolean;
}

export interface WarzoneOperatorEventStat {
  operatorId?: string;
  discordId?: string;
  placement?: number;
  kills: number;
  isMvp?: boolean;
}

export type WarzoneHallOfFameCategory =
  | "champion"
  | "mvp"
  | "record_holder"
  | "elite_operator"
  | "champion_clan";

export interface WarzoneHallOfFameEntry {
  id: string;
  category: WarzoneHallOfFameCategory;
  operationId?: string;
  operatorId?: string;
  clanId?: string;
  title: string;
  description?: string;
  metrics: Record<string, unknown>;
  isFeatured: boolean;
  awardedAt: string;
}

export interface WarzoneOperation {
  id: string;
  title: string;
  codename?: string;
  description: string;
  imageUrl?: string;
  mode: WarzoneMode;
  map?: string;
  status: WarzoneOperationStatus;
  allowedClans: string[];
  startDate?: string;
  endDate?: string;
  prize?: string;
  entryFee?: string;
  rules?: string;
  scoreRule?: string;
  registrationUrl?: string;
  maxTeams?: number;
  participants: number;
  isActive: boolean;
  isFeatured: boolean;
  priority: number;
  result?: WarzoneOperationResult;
  seasonId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface WarzoneParticipation {
  operationId: string;
  userId: string;
  clanTag: string;
  registeredAt: string;
}

export interface WarzoneMetrics {
  totalEvents: number;
  totalKills: number;
  totalMvps: number;
  clanWins: Array<{ clan: string; wins: number }>;
  ranking: Array<{ clan: string; points: number; wins: number; kills: number }>;
  history: WarzoneOperation[];
}

export interface WarzoneGeneralStats {
  eventsCompleted: number;
  operatorsRegistered: number;
  clansRegistered: number;
  killsRegistered: number;
  matchesRegistered: number;
  victoriesRegistered: number;
  mvpsRegistered: number;
}

export interface WarzoneOperatorRankingEntry
  extends Pick<
    WarzoneOperator,
    | "id"
    | "nickname"
    | "platform"
    | "clanTag"
    | "participations"
    | "wins"
    | "kills"
    | "mvpCount"
    | "kd"
    | "rankingPoints"
  > {
  position: number;
}

export interface WarzoneClanRankingEntry
  extends Pick<
    WarzoneClan,
    | "id"
    | "name"
    | "tag"
    | "logoUrl"
    | "participations"
    | "wins"
    | "titles"
    | "kills"
    | "rankingPoints"
  > {
  position: number;
}

export interface WarzonePeriodMetric {
  period: string;
  events: number;
  kills: number;
  matches: number;
}

export interface WarzoneSeasonMetric {
  seasonId: string;
  season: string;
  events: number;
  kills: number;
}
