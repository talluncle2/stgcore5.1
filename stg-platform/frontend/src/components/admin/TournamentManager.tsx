import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { AdminContentCard } from "./AdminContentCard";
import { ContentEditorModal } from "./ContentEditorModal";
import { DeleteConfirmDialog } from "./DeleteConfirmDialog";
import { ImageUploadField } from "./ImageUploadField";
import { deleteTournamentItem, getTournamentItems, saveTournamentItem } from "../../services/tournamentsService";
import { TournamentItem } from "../../types/api";

const emptyForm: Partial<TournamentItem> = {
  title: "",
  description: "",
  imageUrl: "",
  status: "em_breve",
  startDate: "",
  endDate: "",
  prize: "",
  isActive: true,
  isFeatured: false,
  priority: 0,
};

export function TournamentManager() {
  const [items, setItems] = useState<TournamentItem[]>([]);
  const [form, setForm] = useState<Partial<TournamentItem>>(emptyForm);
  const [editorOpen, setEditorOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<TournamentItem | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  async function load() {
    setItems(await getTournamentItems());
  }

  useEffect(() => {
    void load();
  }, []);

  function openCreate() {
    setForm({ ...emptyForm });
    setEditorOpen(true);
  }

  function openEdit(item: TournamentItem) {
    setForm(item);
    setEditorOpen(true);
  }

  async function save() {
    if (!form.title) return;
    setIsSaving(true);
    await saveTournamentItem({
      ...form,
      priority: Number(form.priority || 0),
      isActive: form.isActive !== false,
      isFeatured: form.isFeatured === true,
    });
    setIsSaving(false);
    setEditorOpen(false);
    setForm({ ...emptyForm });
    await load();
  }

  async function remove() {
    if (!deleteTarget) return;
    await deleteTournamentItem(deleteTarget.id);
    setDeleteTarget(null);
    await load();
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="tactical-label">Competitivo STG</p>
          <h3 className="text-lg font-black uppercase text-white">Torneios e campeonatos</h3>
        </div>
        <button type="button" onClick={openCreate} className="stg-button-primary inline-flex items-center justify-center gap-2">
          <Plus size={16} />
          Novo torneio
        </button>
      </div>

      <section className="grid gap-3">
        {items.map((item) => (
          <AdminContentCard
            key={item.id}
            title={item.title}
            subtitle={`${item.status || "status"} - prioridade ${item.priority}`}
            description={item.description}
            imageUrl={item.imageUrl}
            badges={[
              item.isActive ? "Ativo" : "Inativo",
              item.isFeatured ? "Destaque" : "",
              item.prize || "",
            ]}
            onEdit={() => openEdit(item)}
            onDelete={() => setDeleteTarget(item)}
          />
        ))}
      </section>

      <ContentEditorModal
        open={editorOpen}
        onOpenChange={setEditorOpen}
        title={form.id ? "Editar torneio" : "Criar torneio"}
        description="Configure banner, status, datas, premiacao, destaque e ordem de exibicao."
        onSave={save}
        isSaving={isSaving}
        saveLabel={form.id ? "Salvar torneio" : "Criar torneio"}
      >
        <div className="grid gap-5">
          <input className="stg-admin-input" placeholder="Titulo" value={form.title || ""} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <textarea className="stg-admin-input min-h-28" placeholder="Descricao" value={form.description || ""} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <ImageUploadField
            label="Imagem/banner do torneio"
            value={form.imageUrl}
            onChange={(imageUrl) => setForm({ ...form, imageUrl })}
            helperText="Upload local vira data URL no fallback frontend."
          />
          <div className="grid gap-3 md:grid-cols-2">
            <input className="stg-admin-input" placeholder="Status" value={form.status || ""} onChange={(e) => setForm({ ...form, status: e.target.value })} />
            <input className="stg-admin-input" placeholder="Premiacao" value={form.prize || ""} onChange={(e) => setForm({ ...form, prize: e.target.value })} />
            <input className="stg-admin-input" type="date" value={form.startDate || ""} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
            <input className="stg-admin-input" type="date" value={form.endDate || ""} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
            <input className="stg-admin-input" type="number" placeholder="Prioridade" value={form.priority ?? 0} onChange={(e) => setForm({ ...form, priority: Number(e.target.value) })} />
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <label className="flex items-center gap-2 text-sm font-bold text-[#94a3b8]">
              <input type="checkbox" checked={form.isActive !== false} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
              Ativo
            </label>
            <label className="flex items-center gap-2 text-sm font-bold text-[#94a3b8]">
              <input type="checkbox" checked={form.isFeatured === true} onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })} />
              Destaque na landing
            </label>
          </div>
        </div>
      </ContentEditorModal>

      <DeleteConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Excluir torneio"
        description={`Excluir "${deleteTarget?.title || "este torneio"}"?`}
        onConfirm={remove}
      />
    </div>
  );
}
