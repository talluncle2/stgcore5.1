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
