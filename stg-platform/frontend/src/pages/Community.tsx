import { useCallback, useEffect, useMemo, useState } from "react";
import { RefreshCw, Search, Shield, Trophy, Users } from "lucide-react";
import { Layout } from "../components/layout/Layout";
import { getOverview, getRanking } from "../services/api";
import { PublicOverview, RankingEntry } from "../types/api";

export function Community() {
  const [overview, setOverview] = useState<PublicOverview | null>(null);
  const [players, setPlayers] = useState<RankingEntry[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchCommunity = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [overviewData, rankingData] = await Promise.all([
        getOverview(),
        getRanking(50),
      ]);
      setOverview(overviewData);
      setPlayers(rankingData);
    } catch {
      setOverview(null);
      setPlayers([]);
      setError("Nao foi possivel carregar os dados publicos da comunidade.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchCommunity();
  }, [fetchCommunity]);

  const filteredPlayers = useMemo(() => {
    const value = query.trim().toLowerCase();
    if (!value) return players;
    return players.filter((player) =>
      [
        player.discord_id,
        player.username,
        player.discord_username,
      ]
        .filter(Boolean)
        .some((field) => String(field).toLowerCase().includes(value))
    );
  }, [players, query]);

  const stats = [
    { label: "Usuarios", value: overview?.users_total ?? players.length, icon: Users },
    { label: "Ranking", value: players.length, icon: Trophy },
    { label: "Produtos", value: overview?.products_total ?? 0, icon: Shield },
    { label: "Torneios", value: overview?.tournaments_total ?? 0, icon: Trophy },
  ];

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 border border-[#a855f7]/20 bg-[#050608]/70 p-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="tactical-label">Comunidade STG</p>
            <h2 className="text-xl font-black uppercase tracking-[0.06em] text-white">
              Times, jogadores e operadores
            </h2>
            <p className="mt-1 text-sm text-[#94a3b8]">
              Dados publicos carregados pela API configurada. O frontend nao chama o bot Discord diretamente.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void fetchCommunity()}
            disabled={loading}
            className="tactical-edge inline-flex items-center justify-center gap-2 border border-[#a855f7]/40 bg-[#a855f7]/15 px-4 py-2 text-sm font-black uppercase tracking-[0.08em] text-white transition-colors hover:bg-[#a855f7]/25 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            Atualizar
          </button>
        </div>

        {error && (
          <div className="border border-[#f97316]/35 bg-[#f97316]/10 p-4 text-sm font-bold text-[#fed7aa]">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="stg-hud-panel p-5">
                <div className="mb-4 flex items-center justify-between">
                  <p className="tactical-label">{stat.label}</p>
                  <Icon className="text-[#a855f7]" size={20} />
                </div>
                <p className="text-3xl font-black text-white">{loading ? "-" : stat.value}</p>
              </div>
            );
          })}
        </div>

        <section className="stg-hud-panel-glow p-5">
          <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className="text-lg font-black uppercase tracking-[0.06em] text-white">Operadores em destaque</h3>
              <p className="mt-1 text-sm text-[#94a3b8]">
                Ranking publico usado como base temporaria ate o modulo de times dedicado estar disponivel.
              </p>
            </div>
            <div className="relative min-w-0 md:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748b]" size={18} />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Buscar operador"
                className="w-full border border-[#a855f7]/20 bg-[#111827] py-3 pl-10 pr-4 text-sm font-bold text-white outline-none placeholder:text-[#64748b] focus:border-[#a855f7]/55"
              />
            </div>
          </div>

          {loading ? (
            <div className="p-8 text-center text-[#94a3b8]">Carregando comunidade...</div>
          ) : filteredPlayers.length > 0 ? (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {filteredPlayers.map((player) => {
                const name = player.username || player.discord_username || "Operador STG";
                return (
                  <div key={String(player.discord_id)} className="border border-[#a855f7]/15 bg-[#111827]/60 p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex size-11 shrink-0 items-center justify-center border border-[#a855f7]/35 bg-[#a855f7]/15 text-lg font-black text-white">
                        {name.slice(0, 1).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-black uppercase text-white">{name}</p>
                        <p className="truncate font-mono text-xs text-[#94a3b8]">{player.discord_id}</p>
                      </div>
                      <span className="ml-auto border border-[#84cc16]/30 bg-[#84cc16]/10 px-2 py-1 text-xs font-black text-[#84cc16]">
                        #{player.position}
                      </span>
                    </div>
                    <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                      <div className="border border-[#a855f7]/10 bg-black/20 p-2">
                        <p className="text-xs text-[#94a3b8]">LVL</p>
                        <p className="font-black text-white">{player.level}</p>
                      </div>
                      <div className="border border-[#a855f7]/10 bg-black/20 p-2">
                        <p className="text-xs text-[#94a3b8]">XP</p>
                        <p className="font-black text-white">{player.xp}</p>
                      </div>
                      <div className="border border-[#a855f7]/10 bg-black/20 p-2">
                        <p className="text-xs text-[#94a3b8]">Coins</p>
                        <p className="font-black text-white">{player.coins ?? 0}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="border border-[#a855f7]/15 bg-[#111827]/50 p-8 text-center">
              <Users className="mx-auto mb-3 text-[#a855f7]" size={38} />
              <p className="font-black uppercase text-white">Nenhum operador publico encontrado</p>
              <p className="mt-2 text-sm text-[#94a3b8]">
                Aguardando a API retornar dados de ranking ou membros publicos.
              </p>
            </div>
          )}
        </section>
      </div>
    </Layout>
  );
}
