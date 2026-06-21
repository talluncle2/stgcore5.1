import { useMemo, useState } from "react";
import {
  Activity,
  BarChart3,
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

type ClanTag = "STG" | "GHOST" | "FOX" | "WOLF" | "RAVEN";
type OperationStatus = "inscricoes_abertas" | "em_andamento" | "em_breve" | "encerrado";
type OperationMode = "BR Squad" | "Resurgence Squad" | "Resurgence Trio" | "BR Duo";

type Operation = {
  id: string;
  title: string;
  codename: string;
  mode: OperationMode;
  map: string;
  status: OperationStatus;
  startDate: string;
  maxPlayers: number;
  prize: string;
  entryFee: string;
  allowedTags: ClanTag[] | "ALL";
  scoreRule: string;
  description: string;
  slotsByClan?: Partial<Record<ClanTag, number>>;
};

type CommunityMetrics = {
  events: number;
  registeredOperators: number;
  totalKills: number;
  totalWins: number;
  totalMatches: number;
  mvp: string;
  championClan: ClanTag | "-";
};

const clanTags: ClanTag[] = ["STG", "GHOST", "FOX", "WOLF", "RAVEN"];

const operations: Operation[] = [
  {
    id: "op-eclipse",
    title: "STG vs GHOST — Noite da Revanche",
    codename: "Operação Eclipse",
    mode: "Resurgence Squad",
    map: "Rebirth Island",
    status: "em_andamento",
    startDate: "2026-06-28T21:00:00",
    maxPlayers: 40,
    prize: "Troféu digital + destaque Hall da Fama",
    entryFee: "Gratuito",
    allowedTags: ["STG", "GHOST"],
    scoreRule: "Kills + colocação final + bônus por vitória",
    description:
      "Partida personalizada clã x clã. Apenas operadores com tag STG ou GHOST no perfil competitivo podem participar.",
    slotsByClan: { STG: 20, GHOST: 20 },
  },
  {
    id: "op-vanguard",
    title: "Liga Resurgence Multi-Clãs",
    codename: "Operação Vanguarda",
    mode: "Resurgence Trio",
    map: "Fortune's Keep",
    status: "inscricoes_abertas",
    startDate: "2026-07-05T20:30:00",
    maxPlayers: 45,
    prize: "Ranking de temporada + medalhas",
    entryFee: "R$ 5,00 por operador",
    allowedTags: ["STG", "GHOST", "FOX"],
    scoreRule: "Sistema acumulativo em 3 quedas",
    description:
      "Operação restrita aos clãs definidos pela organização. A permissão é liberada automaticamente pela tag oficial do perfil.",
    slotsByClan: { STG: 15, GHOST: 15, FOX: 15 },
  },
  {
    id: "op-openzone",
    title: "Open Zone STG",
    codename: "Operação Zona Aberta",
    mode: "BR Squad",
    map: "Urzikstan",
    status: "em_breve",
    startDate: "2026-07-12T21:30:00",
    maxPlayers: 100,
    prize: "Premiação a definir",
    entryFee: "A definir",
    allowedTags: "ALL",
    scoreRule: "Pontuação por colocação, kills e vitória",
    description:
      "Evento aberto para operadores de qualquer clã cadastrado. Ideal para ranqueamento geral da comunidade.",
  },
];

function formatDate(value: string) {
  return new Date(value).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function statusLabel(status: OperationStatus) {
  const labels: Record<OperationStatus, string> = {
    inscricoes_abertas: "Inscrições abertas",
    em_andamento: "Em operação",
    em_breve: "Em breve",
    encerrado: "Encerrado",
  };
  return labels[status];
}

function statusClass(status: OperationStatus) {
  if (status === "inscricoes_abertas") return "stg-badge-success";
  if (status === "em_andamento") return "stg-badge-warning";
  if (status === "encerrado") return "stg-badge-danger";
  return "stg-badge-info";
}

function canJoin(operation: Operation, tag: ClanTag) {
  return operation.allowedTags === "ALL" || operation.allowedTags.includes(tag);
}

function allowedTagsText(operation: Operation) {
  return operation.allowedTags === "ALL" ? "Todos os clãs" : operation.allowedTags.join(" vs ");
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
  const [operatorTag, setOperatorTag] = useState<ClanTag>("STG");
  const [selectedOperationId, setSelectedOperationId] = useState(operations[0].id);
  const [joinedOperations, setJoinedOperations] = useState<string[]>([]);
  const [finishPanelOpen, setFinishPanelOpen] = useState(false);
  const [finalKills, setFinalKills] = useState(286);
  const [finalMatches, setFinalMatches] = useState(6);
  const [winnerClan, setWinnerClan] = useState<ClanTag>("STG");
  const [mvp, setMvp] = useState("[STG] Bottzim");
  const [metrics, setMetrics] = useState<CommunityMetrics>({
    events: 27,
    registeredOperators: 418,
    totalKills: 14280,
    totalWins: 392,
    totalMatches: 836,
    mvp: "[STG] Ghostline",
    championClan: "STG",
  });

  const selectedOperation = useMemo(
    () => operations.find((operation) => operation.id === selectedOperationId) ?? operations[0],
    [selectedOperationId]
  );

  const permissionGranted = canJoin(selectedOperation, operatorTag);
  const alreadyJoined = joinedOperations.includes(selectedOperation.id);

  function handleJoin() {
    if (!permissionGranted || selectedOperation.status === "em_breve" || selectedOperation.status === "encerrado") return;
    setJoinedOperations((current) => (current.includes(selectedOperation.id) ? current : [...current, selectedOperation.id]));
  }

  function handleFinishOperation() {
    setMetrics((current) => ({
      events: current.events + 1,
      registeredOperators: current.registeredOperators,
      totalKills: current.totalKills + Number(finalKills || 0),
      totalWins: current.totalWins + 1,
      totalMatches: current.totalMatches + Number(finalMatches || 0),
      mvp,
      championClan: winnerClan,
    }));
    setFinishPanelOpen(false);
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
                Central de Operações Warzone
              </h1>
              <p className="mt-4 max-w-3xl text-sm leading-7 text-[#94a3b8] md:text-base">
                Sistema focado em Call of Duty: Warzone com partidas personalizadas, eventos clã x clã, permissão automática por tag e encerramento operacional com métricas finais.
              </p>
            </div>

            <div className="stg-hud-panel p-5">
              <p className="mb-3 text-xs font-black uppercase tracking-[0.12em] text-[#94a3b8]">Operador em teste</p>
              <div className="mb-4 flex items-center gap-3">
                <div className="flex size-12 items-center justify-center border border-[#84cc16]/45 bg-[#84cc16]/10 text-xl font-black text-[#bbf7d0]">
                  {operatorTag}
                </div>
                <div>
                  <div className="font-black uppercase tracking-[0.06em] text-[#f8fafc]">[{operatorTag}] Operador Demo</div>
                  <div className="text-xs text-[#94a3b8]">Permissão baseada na tag oficial do perfil</div>
                </div>
              </div>
              <div className="grid grid-cols-5 gap-2">
                {clanTags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => setOperatorTag(tag)}
                    className={`rounded-md border px-2 py-2 text-xs font-black transition-all ${
                      operatorTag === tag
                        ? "border-[#84cc16] bg-[#84cc16]/15 text-[#bbf7d0]"
                        : "border-[#334155] bg-[#111827] text-[#94a3b8] hover:border-[#a855f7] hover:text-[#f8fafc]"
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {metricCard("Eventos encerrados", metrics.events, <Trophy size={20} />)}
          {metricCard("Kills registradas", metrics.totalKills.toLocaleString("pt-BR"), <Skull size={20} />)}
          {metricCard("Partidas oficiais", metrics.totalMatches, <Swords size={20} />)}
          {metricCard("Último campeão", metrics.championClan, <Medal size={20} />)}
        </section>

        <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="tactical-label mb-2">Operações disponíveis</p>
                <h2 className="text-2xl font-black uppercase tracking-[0.08em] text-[#f8fafc]">Eventos Warzone</h2>
              </div>
            </div>

            {operations.map((operation) => {
              const active = selectedOperation.id === operation.id;
              const allowed = canJoin(operation, operatorTag);
              return (
                <button
                  key={operation.id}
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
                            {statusLabel(operation.status)}
                          </span>
                          <span className={`rounded-md px-3 py-1 text-[10px] font-black uppercase tracking-[0.08em] ${allowed ? "bg-[#84cc16]/10 text-[#bbf7d0]" : "bg-[#ef4444]/10 text-[#fecaca]"}`}>
                            {allowed ? "Tag liberada" : "Tag bloqueada"}
                          </span>
                        </div>
                        <h3 className="font-black uppercase tracking-[0.04em] text-[#f8fafc]">{operation.title}</h3>
                        <p className="mt-1 text-sm text-[#94a3b8]">{operation.codename} · {operation.mode} · {operation.map}</p>
                      </div>
                    </div>
                    <div className="text-right text-xs font-black uppercase tracking-[0.08em] text-[#94a3b8]">
                      {allowedTagsText(operation)}
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
                  {statusLabel(selectedOperation.status)}
                </span>
                <span className="rounded-md border border-[#a855f7]/25 bg-[#a855f7]/10 px-3 py-1 text-xs font-black uppercase text-[#ddd6fe]">
                  {selectedOperation.mode}
                </span>
              </div>
              <h2 className="text-3xl font-black uppercase tracking-[0.06em] text-[#f8fafc]">{selectedOperation.codename}</h2>
              <p className="mt-3 leading-7 text-[#94a3b8]">{selectedOperation.description}</p>
            </div>

            <div className="grid gap-4 p-6 md:grid-cols-2">
              <div className="flex items-center gap-3 text-[#94a3b8]"><Calendar className="text-[#84cc16]" size={18} /> {formatDate(selectedOperation.startDate)}</div>
              <div className="flex items-center gap-3 text-[#94a3b8]"><Users className="text-[#84cc16]" size={18} /> Até {selectedOperation.maxPlayers} operadores</div>
              <div className="flex items-center gap-3 text-[#94a3b8]"><Trophy className="text-[#84cc16]" size={18} /> {selectedOperation.prize}</div>
              <div className="flex items-center gap-3 text-[#94a3b8]"><Shield className="text-[#84cc16]" size={18} /> {selectedOperation.entryFee}</div>
            </div>

            <div className="px-6 pb-6">
              <div className="mb-4 grid gap-4 md:grid-cols-2">
                <div className="border border-[#334155] bg-[#020617]/65 p-4">
                  <p className="mb-2 text-xs font-black uppercase tracking-[0.12em] text-[#64748b]">Clãs permitidos</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedOperation.allowedTags === "ALL" ? (
                      <span className="stg-badge-success">ALL</span>
                    ) : (
                      selectedOperation.allowedTags.map((tag) => <span key={tag} className="stg-badge-purple">{tag}</span>)
                    )}
                  </div>
                </div>
                <div className="border border-[#334155] bg-[#020617]/65 p-4">
                  <p className="mb-2 text-xs font-black uppercase tracking-[0.12em] text-[#64748b]">Regra de pontuação</p>
                  <p className="text-sm text-[#cbd5e1]">{selectedOperation.scoreRule}</p>
                </div>
              </div>

              <div className={`mb-5 border p-4 ${permissionGranted ? "border-[#84cc16]/35 bg-[#84cc16]/10" : "border-[#ef4444]/35 bg-[#ef4444]/10"}`}>
                <div className="flex items-start gap-3">
                  {permissionGranted ? <CheckCircle2 className="mt-0.5 text-[#84cc16]" /> : <XCircle className="mt-0.5 text-[#ef4444]" />}
                  <div>
                    <p className={`font-black uppercase tracking-[0.06em] ${permissionGranted ? "text-[#bbf7d0]" : "text-[#fecaca]"}`}>
                      {permissionGranted ? "Permissão automática concedida" : "Permissão negada pela restrição do evento"}
                    </p>
                    <p className="mt-1 text-sm text-[#94a3b8]">
                      Tag atual do operador: <strong className="text-[#f8fafc]">{operatorTag}</strong>. O sistema compara essa tag com a lista de clãs permitidos do evento.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <button
                  onClick={handleJoin}
                  disabled={!permissionGranted || alreadyJoined || selectedOperation.status === "em_breve" || selectedOperation.status === "encerrado"}
                  className={`tactical-edge flex items-center justify-center gap-2 px-5 py-3 text-sm font-black uppercase tracking-[0.08em] transition-all ${
                    permissionGranted && !alreadyJoined && selectedOperation.status !== "em_breve" && selectedOperation.status !== "encerrado"
                      ? "stg-button-primary"
                      : "cursor-not-allowed border border-[#334155] bg-[#111827] text-[#64748b]"
                  }`}
                >
                  {permissionGranted ? <Radio size={18} /> : <Lock size={18} />}
                  {alreadyJoined ? "Operador inscrito" : "Participar da operação"}
                </button>

                <button
                  onClick={() => setFinishPanelOpen((value) => !value)}
                  className="tactical-edge border border-[#f97316]/35 bg-[#f97316]/10 px-5 py-3 text-sm font-black uppercase tracking-[0.08em] text-[#fed7aa] transition-all hover:border-[#f97316]"
                >
                  Encerramento operacional
                </button>
              </div>
            </div>

            {finishPanelOpen && (
              <div className="border-t border-[#f97316]/25 bg-[#0f172a]/85 p-6">
                <div className="mb-5 flex items-center gap-3">
                  <BarChart3 className="text-[#f97316]" />
                  <div>
                    <h3 className="font-black uppercase tracking-[0.08em] text-[#f8fafc]">Finalizar evento e consolidar métricas</h3>
                    <p className="text-sm text-[#94a3b8]">Simulação do painel do admin designado ao final da operação.</p>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <label className="text-sm font-bold text-[#cbd5e1]">
                    Clã vencedor
                    <select value={winnerClan} onChange={(event) => setWinnerClan(event.target.value as ClanTag)} className="mt-2 w-full border border-[#334155] bg-[#020617] p-3 text-[#f8fafc] outline-none focus:border-[#84cc16]">
                      {clanTags.map((tag) => <option key={tag}>{tag}</option>)}
                    </select>
                  </label>
                  <label className="text-sm font-bold text-[#cbd5e1]">
                    MVP do evento
                    <input value={mvp} onChange={(event) => setMvp(event.target.value)} className="mt-2 w-full border border-[#334155] bg-[#020617] p-3 text-[#f8fafc] outline-none focus:border-[#84cc16]" />
                  </label>
                  <label className="text-sm font-bold text-[#cbd5e1]">
                    Kills totais
                    <input type="number" value={finalKills} onChange={(event) => setFinalKills(Number(event.target.value))} className="mt-2 w-full border border-[#334155] bg-[#020617] p-3 text-[#f8fafc] outline-none focus:border-[#84cc16]" />
                  </label>
                  <label className="text-sm font-bold text-[#cbd5e1]">
                    Partidas realizadas
                    <input type="number" value={finalMatches} onChange={(event) => setFinalMatches(Number(event.target.value))} className="mt-2 w-full border border-[#334155] bg-[#020617] p-3 text-[#f8fafc] outline-none focus:border-[#84cc16]" />
                  </label>
                </div>

                <button onClick={handleFinishOperation} className="stg-button-primary mt-5 flex w-full items-center justify-center gap-2 px-5 py-3 text-sm font-black uppercase tracking-[0.08em]">
                  <Activity size={18} /> Consolidar resultado oficial
                </button>
              </div>
            )}
          </div>
        </section>
      </div>
    </Layout>
  );
}
