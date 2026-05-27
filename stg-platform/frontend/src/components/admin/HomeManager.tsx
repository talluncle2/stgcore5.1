import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { AdminContentCard } from "./AdminContentCard";
import { ContentEditorModal } from "./ContentEditorModal";
import { DeleteConfirmDialog } from "./DeleteConfirmDialog";
import { ImageUploadField } from "./ImageUploadField";
import { deleteHomeContentItem, getHomeContentItems, saveHomeContentItem } from "../../services/homeService";
import { HomeContentItem } from "../../types/api";

const emptyForm: Partial<HomeContentItem> = {
  titleLine1: "",
  titleLine2: "",
  description: "",
  backgroundImageUrl: "",
  primaryLabel: "VER TORNEIOS",
  primaryUrl: "/torneios",
  secondaryLabel: "ENTRAR NA ARENA",
  seasonTitle: "",
  missionTitle: "",
  missionProgress: "",
  isActive: true,
  priority: 0,
};

export function HomeManager() {
  const [items, setItems] = useState<HomeContentItem[]>([]);
  const [form, setForm] = useState<Partial<HomeContentItem>>(emptyForm);
  const [editorOpen, setEditorOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<HomeContentItem | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  async function load() {
    setItems(await getHomeContentItems());
  }

  useEffect(() => {
    void load();
  }, []);

  function openCreate() {
    setForm({ ...emptyForm });
    setEditorOpen(true);
  }

  function openEdit(item: HomeContentItem) {
    setForm(item);
    setEditorOpen(true);
  }

  async function save() {
    if (!form.titleLine1 || !form.titleLine2 || !form.description) return;
    setIsSaving(true);
    await saveHomeContentItem({
      ...form,
      isActive: form.isActive !== false,
      priority: Number(form.priority || 0),
    });
    setIsSaving(false);
    setEditorOpen(false);
    setForm({ ...emptyForm });
    await load();
  }

  async function remove() {
    if (!deleteTarget) return;
    await deleteHomeContentItem(deleteTarget.id);
    setDeleteTarget(null);
    await load();
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="tactical-label">Landing principal</p>
          <h3 className="text-lg font-black uppercase text-white">Conteudos da Home</h3>
        </div>
        <button type="button" onClick={openCreate} className="stg-button-primary inline-flex items-center justify-center gap-2">
          <Plus size={16} />
          Novo hero
        </button>
      </div>

      <section className="grid gap-3">
        {items.map((item) => (
          <AdminContentCard
            key={item.id}
            title={`${item.titleLine1} ${item.titleLine2}`}
            subtitle={`prioridade ${item.priority}`}
            description={item.description}
            imageUrl={item.backgroundImageUrl}
            badges={[item.isActive ? "Ativo" : "Inativo", item.primaryLabel]}
            onEdit={() => openEdit(item)}
            onDelete={() => setDeleteTarget(item)}
          />
        ))}
      </section>

      <ContentEditorModal
        open={editorOpen}
        onOpenChange={setEditorOpen}
        title={form.id ? "Editar hero da Home" : "Criar hero da Home"}
        description="Controle textos, botoes, imagem e painel de temporada da landing."
        onSave={save}
        isSaving={isSaving}
      >
        <div className="grid gap-5">
          <div className="grid gap-3 md:grid-cols-2">
            <input className="stg-admin-input" placeholder="Titulo linha 1" value={form.titleLine1 || ""} onChange={(e) => setForm({ ...form, titleLine1: e.target.value })} />
            <input className="stg-admin-input" placeholder="Titulo linha 2" value={form.titleLine2 || ""} onChange={(e) => setForm({ ...form, titleLine2: e.target.value })} />
          </div>
          <textarea className="stg-admin-input min-h-24" placeholder="Descricao" value={form.description || ""} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <ImageUploadField
            label="Imagem de fundo"
            value={form.backgroundImageUrl}
            onChange={(backgroundImageUrl) => setForm({ ...form, backgroundImageUrl })}
            helperText="Upload local vira data URL no fallback frontend."
          />
          <div className="grid gap-3 md:grid-cols-2">
            <input className="stg-admin-input" placeholder="Botao principal" value={form.primaryLabel || ""} onChange={(e) => setForm({ ...form, primaryLabel: e.target.value })} />
            <input className="stg-admin-input" placeholder="Link do botao principal" value={form.primaryUrl || ""} onChange={(e) => setForm({ ...form, primaryUrl: e.target.value })} />
            <input className="stg-admin-input" placeholder="Botao secundario" value={form.secondaryLabel || ""} onChange={(e) => setForm({ ...form, secondaryLabel: e.target.value })} />
            <input className="stg-admin-input" type="number" placeholder="Prioridade" value={form.priority ?? 0} onChange={(e) => setForm({ ...form, priority: Number(e.target.value) })} />
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            <input className="stg-admin-input" placeholder="Titulo da temporada" value={form.seasonTitle || ""} onChange={(e) => setForm({ ...form, seasonTitle: e.target.value })} />
            <input className="stg-admin-input" placeholder="Missao" value={form.missionTitle || ""} onChange={(e) => setForm({ ...form, missionTitle: e.target.value })} />
            <input className="stg-admin-input" placeholder="Progresso" value={form.missionProgress || ""} onChange={(e) => setForm({ ...form, missionProgress: e.target.value })} />
          </div>
          <label className="flex items-center gap-2 text-sm font-bold text-[#94a3b8]">
            <input type="checkbox" checked={form.isActive !== false} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
            Ativo
          </label>
        </div>
      </ContentEditorModal>

      <DeleteConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Excluir hero"
        description={`Excluir "${deleteTarget?.titleLine1 || "este hero"}"?`}
        onConfirm={remove}
      />
    </div>
  );
}
