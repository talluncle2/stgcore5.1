import { Calendar, Crosshair, Shield, Trophy, Users } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { WarzoneOperation } from "../../types/warzone";
import { modeLabels, statusLabels } from "./WarzoneOperationCard";

interface WarzoneOperationDetailsProps {
  operation: WarzoneOperation | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clanTag: string | null;
  canParticipate: boolean;
  permissionMessage: string;
  isRegistered: boolean;
  onParticipate: () => void;
}

export function WarzoneOperationDetails({
  operation,
  open,
  onOpenChange,
  clanTag,
  canParticipate,
  permissionMessage,
  isRegistered,
  onParticipate,
}: WarzoneOperationDetailsProps) {
  if (!operation) return null;

  const registrationsOpen = operation.status === "inscricoes_abertas";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-5xl overflow-y-auto border-[#a855f7]/45 bg-[#050608] p-0 text-white">
        <div className="relative h-64 overflow-hidden border-b border-[#a855f7]/25 bg-[#111827]">
          {operation.imageUrl ? (
            <img src={operation.imageUrl} alt={operation.title} className="size-full object-cover" />
          ) : (
            <div className="flex size-full items-center justify-center bg-gradient-to-br from-[#2e1065] to-[#050608]">
              <Crosshair size={64} className="text-[#a855f7]" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#050608] via-black/30 to-transparent" />
          <div className="absolute bottom-5 left-5 right-5">
            <div className="mb-3 flex flex-wrap gap-2">
              <span className="stg-badge-purple">{modeLabels[operation.mode]}</span>
              <span className="stg-badge-info">{statusLabels[operation.status]}</span>
            </div>
            <DialogHeader className="text-left">
              <DialogTitle className="text-3xl font-black uppercase tracking-[0.05em] text-white md:text-4xl">
                {operation.title}
              </DialogTitle>
              <DialogDescription className="mt-2 max-w-3xl text-sm text-[#cbd5e1]">
                {operation.description}
              </DialogDescription>
            </DialogHeader>
          </div>
        </div>

        <div className="grid gap-5 p-5 lg:grid-cols-[1fr_330px]">
          <div className="space-y-5">
            <section className="stg-hud-panel p-5">
              <h3 className="text-sm font-black uppercase tracking-[0.08em] text-[#c084fc]">Briefing da operacao</h3>
              <p className="mt-3 whitespace-pre-line text-sm leading-7 text-[#94a3b8]">
                {operation.rules || "Regras detalhadas serao publicadas pela administracao antes do inicio."}
              </p>
            </section>

            <section className="stg-hud-panel p-5">
              <h3 className="text-sm font-black uppercase tracking-[0.08em] text-[#c084fc]">Clas permitidos</h3>
              <div className="mt-3 flex flex-wrap gap-2">
                {operation.allowedClans.map((clan) => (
                  <span key={clan} className="border border-[#a855f7]/35 bg-[#a855f7]/10 px-3 py-2 text-xs font-black uppercase text-[#e9d5ff]">
                    {clan === "ALL" ? "Todos os clas" : clan}
                  </span>
                ))}
              </div>
              <div className={`mt-4 border p-3 text-sm font-bold ${canParticipate ? "border-[#84cc16]/30 bg-[#84cc16]/10 text-[#bbf7d0]" : "border-[#f97316]/30 bg-[#f97316]/10 text-[#fed7aa]"}`}>
                {permissionMessage}
              </div>
            </section>

            {operation.result && (
              <section className="stg-hud-panel-glow p-5">
                <h3 className="text-sm font-black uppercase tracking-[0.08em] text-[#84cc16]">Resultado consolidado</h3>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div><p className="text-xs uppercase text-[#64748b]">Cla vencedor</p><p className="mt-1 text-xl font-black text-white">{operation.result.winnerClan}</p></div>
                  <div><p className="text-xs uppercase text-[#64748b]">MVP</p><p className="mt-1 text-xl font-black text-white">{operation.result.mvp}</p></div>
                  <div><p className="text-xs uppercase text-[#64748b]">Kills totais</p><p className="mt-1 text-xl font-black text-white">{operation.result.totalKills}</p></div>
                  <div><p className="text-xs uppercase text-[#64748b]">Partidas</p><p className="mt-1 text-xl font-black text-white">{operation.result.matchesPlayed}</p></div>
                </div>
              </section>
            )}
          </div>

          <aside className="space-y-4">
            <div className="stg-hud-panel p-5">
              <div className="space-y-4 text-sm">
                <div className="flex gap-3"><Calendar size={18} className="shrink-0 text-[#a855f7]" /><div><p className="text-xs uppercase text-[#64748b]">Inicio</p><p className="font-bold text-white">{operation.startDate ? new Date(operation.startDate).toLocaleString("pt-BR") : "A definir"}</p></div></div>
                <div className="flex gap-3"><Users size={18} className="shrink-0 text-[#84cc16]" /><div><p className="text-xs uppercase text-[#64748b]">Equipes</p><p className="font-bold text-white">{operation.participants}{operation.maxTeams ? `/${operation.maxTeams}` : ""}</p></div></div>
                <div className="flex gap-3"><Trophy size={18} className="shrink-0 text-[#f97316]" /><div><p className="text-xs uppercase text-[#64748b]">Premiacao</p><p className="font-bold text-white">{operation.prize || "A definir"}</p></div></div>
                <div className="flex gap-3"><Shield size={18} className="shrink-0 text-[#38bdf8]" /><div><p className="text-xs uppercase text-[#64748b]">Sua tag</p><p className="font-bold text-white">{clanTag || "Nao identificada"}</p></div></div>
              </div>
            </div>

            <button
              type="button"
              disabled={!registrationsOpen || !canParticipate || isRegistered}
              onClick={onParticipate}
              className="stg-button-primary w-full px-5 py-3 disabled:cursor-not-allowed disabled:border-[#475569] disabled:bg-[#111827] disabled:text-[#64748b] disabled:shadow-none"
            >
              {isRegistered
                ? "Participacao confirmada"
                : registrationsOpen
                  ? canParticipate
                    ? "Participar da operacao"
                    : "Participacao bloqueada"
                  : statusLabels[operation.status]}
            </button>
          </aside>
        </div>
      </DialogContent>
    </Dialog>
  );
}
