import { Layout } from "../components/layout/Layout";
import { useAuth } from "../context/AuthContext";
import { Coins, Trophy, Crosshair, Flame } from "lucide-react";

export function Profile() {
  const { user, profile } = useAuth();

  if (!user || !profile) {
    return (
      <div className="min-h-screen cod-military-bg flex items-center justify-center">
        <div className="cod-loading text-[#a855f7]"></div>
      </div>
    );
  }

  const getRoleBadge = (role: string) => {
    const emojis = {
      admin: "🛡️ COMANDANTE",
      moderator: "⚔️ OPERADOR",
      user: "👤 SOLDADO",
    };
    return emojis[role as keyof typeof emojis] || "👤 SOLDADO";
  };

  return (
    <Layout>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Operator Profile Header */}
        <div className="cod-military-bg rounded-lg border-2 border-[#a855f7]/50 overflow-hidden relative">
          {/* Background Image */}
          <div className="h-48 bg-gradient-to-r from-[#0f172a] via-[#a855f7]/20 to-[#0f172a] relative overflow-hidden">
            <div className="absolute inset-0 opacity-20"></div>
          </div>

          {/* Operator Info */}
          <div className="relative px-8 pb-8 -mt-16">
            <div className="flex flex-col md:flex-row md:items-end gap-6">
              {/* Avatar/Operator Badge */}
              <div className="relative">
                <div className="w-32 h-32 rounded-lg border-4 border-[#a855f7] bg-gradient-to-br from-[#0f172a] to-[#1a1f2e] flex items-center justify-center text-6xl font-black relative overflow-hidden cod-operator-card">
                  {profile.username[0].toUpperCase()}
                  <div className="absolute inset-0 bg-gradient-to-tr from-[#a855f7]/20 to-transparent pointer-events-none"></div>
                </div>
                <div className="absolute -bottom-2 -right-2 bg-[#22c55e] rounded-lg px-3 py-1 text-xs font-black text-white flex items-center gap-1">
                  ✓ ONLINE
                </div>
              </div>

              {/* Name and Class */}
              <div className="flex-1">
                <div className="cod-text-military text-2xl text-[#a855f7] mb-2">OPERADOR</div>
                <h1 className="text-4xl font-black text-white mb-3 uppercase tracking-wider">{profile.username}</h1>
                <div className="cod-rank-badge mb-4">
                  {getRoleBadge(profile.role)}
                </div>
              </div>

              {/* Combat Stats */}
              <div className="cod-stats-grid">
                <div className="cod-stat-box">
                  <Crosshair size={20} className="mx-auto mb-2 text-[#a855f7]" />
                  <div className="cod-stat-box-value">{profile.level}</div>
                  <div className="cod-stat-box-label">RANK</div>
                </div>
                <div className="cod-stat-box">
                  <Flame size={20} className="mx-auto mb-2 text-[#f97316]" />
                  <div className="cod-stat-box-value">{(profile.xp / 1000).toFixed(1)}k</div>
                  <div className="cod-stat-box-label">XP TOTAL</div>
                </div>
                <div className="cod-stat-box">
                  <Coins size={20} className="mx-auto mb-2 text-[#22c55e]" />
                  <div className="cod-stat-box-value">{profile.coins}</div>
                  <div className="cod-stat-box-label">COINS</div>
                </div>
                <div className="cod-stat-box">
                  <Trophy size={20} className="mx-auto mb-2 text-[#38bdf8]" />
                  <div className="cod-stat-box-value">-</div>
                  <div className="cod-stat-box-label">WINS</div>
                </div>
              </div>
            </div>
          </div>

          {/* Mission Panel - Combat Stats */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Account Info */}
            <div className="lg:col-span-1">
              <div className="cod-mission-panel active">
                <div className="cod-text-military text-sm text-[#22c55e] mb-4">🛡️ INFORMAÇÕES DO OPERADOR</div>
                <div className="space-y-3">
                  <div className="cod-combat-stat cod-combat-stat-blue">
                    <div className="text-xs text-[#94a3b8] uppercase">Email</div>
                    <div className="text-sm text-white font-mono mt-1">{profile.email}</div>
                  </div>

                  <div className="cod-combat-stat cod-combat-stat-green">
                    <div className="text-xs text-[#94a3b8] uppercase">Rank</div>
                    <div className="text-sm text-[#22c55e] font-black mt-1 uppercase">
                      {profile.role === "admin" ? "🛡️ COMANDANTE" : profile.role === "moderator" ? "⚔️ OPERADOR" : "👤 SOLDADO"}
                    </div>
                  </div>

                  <div className="cod-combat-stat">
                    <div className="text-xs text-[#94a3b8] uppercase">Discord ID</div>
                    <div className="text-xs text-white font-mono mt-1 break-all">{profile.discord_id || "N/A"}</div>
                  </div>

                  <div className="cod-combat-stat cod-combat-stat-blue">
                    <div className="text-xs text-[#94a3b8] uppercase">Membro desde</div>
                    <div className="text-sm text-[#38bdf8] font-medium mt-1">
                      {new Date(profile.created_at).toLocaleDateString("pt-BR")}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Combat Stats */}
            <div className="lg:col-span-2">
              <div className="cod-mission-panel active">
                <div className="cod-text-military text-sm text-[#22c55e] mb-4">⚔️ ESTATÍSTICAS DE COMBATE</div>
                
                {/* XP Progress */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-[#94a3b8] uppercase font-black">Experiência</span>
                    <span className="text-sm text-[#a855f7] font-black">{profile.xp.toLocaleString()} XP</span>
                  </div>
                  <div className="h-2 bg-[#0f172a]/50 rounded-full overflow-hidden border border-[#a855f7]/20">
                    <div
                      className="h-full bg-gradient-to-r from-[#a855f7] to-[#7c3aed]"
                      style={{ width: `${((profile.xp % 1000) / 1000) * 100}%` }}
                    ></div>
                  </div>
                  <div className="text-xs text-[#64748b] mt-1">{profile.xp % 1000}/1000 para próximo nível</div>
                </div>

                {/* Kill Count / Missions */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="cod-combat-stat cod-combat-stat-red">
                    <div className="text-xs text-[#94a3b8]">KILLS</div>
                    <div className="text-xl font-black text-[#ef4444]">-</div>
                  </div>
                  <div className="cod-combat-stat cod-combat-stat-green">
                    <div className="text-xs text-[#94a3b8]">MISSIONS</div>
                    <div className="text-xl font-black text-[#22c55e]">-</div>
                  </div>
                  <div className="cod-combat-stat cod-combat-stat-blue">
                    <div className="text-xs text-[#94a3b8]">KD RATIO</div>
                    <div className="text-xl font-black text-[#38bdf8]">-</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Sections */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="cod-mission-panel">
              <div className="cod-text-military text-sm text-[#f97316] mb-4">🏆 HISTÓRICO DE TORNEIOS</div>
              <p className="text-[#94a3b8] text-sm">Participações em campeonatos aparecerão aqui</p>
            </div>

            <div className="cod-mission-panel">
              <div className="cod-text-military text-sm text-[#f97316] mb-4">🛒 COMPRAS RECENTES</div>
              <p className="text-[#94a3b8] text-sm">Histórico de compras na loja aparecerá aqui</p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
