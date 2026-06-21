import { assertAdmin } from "./adminGuard";
import { deleteContent, readContent, upsertContent } from "./contentStorage";
import { isSupabaseEnabled, supabase } from "../lib/supabase";
import { AuthUser, Tournament, TournamentItem, TournamentPayload } from "../types/api";

const KEY = "tournaments";
const now = new Date().toISOString();

type TournamentRow = {
  id: string;
  title: string;
  description?: string | null;
  image_url?: string | null;
  status: string;
  start_date?: string | null;
  end_date?: string | null;
  prize?: string | null;
  priority: number;
  is_active: boolean;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
};

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

function rowToTournamentItem(row: TournamentRow): TournamentItem {
  return {
    id: row.id,
    title: row.title,
    description: row.description || undefined,
    imageUrl: row.image_url || undefined,
    status: row.status,
    startDate: row.start_date || undefined,
    endDate: row.end_date || undefined,
    prize: row.prize || undefined,
    priority: row.priority,
    isActive: row.is_active,
    isFeatured: row.is_featured,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function tournamentItemToRow(payload: Partial<TournamentItem>) {
  return {
    title: payload.title,
    description: payload.description || null,
    image_url: payload.imageUrl || null,
    status: payload.status || "em_breve",
    start_date: payload.startDate || null,
    end_date: payload.endDate || null,
    prize: payload.prize || null,
    priority: payload.priority ?? 0,
    is_active: payload.isActive !== false,
    is_featured: payload.isFeatured === true,
  };
}

function tournamentItemToLegacy(item: TournamentItem): Tournament {
  return {
    tournament_id: item.id,
    id: item.id,
    code: item.title,
    creator_discord_id: "",
    ranking: item.description,
    description: item.description,
    status:
      item.status === "rejeitado"
        ? "rejeitado"
        : item.status === "pendente"
          ? "pendente"
          : "aprovado",
    created_at: item.createdAt,
    image_url: item.imageUrl,
    is_featured: item.isFeatured,
  };
}

export async function getTournamentItems(): Promise<TournamentItem[]> {
  if (!isSupabaseEnabled || !supabase) {
    return readContent<TournamentItem>(KEY, defaultTournamentItems);
  }

  const { data, error } = await supabase
    .from("tournament_items")
    .select("*")
    .order("priority", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Falha ao carregar os torneios: ${error.message}`);
  return (data as TournamentRow[]).map(rowToTournamentItem);
}

export async function getFeaturedTournamentItems(): Promise<TournamentItem[]> {
  const items = await getTournamentItems();
  return items.filter((item) => item.isActive && item.isFeatured);
}

export async function saveTournamentItem(
  payload: Partial<TournamentItem> & { id?: string }
): Promise<TournamentItem> {
  if (!payload.title?.trim()) throw new Error("O titulo do torneio e obrigatorio.");

  if (!isSupabaseEnabled || !supabase) {
    return upsertContent(KEY, defaultTournamentItems, payload);
  }

  const row = tournamentItemToRow({ ...payload, title: payload.title.trim() });
  const query = payload.id
    ? supabase.from("tournament_items").update(row).eq("id", payload.id)
    : supabase.from("tournament_items").insert(row);
  const { data, error } = await query.select("*").single();

  if (error) throw new Error(`Falha ao salvar o torneio: ${error.message}`);
  return rowToTournamentItem(data as TournamentRow);
}

export async function deleteTournamentItem(id: string): Promise<void> {
  if (!isSupabaseEnabled || !supabase) {
    deleteContent(KEY, defaultTournamentItems, id);
    return;
  }

  const { error } = await supabase.from("tournament_items").delete().eq("id", id);
  if (error) throw new Error(`Falha ao excluir o torneio: ${error.message}`);
}

export async function getAdminTournaments(): Promise<Tournament[]> {
  return (await getTournamentItems()).map(tournamentItemToLegacy);
}

export async function createTournament(
  payload: TournamentPayload,
  currentUser: AuthUser | null
): Promise<Tournament> {
  assertAdmin(currentUser);
  const item = await saveTournamentItem({
    title: String(payload.title || payload.code || "Torneio STG"),
    description: payload.description || payload.ranking,
    imageUrl: payload.imageUrl || payload.image_url,
    status: payload.status,
    isActive: payload.status !== "rejeitado",
    isFeatured: Boolean(payload.is_featured || payload.featured || payload.destaque),
    priority: Number(payload.priority || 0),
  });
  return tournamentItemToLegacy(item);
}

export async function updateTournament(
  tournamentId: string | number,
  payload: TournamentPayload,
  currentUser: AuthUser | null
): Promise<Tournament> {
  assertAdmin(currentUser);
  const current = (await getTournamentItems()).find((item) => item.id === String(tournamentId));
  const item = await saveTournamentItem({
    ...current,
    id: String(tournamentId),
    title: String(payload.title || payload.code || current?.title || "Torneio STG"),
    description: payload.description || payload.ranking || current?.description,
    imageUrl: payload.imageUrl || payload.image_url || current?.imageUrl,
    status: payload.status || current?.status,
    isActive: payload.status ? payload.status !== "rejeitado" : current?.isActive,
    isFeatured:
      payload.is_featured ?? payload.featured ?? payload.destaque ?? current?.isFeatured,
    priority: Number(payload.priority ?? current?.priority ?? 0),
  });
  return tournamentItemToLegacy(item);
}

export async function deleteTournament(
  tournamentId: string | number,
  currentUser: AuthUser | null
): Promise<void> {
  assertAdmin(currentUser);
  await deleteTournamentItem(String(tournamentId));
}

function unavailableRegistrationAction(): never {
  throw new Error("Inscricoes de torneios aguardam a tabela de participantes no Supabase.");
}

export async function registerForTournament(): Promise<never> {
  return unavailableRegistrationAction();
}

export async function submitTournamentPaymentProof(): Promise<never> {
  return unavailableRegistrationAction();
}

export async function getTournamentRegistrations(): Promise<never> {
  return unavailableRegistrationAction();
}

export async function approveTournamentRegistration(): Promise<never> {
  return unavailableRegistrationAction();
}

export async function rejectTournamentRegistration(): Promise<never> {
  return unavailableRegistrationAction();
}

export function tournamentToTournamentItem(tournament: Tournament): TournamentItem {
  const timestamp = tournament.created_at || new Date().toISOString();
  return {
    id: String(tournament.tournament_id || tournament.id || tournament.code),
    title: tournament.code || `Torneio ${tournament.tournament_id}`,
    description: tournament.description || tournament.ranking,
    imageUrl: tournament.imageUrl || tournament.image_url,
    status: tournament.status,
    startDate: tournament.created_at,
    isActive: tournament.status !== "rejeitado",
    isFeatured: Boolean(tournament.is_featured || tournament.featured || tournament.destaque),
    priority: 0,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}
