import { useCallback, useState } from "react";
import { AlertTriangle, Bot, Gamepad2, RadioTower, RefreshCw, ShoppingCart, Users, Zap } from "lucide-react";
import { Layout } from "../components/layout/Layout";
import { StatCard } from "../components/cards/StatCard";
import { RankingCard } from "../components/cards/RankingCard";
import { ActivityChart } from "../components/charts/ActivityChart";
import { getOverview, getRanking, getStats } from "../services/api";
import { getDiscordMetrics } from "../services/metricsService";
import { usePolling } from "../hooks/usePolling";
import { DiscordMetrics, PublicOverview, PublicStats, RankingEntry } from "../types/api";

export function Dashboard() {
  const [overview, setOverview] = useState<PublicOverview | null>(null);
  const [stats, setStats] = useState<PublicStats | null>(null);
  const [metrics, setMetrics] = useState<DiscordMetrics | null>(null);
  const [ranking, setRanking] = useState<RankingEntry[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [overviewData, statsData, rankingData, metricsData] = await Promise.all([
        getOverview(),
        getStats(),
        getRanking(5),
        getDiscordMetrics(),
      ]);
      setOverview(overviewData);
      setStats(statsData);
      setRanking(rankingData);
      setMetrics(metricsData);
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    } finally {
      setRefreshing(false);
    }
  }, []);

  usePolling(loadData, 15000);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
  };

  return (
    <Layout>
      <div className="flex flex-col gap-8">
        <div className="stg-hud-panel-glow flex flex-col gap-6 p-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="tactical-label mb-2">OPERACAO WARZONE</p>
            <h1 className="mb-2 text-4xl font-black uppercase tracking-[0.08em] text-[#f8fafc]">
              Comando STG
            </h1>
            <p className="max-w-2xl text-[#94a3b8]">
              Painel tatico sincronizado pela API do Replit. O bot atualiza a API e a interface atualiza por polling
              seguro a cada 15 segundos.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className={`stg-hud-panel hidden p-3 md:flex ${metrics?.bot_online ? "border-[#84cc16]/25 bg-[#84cc16]/10 text-[#84cc16] glow-green" : "border-[#f97316]/25 bg-[#f97316]/10 text-[#f97316]"}`}>
              <Bot size={22} />
            </div>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="stg-button-primary flex items-center gap-2 glow-purple"
            >
              <RefreshCw size={18} className={refreshing ? "animate-spin" : ""} />
              {refreshing ? "Atualizando..." : "Atualizar"}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard title="Operadores" value={overview?.users_total || 0} icon={<Users size={24} />} color="purple" />
          <StatCard title="Operacoes" value={overview?.tournaments_total || 0} icon={<Gamepad2 size={24} />} color="green" />
          <StatCard title="Arsenal" value={overview?.products_total || 0} icon={<ShoppingCart size={24} />} color="blue" />
          <StatCard title="Punicoes" value={overview?.punishments_total || 0} icon={<AlertTriangle size={24} />} color="orange" />
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="stg-hud-panel p-4 border-[#84cc16]/30">
            <p className="tactical-label mb-2">Bot Discord</p>
            <p className={`text-2xl font-black ${metrics?.bot_online ? "text-[#84cc16]" : "text-[#f97316]"}`}>
              {metrics?.bot_online ? "Online" : "Offline"}
            </p>
            <p className="mt-1 text-xs text-[#94a3b8]">{metrics?.bot_latency_ms ?? 0}ms de latencia</p>
          </div>
          <div className="stg-hud-panel p-4 border-[#38bdf8]/30">
            <p className="tactical-label mb-2">Membros Discord</p>
            <p className="text-3xl font-black text-[#38bdf8]">{metrics?.member_count ?? 0}</p>
            <p className="mt-1 text-xs text-[#94a3b8]">{metrics?.online_count ?? 0} online</p>
          </div>
          <div className="stg-hud-panel p-4 border-[#a855f7]/30">
            <p className="tactical-label mb-2">Canais</p>
            <p className="text-3xl font-black text-[#a855f7]">{metrics?.channels_count ?? 0}</p>
            <p className="mt-1 text-xs text-[#94a3b8]">{metrics?.voice_channels_count ?? 0} voz</p>
          </div>
          <div className="stg-hud-panel p-4 border-[#f97316]/30">
            <p className="tactical-label mb-2">Cargos</p>
            <p className="text-3xl font-black text-[#f97316]">{metrics?.roles_count ?? 0}</p>
            <p className="mt-1 text-xs text-[#94a3b8]">{metrics?.commands_executed ?? 0} comandos</p>
          </div>
        </div>

        {stats && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="stg-hud-panel p-4 border-[#a855f7]/30">
              <p className="tactical-label mb-2">Operadores Hoje</p>
              <p className="text-3xl font-black text-[#a855f7]">{stats.users_active_today}</p>
              <p className="text-xs text-[#94a3b8] mt-1">Atividade recente</p>
            </div>
            <div className="stg-hud-panel p-4 border-[#84cc16]/30">
              <p className="tactical-label mb-2">Operacoes Criadas</p>
              <p className="text-3xl font-black text-[#84cc16]">{stats.tournaments_created_today}</p>
              <p className="text-xs text-[#94a3b8] mt-1">Ultimas 24h</p>
            </div>
            <div className="stg-hud-panel p-4 border-[#38bdf8]/30">
              <p className="tactical-label mb-2">Transacoes</p>
              <p className="text-3xl font-black text-[#38bdf8]">{stats.transactions_today}</p>
              <p className="text-xs text-[#94a3b8] mt-1">Coins movidos</p>
            </div>
            <div className="stg-hud-panel p-4 border-[#22c55e]/30">
              <p className="tactical-label mb-2">XP Distribuido</p>
              <p className="text-3xl font-black text-[#22c55e]">{stats.xp_distributed_today}</p>
              <p className="text-xs text-[#94a3b8] mt-1">Experiencia</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <ActivityChart />
          </div>

          <div className="stg-hud-panel-glow flex flex-col justify-between p-6">
            <div className="relative">
              <div className="mb-6 flex items-center gap-3 border-b border-[#7c3aed]/20 pb-4">
                <RadioTower className="text-[#a855f7]" size={22} />
                <h3 className="text-lg font-black uppercase tracking-[0.06em] text-[#f8fafc]">Matriz STG</h3>
              </div>
              <div className="flex flex-col gap-4 text-sm">
                <div className="flex justify-between gap-4">
                  <span className="text-[#94a3b8]">Guild:</span>
                  <span className="font-bold text-[#f8fafc]">{metrics?.guild?.name || overview?.guild_name || "STG"}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-[#94a3b8]">Status Bot:</span>
                  <div className={`flex items-center gap-2 font-bold ${metrics?.bot_online ? "text-[#84cc16]" : "text-[#f97316]"}`}>
                    <span className={`size-2 rounded-full ${metrics?.bot_online ? "bg-[#84cc16]" : "bg-[#f97316]"} pulse-glow`} />
                    {metrics?.bot_online ? "Online" : "Bot offline ou indisponivel"}
                  </div>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-[#94a3b8]">Ultima Sync:</span>
                  <span className="text-xs font-bold text-[#f8fafc]">
                    {metrics?.last_sync ? new Date(metrics.last_sync).toLocaleTimeString("pt-BR") : "N/A"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div>
          <h2 className="mb-4 text-2xl font-black uppercase tracking-[0.06em] text-[#f8fafc]">Elite Squad</h2>
          <div className="flex flex-col gap-3">
            {ranking.length > 0 ? (
              ranking.map((entry) => <RankingCard key={entry.discord_id} entry={entry} />)
            ) : (
              <div className="stg-hud-panel p-8 text-center">
                <Zap className="mx-auto mb-3 text-[#94a3b8]" size={32} />
                <p className="text-[#94a3b8]">Nenhum operador no ranking ainda.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
