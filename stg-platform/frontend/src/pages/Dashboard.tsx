import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Bot,
  Clock,
  RadioTower,
  RefreshCw,
  ShieldCheck,
  Signal,
  Users,
} from "lucide-react";
import { Layout } from "../components/layout/Layout";
import { StatCard } from "../components/cards/StatCard";
import { getHealth } from "../services/api";
import {
  getDiscordGuild,
  getDiscordMetrics,
  getDiscordStatus,
} from "../services/adminService";

type BotStatus = {
  status?: string;
  bot_name?: string;
  latency_ms?: number;
  uptime_seconds?: number;
  guild_count?: number;
  version?: string;
  last_sync_at?: string;
  created_at?: string;
};

type GuildInfo = {
  guild_name?: string;
  member_count?: number;
  human_members?: number;
  bot_members?: number;
  online_members?: number;
  channels_total?: number;
  text_channels?: number;
  voice_channels?: number;
  roles_count?: number;
  latency_ms?: number;
  uptime_seconds?: number;
  last_sync_at?: string;
};

function formatUptime(seconds?: number) {
  if (!seconds) return "N/A";
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
}

function formatDate(value?: string) {
  if (!value) return "N/A";
  return new Date(value).toLocaleString("pt-BR");
}

export function Dashboard() {
  const [apiOnline, setApiOnline] = useState(false);
  const [botStatus, setBotStatus] = useState<BotStatus | null>(null);
  const [guild, setGuild] = useState<GuildInfo | null>(null);
  const [metricsCount, setMetricsCount] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setError(null);
      const [healthData, statusData, guildData, metricsData] = await Promise.all([
        getHealth(),
        getDiscordStatus(),
        getDiscordGuild(),
        getDiscordMetrics(),
      ]);

      setApiOnline(healthData.status === "online");
      setBotStatus(statusData as BotStatus | null);
      setGuild(guildData as GuildInfo | null);
      setMetricsCount(metricsData?.metrics?.length ?? 0);
    } catch (err) {
      console.error("Error loading dashboard data:", err);
      setError("Nao foi possivel carregar os dados administrativos da API.");
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const botOnline = (botStatus?.status || "").toLowerCase() === "online";
  const lastSync = botStatus?.last_sync_at || guild?.last_sync_at || botStatus?.created_at;

  const statCards = useMemo(
    () => [
      {
        title: "Membros",
        value: guild?.member_count ?? 0,
        icon: <Users size={24} />,
        color: "purple" as const,
      },
      {
        title: "Humanos",
        value: guild?.human_members ?? 0,
        icon: <ShieldCheck size={24} />,
        color: "green" as const,
      },
      {
        title: "Bots",
        value: guild?.bot_members ?? 0,
        icon: <Bot size={24} />,
        color: "blue" as const,
      },
      {
        title: "Online",
        value: guild?.online_members ?? 0,
        icon: <Signal size={24} />,
        color: "orange" as const,
      },
    ],
    [guild]
  );

  if (loading) {
    return (
      <Layout>
        <div className="flex min-h-[50vh] items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin">
              <div className="size-12 rounded-full border-4 border-[#a855f7] border-t-[#c084fc]" />
            </div>
            <p className="mt-4 text-[#c4b5fd]">Carregando painel...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 border border-[#a855f7]/20 bg-[#050608]/70 p-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="tactical-label">Fonte oficial</p>
            <h2 className="text-xl font-black uppercase tracking-[0.06em] text-white">
              API STG Core / Supabase
            </h2>
            <p className="mt-1 text-sm text-[#94a3b8]">
              Dados sincronizados pelo bot via API. JSON local nao e fonte oficial.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setRefreshing(true);
              void loadData();
            }}
            disabled={refreshing}
            className="tactical-edge inline-flex items-center justify-center gap-2 border border-[#a855f7]/40 bg-[#a855f7]/15 px-4 py-2 text-sm font-black uppercase tracking-[0.08em] text-white transition-colors hover:bg-[#a855f7]/25 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
            Atualizar
          </button>
        </div>

        {error && (
          <div className="flex items-center gap-3 border border-[#f97316]/35 bg-[#f97316]/10 p-4 text-[#fed7aa]">
            <AlertCircle size={20} />
            <span className="text-sm font-bold">{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {statCards.map((card) => (
            <StatCard key={card.title} {...card} />
          ))}
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <section className="stg-hud-panel-glow p-6 xl:col-span-2">
            <div className="mb-6 flex items-center gap-3 border-b border-[#7c3aed]/20 pb-4">
              <RadioTower className="text-[#a855f7]" size={22} />
              <h3 className="text-lg font-black uppercase tracking-[0.06em] text-[#f8fafc]">
                Operacao Discord
              </h3>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {[
                ["API", apiOnline ? "Online" : "Offline"],
                ["Bot", botOnline ? "Online" : botStatus?.status || "Indisponivel"],
                ["Guild", guild?.guild_name || "Nao sincronizada"],
                ["Canais", guild?.channels_total ?? 0],
                ["Texto/Voz", `${guild?.text_channels ?? 0}/${guild?.voice_channels ?? 0}`],
                ["Cargos", guild?.roles_count ?? 0],
                ["Latencia", `${botStatus?.latency_ms ?? guild?.latency_ms ?? 0} ms`],
                ["Uptime", formatUptime(botStatus?.uptime_seconds ?? guild?.uptime_seconds)],
              ].map(([label, value]) => (
                <div key={label} className="border border-[#a855f7]/15 bg-[#111827]/60 p-4">
                  <p className="tactical-label mb-1">{label}</p>
                  <p className="text-lg font-black text-white">{value}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="stg-hud-panel-glow p-6">
            <div className="mb-6 flex items-center gap-3 border-b border-[#7c3aed]/20 pb-4">
              <Clock className="text-[#84cc16]" size={22} />
              <h3 className="text-lg font-black uppercase tracking-[0.06em] text-[#f8fafc]">
                Sincronizacao
              </h3>
            </div>

            <div className="space-y-4 text-sm">
              <div>
                <p className="tactical-label mb-1">Ultima sync</p>
                <p className="font-bold text-white">{formatDate(lastSync)}</p>
              </div>
              <div>
                <p className="tactical-label mb-1">Eventos recentes</p>
                <p className="font-bold text-white">{metricsCount}</p>
              </div>
              <div>
                <p className="tactical-label mb-1">Status de dados</p>
                <p className="font-bold text-[#94a3b8]">
                  {guild ? "Dados reais carregados da API" : "Aguardando primeira sincronizacao do bot"}
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </Layout>
  );
}
