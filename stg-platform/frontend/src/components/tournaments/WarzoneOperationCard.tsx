import { Calendar, LockKeyhole, ShieldCheck, Swords, Users } from "lucide-react";
import { WarzoneOperation } from "../../types/warzone";

const modeLabels: Record<WarzoneOperation["mode"], string> = {
  battle_royale_solo: "Battle Royale Solo",
  battle_royale_duo: "Battle Royale Duo",
  battle_royale_trio: "Battle Royale Trio",
  battle_royale_squad: "Battle Royale Squad",
  resurgence_duo: "Resurgence Duo",
  resurgence_trio: "Resurgence Trio",
  resurgence_squad: "Resurgence Squad",
  custom_lobby: "Custom Lobby",
};

const statusLabels: Record<WarzoneOperation["status"], string> = {
  em_breve: "Em breve",
  inscricoes_abertas: "Inscricoes abertas",
  em_andamento: "Em andamento",
  encerrado: "Encerrado",
  cancelado: "Cancelado",
};

function statusClass(status: WarzoneOperation["status"]) {
  if (status === "inscricoes_abertas" || status === "em_andamento") return "stg-badge-success";
  if (status === "encerrado" || status === "cancelado") return "stg-badge-danger";
  return "stg-badge-warning";
}

interface WarzoneOperationCardProps {
  operation: WarzoneOperation;
  clanTag: string | null;
  canParticipate: boolean;
  permissionMessage: string;
  isRegistered: boolean;
  onOpen: () => void;
  onParticipate: () => void;
}

export function WarzoneOperationCard({
  operation,
  clanTag,
  canParticipate,
  permissionMessage,
  isRegistered,
  onOpen,
  onParticipate,
}: WarzoneOperationCardProps) {
  const registrationsOpen = operation.status === "inscricoes_abertas";
  const buttonEnabled = registrationsOpen && canParticipate && !isRegistered;

  return (
    <article className="stg-card-hover group overflow-hidden">
      <button type="button" onClick={onOpen} className="relative block h-48 w-full overflow-hidden border-b border-[#a855f7]/20 bg-[#111827] text-left">
        {operation.imageUrl ? (
          <img src={operation.imageUrl} alt={operation.title} className="size-full object-cover transition duration-500 group-hover:scale-105" />
        ) : (
          <div className="flex size-full items-center justify-center bg-gradient-to-br from-[#a855f7]/20 to-[#050608]">
            <Swords className="text-[#a855f7]" size={58} />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#050608] via-transparent to-black/20" />
        <div className="absolute left-3 top-3 flex flex-wrap gap-2">
          <span className={statusClass(operation.status)}>{statusLabels[operation.status]}</span>
          {operation.isFeatured && <span className="stg-badge-purple">Destaque</span>}
        </div>
        <span className="absolute bottom-3 left-3 border border-[#a855f7]/35 bg-black/70 px-3 py-1 text-xs font-black uppercase text-[#d8b4fe]">
          {modeLabels[operation.mode]}
        </span>
      </button>

      <div className="p-5">
        <button type="button" onClick={onOpen} className="text-left">
          <h3 className="text-xl font-black uppercase tracking-[0.04em] text-white">{operation.title}</h3>
          <p className="mt-2 line-clamp-2 text-sm leading-6 text-[#94a3b8]">{operation.description}</p>
        </button>

        <div className="mt-4 grid gap-2 text-xs font-bold uppercase tracking-[0.05em] text-[#94a3b8]">
          <div className="flex items-center gap-2">
            <Calendar size={15} className="text-[#a855f7]" />
            {operation.startDate ? new Date(operation.startDate).toLocaleString("pt-BR") : "Data a definir"}
          </div>
          <div className="flex items-center gap-2">
            <Users size={15} className="text-[#84cc16]" />
            {operation.participants}{operation.maxTeams ? `/${operation.maxTeams}` : ""} equipes
          </div>
          <div className="flex items-center gap-2">
            {canParticipate ? <ShieldCheck size={15} className="text-[#84cc16]" /> : <LockKeyhole size={15} className="text-[#f97316]" />}
            <span className={canParticipate ? "text-[#bbf7d0]" : "text-[#fed7aa]"}>
              {operation.allowedClans.includes("ALL")
                ? "Aberto para todos"
                : clanTag
                  ? `Tag identificada: ${clanTag}`
                  : "Tag nao identificada"}
            </span>
          </div>
        </div>

        <div className="mt-5 border-t border-[#a855f7]/20 pt-4">
          <button
            type="button"
            onClick={buttonEnabled ? onParticipate : onOpen}
            className={
              buttonEnabled
                ? "stg-button-primary w-full px-4 py-3 text-sm"
                : isRegistered
                  ? "w-full border border-[#84cc16]/35 bg-[#84cc16]/10 px-4 py-3 text-sm font-black uppercase text-[#bbf7d0]"
                  : "w-full border border-[#475569]/60 bg-[#111827] px-4 py-3 text-sm font-black uppercase text-[#94a3b8]"
            }
            title={permissionMessage}
          >
            {isRegistered
              ? "Participacao confirmada"
              : registrationsOpen
                ? canParticipate
                  ? "Participar"
                  : "Ver restricao"
                : statusLabels[operation.status]}
          </button>
        </div>
      </div>
    </article>
  );
}

export { modeLabels, statusLabels };
