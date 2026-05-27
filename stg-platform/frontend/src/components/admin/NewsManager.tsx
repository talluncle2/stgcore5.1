import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { AdminContentCard } from "./AdminContentCard";
import { ContentEditorModal } from "./ContentEditorModal";
import { DeleteConfirmDialog } from "./DeleteConfirmDialog";
import { ImageUploadField } from "./ImageUploadField";
import { deleteNewsItem, getNewsItems, saveNewsItem } from "../../services/newsService";
import { NewsCategory, NewsItem } from "../../types/api";

const categories: NewsCategory[] = ["anuncio", "temporada", "torneio", "sistema", "jogo"];

const emptyForm: Partial<NewsItem> = {
  title: "",
  subtitle: "",
  description: "",
  category: "anuncio",
  imageUrl: "",
  badge: "",
  actionLabel: "",
  actionUrl: "",
  isActive: true,
  isFeatured: false,
  priority: 0,
  publishedAt: "",
};

export function NewsManager() {
  const [items, setItems] = useState<NewsItem[]>([]);
  const [form, setForm] = useState<Partial<NewsItem>>(emptyForm);
  const [editorOpen, setEditorOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<NewsItem | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  async function load() {
    setItems(await getNewsItems());
  }

  useEffect(() => {
    void load();
  }, []);

  function openCreate() {
    setForm({ ...emptyForm });
    setEditorOpen(true);
  }

  function openEdit(item: NewsItem) {
    setForm(item);
    setEditorOpen(true);
  }

  async function save() {
    if (!form.title || !form.description) return;
    setIsSaving(true);
    await saveNewsItem({
      ...form,
      category: form.category || "anuncio",
      isActive: form.isActive !== false,
      isFeatured: form.isFeatured === true,
      priority: Number(form.priority || 0),
      publishedAt: form.publishedAt || new Date().toISOString(),
    });
    setIsSaving(false);
    setEditorOpen(false);
    setForm({ ...emptyForm });
    await load();
  }

  async function remove() {
    if (!deleteTarget) return;
    await deleteNewsItem(deleteTarget.id);
    setDeleteTarget(null);
    await load();
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="tactical-label">Noticias e banners</p>
          <h3 className="text-lg font-black uppercase text-white">Itens publicados</h3>
        </div>
        <button type="button" onClick={openCreate} className="stg-button-primary inline-flex items-center justify-center gap-2">
          <Plus size={16} />
          Nova noticia
        </button>
      </div>

      <section className="grid gap-3">
        {items.map((item) => (
          <AdminContentCard
            key={item.id}
            title={item.title}
            subtitle={`${item.category} - prioridade ${item.priority}`}
            description={item.description}
            imageUrl={item.imageUrl}
            badges={[
              item.isActive ? "Ativo" : "Inativo",
              item.isFeatured ? "Destaque" : "",
              item.badge || "",
            ]}
            onEdit={() => openEdit(item)}
            onDelete={() => setDeleteTarget(item)}
          />
        ))}
      </section>

      <ContentEditorModal
        open={editorOpen}
        onOpenChange={setEditorOpen}
        title={form.id ? "Editar noticia" : "Criar noticia"}
        description="Gerencie anuncios, temporadas, torneios e novidades exibidos nos carrosseis."
        onSave={save}
        isSaving={isSaving}
        saveLabel={form.id ? "Salvar noticia" : "Criar noticia"}
      >
        <div className="grid gap-5">
          <div className="grid gap-3 md:grid-cols-2">
            <input className="stg-admin-input" placeholder="Titulo" value={form.title || ""} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            <input className="stg-admin-input" placeholder="Subtitulo" value={form.subtitle || ""} onChange={(e) => setForm({ ...form, subtitle: e.target.value })} />
          </div>
          <textarea className="stg-admin-input min-h-28" placeholder="Descricao" value={form.description || ""} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <div className="grid gap-3 md:grid-cols-3">
            <select className="stg-admin-input" value={form.category || "anuncio"} onChange={(e) => setForm({ ...form, category: e.target.value as NewsCategory })}>
              {categories.map((category) => <option key={category} value={category}>{category}</option>)}
            </select>
            <input className="stg-admin-input" placeholder="Badge/status" value={form.badge || ""} onChange={(e) => setForm({ ...form, badge: e.target.value })} />
            <input className="stg-admin-input" type="number" placeholder="Prioridade" value={form.priority ?? 0} onChange={(e) => setForm({ ...form, priority: Number(e.target.value) })} />
          </div>
          <ImageUploadField
            label="Imagem/banner"
            value={form.imageUrl}
            onChange={(imageUrl) => setForm({ ...form, imageUrl })}
            helperText="Upload local vira data URL no fallback frontend."
          />
          <div className="grid gap-3 md:grid-cols-2">
            <input className="stg-admin-input" placeholder="Botao de acao" value={form.actionLabel || ""} onChange={(e) => setForm({ ...form, actionLabel: e.target.value })} />
            <input className="stg-admin-input" placeholder="Link de acao" value={form.actionUrl || ""} onChange={(e) => setForm({ ...form, actionUrl: e.target.value })} />
          </div>
          <input className="stg-admin-input" type="datetime-local" value={form.publishedAt ? form.publishedAt.slice(0, 16) : ""} onChange={(e) => setForm({ ...form, publishedAt: e.target.value ? new Date(e.target.value).toISOString() : "" })} />
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
        title="Excluir noticia"
        description={`Excluir "${deleteTarget?.title || "este item"}"?`}
        onConfirm={remove}
      />
    </div>
  );
}
