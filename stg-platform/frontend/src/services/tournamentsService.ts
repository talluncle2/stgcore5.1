import { authedApiRequest, getTournaments } from "./api";
import { assertAdmin } from "./adminGuard";
import { AuthUser, Tournament, TournamentPayload } from "../types/api";

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
