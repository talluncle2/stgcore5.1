import { useCallback, useEffect, useMemo, useState } from "react";
import { Copy, RefreshCw, Search, ShieldCheck, Users } from "lucide-react";
import { Layout } from "../components/layout/Layout";
import {
  getDiscordEvents,
  getDiscordMembers,
  getDiscordRoles,
} from "../services/adminService";

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
};

type DiscordRole = {
  role_id: string | number;
  name: string;
  color?: string;
  position?: number;
  mentionable?: boolean;
};

type DiscordEvent = {
  id?: string | number;
  event_type?: string;
  discord_id?: string | number;
  channel_id?: string | number;
  created_at?: string;
};

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

function formatDate(value?: string) {
  if (!value) return "N/A";
  return new Date(value).toLocaleString("pt-BR");
}

export function Admin() {
  const [members, setMembers] = useState<DiscordMember[]>([]);
  const [roles, setRoles] = useState<DiscordRole[]>([]);
  const [events, setEvents] = useState<DiscordEvent[]>([]);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("todos");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
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
    } catch (err) {
      console.error("Failed to load admin data:", err);
      setError("Rota administrativa ainda nao disponivel na API.");
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

      return [
        member.discord_id,
        member.display_name,
        member.username,
        member.discord_username,
        member.global_name,
        member.nick,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(normalizedQuery));
    });
  }, [filter, members, query]);

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 border border-[#a855f7]/20 bg-[#050608]/70 p-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="tactical-label">Administracao Discord</p>
            <h2 className="text-xl font-black uppercase tracking-[0.06em] text-white">
              Membros, cargos e eventos reais
            </h2>
            <p className="mt-1 text-sm text-[#94a3b8]">
              Dados lidos das rotas seguras `/admin/discord/*`, sem chave do bot no frontend.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setRefreshing(true);
              void loadData();
            }}
            className="tactical-edge inline-flex items-center justify-center gap-2 border border-[#a855f7]/40 bg-[#a855f7]/15 px-4 py-2 text-sm font-black uppercase tracking-[0.08em] text-white transition-colors hover:bg-[#a855f7]/25"
          >
            <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
            Atualizar dados
          </button>
        </div>

        {error && (
          <div className="border border-[#f97316]/35 bg-[#f97316]/10 p-4 text-sm font-bold text-[#fed7aa]">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {[
            ["Membros", members.length, Users],
            ["Cargos", roles.length, ShieldCheck],
            ["Eventos", events.length, RefreshCw],
          ].map(([label, value, Icon]) => (
            <div key={String(label)} className="stg-hud-panel p-4">
              <div className="mb-3 flex items-center gap-2 text-[#a855f7]">
                <Icon size={18} />
                <p className="tactical-label">{label}</p>
              </div>
              <p className="text-3xl font-black text-white">{String(value)}</p>
            </div>
          ))}
        </div>

        <section className="stg-hud-panel-glow p-5">
          <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="relative min-w-0 flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748b]" size={18} />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Buscar por nome ou Discord ID"
                className="w-full border border-[#a855f7]/20 bg-[#111827] py-3 pl-10 pr-4 text-sm font-bold text-white outline-none placeholder:text-[#64748b] focus:border-[#a855f7]/55"
              />
            </div>
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
            <div className="p-8 text-center text-[#94a3b8]">
              Nenhum membro encontrado. Aguarde a sincronizacao do bot ou ajuste os filtros.
            </div>
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
                    <th className="py-3 pr-4">Acao</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMembers.map((member) => {
                    const displayName =
                      member.display_name ||
                      member.global_name ||
                      member.username ||
                      member.discord_username ||
                      "Membro";
                    return (
                      <tr key={String(member.discord_id)} className="border-b border-[#a855f7]/10">
                        <td className="py-3 pr-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={
                                member.avatar_url ||
                                `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=a855f7&color=fff`
                              }
                              alt={displayName}
                              className="size-10 rounded-full border border-[#a855f7]/40 object-cover"
                            />
                            <div>
                              <p className="font-black text-white">{displayName}</p>
                              <p className="text-xs text-[#94a3b8]">{member.discord_username || member.username || "Discord"}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 pr-4 font-mono text-[#c4b5fd]">{member.discord_id}</td>
                        <td className="py-3 pr-4">
                          <span className="border border-[#a855f7]/30 bg-[#a855f7]/15 px-2 py-1 text-xs font-black text-white">
                            {roleBadge(member)}
                          </span>
                        </td>
                        <td className="py-3 pr-4 text-[#94a3b8]">{member.status || "N/A"}</td>
                        <td className="max-w-[280px] truncate py-3 pr-4 text-[#94a3b8]" title={roleNames(member)}>
                          {roleNames(member)}
                        </td>
                        <td className="py-3 pr-4">
                          <button
                            type="button"
                            onClick={() => navigator.clipboard.writeText(String(member.discord_id))}
                            className="tactical-edge inline-flex items-center gap-2 border border-[#a855f7]/25 bg-[#111827]/80 px-3 py-2 text-xs font-black uppercase text-[#c4b5fd] hover:border-[#a855f7]/55"
                          >
                            <Copy size={14} />
                            Copiar ID
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <section className="stg-hud-panel-glow p-5">
            <h3 className="mb-4 text-lg font-black uppercase tracking-[0.06em] text-white">Cargos reais</h3>
            <div className="max-h-96 space-y-2 overflow-y-auto pr-1">
              {roles.length === 0 ? (
                <p className="text-sm text-[#94a3b8]">Nenhum cargo sincronizado ainda.</p>
              ) : (
                roles.map((role) => (
                  <div key={String(role.role_id)} className="flex items-center justify-between border border-[#a855f7]/10 bg-[#111827]/55 p-3">
                    <div>
                      <p className="font-black text-white">{role.name}</p>
                      <p className="text-xs text-[#94a3b8]">{role.role_id}</p>
                    </div>
                    <span className="text-xs font-bold text-[#94a3b8]">#{role.position ?? 0}</span>
                  </div>
                ))
              )}
            </div>
          </section>

          <section className="stg-hud-panel-glow p-5">
            <h3 className="mb-4 text-lg font-black uppercase tracking-[0.06em] text-white">Ultimos eventos</h3>
            <div className="max-h-96 space-y-2 overflow-y-auto pr-1">
              {events.length === 0 ? (
                <p className="text-sm text-[#94a3b8]">Nenhum evento sincronizado ainda.</p>
              ) : (
                events.map((event) => (
                  <div key={String(event.id ?? `${event.event_type}-${event.created_at}`)} className="border border-[#a855f7]/10 bg-[#111827]/55 p-3">
                    <p className="font-black uppercase text-white">{event.event_type || "evento"}</p>
                    <p className="text-xs text-[#94a3b8]">
                      {event.discord_id ? `Discord ${event.discord_id} - ` : ""}
                      {formatDate(event.created_at)}
                    </p>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      </div>
    </Layout>
  );
}
