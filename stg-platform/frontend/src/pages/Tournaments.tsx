import { useEffect, useMemo, useState } from "react";
import { Calendar, Filter, Trophy } from "lucide-react";
import { Layout } from "../components/layout/Layout";
import { getTournamentItems } from "../services/tournamentsService";
import { API_BASE_URL } from "../services/api";
import { TournamentItem } from "../types/api";

function formatDate(value?: string) {
  if (!value) return "A definir";
  return new Date(value).toLocaleDateString("pt-BR");
}

function statusClass(value?: string) {
  const normalized = String(value || "").toLowerCase();
  if (["ativo", "aprovado", "inscricoes_abertas", "em_andamento"].includes(normalized)) {
    return "stg-badge-success";
  }
  if (["encerrado", "rejeitado", "cancelado"].includes(normalized)) {
    return "stg-badge-danger";
  }
  if (["em_breve", "pendente"].includes(normalized)) {
    return "stg-badge-warning";
  }
  return "stg-badge-info";
}

function registrationLabel(value?: string) {
  const normalized = String(value || "").toLowerCase();
  if (["ativo", "aprovado", "inscricoes_abertas", "em_andamento"].includes(normalized)) {
    return "Inscricao aguardando endpoint /tournaments/:id/register";
  }
  if (["em_breve", "pendente"].includes(normalized)) return "Inscricoes em breve";
  if (["encerrado", "rejeitado", "cancelado"].includes(normalized)) return "Inscricoes encerradas";
  return "Aguardando backend de inscricoes";
}

export function Tournaments() {
  const [tournaments, setTournaments] = useState<TournamentItem[]>([]);
  const [status, setStatus] = useState("todos");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadTournaments() {
      setLoading(true);
      setTournaments(await getTournamentItems());
      setLoading(false);
    }

    void loadTournaments();
  }, []);

  const statusOptions = useMemo(
    () => ["todos", ...Array.from(new Set(tournaments.map((item) => item.status || "sem_status")))],
    [tournaments]
  );

  const filteredTournaments = tournaments
    .filter((item) => item.isActive)
    .filter((item) => status === "todos" || (item.status || "sem_status") === status)
    .sort((a, b) => b.priority - a.priority || b.createdAt.localeCompare(a.createdAt));

  return (
    <Layout>
      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="tactical-label mb-2">Operacoes competitivas</p>
            <h1 className="mb-2 text-4xl font-black uppercase tracking-[0.08em] text-[#f8fafc]">
              Campeonatos
            </h1>
            <p className="text-[#94a3b8]">Acompanhe temporadas, torneios e chamadas competitivas da STG.</p>
          </div>
        </div>

        {!API_BASE_URL && (
          <div className="border border-[#f97316]/30 bg-[#f97316]/10 p-3 text-sm font-bold text-[#fed7aa]">
            Modo demonstracao: configure VITE_API_BASE_URL para carregar campeonatos oficiais da API Replit.
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          {statusOptions.map((value) => (
            <button
              key={value}
              onClick={() => setStatus(value)}
              className={`tactical-edge flex items-center gap-2 rounded-lg px-4 py-2 font-black uppercase tracking-[0.06em] transition-all ${
                status === value
                  ? "stg-button-primary"
                  : "border border-[#a855f7]/25 bg-[#111827]/85 text-[#94a3b8] hover:border-[#84cc16]/45 hover:text-[#84cc16]"
              }`}
            >
              {value === "todos" && <Filter size={16} />}
              {value === "todos" ? `Todos (${tournaments.length})` : value.replace(/_/g, " ")}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="py-12 text-center">
            <div className="inline-block animate-spin">
              <div className="size-8 rounded-full border-4 border-[#a855f7] border-t-[#84cc16]" />
            </div>
            <p className="mt-4 text-[#94a3b8]">Carregando operacoes...</p>
          </div>
        ) : filteredTournaments.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredTournaments.map((tournament) => (
              <div key={tournament.id} className="stg-card-hover group overflow-hidden">
                <div className="relative flex h-40 items-center justify-center border-b border-[#a855f7]/20 bg-gradient-to-br from-[#a855f7]/15 to-[#111827]">
                  {tournament.imageUrl ? (
                    <img src={tournament.imageUrl} alt={tournament.title} className="size-full object-cover" />
                  ) : (
                    <Trophy className="text-[#a855f7] opacity-70 transition-opacity group-hover:opacity-100" size={52} />
                  )}
                  {tournament.isFeatured && <div className="absolute right-2 top-2 stg-badge-purple">Destaque</div>}
                </div>

                <div className="relative p-6">
                  <div className="mb-4 flex items-start justify-between gap-3">
                    <h3 className="flex-1 break-words text-lg font-black uppercase tracking-[0.04em] text-[#f8fafc]">
                      {tournament.title}
                    </h3>
                    <span className={`whitespace-nowrap rounded-md px-3 py-1 text-xs font-black uppercase ${statusClass(tournament.status)}`}>
                      {tournament.status || "status"}
                    </span>
                  </div>

                  {tournament.description && (
                    <p className="mb-5 line-clamp-3 text-sm leading-6 text-[#94a3b8]">{tournament.description}</p>
                  )}

                  <div className="flex flex-col gap-3 text-sm">
                    <div className="flex items-center gap-2 text-[#94a3b8]">
                      <Calendar size={16} />
                      <span>{formatDate(tournament.startDate)} - {formatDate(tournament.endDate)}</span>
                    </div>
                    {tournament.prize && (
                      <div className="border border-[#84cc16]/25 bg-[#84cc16]/10 px-3 py-2 text-xs font-black uppercase tracking-[0.06em] text-[#bbf7d0]">
                        {tournament.prize}
                      </div>
                    )}
                  </div>

                  <div className="mt-6 border-t border-[#a855f7]/20 pt-4">
                    <button disabled title="Fluxo real depende da API do Replit" className="w-full cursor-not-allowed border border-[#2d3748] bg-[#111827] px-4 py-2 text-sm font-black uppercase text-[#64748b]">
                      {registrationLabel(tournament.status)}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="stg-hud-panel p-12 text-center">
            <Trophy className="mx-auto mb-3 text-[#94a3b8]" size={48} />
            <p className="text-[#94a3b8]">Modulo de campeonatos aguardando conteudo ativo.</p>
            <p className="mt-2 text-xs text-[#64748b]">Torneios oficiais aparecem aqui quando a API do Replit retornar conteudo ativo.</p>
          </div>
        )}
      </div>
    </Layout>
  );
}
