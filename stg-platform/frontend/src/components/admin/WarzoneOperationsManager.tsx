import { useEffect, useMemo, useState } from "react";
import { Flag, Plus } from "lucide-react";
import { AdminContentCard } from "./AdminContentCard";
import { ContentEditorModal } from "./ContentEditorModal";
import {
  calculateWarzoneMetrics,
  closeWarzoneOperation,
  getWarzoneOperations,
  saveWarzoneOperation,
} from "../../services/warzoneOperationsService";
import {
  WARZONE_MODES,
  WARZONE_STATUSES,
  WarzoneFinalStanding,
  WarzoneOperation,
} from "../../types/warzone";
import { modeLabels, statusLabels } from "../tournaments/WarzoneOperationCard";
import { WarzoneMetricsPanel } from "../tournaments/WarzoneMetricsPanel";

const emptyOperation: Partial<WarzoneOperation> = {
  title: "",
  description: "",
  imageUrl: "",
  mode: "custom_lobby",
  status: "em_breve",
  allowedClans: ["ALL"],
  startDate: "",
  endDate: "",
  prize: "",
  rules: "",
  registrationUrl: "",
  maxTeams: 16,
  participants: 0,
  isActive: true,
  isFeatured: false,
  priority: 0,
};

interface CloseForm {
  winnerClan: string;
  mvp: string;
  totalKills: number;
  matchesPlayed: number;
  standings: string;
  adminNotes: string;
}

const emptyCloseForm: CloseForm = {
  winnerClan: "",
  mvp: "",
  totalKills: 0,
  matchesPlayed: 0,
  standings: "",
  adminNotes: "",
};

function parseStandings(value: string): WarzoneFinalStanding[] {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line, index) => {
      const [clan, killsRaw] = line.split(",").map((part) => part.trim());
      return {
        position: index + 1,
        clan: clan || `Cla ${index + 1}`,
        kills: Number(killsRaw || 0),
      };
    });
}

export function WarzoneOperationsManager() {
  const [operations, setOperations] = useState<WarzoneOperation[]>([]);
  const [form, setForm] = useState<Partial<WarzoneOperation>>(emptyOperation);
  const [editorOpen, setEditorOpen] = useState(false);
  const [closeTarget, setCloseTarget] = useState<WarzoneOperation | null>(null);
  const [closeForm, setCloseForm] = useState<CloseForm>(emptyCloseForm);
  const [saving, setSaving] = useState(false);

  async function load() {
    setOperations(await getWarzoneOperations());
  }

  useEffect(() => {
    void load();
  }, []);

  const metrics = useMemo(() => calculateWarzoneMetrics(operations), [operations]);

  async function save() {
    if (!form.title?.trim()) return;
    setSaving(true);
    await saveWarzoneOperation({
      ...form,
      allowedClans: form.allowedClans?.length ? form.allowedClans : ["ALL"],
      maxTeams: Number(form.maxTeams || 0),
      participants: Number(form.participants || 0),
      priority: Number(form.priority || 0),
    });
    setSaving(false);
    setEditorOpen(false);
    setForm({ ...emptyOperation });
    await load();
  }

  async function closeOperation() {
    if (!closeTarget || !closeForm.winnerClan.trim() || !closeForm.mvp.trim()) return;
    setSaving(true);
    await closeWarzoneOperation(closeTarget.id, {
      winnerClan: closeForm.winnerClan.trim().toUpperCase(),
      mvp: closeForm.mvp.trim(),
      totalKills: Number(closeForm.totalKills || 0),
      matchesPlayed: Number(closeForm.matchesPlayed || 0),
      finalStandings: parseStandings(closeForm.standings),
      adminNotes: closeForm.adminNotes.trim(),
    });
    setSaving(false);
    setCloseTarget(null);
    setCloseForm({ ...emptyCloseForm });
    await load();
  }

  return (
    <div className="space-y-6 border-t border-[#a855f7]/20 pt-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="tactical-label">Warzone competitivo</p>
          <h3 className="text-lg font-black uppercase text-white">Operacoes clã x clã</h3>
          <p className="mt-1 text-sm text-[#94a3b8]">Configure modos, tags autorizadas, regras e resultados finais.</p>
        </div>
        <button
          type="button"
          onClick={() => {
            setForm({ ...emptyOperation });
            setEditorOpen(true);
          }}
          className="stg-button-primary inline-flex items-center justify-center gap-2"
        >
          <Plus size={16} />
          Nova operacao
        </button>
      </div>

      <section className="grid gap-3">
        {operations.map((operation) => (
          <AdminContentCard
            key={operation.id}
            title={operation.title}
            subtitle={`${modeLabels[operation.mode]} · ${statusLabels[operation.status]}`}
            description={`${operation.description} Clas: ${operation.allowedClans.join(", ")}.`}
            imageUrl={operation.imageUrl}
            badges={[
              operation.isActive ? "Ativa" : "Inativa",
              operation.isFeatured ? "Destaque" : "",
              `${operation.participants}${operation.maxTeams ? `/${operation.maxTeams}` : ""} equipes`,
            ]}
            onEdit={() => {
              setForm(operation);
              setEditorOpen(true);
            }}
            onDelete={() => {
              setCloseTarget(operation);
              setCloseForm({ ...emptyCloseForm });
            }}
            destructiveLabel="Encerrar operacao"
          />
        ))}
      </section>

      <p className="text-xs text-[#64748b]">
        Encerrar consolida o resultado e preserva o evento no historico competitivo.
      </p>

      <WarzoneMetricsPanel metrics={metrics} />

      <ContentEditorModal
        open={editorOpen}
        onOpenChange={setEditorOpen}
        title={form.id ? "Editar operacao Warzone" : "Criar operacao Warzone"}
        description="Defina o modo, os clas autorizados e as regras da operacao sem alterar os torneios existentes."
        onSave={save}
        isSaving={saving}
      >
        <div className="grid gap-4">
          <input className="stg-admin-input" placeholder="Titulo da operacao" value={form.title || ""} onChange={(event) => setForm({ ...form, title: event.target.value })} />
          <textarea className="stg-admin-input min-h-24" placeholder="Descricao" value={form.description || ""} onChange={(event) => setForm({ ...form, description: event.target.value })} />
          <input className="stg-admin-input" placeholder="URL da imagem/banner" value={form.imageUrl || ""} onChange={(event) => setForm({ ...form, imageUrl: event.target.value })} />
          <div className="grid gap-3 md:grid-cols-2">
            <select className="stg-admin-input" value={form.mode} onChange={(event) => setForm({ ...form, mode: event.target.value as WarzoneOperation["mode"] })}>
              {WARZONE_MODES.map((mode) => <option key={mode} value={mode}>{modeLabels[mode]}</option>)}
            </select>
            <select className="stg-admin-input" value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as WarzoneOperation["status"] })}>
              {WARZONE_STATUSES.map((status) => <option key={status} value={status}>{statusLabels[status]}</option>)}
            </select>
            <input className="stg-admin-input" type="datetime-local" value={form.startDate?.slice(0, 16) || ""} onChange={(event) => setForm({ ...form, startDate: event.target.value })} />
            <input className="stg-admin-input" type="datetime-local" value={form.endDate?.slice(0, 16) || ""} onChange={(event) => setForm({ ...form, endDate: event.target.value })} />
            <input className="stg-admin-input" type="number" min="0" placeholder="Vagas/equipes" value={form.maxTeams ?? 0} onChange={(event) => setForm({ ...form, maxTeams: Number(event.target.value) })} />
            <input className="stg-admin-input" type="number" placeholder="Prioridade" value={form.priority ?? 0} onChange={(event) => setForm({ ...form, priority: Number(event.target.value) })} />
          </div>
          <input
            className="stg-admin-input"
            placeholder="Clas permitidos: STG, WOLF, RUSH ou ALL"
            value={(form.allowedClans || []).join(", ")}
            onChange={(event) =>
              setForm({
                ...form,
                allowedClans: event.target.value
                  .split(",")
                  .map((clan) => clan.trim().toUpperCase())
                  .filter(Boolean),
              })
            }
          />
          <input className="stg-admin-input" placeholder="Premiacao" value={form.prize || ""} onChange={(event) => setForm({ ...form, prize: event.target.value })} />
          <textarea className="stg-admin-input min-h-32" placeholder="Regras da operacao" value={form.rules || ""} onChange={(event) => setForm({ ...form, rules: event.target.value })} />
          <div className="grid gap-3 md:grid-cols-2">
            <label className="flex items-center gap-2 text-sm font-bold text-[#94a3b8]">
              <input type="checkbox" checked={form.isActive !== false} onChange={(event) => setForm({ ...form, isActive: event.target.checked })} />
              Operacao ativa
            </label>
            <label className="flex items-center gap-2 text-sm font-bold text-[#94a3b8]">
              <input type="checkbox" checked={form.isFeatured === true} onChange={(event) => setForm({ ...form, isFeatured: event.target.checked })} />
              Destaque
            </label>
          </div>
        </div>
      </ContentEditorModal>

      <ContentEditorModal
        open={Boolean(closeTarget)}
        onOpenChange={(open) => !open && setCloseTarget(null)}
        title={`Encerrar ${closeTarget?.title || "operacao"}`}
        description="O resultado sera consolidado nas metricas gerais e no historico competitivo."
        onSave={closeOperation}
        isSaving={saving}
        saveLabel="Encerrar e consolidar"
      >
        <div className="grid gap-4">
          <div className="flex items-center gap-3 border border-[#f97316]/30 bg-[#f97316]/10 p-3 text-sm text-[#fed7aa]">
            <Flag size={18} />
            Esta acao encerra a operacao, mas preserva todo o historico.
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <input className="stg-admin-input" placeholder="Cla vencedor" value={closeForm.winnerClan} onChange={(event) => setCloseForm({ ...closeForm, winnerClan: event.target.value })} />
            <input className="stg-admin-input" placeholder="MVP" value={closeForm.mvp} onChange={(event) => setCloseForm({ ...closeForm, mvp: event.target.value })} />
            <input className="stg-admin-input" type="number" min="0" placeholder="Kills totais" value={closeForm.totalKills} onChange={(event) => setCloseForm({ ...closeForm, totalKills: Number(event.target.value) })} />
            <input className="stg-admin-input" type="number" min="0" placeholder="Partidas realizadas" value={closeForm.matchesPlayed} onChange={(event) => setCloseForm({ ...closeForm, matchesPlayed: Number(event.target.value) })} />
          </div>
          <textarea
            className="stg-admin-input min-h-32"
            placeholder={"Colocacao final, uma equipe por linha:\nSTG, 42\nWOLF, 31\nRUSH, 24"}
            value={closeForm.standings}
            onChange={(event) => setCloseForm({ ...closeForm, standings: event.target.value })}
          />
          <textarea className="stg-admin-input min-h-24" placeholder="Observacoes administrativas" value={closeForm.adminNotes} onChange={(event) => setCloseForm({ ...closeForm, adminNotes: event.target.value })} />
        </div>
      </ContentEditorModal>
    </div>
  );
}
