import type {
  AuthUser,
  FeaturedBanner,
  Product,
  PublicOverview,
  PublicStats,
  Punishment,
  RankingEntry,
  Tournament,
} from "../types/api";

const rawApiBaseUrl = import.meta.env.VITE_API_BASE_URL;
const API_BASE_URL = rawApiBaseUrl
  ? String(rawApiBaseUrl).replace(/\/$/, "")
  : "";
const AUTH_TOKEN_KEY = "stg_auth_token";
const LEGACY_AUTH_TOKEN_KEYS = ["stg_token", "token", "authToken"];

export type DataSourceStatus = "api" | "demo" | "offline" | "permission_error";

export interface SourcedData<T> {
  data: T;
  source: DataSourceStatus;
  message?: string;
}

function buildUrl(path: string): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
}

export function buildApiUrl(path: string): string {
  return buildUrl(path);
}

export function getAuthToken(): string | null {
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

export function setAuthToken(token: string): void {
  localStorage.setItem(AUTH_TOKEN_KEY, token);
}

export function clearAuthToken(): void {
  localStorage.removeItem(AUTH_TOKEN_KEY);
  LEGACY_AUTH_TOKEN_KEYS.forEach((key) => localStorage.removeItem(key));
}

export class ApiError extends Error {
  status?: number;
  endpoint?: string;

  constructor(message: string, status?: number, endpoint?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.endpoint = endpoint;
  }
}

function normalizeApiResponse<T>(payload: unknown): T {
  if (payload && typeof payload === "object") {
    const record = payload as Record<string, unknown>;
    if ("success" in record && record.success === false) {
      const message = record.message ?? record.error ?? "A API retornou erro ao processar a solicitacao.";
      throw new ApiError(String(message));
    }
    if ("data" in record) return record.data as T;
  }
  return payload as T;
}

function endpointUnavailableMessage(path: string, status?: number): string {
  if (status === 401) return "Sessao expirada ou token invalido. Faca login novamente.";
  if (status === 403) return "Sem permissao para executar esta acao.";
  if (status === 404) return `Endpoint ainda nao disponivel na API do Replit: ${path}`;
  if (status && status >= 500) return "API do Replit indisponivel no momento.";
  return "Nao foi possivel sincronizar com a API.";
}

async function readErrorMessage(response: Response, path: string): Promise<string> {
  const errorText = await response.text().catch(() => "");
  if (errorText) {
    try {
      const parsed = JSON.parse(errorText) as { detail?: unknown; message?: unknown; error?: unknown };
      const parsedMessage = parsed.detail ?? parsed.message ?? parsed.error;
      if (typeof parsedMessage === "string") return parsedMessage;
    } catch {
      return errorText;
    }
  }
  return endpointUnavailableMessage(path, response.status);
}

async function fetchJson<T>(path: string, init?: RequestInit, fallback?: T): Promise<T> {
  if (!API_BASE_URL) {
    return fallback as T;
  }

  try {
    const response = await fetch(buildUrl(path), {
      ...init,
      headers: {
        ...(init?.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
        ...(init?.headers ?? {}),
      },
    });

    if (!response.ok) {
      return fallback as T;
    }

    return normalizeApiResponse<T>(await response.json());
  } catch (error) {
    console.error(`API request failed: ${path}`, error);
    return fallback as T;
  }
}

export async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  if (!API_BASE_URL) {
    throw new ApiError("VITE_API_BASE_URL nao esta configurado. Configure a URL da API oficial no Vercel.", undefined, path);
  }

  try {
    const response = await fetch(buildUrl(path), {
      ...init,
      headers: {
        ...(init?.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
        ...(init?.headers ?? {}),
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        clearAuthToken();
      }
      throw new ApiError(await readErrorMessage(response, path), response.status, path);
    }

    if (response.status === 204) {
      return undefined as T;
    }

    return normalizeApiResponse<T>(await response.json());
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError("API do Replit offline ou sem resposta.", undefined, path);
  }
}

export async function authedApiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getAuthToken();
  if (!token) {
    throw new ApiError("Voce precisa estar autenticado para executar esta acao.", 401, path);
  }

  return apiRequest<T>(path, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(init?.headers ?? {}),
    },
  });
}

export function adminEndpointUnavailable(path: string): ApiError {
  return new ApiError(`Endpoint ainda nao disponivel na API do Replit: ${path}`, 404, path);
}

export function classifyApiError(error: unknown): DataSourceStatus {
  if (error instanceof ApiError) {
    if (error.status === 401 || error.status === 403) return "permission_error";
    return "offline";
  }
  return "offline";
}

async function fetchAuthedJson<T>(path: string, fallback: T): Promise<T> {
  if (!API_BASE_URL) return fallback;

  const token = getAuthToken();
  if (!token) return fallback;

  try {
    const response = await fetch(buildUrl(path), {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.status === 401 || response.status === 403) {
      clearAuthToken();
      return fallback;
    }

    if (!response.ok) {
      return fallback;
    }

    return normalizeApiResponse<T>(await response.json());
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error(`Authenticated API request failed: ${path}`, error);
    }
    return fallback;
  }
}

function normalizeProduct(product: Record<string, unknown>): Product {
  const id = product.product_id ?? product.id ?? product.code ?? "";
  return {
    ...product,
    id: product.id as string | number | undefined,
    product_id: String(id),
    name: String(product.name ?? "Produto STG"),
    description: product.description as string | undefined,
    emoji: (product.emoji as string | undefined) || "STG",
    price: Number(product.price ?? product.price_coins ?? 0),
    price_coins: Number(product.price_coins ?? product.price ?? 0),
    price_real: Number(product.price_real ?? 0),
    stock: Number(product.stock ?? 0),
    category: String(product.category ?? "geral"),
    featured: Boolean(product.featured ?? product.is_featured ?? product.destaque ?? false),
    is_featured: Boolean(product.is_featured ?? product.featured ?? product.destaque ?? false),
    destaque: Boolean(product.destaque ?? product.featured ?? product.is_featured ?? false),
    image_url: product.image_url as string | undefined,
    imageUrl: (product.imageUrl as string | undefined) || (product.image_url as string | undefined),
  };
}

function normalizeTournament(tournament: Record<string, unknown>): Tournament {
  const id = tournament.tournament_id ?? tournament.id ?? tournament.code ?? "";
  return {
    ...tournament,
    id: tournament.id as string | number | undefined,
    tournament_id: String(id),
    code: tournament.code as string | undefined,
    creator_discord_id: (tournament.creator_discord_id ?? tournament.discord_id ?? "") as string | number,
    creator_username: (tournament.creator_username ??
      tournament.discord_username ??
      "Unknown") as string,
    discord_username: tournament.discord_username as string | undefined,
    ranking_data: (tournament.ranking_data ?? tournament.ranking) as string | undefined,
    ranking: tournament.ranking as string | undefined,
    status: (tournament.status as Tournament["status"]) || "pendente",
    created_at: tournament.created_at as string | undefined,
    description: tournament.description as string | undefined,
    image_url: tournament.image_url as string | undefined,
    imageUrl: (tournament.imageUrl as string | undefined) || (tournament.image_url as string | undefined),
    featured: Boolean(tournament.featured ?? tournament.is_featured ?? tournament.destaque ?? false),
    is_featured: Boolean(tournament.is_featured ?? tournament.featured ?? tournament.destaque ?? false),
    destaque: Boolean(tournament.destaque ?? tournament.featured ?? tournament.is_featured ?? false),
  };
}

function extractArray<T>(data: unknown, key: string): T[] {
  if (Array.isArray(data)) return data as T[];
  if (data && typeof data === "object" && Array.isArray((data as Record<string, unknown>)[key])) {
    return (data as Record<string, unknown>)[key] as T[];
  }
  return [];
}

function productToBanner(product: Product): FeaturedBanner {
  return {
    id: `product-${product.product_id}`,
    title: product.name,
    description: product.description || `${product.price} coins`,
    imageUrl: product.imageUrl || product.image_url,
    type: "product",
    href: "/loja",
    ctaLabel: "Ver item",
    badge: "Loja",
  };
}

function tournamentToBanner(tournament: Tournament): FeaturedBanner {
  return {
    id: `tournament-${tournament.tournament_id}`,
    title: tournament.code ? `Torneio #${tournament.code}` : `Torneio #${tournament.tournament_id}`,
    description: tournament.description || tournament.ranking || "Competicao STG em destaque",
    imageUrl: tournament.imageUrl || tournament.image_url,
    type: "tournament",
    href: "/torneios",
    ctaLabel: "Ver torneio",
    badge: "Torneio",
  };
}

export async function getHealth(): Promise<{ status: "online" | "offline" }> {
  const data = await fetchJson<{ status?: string }>("/health", undefined, { status: "offline" });
  return { status: data?.status === "online" ? "online" : "offline" };
}

export async function getOverview(): Promise<PublicOverview> {
  const defaultOverview: PublicOverview = {
    api: "offline",
    project: "STG | Supremo Tribunal Gamer",
    guild_id: "",
    guild_name: "",
    users_total: 0,
    products_total: 0,
    tournaments_total: 0,
    punishments_total: 0,
    ranking_top: [],
    last_sync: new Date().toISOString(),
  };

  const data = await fetchJson<Partial<PublicOverview>>("/public/overview", undefined, defaultOverview);
  return { ...defaultOverview, ...data, api: data?.api === "online" ? "online" : defaultOverview.api };
}

export async function getStats(): Promise<PublicStats> {
  const defaultStats: PublicStats = {
    users_active_today: 0,
    tournaments_created_today: 0,
    transactions_today: 0,
    xp_distributed_today: 0,
  };

  const data = await fetchJson<Partial<PublicStats> & Record<string, number | undefined>>(
    "/public/stats",
    undefined,
    defaultStats as Partial<PublicStats> & Record<string, number | undefined>
  );
  return {
    users_active_today: data?.users_active_today ?? data?.active_users ?? 0,
    tournaments_created_today: data?.tournaments_created_today ?? 0,
    transactions_today: data?.transactions_today ?? 0,
    xp_distributed_today: data?.xp_distributed_today ?? data?.total_xp_distributed ?? 0,
  };
}

export async function getRanking(limit: number = 20): Promise<RankingEntry[]> {
  const data = await fetchJson<unknown>(`/public/ranking?limit=${limit}`, undefined, []);
  return extractArray<RankingEntry>(data, "ranking").map((entry, index) => ({
    ...entry,
    position: entry.position || index + 1,
    username: entry.discord_username || entry.username || "Unknown",
  }));
}

export async function getTournaments(status?: string, limit: number = 20): Promise<Tournament[]> {
  const params = new URLSearchParams();
  if (status) params.append("status", status);
  params.append("limit", limit.toString());

  const data = await fetchJson<unknown>(`/public/tournaments?${params.toString()}`, undefined, []);
  return extractArray<Record<string, unknown>>(data, "tournaments").map(normalizeTournament);
}

export async function getProducts(category?: string, limit: number = 50): Promise<Product[]> {
  const params = new URLSearchParams();
  if (category) params.append("category", category);
  params.append("limit", limit.toString());

  const data = await fetchJson<unknown>(`/public/products?${params.toString()}`, undefined, []);
  return extractArray<Record<string, unknown>>(data, "products").map(normalizeProduct);
}

export async function getFeaturedProducts(): Promise<Product[]> {
  const data = await fetchJson<unknown>("/public/products?featured_only=true&limit=20", undefined, []);
  return extractArray<Record<string, unknown>>(data, "products")
    .map(normalizeProduct)
    .filter((product) => product.is_featured || product.featured || product.destaque);
}

export async function getFeaturedTournaments(): Promise<Tournament[]> {
  const tournaments = await getTournaments(undefined, 50);
  return tournaments.filter((tournament) => tournament.is_featured || tournament.featured || tournament.destaque);
}

export async function getHighlights(): Promise<FeaturedBanner[]> {
  const [products, tournaments] = await Promise.all([
    getFeaturedProducts(),
    getFeaturedTournaments(),
  ]);

  return [...products.map(productToBanner), ...tournaments.map(tournamentToBanner)];
}

export async function getPunishments(limit: number = 20): Promise<Punishment[]> {
  const data = await fetchJson<unknown>(`/public/punishments?limit=${limit}`, undefined, []);
  return extractArray<Punishment>(data, "punishments").map((punishment) => ({
    ...punishment,
    username: punishment.discord_username || punishment.username || "Unknown",
    created_at: punishment.created_at || new Date().toISOString(),
  }));
}

export async function getMe(): Promise<AuthUser | null> {
  const data = await fetchAuthedJson<AuthUser | { user?: AuthUser } | null>("/auth/me", null);
  if (data && typeof data === "object" && "user" in data) {
    return data.user ?? null;
  }
  return data as AuthUser | null;
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  return getMe();
}

export { API_BASE_URL, AUTH_TOKEN_KEY };
