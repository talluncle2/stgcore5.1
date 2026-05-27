import { useEffect, useState } from "react";
import { Calendar, Filter, Trophy, User } from "lucide-react";
import { Layout } from "../components/layout/Layout";
import { getTournaments } from "../services/api";
import { Tournament } from "../types/api";

export function Tournaments() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [filteredTournaments, setFilteredTournaments] = useState<Tournament[]>([]);
  const [status, setStatus] = useState("todos");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTournaments = async () => {
      setLoading(true);
      const statusFilter = status === "todos" ? undefined : status;
      const data = await getTournaments(statusFilter, 50);
      setTournaments(data);
      setFilteredTournaments(data);
      setLoading(false);
    };

    loadTournaments();
  }, [status]);

  const statusClass = (value: string) => {
    const colors = {
      pendente: "stg-badge-warning",
      aprovado: "stg-badge-success",
      rejeitado: "stg-badge-danger",
    };
    return colors[value as keyof typeof colors] || "stg-badge-info";
  };

  return (
    <Layout>
      <div className="flex flex-col gap-8">
        <div>
          <p className="tactical-label mb-2">⚔️ OPERAÇÕES COMPETITIVAS</p>
          <h1 className="mb-2 text-4xl font-black uppercase tracking-[0.08em] text-[#f8fafc]">
            Campeonatos
          </h1>
          <p className="text-[#94a3b8]">Acompanhe as operações registradas na comunidade STG</p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          {[
            ["todos", `Todos (${tournaments.length})`],
            ["pendente", "Pendentes"],
            ["aprovado", "Aprovadas"],
            ["rejeitado", "Rejeitadas"],
          ].map(([value, label]) => (
            <button
              key={value}
              onClick={() => setStatus(value)}
              className={`tactical-edge flex items-center gap-2 px-4 py-2 font-black uppercase tracking-[0.06em] transition-all rounded-lg ${
                status === value
                  ? "stg-button-primary"
                  : "border border-[#a855f7]/25 bg-[#111827]/85 text-[#94a3b8] hover:border-[#84cc16]/45 hover:text-[#84cc16]"
              }`}
            >
              {value === "todos" && <Filter size={16} />}
              {label}
            </button>
          ))}
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="py-12 text-center">
            <div className="inline-block animate-spin">
              <div className="size-8 rounded-full border-4 border-[#a855f7] border-t-[#84cc16]" />
            </div>
            <p className="mt-4 text-[#94a3b8]">Carregando operações...</p>
          </div>
        ) : filteredTournaments.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredTournaments.map((tournament) => (
              <div
                key={tournament.tournament_id}
                className="stg-card-hover group overflow-hidden"
              >
                {/* Header */}
                <div className="flex h-32 items-center justify-center border-b border-[#a855f7]/20 bg-gradient-to-br from-[#a855f7]/15 to-[#111827]">
                  <Trophy className="text-[#a855f7] opacity-60 transition-opacity group-hover:opacity-100" size={48} />
                </div>

                {/* Content */}
                <div className="relative p-6">
                  <div className="mb-4 flex items-start justify-between gap-3">
                    <h3 className="flex-1 break-words text-lg font-black uppercase tracking-[0.04em] text-[#f8fafc]">
                      Operação #{tournament.code || tournament.tournament_id.slice(0, 8)}
                    </h3>
                    <span className={`whitespace-nowrap px-3 py-1 text-xs font-black uppercase ${statusClass(tournament.status)} rounded-md`}>
                      {tournament.status}
                    </span>
                  </div>

                  <div className="flex flex-col gap-3 text-sm">
                    <div className="flex items-center gap-2 text-[#94a3b8]">
                      <User size={16} />
                      <span>{tournament.creator_username || tournament.discord_username || "Desconhecido"}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[#94a3b8]">
                      <Calendar size={16} />
                      <span>{tournament.created_at ? new Date(tournament.created_at).toLocaleDateString("pt-BR") : "N/A"}</span>
                    </div>
                  </div>

                  <div className="mt-6 border-t border-[#a855f7]/20 pt-4">
                    <button className="stg-button-primary w-full text-sm">
                      Ver Detalhes
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="stg-hud-panel p-12 text-center">
            <Trophy className="mx-auto mb-3 text-[#94a3b8]" size={48} />
            <p className="text-[#94a3b8]">Nenhuma operação encontrada no momento</p>
            <p className="text-xs text-[#64748b] mt-2">Volte em breve para novas competições</p>
          </div>
        )}
      </div>
    </Layout>
  );
}
