export interface RankingEntry {
  position: number;
  discord_id: string | number;
  discord_username: string;
  username?: string;
  xp: number;
  level: number;
  coins?: number;
  wins?: number;
  losses?: number;
  kills?: number;
  deaths?: number;
  kd?: number;
}

export interface Tournament {
  tournament_id: string;
  id?: string | number;
  code?: string;
  creator_discord_id: string | number;
  creator_username?: string;
  discord_username?: string;
  ranking_data?: string;
  ranking?: string;
  status: "pendente" | "aprovado" | "rejeitado";
  created_at?: string;
  image_url?: string;
  imageUrl?: string;
  description?: string;
  is_featured?: boolean;
  featured?: boolean;
  destaque?: boolean;
}

export interface Product {
  product_id: string;
  id?: string | number;
  name: string;
  description?: string;
  emoji?: string;
  price: number;
  price_coins?: number;
  price_real?: number;
  sale_price_coins?: number;
  sale_price_brl?: number;
  discount_percent?: number;
  stock?: number;
  category?: string;
  featured?: boolean;
  is_featured?: boolean;
  is_active?: boolean;
  destaque?: boolean;
  image_url?: string;
  imageUrl?: string;
}

export interface Punishment {
  punishment_id: string;
  discord_id: string | number;
  discord_username?: string;
  username?: string;
  type: string;
  reason: string;
  status: "active" | "expired" | "revoked" | "ativo" | "expirado" | "removido";
  expires_at?: string | null;
  created_at?: string;
}

export interface User {
  discord_id: string | number;
  discord_username?: string;
  username?: string;
  xp: number;
  level: number;
  coins: number;
}

export interface AuthUser {
  id?: string | number;
  discord_id?: string | number;
  discord_username?: string;
  display_name?: string;
  global_name?: string;
  username?: string;
  email?: string | null;
  avatar_url?: string;
  discord_avatar_url?: string;
  image_url?: string;
  role?: string;
  roles?: Array<string | number>;
  role_ids?: Array<string | number>;
  discord_roles?: Array<string | number>;
  guild_roles?: Array<string | number>;
  clan_tag?: string;
  clanTag?: string;
  permissions?: Array<string | number>;
  sectors?: Array<string | number>;
  is_admin?: boolean;
  is_staff?: boolean;
  is_moderator?: boolean;
  is_content_creator?: boolean;
  can_access_dashboard?: boolean;
  public_name?: string;
  public_avatar_url?: string;
  public_banner_url?: string;
  bio?: string;
  public_email?: string;
  location_optional?: string;
  pronouns?: string;
  sexual_orientation?: string;
  sexual_orientation_visibility?: ProfileFieldVisibility;
  profile_visibility?: ProfileVisibility;
  coins?: number;
  xp?: number;
  level?: number;
}

export interface AuthResponse {
  access_token: string;
  token_type?: string;
  expires_in?: number;
  user: AuthUser;
}

export type FeaturedBannerType = "product" | "tournament" | "event" | "notice";

export interface FeaturedBanner {
  id: string;
  title: string;
  description?: string;
  imageUrl?: string;
  type: FeaturedBannerType;
  href?: string;
  ctaLabel?: string;
  badge?: string;
}

export interface PublicOverview {
  api: "online" | "offline";
  project: string;
  guild_id: string;
  guild_name: string;
  users_total: number;
  products_total: number;
  tournaments_total: number;
  punishments_total: number;
  ranking_top: RankingEntry[];
  last_sync: string;
}

export interface PublicStats {
  users_active_today: number;
  tournaments_created_today: number;
  transactions_today: number;
  xp_distributed_today: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface DiscordMetrics {
  bot_online?: boolean;
  bot_latency_ms?: number;
  uptime_seconds?: number;
  commands_executed?: number;
  member_count?: number;
  online_count?: number;
  offline_count?: number;
  bots_count?: number;
  roles_count?: number;
  channels_count?: number;
  text_channels_count?: number;
  voice_channels_count?: number;
  bans_count?: number;
  active_events?: number;
  active_tournaments?: number;
  tickets_count?: number;
  reports_count?: number;
  logs_count?: number;
  last_sync?: string;
  guild?: {
    id?: string | number;
    name?: string;
    icon_url?: string;
    description?: string;
  };
}

export interface AdminMember {
  id?: string | number;
  discord_id: string | number;
  discord_username?: string;
  username?: string;
  display_name?: string;
  role?: string;
  roles?: Array<string | number>;
  status?: string;
  permissions?: Array<string | number>;
  notes?: string;
  xp?: number;
  level?: number;
  coins?: number;
  is_bot?: boolean;
}

export type AdminMemberPayload = Partial<AdminMember>;
export type ProductPayload = Partial<Product>;
export type TournamentPayload = Partial<Tournament> & Record<string, unknown>;

export type NewsCategory = "anuncio" | "temporada" | "torneio" | "sistema" | "jogo";

export interface NewsItem {
  id: string;
  title: string;
  subtitle?: string;
  description: string;
  category: NewsCategory;
  imageUrl?: string;
  badge?: string;
  actionLabel?: string;
  actionUrl?: string;
  isActive: boolean;
  isFeatured: boolean;
  priority: number;
  publishedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface StoreItem {
  id: string;
  name: string;
  description?: string;
  category?: string;
  imageUrl?: string;
  priceCoins?: number;
  salePriceCoins?: number;
  priceBrl?: number;
  salePriceBrl?: number;
  discountPercent?: number;
  isActive: boolean;
  isFeatured: boolean;
  stock?: number;
  createdAt: string;
  updatedAt: string;
}

export interface TournamentItem {
  id: string;
  title: string;
  description?: string;
  imageUrl?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  prize?: string;
  isActive: boolean;
  isFeatured: boolean;
  priority: number;
  createdAt: string;
  updatedAt: string;
}

export interface FeaturedHeroItem {
  id: string;
  sourceType: "news" | "store" | "tournament";
  title: string;
  subtitle?: string;
  description?: string;
  imageUrl?: string;
  badge?: string;
  actionLabel: string;
  actionUrl: string;
  priority: number;
  createdAt: string;
}

export interface HomeContentItem {
  id: string;
  titleLine1: string;
  titleLine2: string;
  description: string;
  backgroundImageUrl?: string;
  primaryLabel: string;
  primaryUrl: string;
  secondaryLabel: string;
  seasonTitle?: string;
  missionTitle?: string;
  missionProgress?: string;
  isActive: boolean;
  priority: number;
  createdAt: string;
  updatedAt: string;
}

export interface RankingItem {
  id: string;
  playerName: string;
  nick?: string;
  avatarUrl?: string;
  position: number;
  points: number;
  wins?: number;
  losses?: number;
  kills?: number;
  deaths?: number;
  kd?: number;
  level: number;
  badge?: string;
  isActive: boolean;
  isFeatured?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ModerationConfig {
  automod_enabled?: boolean;
  word_filters?: string[];
  punishments?: Record<string, unknown>;
  logs_channel_id?: string;
  moderation_channel_id?: string;
  protected_role_ids?: string[];
  warn_enabled?: boolean;
  mute_enabled?: boolean;
  kick_enabled?: boolean;
  ban_enabled?: boolean;
  timeout_enabled?: boolean;
}

export interface AdminSettings {
  admin_role_ids?: string[];
  moderator_role_ids?: string[];
  dashboard_role_ids?: string[];
  admin_channel_ids?: string[];
  logs_channel_id?: string;
  enabled_commands?: string[];
  disabled_commands?: string[];
  options?: Record<string, unknown>;
}

export type CreatorPlatform = "youtube" | "twitch" | "kick" | "tiktok";
export type CreatorContentType = "video" | "live" | "short" | "clip";
export type ProfileVisibility = "public" | "members" | "private";
export type ProfileFieldVisibility = "public" | "private";

export interface CreatorChannel {
  id: string;
  creator_id: string;
  platform: CreatorPlatform;
  channel_id?: string;
  channel_url?: string;
  channel_name?: string;
  handle?: string;
  description?: string;
  thumbnail_url?: string;
  subscriber_count?: number;
  video_count?: number;
  view_count?: number;
  metadata_json?: Record<string, unknown>;
  is_active: boolean;
  status?: string;
  last_checked_at?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CreatorContent {
  id: string;
  creator_id: string;
  channel_id: string;
  platform: CreatorPlatform;
  external_id: string;
  content_type: CreatorContentType;
  title?: string;
  description?: string;
  thumbnail_url?: string;
  content_url?: string;
  embed_url?: string;
  published_at?: string;
  started_at?: string;
  ended_at?: string;
  is_live: boolean;
  is_active: boolean;
  creator?: Pick<ContentCreator, "id" | "display_name" | "username" | "avatar_url" | "public_name" | "public_avatar_url">;
}

export interface ContentCreator {
  id: string;
  discord_id: string;
  guild_id?: string;
  profile?: PublicProfile;
  display_name?: string;
  username?: string;
  avatar_url?: string;
  banner_url?: string;
  public_name?: string;
  public_avatar_url?: string;
  public_banner_url?: string;
  bio?: string;
  public_email?: string;
  location_optional?: string;
  pronouns?: string;
  sexual_orientation?: string;
  sexual_orientation_visibility?: ProfileFieldVisibility;
  profile_visibility?: ProfileVisibility;
  is_verified?: boolean;
  is_active: boolean;
  is_featured: boolean;
  is_live?: boolean;
  sort_order: number;
  last_checked_at?: string;
  last_check_status?: string;
  created_at?: string;
  updated_at?: string;
  channels: CreatorChannel[];
  latest_content?: CreatorContent[];
  latest_contents?: CreatorContent[];
}

export type ContentCreatorPayload = Partial<Omit<ContentCreator, "id" | "channels" | "latest_content" | "created_at" | "updated_at">>;
export type CreatorChannelPayload = Partial<Omit<CreatorChannel, "id" | "creator_id" | "created_at" | "updated_at" | "last_checked_at">>;

export interface MyCreatorResponse {
  is_creator: boolean;
  creator?: ContentCreator | null;
  channels?: CreatorChannel[];
  profile?: PublicProfile | null;
}

export interface MyCreatorSyncResponse {
  success?: boolean;
  summary?: Record<string, unknown>;
  creator?: ContentCreator | null;
  channels?: CreatorChannel[];
}

export interface PublicProfile {
  id?: string | number;
  discord_id?: string | number;
  username?: string;
  public_name?: string;
  avatar_url?: string;
  public_avatar_url?: string;
  public_banner_url?: string;
  bio?: string;
  public_email?: string;
  location_optional?: string;
  pronouns?: string;
  sexual_orientation?: string;
  sexual_orientation_visibility?: ProfileFieldVisibility;
  profile_visibility?: ProfileVisibility;
}

export type PublicProfilePayload = Pick<
  PublicProfile,
  | "public_name"
  | "public_avatar_url"
  | "public_banner_url"
  | "bio"
  | "public_email"
  | "location_optional"
  | "pronouns"
  | "sexual_orientation"
  | "sexual_orientation_visibility"
  | "profile_visibility"
>;
