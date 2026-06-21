import { useEffect, useMemo, useState } from "react";
import {
  Calendar,
  CheckCircle2,
  Crosshair,
  Lock,
  Medal,
  Radio,
  Shield,
  Skull,
  Swords,
  Trophy,
  Users,
  XCircle,
} from "lucide-react";
import { Layout } from "../components/layout/Layout";
import { useAuth } from "../context/AuthContext";
import { getTournamentItems } from "../services/tournamentsService";
import {
  calculateWarzoneMetrics,
  getWarzoneParticipations,
  getWarzoneOperations,
  registerForWarzoneOperation,
} from "../services/warzoneOperationsService";
import { TournamentItem } from "../types/api";
import { WarzoneOperation } from "../types/warzone";
import { getOperatorClanTag, getParticipationReason } from "../utils/warzonePermissions";
import { modeLabels, statusLabels } from "../components/tournaments/WarzoneOperationCard";

function formatDate(value?: string) {
  if (!value) return "A definir";
  return new Date(value).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function statusClass(status: WarzoneOperation["status"]) {
  if (status === "inscricoes_abertas") return "stg-badge-success";
  if (status === "em_andamento") return "stg-badge-warning";
  if (status === "encerrado" || status === "cancelado") return "stg-badge-danger";
  return "stg-badge-info";
}

function tournamentStatusClass(value?: string) {
  const normalized = String(value || "").toLowerCase();
  if (["ativo", "aprovado", "inscricoes_abertas", "em_andamento"].includes(normalized)) return "stg-badge-success";
  if (["encerrado", "rejeitado", "cancelado"].includes(normalized)) return "stg-badge-danger";
  if (["em_breve", "pendente"].includes(normalized)) return "stg-badge-warning";
  return "stg-badge-info";
}

function metricCard(label: string, value: string | number, icon: React.ReactNode) {
  return (
    <div className="stg-hud-panel p-4">
      <div className="mb-3 flex items-center justify-between text-[#94a3b8]">
        <span className="text-xs font-black uppercase tracking-[0.12em]">{label}</span>
        <span className="text-[#84cc16]">{icon}</span>
      </div>
      <div className="text-2xl font-black text-[#f8fafc]">{value}</div>
    </div>
  );
}

export function Tournaments() {
  const { user, isAuthenticated, loginWithDiscord } = useAuth();
  const [operations, setOperations] = useState<WarzoneOperation[]>([]);
  const [tournaments, setTournaments] = useState<TournamentItem[]>([]);
  const [selectedOperationId, setSelectedOperationId] = useState("");
  const [registeredIds, setRegisteredIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState<string | null>(null);

  const operatorTag = getOperatorClanTag(user);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const [operationItems, tournamentItems] = await Promise.all([
        getWarzoneOperations(),
        getTournamentItems(),
      ]);
      const activeOperations = operationItems
        .filter((operation) => operation.isActive)
        .sort((a, b) => b.priority - a.priority || b.createdAt.localeCompare(a.createdAt));
      setOperations(activeOperations);
      setTournaments(
        tournamentItems
          .filter((tournament) => tournament.isActive)
          .sort((a, b) => b.priority - a.priority || b.createdAt.localeCompare(a.createdAt))
      );
      setSelectedOperationId((current) => current || activeOperations[0]?.id || "");

      if (user?.discord_id) {
        const participations = await getWarzoneParticipations(String(user.discord_id));
        setRegisteredIds(new Set(participations.map((item) => item.operationId)));
      }
      setLoading(false);
    }
    void load();
  }, [user?.discord_id, user?.id]);

  const selectedOperation = useMemo(
    () => operations.find((operation) => operation.id === selectedOperationId) || operations[0] || null,
    [operations, selectedOperationId]
  );

  const metrics = useMemo(() => calculateWarzoneMetrics(operations), [operations]);
  const permission = selectedOperation
    ? getParticipationReason(selectedOperation.allowedClans, operatorTag)
    : { allowed: false, message: "Nenhuma operacao selecionada." };
  const alreadyJoined = selectedOperation ? registeredIds.has(selectedOperation.id) : false;

  async function handleJoin() {
    if (!selectedOperation) return;
    if (!isAuthenticated || !user) {
      loginWithDiscord();
      return;
    }
    if (!permission.allowed) {
      setNotice(permission.message);
      return;
    }

    const discordId = String(user.discord_id || "");
    if (!discordId) {
      setNotice("Nao foi possivel validar seu Discord. Entre novamente.");
      return;
    }
    await registerForWarzoneOperation(selectedOperation.id, discordId, operatorTag || "ALL");
    setRegisteredIds((current) => new Set(current).add(selectedOperation.id));
    setOperations((current) =>
      current.map((operation) =>
        operation.id === selectedOperation.id
          ? { ...operation, participants: operation.participants + 1 }
          : operation
      )
    );
    setNotice(`Participacao confirmada em ${selectedOperation.title}.`);
  }

  if (loading) {
    return (
      <Layout>
        <div className="py-20 text-center">
          <div className="inline-block animate-spin">
            <div className="size-10 rounded-full border-4 border-[#a855f7] border-t-[#84cc16]" />
          </div>
          <p className="mt-4 text-[#94a3b8]">Carregando operacoes Warzone...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="flex flex-col gap-8">
        <section className="relative overflow-hidden border border-[#a855f7]/25 bg-[#020617] p-6 shadow-[0_0_55px_rgba(168,85,247,0.12)] md:p-8">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(132,204,22,0.16),transparent_32%),radial-gradient(circle_at_bottom_left,rgba(168,85,247,0.2),transparent_36%)]" />
          <div className="relative grid gap-8 lg:grid-cols-[1.25fr_0.75fr] lg:items-end">
            <div>
              <p className="tactical-label mb-3">STG Warzone Competitive Platform</p>
              <h1 className="max-w-4xl text-4xl font-black uppercase tracking-[0.08em] text-[#f8fafc] md:text-6xl">
                Central de Operacoes Warzone
              </h1>
              <p className="mt-4 max-w-3xl text-sm leading-7 text-[#94a3b8] md:text-base">
                Partidas personalizadas, eventos cla x cla, permissao automatica por tag e resultados consolidados.
              </p>
            </div>

            <div className="stg-hud-panel p-5">
              <p className="mb-3 text-xs font-black uppercase tracking-[0.12em] text-[#94a3b8]">Identidade competitiva</p>
              <div className="flex items-center gap-3">
                <div className={`flex size-12 items-center justify-center border text-lg font-black ${operatorTag ? "border-[#84cc16]/45 bg-[#84cc16]/10 text-[#bbf7d0]" : "border-[#f97316]/45 bg-[#f97316]/10 text-[#fed7aa]"}`}>
                  {operatorTag || "?"}
                </div>
                <div>
                  <div className="font-black uppercase tracking-[0.06em] text-[#f8fafc]">
                    {operatorTag ? `[${operatorTag}] Operador autorizado` : "Tag de cla nao identificada"}
                  </div>
                  <div className="text-xs text-[#94a3b8]">
                    A tag vem do perfil ou dos cargos sincronizados pelo Discord.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {notice && (
          <div className="border border-[#a855f7]/30 bg-[#a855f7]/10 p-4 text-sm font-bold text-[#e9d5ff]">
            {notice}
          </div>
        )}

        <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {metricCard("Eventos encerrados", metrics.totalEvents, <Trophy size={20} />)}
          {metricCard("Kills registradas", metrics.totalKills.toLocaleString("pt-BR"), <Skull size={20} />)}
          {metricCard("MVPs registrados", metrics.totalMvps, <Swords size={20} />)}
          {metricCard("Ultimo campeao", metrics.history[0]?.result?.winnerClan || "-", <Medal size={20} />)}
        </section>

        {selectedOperation ? (
          <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
            <div className="flex flex-col gap-4">
              <div>
                <p className="tactical-label mb-2">Operacoes disponiveis</p>
                <h2 className="text-2xl font-black uppercase tracking-[0.08em] text-[#f8fafc]">Eventos Warzone</h2>
              </div>

              {operations.map((operation) => {
                const active = selectedOperation.id === operation.id;
                const operationPermission = getParticipationReason(operation.allowedClans, operatorTag);
                return (
                  <button
                    key={operation.id}
                    type="button"
                    onClick={() => setSelectedOperationId(operation.id)}
                    className={`stg-card-hover text-left transition-all ${active ? "border-[#84cc16]/60 shadow-[0_0_28px_rgba(132,204,22,0.12)]" : ""}`}
                  >
                    <div className="flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between">
                      <div className="flex gap-4">
                        <div className="flex size-12 shrink-0 items-center justify-center border border-[#a855f7]/35 bg-[#a855f7]/10 text-[#c4b5fd]">
                          <Crosshair size={24} />
                        </div>
                        <div>
                          <div className="mb-2 flex flex-wrap items-center gap-2">
                            <span className={`rounded-md px-3 py-1 text-[10px] font-black uppercase tracking-[0.08em] ${statusClass(operation.status)}`}>
                              {statusLabels[operation.status]}
                            </span>
                            <span className={`rounded-md px-3 py-1 text-[10px] font-black uppercase tracking-[0.08em] ${operationPermission.allowed ? "bg-[#84cc16]/10 text-[#bbf7d0]" : "bg-[#ef4444]/10 text-[#fecaca]"}`}>
                              {operationPermission.allowed ? "Tag liberada" : "Tag bloqueada"}
                            </span>
                          </div>
                          <h3 className="font-black uppercase tracking-[0.04em] text-[#f8fafc]">{operation.title}</h3>
                          <p className="mt-1 text-sm text-[#94a3b8]">
                            {operation.codename || "Operacao STG"} · {modeLabels[operation.mode]}{operation.map ? ` · ${operation.map}` : ""}
                          </p>
                        </div>
                      </div>
                      <div className="text-right text-xs font-black uppercase tracking-[0.08em] text-[#94a3b8]">
                        {operation.allowedClans.includes("ALL") ? "Todos os clas" : operation.allowedClans.join(" vs ")}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="stg-hud-panel overflow-hidden">
              <div className="border-b border-[#a855f7]/20 bg-[#020617]/70 p-6">
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <span className={`rounded-md px-3 py-1 text-xs font-black uppercase ${statusClass(selectedOperation.status)}`}>
                    {statusLabels[selectedOperation.status]}
                  </span>
                  <span className="rounded-md border border-[#a855f7]/25 bg-[#a855f7]/10 px-3 py-1 text-xs font-black uppercase text-[#ddd6fe]">
                    {modeLabels[selectedOperation.mode]}
                  </span>
                </div>
                <h2 className="text-3xl font-black uppercase tracking-[0.06em] text-[#f8fafc]">
                  {selectedOperation.codename || selectedOperation.title}
                </h2>
                <p className="mt-3 leading-7 text-[#94a3b8]">{selectedOperation.description}</p>
              </div>

              <div className="grid gap-4 p-6 md:grid-cols-2">
                <div className="flex items-center gap-3 text-[#94a3b8]"><Calendar className="text-[#84cc16]" size={18} /> {formatDate(selectedOperation.startDate)}</div>
                <div className="flex items-center gap-3 text-[#94a3b8]"><Users className="text-[#84cc16]" size={18} /> {selectedOperation.participants}{selectedOperation.maxTeams ? `/${selectedOperation.maxTeams}` : ""} equipes</div>
                <div className="flex items-center gap-3 text-[#94a3b8]"><Trophy className="text-[#84cc16]" size={18} /> {selectedOperation.prize || "A definir"}</div>
                <div className="flex items-center gap-3 text-[#94a3b8]"><Shield className="text-[#84cc16]" size={18} /> {selectedOperation.entryFee || "Gratuito"}</div>
              </div>

              <div className="px-6 pb-6">
                <div className="mb-4 grid gap-4 md:grid-cols-2">
                  <div className="border border-[#334155] bg-[#020617]/65 p-4">
                    <p className="mb-2 text-xs font-black uppercase tracking-[0.12em] text-[#64748b]">Clas permitidos</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedOperation.allowedClans.map((tag) => (
                        <span key={tag} className={tag === "ALL" ? "stg-badge-success" : "stg-badge-purple"}>
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="border border-[#334155] bg-[#020617]/65 p-4">
                    <p className="mb-2 text-xs font-black uppercase tracking-[0.12em] text-[#64748b]">Regra de pontuacao</p>
                    <p className="text-sm text-[#cbd5e1]">{selectedOperation.scoreRule || selectedOperation.rules || "A definir"}</p>
                  </div>
                </div>

                <div className={`mb-5 border p-4 ${permission.allowed ? "border-[#84cc16]/35 bg-[#84cc16]/10" : "border-[#ef4444]/35 bg-[#ef4444]/10"}`}>
                  <div className="flex items-start gap-3">
                    {permission.allowed ? <CheckCircle2 className="mt-0.5 text-[#84cc16]" /> : <XCircle className="mt-0.5 text-[#ef4444]" />}
                    <div>
                      <p className={`font-black uppercase tracking-[0.06em] ${permission.allowed ? "text-[#bbf7d0]" : "text-[#fecaca]"}`}>
                        {permission.allowed ? "Permissao automatica concedida" : "Permissao negada pela restricao do evento"}
                      </p>
                      <p className="mt-1 text-sm text-[#94a3b8]">{permission.message}</p>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => void handleJoin()}
                  disabled={
                    alreadyJoined ||
                    (!permission.allowed && isAuthenticated) ||
                    selectedOperation.status !== "inscricoes_abertas"
                  }
                  className={`tactical-edge flex w-full items-center justify-center gap-2 px-5 py-3 text-sm font-black uppercase tracking-[0.08em] transition-all ${
                    !alreadyJoined &&
                    (permission.allowed || !isAuthenticated) &&
                    selectedOperation.status === "inscricoes_abertas"
                      ? "stg-button-primary"
                      : "cursor-not-allowed border border-[#334155] bg-[#111827] text-[#64748b]"
                  }`}
                >
                  {permission.allowed ? <Radio size={18} /> : <Lock size={18} />}
                  {alreadyJoined
                    ? "Operador inscrito"
                    : !isAuthenticated
                      ? "Entrar para participar"
                      : selectedOperation.status === "inscricoes_abertas"
                        ? "Participar da operacao"
                        : statusLabels[selectedOperation.status]}
                </button>
              </div>
            </div>
          </section>
        ) : (
          <div className="stg-hud-panel p-10 text-center text-[#94a3b8]">
            Nenhuma operacao Warzone ativa no momento.
          </div>
        )}

        <section className="space-y-5 border-t border-[#a855f7]/20 pt-8">
          <div>
            <p className="tactical-label mb-2">Circuitos existentes</p>
            <h2 className="text-2xl font-black uppercase tracking-[0.08em] text-[#f8fafc]">Torneios e campeonatos STG</h2>
          </div>
          {tournaments.length > 0 ? (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {tournaments.map((tournament: TournamentItem) => (
                <article key={tournament.id} className="stg-card-hover overflow-hidden">
                  <div className="relative h-36 border-b border-[#a855f7]/20 bg-[#111827]">
                    {tournament.imageUrl ? (
                      <img src={tournament.imageUrl} alt={tournament.title} className="size-full object-cover" />
                    ) : (
                      <div className="flex size-full items-center justify-center"><Trophy size={44} className="text-[#a855f7]" /></div>
                    )}
                  </div>
                  <div className="p-5">
                    <div className="mb-3 flex items-start justify-between gap-3">
                      <h3 className="font-black uppercase text-white">{tournament.title}</h3>
                      <span className={tournamentStatusClass(tournament.status)}>{tournament.status || "status"}</span>
                    </div>
                    <p className="line-clamp-3 text-sm text-[#94a3b8]">{tournament.description}</p>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="stg-hud-panel p-8 text-center text-[#94a3b8]">Nenhum torneio adicional publicado.</div>
          )}
        </section>
      </div>
    </Layout>
  );
}
