import { useEffect, useState } from "react";
import { Layout } from "../components/layout/Layout";
import { getRanking } from "../services/api";
import { RankingEntry } from "../types/api";
import { Users, Search, Crosshair } from "lucide-react";

export function Players() {
  const [players, setPlayers] = useState<RankingEntry[]>([]);
  const [filteredPlayers, setFilteredPlayers] = useState<RankingEntry[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedPlayer, setSelectedPlayer] = useState<RankingEntry | null>(null);

  useEffect(() => {
    const loadPlayers = async () => {
      try {
        const data = await getRanking(100);
        setPlayers(data);
        setFilteredPlayers(data);
      } catch (error) {
        console.error("Error loading players:", error);
        setPlayers([]);
        setFilteredPlayers([]);
      } finally {
        setLoading(false);
      }
    };

    loadPlayers();
  }, []);

  useEffect(() => {
    if (search.trim() === "") {
      setFilteredPlayers(players);
    } else {
      const filtered = players.filter(
        (player) => {
          const name = (player.username || player.discord_username || "").toLowerCase();
          const id = player.discord_id?.toString().toLowerCase() || "";
          return name.includes(search.toLowerCase()) || id.includes(search.toLowerCase());
        }
      );
      setFilteredPlayers(filtered);
    }
  }, [search, players]);

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="cod-military-bg p-6 rounded-lg border-2 border-[#a855f7]/50">
          <div className="flex items-center gap-3 mb-2">
            <Crosshair className="text-[#a855f7]" size={28} />
            <h1 className="cod-header-highlight">OPERADORES GLOBAIS</h1>
          </div>
          <p className="text-[#94a3b8] text-sm ml-11">Galeria tática de soldados em combate</p>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-4 top-3.5 text-[#a855f7]" size={20} />
          <input
            type="text"
            placeholder="Buscar operador..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-[#0f172a] border-2 border-[#2d3748] rounded-lg text-white placeholder-[#64748b] focus:outline-none focus:border-[#a855f7] transition-colors cod-military-bg"
          />
        </div>

        {/* Operators Grid */}
        {loading ? (
          <div className="flex items-center justify-center h-96">
            <div className="cod-loading text-[#a855f7] text-2xl"></div>
          </div>
        ) : filteredPlayers.length > 0 ? (
          <div className="cod-tactical-grid">
            {filteredPlayers.map((player) => (
              <div
                key={player.discord_id}
                onClick={() => setSelectedPlayer(player)}
                className="cod-operator-grid cursor-pointer"
              >
                <div className="cod-operator-card">
                  {/* Operator Avatar */}
                  <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-[#a855f7]/10 to-[#0f172a] p-4">
                    <div className="text-5xl font-black text-[#a855f7] mb-3">
                      {(player.username || player.discord_username || "O")[0].toUpperCase()}
                    </div>
                    <div className="text-center w-full">
                      <p className="text-sm font-black text-white truncate">{player.username}</p>
                      <p className="text-xs text-[#64748b]">#{player.position}</p>
                      <div className="mt-2">
                        <span className="inline-block px-2 py-1 bg-[#a855f7]/20 text-[#a855f7] text-xs font-black rounded">
                          LVL {player.level}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#a855f7]/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                    <div className="w-full text-center">
                      <p className="text-[#22c55e] text-xs font-black">OPERACIONAL</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="cod-mission-panel h-48 flex items-center justify-center">
            <div className="text-center">
              <Users className="mx-auto mb-3 text-[#a855f7]" size={40} />
              <p className="text-[#94a3b8]">Nenhum operador encontrado</p>
            </div>
          </div>
        )}

        {/* Operator Details Panel */}
        {selectedPlayer && (
          <div className="cod-military-bg rounded-lg border-2 border-[#a855f7]/50 p-6 fixed inset-0 bg-black/80 flex items-center justify-center z-50">
            <div className="cod-mission-panel w-full max-w-2xl max-h-96 overflow-y-auto">
              <button
                onClick={() => setSelectedPlayer(null)}
                className="float-right text-[#a855f7] hover:text-[#22c55e] font-black text-xl mb-4"
              >
                ✕
              </button>

              <div className="cod-text-military text-sm text-[#22c55e] mb-4">⚔️ BRIEFING DO OPERADOR</div>

              {/* Operator Header */}
              <div className="flex items-center gap-4 mb-6">
                <div className="w-24 h-24 rounded-lg border-2 border-[#a855f7] bg-gradient-to-br from-[#a855f7]/20 to-[#0f172a] flex items-center justify-center text-4xl font-black">
                  {(selectedPlayer.username || selectedPlayer.discord_username || "O")[0].toUpperCase()}
                </div>
                <div>
                  <h2 className="text-2xl font-black text-white uppercase">{selectedPlayer.username || selectedPlayer.discord_username || "Desconhecido"}</h2>
                  <p className="text-[#64748b] font-mono text-sm">{selectedPlayer.discord_id?.toString() || "N/A"}</p>
                  <div className="mt-2 cod-rank-badge">
                    POSIÇÃO #{selectedPlayer.position}
                  </div>
                </div>
              </div>

              {/* Combat Stats */}
              <div className="cod-stats-grid mb-6">
                <div className="cod-stat-box">
                  <div className="cod-stat-box-label">RANK</div>
                  <div className="cod-stat-box-value">{selectedPlayer.level}</div>
                </div>
                <div className="cod-stat-box">
                  <div className="cod-stat-box-label">XP</div>
                  <div className="cod-stat-box-value">{(selectedPlayer.xp / 1000).toFixed(1)}k</div>
                </div>
                <div className="cod-stat-box">
                  <div className="cod-stat-box-label">POSIÇÃO</div>
                  <div className="cod-stat-box-value">#{selectedPlayer.position}</div>
                </div>
                <div className="cod-stat-box">
                  <div className="cod-stat-box-label">STATUS</div>
                  <div className="cod-stat-box-value text-[#22c55e]">ATIVO</div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="cod-mission-panel p-4 mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-[#94a3b8] uppercase font-black">Progresso XP</span>
                  <span className="text-sm text-[#a855f7] font-black">{selectedPlayer.xp % 1000}/1000</span>
                </div>
                <div className="h-2 bg-[#0f172a]/50 rounded-full overflow-hidden border border-[#a855f7]/20">
                  <div
                    className="h-full bg-gradient-to-r from-[#a855f7] to-[#7c3aed]"
                    style={{ width: `${((selectedPlayer.xp % 1000) / 1000) * 100}%` }}
                  ></div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3">
                <button className="px-4 py-2 rounded-lg bg-[#a855f7] text-white font-black text-xs uppercase hover:bg-[#7c3aed] transition-colors">
                  Ver Perfil Completo
                </button>
                <button className="px-4 py-2 rounded-lg border-2 border-[#2d3748] text-[#a855f7] font-black text-xs uppercase hover:border-[#a855f7] transition-colors">
                  Histórico
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
