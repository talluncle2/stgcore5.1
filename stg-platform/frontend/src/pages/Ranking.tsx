import { useEffect, useState } from "react";
import { Search, Medal } from "lucide-react";
import { Layout } from "../components/layout/Layout";
import { RankingCard } from "../components/cards/RankingCard";
import { getRanking } from "../services/api";
import { RankingEntry } from "../types/api";

export function Ranking() {
  const [ranking, setRanking] = useState<RankingEntry[]>([]);
  const [filteredRanking, setFilteredRanking] = useState<RankingEntry[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadRanking = async () => {
      try {
        const data = await getRanking(100);
        setRanking(data);
        setFilteredRanking(data);
      } catch (error) {
        console.error("Error loading ranking:", error);
        setRanking([]);
        setFilteredRanking([]);
      } finally {
        setLoading(false);
      }
    };

    loadRanking();
  }, []);

  useEffect(() => {
    if (search.trim() === "") {
      setFilteredRanking(ranking);
      return;
    }

    const filtered = ranking.filter((entry) => {
      const name = (entry.username || entry.discord_username || "").toLowerCase();
      const id = entry.discord_id?.toString().toLowerCase() || "";
      return name.includes(search.toLowerCase()) || id.includes(search.toLowerCase());
    });
    setFilteredRanking(filtered);
  }, [search, ranking]);

  const getMedalEmoji = (index: number) => {
    if (index === 0) return "🥇";
    if (index === 1) return "🥈";
    if (index === 2) return "🥉";
    return `#${index + 1}`;
  };

  return (
    <Layout>
      <div className="flex flex-col gap-8">
        <div>
          <p className="tactical-label mb-2">🎖️ PLACAR OPERACIONAL</p>
          <h1 className="mb-2 text-4xl font-black uppercase tracking-[0.08em] text-[#f8fafc]">
            Ranking Global
          </h1>
          <p className="text-[#94a3b8]">Veja a posição de todos os operadores da comunidade</p>
        </div>

        {/* Search Box */}
        <div className="relative">
          <Search className="absolute left-4 top-3 text-[#94a3b8]" size={20} />
          <input
            type="text"
            placeholder="Buscar por nome ou Discord ID..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="tactical-edge w-full border border-[#a855f7]/20 bg-[#111827] py-3 pl-12 pr-4 font-bold text-[#f8fafc] placeholder-[#475569] transition-colors focus:border-[#a855f7]/55 focus:outline-none hover:border-[#a855f7]/35"
          />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="stg-hud-panel p-4 border-[#a855f7]/30">
            <p className="tactical-label mb-2">Total de Operadores</p>
            <p className="text-3xl font-black text-[#f8fafc]">{ranking.length}</p>
          </div>
          <div className="stg-hud-panel p-4 border-[#84cc16]/30">
            <p className="tactical-label mb-2">XP Total Distribuído</p>
            <p className="text-3xl font-black text-[#84cc16]">
              {ranking.reduce((sum, entry) => sum + entry.xp, 0).toLocaleString()}
            </p>
          </div>
          <div className="stg-hud-panel p-4 border-[#38bdf8]/30">
            <p className="tactical-label mb-2">Nível Máximo</p>
            <p className="text-3xl font-black text-[#38bdf8]">
              {Math.max(...ranking.map((e) => e.level || 0), 0) || "—"}
            </p>
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="py-12 text-center">
            <div className="inline-block animate-spin">
              <div className="size-8 rounded-full border-4 border-[#a855f7] border-t-[#84cc16]" />
            </div>
            <p className="mt-4 text-[#94a3b8]">Carregando ranking...</p>
          </div>
        ) : filteredRanking.length > 0 ? (
          <div className="space-y-3">
            {/* Top 3 Featured */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3 mb-8">
              {filteredRanking.slice(0, 3).map((entry, idx) => (
                <div key={entry.discord_id} className="stg-card-hover border-[#a855f7]/50 relative overflow-hidden">
                  <div className="absolute top-0 right-0 text-4xl opacity-20">{getMedalEmoji(idx)}</div>
                  <div className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <span className="text-3xl font-black">{getMedalEmoji(idx)}</span>
                      <div className="flex-1">
                        <p className="font-black uppercase tracking-wider text-[#f8fafc]">
                          {entry.username || entry.discord_username || "Operador"}
                        </p>
                        <p className="text-xs text-[#94a3b8]">Nível {entry.level || 1}</p>
                      </div>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-[#94a3b8]">XP:</span>
                      <span className="font-black text-[#a855f7]">{entry.xp.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Full Ranking Table */}
            {filteredRanking.length > 3 && (
              <div className="space-y-2">
                <h3 className="text-lg font-black uppercase tracking-wider text-[#94a3b8] mb-4">Demais Operadores</h3>
                {filteredRanking.slice(3).map((entry, idx) => (
                  <RankingCard key={entry.discord_id} entry={entry} position={idx + 4} />
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="stg-hud-panel p-12 text-center">
            <Medal className="mx-auto mb-3 text-[#94a3b8]" size={48} />
            <p className="text-[#94a3b8]">Nenhum operador encontrado</p>
            <p className="text-xs text-[#64748b] mt-2">Primeira operação em breve!</p>
          </div>
        )}
      </div>
    </Layout>
  );
}
