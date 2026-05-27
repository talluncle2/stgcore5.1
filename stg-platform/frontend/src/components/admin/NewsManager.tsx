import { useEffect, useState } from "react";
import { Plus, Save, Trash2 } from "lucide-react";
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
};

export function NewsManager() {
  const [items, setItems] = useState<NewsItem[]>([]);
  const [form, setForm] = useState<Partial<NewsItem>>(emptyForm);

  async function load() {
    setItems(await getNewsItems());
  }

  useEffect(() => {
    void load();
  }, []);

  async function save() {
    if (!form.title || !form.description) return;
    await saveNewsItem({
      ...form,
      category: form.category || "anuncio",
      isActive: form.isActive !== false,
      isFeatured: form.isFeatured === true,
      priority: Number(form.priority || 0),
      publishedAt: form.publishedAt || new Date().toISOString(),
    });
    setForm(emptyForm);
    await load();
  }

  async function remove(id: string) {
    await deleteNewsItem(id);
    await load();
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[380px_1fr]">
      <section className="stg-hud-panel-glow p-5">
        <h2 className="mb-4 text-lg font-black uppercase text-white">Gestao de Noticias</h2>
        <div className="space-y-3">
          <input className="stg-admin-input" placeholder="Titulo" value={form.title || ""} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <input className="stg-admin-input" placeholder="Subtitulo" value={form.subtitle || ""} onChange={(e) => setForm({ ...form, subtitle: e.target.value })} />
          <textarea className="stg-admin-input min-h-24" placeholder="Descricao" value={form.description || ""} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <select className="stg-admin-input" value={form.category || "anuncio"} onChange={(e) => setForm({ ...form, category: e.target.value as NewsCategory })}>
            {categories.map((category) => <option key={category} value={category}>{category}</option>)}
          </select>
          <input className="stg-admin-input" placeholder="Imagem/banner URL" value={form.imageUrl || ""} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} />
          <input className="stg-admin-input" placeholder="Badge/status" value={form.badge || ""} onChange={(e) => setForm({ ...form, badge: e.target.value })} />
          <div className="grid gap-3 md:grid-cols-2">
            <input className="stg-admin-input" placeholder="Botao" value={form.actionLabel || ""} onChange={(e) => setForm({ ...form, actionLabel: e.target.value })} />
            <input className="stg-admin-input" placeholder="Link" value={form.actionUrl || ""} onChange={(e) => setForm({ ...form, actionUrl: e.target.value })} />
          </div>
          <input className="stg-admin-input" type="number" placeholder="Prioridade" value={form.priority ?? 0} onChange={(e) => setForm({ ...form, priority: Number(e.target.value) })} />
          <label className="flex items-center gap-2 text-sm font-bold text-[#94a3b8]">
            <input type="checkbox" checked={form.isActive !== false} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
            Ativo
          </label>
          <label className="flex items-center gap-2 text-sm font-bold text-[#94a3b8]">
            <input type="checkbox" checked={form.isFeatured === true} onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })} />
            Destaque na landing
          </label>
          <button type="button" onClick={save} className="stg-button-primary inline-flex w-full items-center justify-center gap-2">
            {form.id ? <Save size={16} /> : <Plus size={16} />}
            {form.id ? "Salvar noticia" : "Criar noticia"}
          </button>
        </div>
      </section>

      <section className="space-y-3">
        {items.map((item) => (
          <div key={item.id} className="stg-hud-panel flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="font-black uppercase text-white">{item.title}</p>
              <p className="text-xs text-[#94a3b8]">{item.category} - prioridade {item.priority} - {item.isActive ? "ativo" : "inativo"}</p>
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => setForm(item)} className="stg-button-secondary px-3 py-2 text-xs">Editar</button>
              <button type="button" onClick={() => void remove(item.id)} className="border border-[#ef4444]/40 bg-[#ef4444]/10 px-3 py-2 text-xs font-black uppercase text-[#ef4444]">
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
