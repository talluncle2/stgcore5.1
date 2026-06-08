import { authedApiRequest, getTournaments } from "./api";
import { readContent } from "./contentStorage";
import { assertAdmin } from "./adminGuard";
import { AuthUser, Tournament, TournamentItem, TournamentPayload } from "../types/api";

const KEY = "tournaments";
const now = new Date().toISOString();

export const defaultTournamentItems: TournamentItem[] = [
  {
    id: "elite-league",
    title: "STG Elite League",
    description: "Circuito competitivo da comunidade com ranking especial e chamadas de temporada.",
    imageUrl: "/assets/stg-elite-league.png",
    status: "em_breve",
    startDate: now,
    prize: "Premiacao a definir",
    isActive: true,
    isFeatured: true,
    priority: 9,
    createdAt: now,
    updatedAt: now,
  },
];

function extractTournaments(data: unknown): Tournament[] {
  if (Array.isArray(data)) return data as Tournament[];
  if (data && typeof data === "object" && Array.isArray((data as Record<string, unknown>).tournaments)) {
    return (data as Record<string, unknown>).tournaments as Tournament[];
  }
  return [];
}

export async function getAdminTournaments(): Promise<Tournament[]> {
  try {
    const data = await authedApiRequest<unknown>("/admin/tournaments");
    const tournaments = extractTournaments(data);
    return tournaments.length > 0 ? tournaments : getTournaments(undefined, 100);
  } catch {
    return getTournaments(undefined, 100);
  }
}

export async function createTournament(payload: TournamentPayload, currentUser: AuthUser | null): Promise<Tournament> {
  assertAdmin(currentUser);
  return authedApiRequest<Tournament>("/admin/tournaments", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateTournament(
  tournamentId: string | number,
  payload: TournamentPayload,
  currentUser: AuthUser | null
): Promise<Tournament> {
  assertAdmin(currentUser);
  return authedApiRequest<Tournament>(`/admin/tournaments/${tournamentId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function deleteTournament(tournamentId: string | number, currentUser: AuthUser | null): Promise<void> {
  assertAdmin(currentUser);
  await authedApiRequest<void>(`/admin/tournaments/${tournamentId}`, {
    method: "DELETE",
  });
}

export function registerForTournament(tournamentId: string | number, payload?: Record<string, unknown>) {
  return authedApiRequest(`/tournaments/${tournamentId}/register`, {
    method: "POST",
    body: JSON.stringify(payload ?? {}),
  });
}

export function submitTournamentPaymentProof(tournamentId: string | number, payload: Record<string, unknown>) {
  return authedApiRequest(`/tournaments/${tournamentId}/payment-proof`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function getTournamentRegistrations(tournamentId: string | number) {
  return authedApiRequest(`/admin/tournaments/${tournamentId}/registrations`);
}

export function approveTournamentRegistration(registrationId: string | number) {
  return authedApiRequest(`/admin/tournament-registrations/${registrationId}/approve`, { method: "PUT" });
}

export function rejectTournamentRegistration(registrationId: string | number) {
  return authedApiRequest(`/admin/tournament-registrations/${registrationId}/reject`, { method: "PUT" });
}

export function tournamentToTournamentItem(tournament: Tournament): TournamentItem {
  const id = String(tournament.tournament_id || tournament.id || tournament.code);
  return {
    id,
    title: tournament.code ? `Torneio ${tournament.code}` : `Torneio ${id}`,
    description: tournament.description || tournament.ranking,
    imageUrl: tournament.imageUrl || tournament.image_url,
    status: tournament.status,
    startDate: tournament.created_at,
    isActive: tournament.status !== "rejeitado",
    isFeatured: Boolean(tournament.is_featured || tournament.featured || tournament.destaque),
    priority: 0,
    createdAt: tournament.created_at || new Date().toISOString(),
    updatedAt: tournament.created_at || new Date().toISOString(),
  };
}

export async function getTournamentItems(): Promise<TournamentItem[]> {
  try {
    const tournaments = await getTournaments(undefined, 100);
    if (tournaments.length > 0) return tournaments.map(tournamentToTournamentItem);
  } catch {
    // TODO: integrate with Replit API when tournament management endpoints are available.
  }
  return readContent<TournamentItem>(KEY, defaultTournamentItems);
}

export async function getFeaturedTournamentItems(): Promise<TournamentItem[]> {
  const items = await getTournamentItems();
  return items.filter((item) => item.isActive && item.isFeatured);
}

export async function saveTournamentItem(payload: Partial<TournamentItem> & { id?: string }): Promise<TournamentItem> {
  const path = payload.id ? `/admin/tournaments/${payload.id}` : "/admin/tournaments";
  return authedApiRequest<TournamentItem>(path, {
    method: payload.id ? "PUT" : "POST",
    body: JSON.stringify(payload),
  });
}

export async function deleteTournamentItem(id: string): Promise<void> {
  await authedApiRequest<void>(`/admin/tournaments/${id}`, { method: "DELETE" });
}
