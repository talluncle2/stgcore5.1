import { useEffect, useState } from "react";
import { Edit3, Medal, Search } from "lucide-react";
import { Link } from "react-router-dom";
import { Layout } from "../components/layout/Layout";
import { RankingCard } from "../components/cards/RankingCard";
import { useAuth } from "../context/AuthContext";
import { getRankingItems, rankingItemToEntry } from "../services/rankingService";
import { RankingEntry, RankingItem } from "../types/api";
import { canManageContent } from "../utils/permissions";

export function Ranking() {
  const [ranking, setRanking] = useState<RankingEntry[]>([]);
  const [rankingItems, setRankingItems] = useState<RankingItem[]>([]);
  const [filteredRanking, setFilteredRanking] = useState<RankingEntry[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const { user, profile } = useAuth();

  useEffect(() => {
    async function loadRanking() {
      try {
        const items = (await getRankingItems())
          .filter((item) => item.isActive)
          .sort((a, b) => a.position - b.position || b.points - a.points);
        const entries = items.map(rankingItemToEntry);
        setRankingItems(items);
        setRanking(entries);
        setFilteredRanking(entries);
      } catch (error) {
        console.error("Error loading ranking:", error);
        setRankingItems([]);
        setRanking([]);
        setFilteredRanking([]);
      } finally {
        setLoading(false);
      }
    }

    void loadRanking();
  }, []);

  useEffect(() => {
    if (search.trim() === "") {
      setFilteredRanking(ranking);
      return;
    }

    const value = search.toLowerCase();
    setFilteredRanking(
      ranking.filter((entry) => {
        const name = (entry.username || entry.discord_username || "").toLowerCase();
        const id = entry.discord_id?.toString().toLowerCase() || "";
        return name.includes(value) || id.includes(value);
      })
    );
  }, [search, ranking]);

  const getPositionLabel = (index: number) => `#${index + 1}`;

  return (
    <Layout>
      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="tactical-label mb-2">Placar operacional</p>
            <h1 className="mb-2 text-4xl font-black uppercase tracking-[0.08em] text-[#f8fafc]">
              Ranking Global
            </h1>
            <p className="text-[#94a3b8]">Veja a posicao de todos os operadores da comunidade</p>
          </div>
          {canManageContent(user ?? profile) && (
            <Link to="/admin/ranking" className="stg-button-secondary inline-flex items-center justify-center gap-2 px-4 py-3 text-sm">
              <Edit3 size={16} />
              Gerir ranking
            </Link>
          )}
        </div>

        <div className="relative">
          <Search className="absolute left-4 top-3 text-[#94a3b8]" size={20} />
          <input
            type="text"
            placeholder="Buscar por nome ou Discord ID..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="tactical-edge w-full border border-[#a855f7]/20 bg-[#111827] py-3 pl-12 pr-4 font-bold text-[#f8fafc] placeholder-[#475569] transition-colors hover:border-[#a855f7]/35 focus:border-[#a855f7]/55 focus:outline-none"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="stg-hud-panel border-[#a855f7]/30 p-4">
            <p className="tactical-label mb-2">Total de Operadores</p>
            <p className="text-3xl font-black text-[#f8fafc]">{ranking.length}</p>
          </div>
          <div className="stg-hud-panel border-[#84cc16]/30 p-4">
            <p className="tactical-label mb-2">XP Total Distribuido</p>
            <p className="text-3xl font-black text-[#84cc16]">
              {ranking.reduce((sum, entry) => sum + entry.xp, 0).toLocaleString()}
            </p>
          </div>
          <div className="stg-hud-panel border-[#38bdf8]/30 p-4">
            <p className="tactical-label mb-2">Nivel Maximo</p>
            <p className="text-3xl font-black text-[#38bdf8]">
              {Math.max(...ranking.map((entry) => entry.level || 0), 0) || "-"}
            </p>
          </div>
        </div>

        {loading ? (
          <div className="py-12 text-center">
            <div className="inline-block animate-spin">
              <div className="size-8 rounded-full border-4 border-[#a855f7] border-t-[#84cc16]" />
            </div>
            <p className="mt-4 text-[#94a3b8]">Carregando ranking...</p>
          </div>
        ) : filteredRanking.length > 0 ? (
          <div className="flex flex-col gap-3">
            <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
              {filteredRanking.slice(0, 3).map((entry, index) => {
                const source = rankingItems.find((item) => item.id === String(entry.discord_id));
                return (
                  <div key={entry.discord_id} className="stg-card-hover relative overflow-hidden border-[#a855f7]/50">
                    <div className="absolute right-0 top-0 text-4xl opacity-20">{getPositionLabel(index)}</div>
                    <div className="p-6">
                      <div className="mb-4 flex items-center gap-3">
                        {source?.avatarUrl ? (
                          <img src={source.avatarUrl} alt={entry.username || "Operador"} className="size-12 rounded border border-[#a855f7]/40 object-cover" />
                        ) : (
                          <span className="text-3xl font-black">{getPositionLabel(index)}</span>
                        )}
                        <div className="flex-1">
                          <p className="font-black uppercase tracking-wider text-[#f8fafc]">
                            {entry.username || entry.discord_username || "Operador"}
                          </p>
                          <p className="text-xs text-[#94a3b8]">Nivel {entry.level || 1}</p>
                        </div>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-[#94a3b8]">XP:</span>
                        <span className="font-black text-[#a855f7]">{entry.xp.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {filteredRanking.length > 3 && (
              <div className="flex flex-col gap-2">
                <h3 className="mb-2 text-lg font-black uppercase tracking-wider text-[#94a3b8]">Demais Operadores</h3>
                {filteredRanking.slice(3).map((entry, index) => (
                  <RankingCard key={entry.discord_id} entry={entry} position={index + 4} />
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="stg-hud-panel p-12 text-center">
            <Medal className="mx-auto mb-3 text-[#94a3b8]" size={48} />
            <p className="text-[#94a3b8]">Nenhum operador encontrado</p>
            <p className="mt-2 text-xs text-[#64748b]">Primeira operacao em breve.</p>
          </div>
        )}
      </div>
    </Layout>
  );
}
