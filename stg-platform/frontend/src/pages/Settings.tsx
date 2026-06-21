import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import {
  Activity,
  AlertCircle,
  Bot,
  CheckCircle2,
  Crown,
  FileText,
  Gauge,
  Home,
  RefreshCw,
  Server,
  Shield,
  ShieldCheck,
  ShoppingCart,
  Trophy,
  Video,
  Users,
  XCircle,
} from "lucide-react";
import { Layout } from "../components/layout/Layout";
import { StoreManager } from "../components/admin/StoreManager";
import { RankingManager } from "../components/admin/RankingManager";
import { TournamentManager } from "../components/admin/TournamentManager";
import { NewsManager } from "../components/admin/NewsManager";
import { HomeManager } from "../components/admin/HomeManager";
import { AdminCreators } from "../components/admin/AdminCreators";
import { SettingsSectionCard } from "../components/settings/SettingsSectionCard";
import { SettingsSidebar, SettingsNavItem } from "../components/settings/SettingsSidebar";
import { SettingsStatusBadge } from "../components/settings/SettingsStatusBadge";
import { SettingsTabHeader } from "../components/settings/SettingsTabHeader";
import { useAuth } from "../context/AuthContext";
import { hasAbsoluteAdminAccess } from "../utils/permissions";
import {
  API_BASE_URL,
  buildApiUrl,
  getHealth,
  getOverview,
  getRanking,
} from "../services/api";
import { getStoreItems } from "../services/storeService";
import { getTournamentItems } from "../services/tournamentsService";
import {
  getDiscordEvents,
  getDiscordGuild,
  getDiscordMembers,
  getDiscordMetrics,
  getDiscordRoles,
  getDiscordStatus,
} from "../services/adminService";

type DiagnosticStatus = "idle" | "loading" | "online" | "offline";

interface DiagnosticResult {
  label: string;
  endpoint: string;
  ok: boolean;
  detail: string;
}

type DiscordMember = {
  discord_id: string | number;
  username?: string;
  discord_username?: string;
  global_name?: string;
  display_name?: string;
  nick?: string;
  avatar_url?: string;
  status?: string;
  role_ids?: Array<string | number>;
  roles_json?: Array<{ id?: string | number; name?: string }> | Record<string, unknown>;
  is_admin?: boolean;
  is_moderator?: boolean;
  can_access_dashboard?: boolean;
  is_bot?: boolean;
  xp?: number;
  level?: number;
  coins?: number;
};

type DiscordRole = {
  role_id: string | number;
  name: string;
  color?: string;
  position?: number;
  mentionable?: boolean;
  permissions?: string[];
};

type DiscordEvent = {
  id?: string | number;
  event_type?: string;
  discord_id?: string | number;
  channel_id?: string | number;
  created_at?: string;
};

const checks = [
  {
    label: "Saude da API",
    endpoint: "/health",
    run: async () => {
      const data = await getHealth();
      return {
        ok: data.status === "online",
        detail: data.status === "online" ? "API respondeu online" : "Sem resposta online",
      };
    },
  },
  {
    label: "Overview publico",
    endpoint: "/public/overview",
    run: async () => {
      const data = await getOverview();
      return {
        ok: data.api === "online",
        detail: `${data.users_total} usuarios, ${data.products_total} produtos, ${data.tournaments_total} torneios`,
      };
    },
  },
  {
    label: "Ranking",
    endpoint: "/public/ranking?limit=5",
    run: async () => {
      const data = await getRanking(5);
      return { ok: true, detail: `${data.length} registros carregados` };
    },
  },
  {
    label: "Loja",
    endpoint: "supabase://store_items",
    run: async () => {
      const data = await getStoreItems();
      return { ok: true, detail: `${data.length} produtos carregados` };
    },
  },
  {
    label: "Torneios",
    endpoint: "supabase://tournament_items",
    run: async () => {
      const data = await getTournamentItems();
      return { ok: true, detail: `${data.length} torneios carregados` };
    },
  },
];

const settingsTabs: SettingsNavItem[] = [
  { id: "admin", label: "Central Admin", description: "Acesso absoluto", icon: Shield, adminOnly: true },
  { id: "home", label: "Home/Landing", description: "Hero e destaques", icon: Home },
  { id: "noticias", label: "Noticias", description: "Comunicados oficiais", icon: FileText },
  { id: "loja", label: "Gestao de Loja", description: "Produtos e economia", icon: ShoppingCart },
  { id: "ranking", label: "Gestao de Ranking", description: "Placares e jogadores", icon: Crown },
  { id: "campeonatos", label: "Gestao de Campeonatos", description: "Torneios e temporadas", icon: Trophy },
  { id: "criadores", label: "Criadores STG", description: "Canais e lives", icon: Video },
  { id: "membros", label: "Gestao de Membros", description: "Usuarios sincronizados", icon: Users },
  { id: "cargos", label: "Gestao de Cargos", description: "Roles e permissoes", icon: ShieldCheck },
  { id: "api", label: "Gestao de API", description: "Diagnostico seguro", icon: Server, adminOnly: true },
  { id: "bot", label: "Gestao de Bot", description: "Status publico", icon: Bot, adminOnly: true },
];

function roleBadge(member: DiscordMember) {
  if (member.is_admin) return "ADMIN";
  if (member.is_moderator) return "MODERADOR";
  if (member.can_access_dashboard) return "STAFF";
  return member.is_bot ? "BOT" : "MEMBRO";
}

function roleNames(member: DiscordMember) {
  if (Array.isArray(member.roles_json)) {
    return member.roles_json.map((role) => role.name).filter(Boolean).join(", ");
  }
  return member.role_ids?.join(", ") || "Sem cargos sincronizados";
}

function displayName(member: DiscordMember) {
  return member.display_name || member.global_name || member.username || member.discord_username || member.nick || "Membro";
}

function formatDate(value?: string) {
  if (!value) return "N/A";
  return new Date(value).toLocaleString("pt-BR");
}

function RestrictedTab() {
  return (
    <SettingsSectionCard title="Acesso restrito" description="Esta aba contem diagnosticos sensiveis e fica limitada a administradores.">
      <div className="flex items-start gap-3 border border-[#f97316]/30 bg-[#f97316]/10 p-4 text-sm text-[#fed7aa]">
        <AlertCircle className="mt-0.5 shrink-0" size={18} />
        <p>Moderadores continuam com acesso as gestoes operacionais permitidas, mas API e Bot nao exibem controles administrativos.</p>
      </div>
    </SettingsSectionCard>
  );
}

function ContentManagementTab({
  type,
}: {
  type: "loja" | "ranking" | "campeonatos" | "noticias" | "home";
}) {
  const config = {
    loja: {
      icon: ShoppingCart,
      eyebrow: "Conteudo comercial",
      title: "Gestao de Loja",
      description: "Produtos, imagens, precos em STG Coins/BRL, descontos, estoque, destaque e status.",
      body: <StoreManager />,
    },
    ranking: {
      icon: Crown,
      eyebrow: "Competitivo",
      title: "Gestao de Ranking",
      description: "Registros do ranking com avatar, pontos, vitorias, derrotas, KD, nivel e status.",
      body: <RankingManager />,
    },
    campeonatos: {
      icon: Trophy,
      eyebrow: "Competicoes STG",
      title: "Gestao de Campeonatos",
      description: "Torneios, temporadas, banners, status, datas, premiacao, prioridade e destaque na landing.",
      body: <TournamentManager />,
    },
    noticias: {
      icon: Activity,
      eyebrow: "Banners e comunicados",
      title: "Gestao de Noticias",
      description: "Anuncios, temporadas, torneios, novidades do sistema e novidades do jogo exibidas em Noticias.",
      body: <NewsManager />,
    },
    home: {
      icon: Activity,
      eyebrow: "Landing",
      title: "Gestao da Home",
      description: "Banners proprios da pagina inicial e destaques visuais publicados pelo sistema.",
      body: <HomeManager />,
    },
  }[type];

  return (
    <div className="space-y-5">
      <SettingsTabHeader icon={config.icon} eyebrow={config.eyebrow} title={config.title} description={config.description} />
      <div className="grid gap-4 md:grid-cols-3">
        <SettingsSectionCard>
          <SettingsStatusBadge tone="purple">Modal de edicao</SettingsStatusBadge>
          <p className="mt-3 text-sm text-[#94a3b8]">Criacao e edicao abrem em modal/card, sem formulario fixo ocupando a pagina.</p>
        </SettingsSectionCard>
        <SettingsSectionCard>
          <SettingsStatusBadge tone="green">Banco direto</SettingsStatusBadge>
          <p className="mt-3 text-sm text-[#94a3b8]">Loja e campeonatos usam Supabase com permissoes RLS vinculadas ao login Discord.</p>
        </SettingsSectionCard>
        <SettingsSectionCard>
          <SettingsStatusBadge tone="blue">Acoes agrupadas</SettingsStatusBadge>
          <p className="mt-3 text-sm text-[#94a3b8]">Editar e excluir ficam agrupados em menu por item para reduzir botoes visiveis.</p>
        </SettingsSectionCard>
      </div>
      {config.body}
    </div>
  );
}

function MembersTab() {
  const [members, setMembers] = useState<DiscordMember[]>([]);
  const [roles, setRoles] = useState<DiscordRole[]>([]);
  const [events, setEvents] = useState<DiscordEvent[]>([]);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("todos");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setRefreshing(true);
    try {
      setError(null);
      const [memberData, roleData, eventData] = await Promise.all([
        getDiscordMembers({ limit: 200 }),
        getDiscordRoles({ limit: 200 }),
        getDiscordEvents({ limit: 20 }),
      ]);
      setMembers(memberData ?? []);
      setRoles(roleData ?? []);
      setEvents(eventData?.events ?? []);
    } catch {
      setError("Rotas administrativas de membros ainda nao disponiveis na API.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const filteredMembers = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return members.filter((member) => {
      const permissionMatch =
        filter === "todos" ||
        (filter === "admin" && member.is_admin) ||
        (filter === "moderador" && member.is_moderator) ||
        (filter === "staff" && member.can_access_dashboard) ||
        (filter === "bot" && member.is_bot) ||
        (filter === "membro" && !member.is_admin && !member.is_moderator && !member.can_access_dashboard && !member.is_bot);

      if (!permissionMatch) return false;
      if (!normalizedQuery) return true;

      return [member.discord_id, member.display_name, member.username, member.discord_username, member.global_name, member.nick]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(normalizedQuery));
    });
  }, [filter, members, query]);

  return (
    <div className="space-y-5">
      <SettingsTabHeader
        icon={Users}
        eyebrow="Usuarios e comunidade"
        title="Gestao de Membros"
        description="Centraliza membros sincronizados pela API segura. Edicao real depende dos endpoints administrativos do Replit."
        action={
          <button
            type="button"
            onClick={() => void loadData()}
            className="stg-button-primary inline-flex items-center gap-2 disabled:opacity-60"
            disabled={refreshing}
          >
            <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
            Atualizar
          </button>
        }
      />

      <div className="grid gap-4 md:grid-cols-3">
        {[
          ["Membros", members.length, "purple"],
          ["Cargos", roles.length, "green"],
          ["Eventos", events.length, "blue"],
        ].map(([label, value, tone]) => (
          <SettingsSectionCard key={String(label)}>
            <SettingsStatusBadge tone={tone as "green" | "purple" | "blue"}>{label}</SettingsStatusBadge>
            <p className="mt-3 text-3xl font-black text-white">{String(value)}</p>
          </SettingsSectionCard>
        ))}
      </div>

      {error && <div className="border border-[#f97316]/35 bg-[#f97316]/10 p-4 text-sm font-bold text-[#fed7aa]">{error}</div>}

      <SettingsSectionCard title="Lista de membros" description="Busca, filtros e leitura de permissoes sincronizadas. Alteracoes reais exigem endpoint de escrita.">
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar por nome ou Discord ID"
            className="w-full border border-[#a855f7]/20 bg-[#111827] px-4 py-3 text-sm font-bold text-white outline-none placeholder:text-[#64748b] focus:border-[#a855f7]/55"
          />
          <select
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
            className="border border-[#a855f7]/20 bg-[#111827] px-4 py-3 text-sm font-black uppercase text-white outline-none focus:border-[#a855f7]/55"
          >
            <option value="todos">Todos</option>
            <option value="admin">Admin</option>
            <option value="moderador">Moderador</option>
            <option value="staff">Staff</option>
            <option value="membro">Membro</option>
            <option value="bot">Bot</option>
          </select>
        </div>

        {loading ? (
          <div className="p-8 text-center text-[#94a3b8]">Carregando membros sincronizados...</div>
        ) : filteredMembers.length === 0 ? (
          <div className="p-8 text-center text-[#94a3b8]">Nenhum membro encontrado. Aguarde a sincronizacao da API ou ajuste os filtros.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-left text-sm">
              <thead className="border-b border-[#a855f7]/20 text-xs uppercase tracking-[0.08em] text-[#94a3b8]">
                <tr>
                  <th className="py-3 pr-4">Membro</th>
                  <th className="py-3 pr-4">Discord ID</th>
                  <th className="py-3 pr-4">Permissao</th>
                  <th className="py-3 pr-4">Status</th>
                  <th className="py-3 pr-4">Cargos</th>
                </tr>
              </thead>
              <tbody>
                {filteredMembers.map((member) => {
                  const name = displayName(member);
                  return (
                    <tr key={String(member.discord_id)} className="border-b border-[#a855f7]/10">
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={member.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=a855f7&color=fff`}
                            alt={name}
                            className="size-10 rounded-full border border-[#a855f7]/40 object-cover"
                          />
                          <div>
                            <p className="font-black text-white">{name}</p>
                            <p className="text-xs text-[#94a3b8]">{member.discord_username || member.username || "Discord"}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 pr-4 font-mono text-[#c4b5fd]">{member.discord_id}</td>
                      <td className="py-3 pr-4"><SettingsStatusBadge tone={member.is_admin ? "orange" : "purple"}>{roleBadge(member)}</SettingsStatusBadge></td>
                      <td className="py-3 pr-4 text-[#94a3b8]">{member.status || "N/A"}</td>
                      <td className="max-w-[320px] truncate py-3 pr-4 text-[#94a3b8]" title={roleNames(member)}>{roleNames(member)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </SettingsSectionCard>
    </div>
  );
}

function RolesTab() {
  const [roles, setRoles] = useState<DiscordRole[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadRoles = async () => {
      setLoading(true);
      const roleData = await getDiscordRoles({ limit: 200 });
      setRoles(roleData ?? []);
      setLoading(false);
    };
    void loadRoles();
  }, []);

  return (
    <div className="space-y-5">
      <SettingsTabHeader
        icon={ShieldCheck}
        eyebrow="Permissoes"
        title="Gestao de Cargos"
        description="Visualizacao de cargos sincronizados. Alterar cargos reais do Discord exige endpoint seguro na API."
      />
      <SettingsSectionCard title="Cargos sincronizados" description="Nome, ID, cor, prioridade e estado de sincronizacao. Nenhum token Discord e exibido.">
        {loading ? (
          <div className="p-8 text-center text-[#94a3b8]">Carregando cargos...</div>
        ) : roles.length === 0 ? (
          <div className="border border-[#f97316]/30 bg-[#f97316]/10 p-4 text-sm text-[#fed7aa]">
            Nenhum cargo retornado pela API. A interface fica preparada para integracao futura.
          </div>
        ) : (
          <div className="grid gap-3">
            {roles.map((role) => (
              <div key={String(role.role_id)} className="flex flex-col gap-3 border border-[#a855f7]/15 bg-[#050608]/55 p-4 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-3">
                  <span className="size-4 rounded-full border border-white/20" style={{ backgroundColor: role.color || "#a855f7" }} />
                  <div>
                    <p className="font-black uppercase text-white">{role.name}</p>
                    <p className="font-mono text-xs text-[#94a3b8]">{role.role_id}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <SettingsStatusBadge tone="purple">Prioridade {role.position ?? "N/A"}</SettingsStatusBadge>
                  <SettingsStatusBadge tone={role.mentionable ? "green" : "blue"}>{role.mentionable ? "Mencionavel" : "Restrito"}</SettingsStatusBadge>
                </div>
              </div>
            ))}
          </div>
        )}
      </SettingsSectionCard>
    </div>
  );
}

function ApiTab() {
  const [apiStatus, setApiStatus] = useState<"online" | "offline">("offline");
  const [status, setStatus] = useState<DiagnosticStatus>("idle");
  const [results, setResults] = useState<DiagnosticResult[]>([]);
  const [lastRun, setLastRun] = useState<string | null>(null);
  const connectionMode = useMemo(() => API_BASE_URL || "Nao configurada", []);

  const runChecks = useCallback(async () => {
    setStatus("loading");
    const startedAt = performance.now();
    const settled = await Promise.all(
      checks.map(async (check): Promise<DiagnosticResult> => {
        try {
          const result = await check.run();
          return { label: check.label, endpoint: check.endpoint, ok: result.ok, detail: result.detail };
        } catch (error) {
          return {
            label: check.label,
            endpoint: check.endpoint,
            ok: false,
            detail: error instanceof Error ? error.message : "Falha desconhecida",
          };
        }
      })
    );
    const elapsed = Math.round(performance.now() - startedAt);
    const healthResult = settled.find((result) => result.endpoint === "/health");
    setApiStatus(healthResult?.ok ? "online" : "offline");
    setResults(settled.map((result) => result.endpoint === "/health" ? { ...result, detail: `${result.detail} em ${elapsed}ms` } : result));
    setStatus(settled.some((result) => result.ok) ? "online" : "offline");
    setLastRun(new Date().toLocaleString("pt-BR"));
  }, []);

  useEffect(() => {
    void runChecks();
  }, [runChecks]);

  const onlineCount = results.filter((result) => result.ok).length;

  return (
    <div className="space-y-5">
      <SettingsTabHeader
        icon={Server}
        eyebrow="Infraestrutura"
        title="Gestao de API"
        description="Diagnostico da API Replit consumida por VITE_API_BASE_URL. Tokens e secrets nao sao exibidos nem editados."
        action={
          <button type="button" onClick={() => void runChecks()} disabled={status === "loading"} className="stg-button-primary inline-flex items-center gap-2 disabled:opacity-60">
            <RefreshCw size={16} className={status === "loading" ? "animate-spin" : ""} />
            Testar conexao
          </button>
        }
      />
      <div className="grid gap-4 md:grid-cols-3">
        <SettingsSectionCard>
          <SettingsStatusBadge tone={apiStatus === "online" ? "green" : "red"}>{status === "loading" ? "Validando" : apiStatus}</SettingsStatusBadge>
          <p className="mt-3 text-sm text-[#94a3b8]">{onlineCount}/{checks.length} verificacoes respondendo</p>
        </SettingsSectionCard>
        <SettingsSectionCard>
          <SettingsStatusBadge tone="blue">VITE_API_BASE_URL</SettingsStatusBadge>
          <p className="mt-3 break-all text-sm font-bold text-white">{connectionMode}</p>
        </SettingsSectionCard>
        <SettingsSectionCard>
          <SettingsStatusBadge tone="orange">Ultima verificacao</SettingsStatusBadge>
          <p className="mt-3 text-sm font-bold text-white">{lastRun || "Aguardando primeira validacao"}</p>
        </SettingsSectionCard>
      </div>
      <SettingsSectionCard title="Endpoints em teste" description="Somente endpoints publicos/seguros sao chamados pelo frontend.">
        <div className="divide-y divide-[#7c3aed]/20">
          {(results.length > 0 ? results : checks.map((check) => ({ label: check.label, endpoint: check.endpoint, ok: false, detail: "Aguardando validacao" }))).map((result) => (
            <div key={result.endpoint} className="grid gap-3 py-4 md:grid-cols-[220px_1fr_220px] md:items-center">
              <div className="flex items-center gap-3">
                {result.ok ? <CheckCircle2 className="text-[#84cc16]" size={20} /> : <XCircle className="text-[#ef4444]" size={20} />}
                <span className="font-black uppercase text-[#f8fafc]">{result.label}</span>
              </div>
              <code className="break-all rounded-md border border-[#1e293b] bg-[#0f172a] px-3 py-2 text-xs text-[#94a3b8]">
                {result.endpoint.startsWith("supabase://") ? result.endpoint : buildApiUrl(result.endpoint)}
              </code>
              <p className={result.ok ? "text-sm font-bold text-[#84cc16]" : "text-sm font-bold text-[#ef4444]"}>{result.detail}</p>
            </div>
          ))}
        </div>
      </SettingsSectionCard>
    </div>
  );
}

function BotTab() {
  const [metrics, setMetrics] = useState<Record<string, unknown> | null>(null);
  const [status, setStatus] = useState<Record<string, unknown> | null>(null);
  const [guild, setGuild] = useState<Record<string, unknown> | null>(null);
  const [events, setEvents] = useState<DiscordEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const loadBot = useCallback(async () => {
    setLoading(true);
    const [statusData, metricsData, guildData, eventData] = await Promise.all([
      getDiscordStatus(),
      getDiscordMetrics(),
      getDiscordGuild(),
      getDiscordEvents({ limit: 8 }),
    ]);
    setStatus((statusData ?? null) as Record<string, unknown> | null);
    setMetrics((metricsData ?? null) as Record<string, unknown> | null);
    setGuild((guildData ?? null) as Record<string, unknown> | null);
    setEvents(eventData?.events ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    void loadBot();
  }, [loadBot]);

  const botOnline = Boolean(status?.bot_online ?? metrics?.bot_online);

  return (
    <div className="space-y-5">
      <SettingsTabHeader
        icon={Bot}
        eyebrow="Discord seguro"
        title="Gestao de Bot"
        description="Status publico do bot via API. O frontend nao chama comandos diretos do bot e nao carrega tokens."
        action={
          <button type="button" onClick={() => void loadBot()} disabled={loading} className="stg-button-primary inline-flex items-center gap-2 disabled:opacity-60">
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            Atualizar dados
          </button>
        }
      />
      <div className="grid gap-4 md:grid-cols-4">
        <SettingsSectionCard>
          <SettingsStatusBadge tone={botOnline ? "green" : "red"}>{botOnline ? "Online" : "Offline/indisponivel"}</SettingsStatusBadge>
          <p className="mt-3 text-sm text-[#94a3b8]">Status retornado pela API administrativa.</p>
        </SettingsSectionCard>
        <SettingsSectionCard>
          <SettingsStatusBadge tone="blue">Membros</SettingsStatusBadge>
          <p className="mt-3 text-2xl font-black text-white">{String(metrics?.member_count ?? status?.member_count ?? "N/A")}</p>
        </SettingsSectionCard>
        <SettingsSectionCard>
          <SettingsStatusBadge tone="purple">Latencia</SettingsStatusBadge>
          <p className="mt-3 text-2xl font-black text-white">{String(metrics?.bot_latency_ms ?? status?.bot_latency_ms ?? "N/A")}ms</p>
        </SettingsSectionCard>
        <SettingsSectionCard>
          <SettingsStatusBadge tone="orange">Servidor</SettingsStatusBadge>
          <p className="mt-3 truncate text-sm font-bold text-white">{String(guild?.name ?? metrics?.guild_name ?? "N/A")}</p>
        </SettingsSectionCard>
      </div>
      <SettingsSectionCard title="Eventos recentes" description="Ultimos eventos publicos retornados pela API, quando disponiveis.">
        {events.length === 0 ? (
          <div className="border border-[#f97316]/30 bg-[#f97316]/10 p-4 text-sm text-[#fed7aa]">Nenhum evento retornado. A aba permanece preparada para os endpoints reais.</div>
        ) : (
          <div className="grid gap-3">
            {events.map((event, index) => (
              <div key={String(event.id ?? index)} className="flex flex-col gap-2 border border-[#a855f7]/15 bg-[#050608]/55 p-3 md:flex-row md:items-center md:justify-between">
                <p className="font-black uppercase text-white">{event.event_type || "Evento Discord"}</p>
                <p className="font-mono text-xs text-[#94a3b8]">{formatDate(event.created_at)}</p>
              </div>
            ))}
          </div>
        )}
      </SettingsSectionCard>
    </div>
  );
}

function AdminCentralTab() {
  const navigate = useNavigate();
  const [apiStatus, setApiStatus] = useState<"online" | "offline">("offline");
  const [botStatus, setBotStatus] = useState<"online" | "offline" | "unavailable">("unavailable");
  const [loadingStatus, setLoadingStatus] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function loadStatus() {
      const [healthResult, botResult] = await Promise.allSettled([getHealth(), getDiscordStatus()]);
      if (!mounted) return;

      if (healthResult.status === "fulfilled") {
        setApiStatus(healthResult.value.status === "online" ? "online" : "offline");
      } else {
        setApiStatus("offline");
      }

      if (botResult.status === "fulfilled" && botResult.value) {
        const botPayload = botResult.value as { status?: unknown; bot_online?: unknown };
        const rawStatus = String(botPayload.status ?? "");
        const online = botPayload.bot_online === true || rawStatus.toLowerCase() === "online";
        setBotStatus(online ? "online" : "offline");
      } else {
        setBotStatus("unavailable");
      }

      setLoadingStatus(false);
    }

    void loadStatus();
    return () => {
      mounted = false;
    };
  }, []);

  const cards = [
    { title: "Home/Landing", description: "Hero, temporada atual e destaques da pagina inicial.", icon: Home, to: "/configuracoes?tab=home", tone: "purple" as const, status: "Conteudo" },
    { title: "Noticias", description: "Comunicados, novidades e banners editoriais.", icon: FileText, to: "/configuracoes?tab=noticias", tone: "blue" as const, status: "Conteudo" },
    { title: "Loja", description: "Produtos, precos, estoque e destaques comerciais no Supabase.", icon: ShoppingCart, to: "/configuracoes?tab=loja", tone: "green" as const, status: "Banco direto" },
    { title: "Torneios", description: "Campeonatos, temporadas e inscricoes no Supabase.", icon: Trophy, to: "/configuracoes?tab=campeonatos", tone: "orange" as const, status: "Banco direto" },
    { title: "Ranking", description: "Placares, operadores e estatisticas reais da API.", icon: Crown, to: "/configuracoes?tab=ranking", tone: "purple" as const, status: "Ranking" },
    { title: "Criadores", description: "Canais, lives e conteudo de criadores STG.", icon: Video, to: "/configuracoes?tab=criadores", tone: "blue" as const, status: "Criadores" },
    { title: "Membros", description: "Usuarios sincronizados, cargos e permissoes.", icon: Users, to: "/configuracoes?tab=membros", tone: "green" as const, status: "Discord" },
    { title: "Cargos", description: "Roles sincronizadas e leitura operacional.", icon: ShieldCheck, to: "/configuracoes?tab=cargos", tone: "purple" as const, status: "Roles" },
    { title: "API", description: "Diagnosticos da API oficial hospedada no Replit.", icon: Server, to: "/configuracoes?tab=api", tone: apiStatus === "online" ? "green" as const : "red" as const, status: loadingStatus ? "Validando" : apiStatus },
    { title: "Bot", description: "Status do bot Discloud e sincronizacao Discord.", icon: Bot, to: "/configuracoes?tab=bot", tone: botStatus === "online" ? "green" as const : botStatus === "offline" ? "red" as const : "orange" as const, status: loadingStatus ? "Validando" : botStatus === "unavailable" ? "Endpoint indisponivel" : botStatus },
    { title: "Moderacao", description: "Punicoes, regras e configuracoes de moderacao.", icon: Shield, to: "/moderation", tone: "orange" as const, status: "Restrito" },
    { title: "Diagnosticos", description: "Saude da API, contratos e verificacoes de integracao.", icon: Gauge, to: "/configuracoes?tab=api", tone: apiStatus === "online" ? "green" as const : "red" as const, status: "Sistema" },
  ];

  return (
    <div className="space-y-5">
      <SettingsTabHeader
        icon={Shield}
        eyebrow="Comando central"
        title="Central Admin"
        description="Acesso absoluto as areas administrativas do STG. Conteudo usa Supabase; Discord e bot continuam pela API Replit."
      />

      <div className="grid gap-4 md:grid-cols-3">
        <SettingsSectionCard>
          <SettingsStatusBadge tone={apiStatus === "online" ? "green" : "red"}>
            API {loadingStatus ? "validando" : apiStatus}
          </SettingsStatusBadge>
          <p className="mt-3 text-sm text-[#94a3b8]">Fonte oficial: Replit conectado ao Supabase.</p>
        </SettingsSectionCard>
        <SettingsSectionCard>
          <SettingsStatusBadge tone={botStatus === "online" ? "green" : botStatus === "offline" ? "red" : "orange"}>
            Bot {loadingStatus ? "validando" : botStatus === "unavailable" ? "indisponivel" : botStatus}
          </SettingsStatusBadge>
          <p className="mt-3 text-sm text-[#94a3b8]">Status via endpoint administrativo seguro.</p>
        </SettingsSectionCard>
        <SettingsSectionCard>
          <SettingsStatusBadge tone="purple">Admin absoluto</SettingsStatusBadge>
          <p className="mt-3 text-sm text-[#94a3b8]">Moderadores e staff nao recebem acesso total sem cargo admin.</p>
        </SettingsSectionCard>
      </div>

      {apiStatus === "offline" && !loadingStatus && (
        <div className="border border-[#f97316]/35 bg-[#f97316]/10 p-4 text-sm font-bold text-[#fed7aa]">
          API offline ou nao configurada. O painel continua navegavel, mas salvamentos administrativos exigem confirmacao da API Replit.
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <SettingsSectionCard key={card.title} className="h-full">
              <div className="flex h-full flex-col gap-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="tactical-edge grid size-11 shrink-0 place-items-center border border-[#a855f7]/35 bg-[#a855f7]/15 text-[#c084fc]">
                      <Icon size={20} />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-base font-black uppercase tracking-[0.06em] text-white">{card.title}</h3>
                      <p className="mt-1 text-sm text-[#94a3b8]">{card.description}</p>
                    </div>
                  </div>
                  <SettingsStatusBadge tone={card.tone}>{card.status}</SettingsStatusBadge>
                </div>
                <button
                  type="button"
                  onClick={() => navigate(card.to)}
                  className="stg-button-primary mt-auto inline-flex w-full items-center justify-center gap-2"
                >
                  Gerenciar
                </button>
              </div>
            </SettingsSectionCard>
          );
        })}
      </div>
    </div>
  );
}

export function Settings() {
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const { user, profile } = useAuth();
  const isAdmin = hasAbsoluteAdminAccess(user ?? profile);
  const activeTab = searchParams.get("tab") || (location.pathname === "/admin" ? "admin" : "loja");
  const activeConfig = settingsTabs.find((tab) => tab.id === activeTab);

  const setActiveTab = (tab: string) => {
    setSearchParams({ tab });
  };

  const renderTab = () => {
    if (activeConfig?.adminOnly && !isAdmin) return <RestrictedTab />;
    if (activeTab === "admin") return isAdmin ? <AdminCentralTab /> : <RestrictedTab />;
    if (activeTab === "loja") return <ContentManagementTab type="loja" />;
    if (activeTab === "ranking") return <ContentManagementTab type="ranking" />;
    if (activeTab === "campeonatos") return <ContentManagementTab type="campeonatos" />;
    if (activeTab === "criadores") {
      return (
        <div className="space-y-5">
          <SettingsTabHeader
            icon={Video}
            eyebrow="Conteudo e comunidade"
            title="Criadores de Conteudo STG"
            description="Vincule membros com cargo de criador, canais YouTube/Twitch/Kick/TikTok e verifique lives/videos via API."
          />
          <AdminCreators />
        </div>
      );
    }
    if (activeTab === "membros") return <MembersTab />;
    if (activeTab === "cargos") return <RolesTab />;
    if (activeTab === "api") return <ApiTab />;
    if (activeTab === "bot") return <BotTab />;
    if (activeTab === "noticias") return <ContentManagementTab type="noticias" />;
    if (activeTab === "home") return <ContentManagementTab type="home" />;
    return <ContentManagementTab type="loja" />;
  };

  return (
    <Layout>
      <div className="max-w-7xl space-y-6">
        <div className="cod-military-bg rounded-lg border-2 border-[#a855f7]/50 p-6">
          <div className="mb-2 flex items-center gap-3">
            <Shield className="text-[#a855f7]" size={28} />
            <h1 className="cod-header-highlight">CONFIGURACOES</h1>
          </div>
          <p className="ml-11 text-sm text-[#94a3b8]">
            Painel centralizado de administracao STG. Todas as gestoes ficam dentro desta janela.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[290px_minmax(0,1fr)]">
          <SettingsSidebar items={settingsTabs} activeTab={activeTab} onSelect={setActiveTab} isAdmin={isAdmin} />
          <main key={activeTab} className="min-w-0 animate-[settings-slide_220ms_ease-out] space-y-5">
            {renderTab()}
          </main>
        </div>
      </div>
    </Layout>
  );
}
