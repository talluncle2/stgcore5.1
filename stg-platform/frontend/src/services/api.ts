import type {
  AuthUser,
  PublicOverview,
  PublicStats,
  Punishment,
  RankingEntry,
} from "../types/api";

const rawApiBaseUrl = import.meta.env.VITE_API_BASE_URL;
const API_BASE_URL = rawApiBaseUrl
  ? String(rawApiBaseUrl).replace(/\/$/, "")
  : "/api";
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
  if (status === 404) return `Endpoint ainda nao disponivel na API oficial: ${path}`;
  if (status && status >= 500) return "API oficial indisponivel no momento.";
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
    throw new ApiError("API oficial nao esta configurada.", undefined, path);
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
    throw new ApiError("API oficial offline ou sem resposta.", undefined, path);
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
  return new ApiError(`Endpoint ainda nao disponivel na API oficial: ${path}`, 404, path);
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

function extractArray<T>(data: unknown, key: string): T[] {
  if (Array.isArray(data)) return data as T[];
  if (data && typeof data === "object" && Array.isArray((data as Record<string, unknown>)[key])) {
    return (data as Record<string, unknown>)[key] as T[];
  }
  return [];
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
