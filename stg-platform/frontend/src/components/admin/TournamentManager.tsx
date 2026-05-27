import { useEffect, useState } from "react";
import { Plus, Save, Trash2 } from "lucide-react";
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

  async function load() {
    setItems(await getTournamentItems());
  }

  useEffect(() => {
    void load();
  }, []);

  async function save() {
    if (!form.title) return;
    await saveTournamentItem({
      ...form,
      priority: Number(form.priority || 0),
      isActive: form.isActive !== false,
      isFeatured: form.isFeatured === true,
    });
    setForm(emptyForm);
    await load();
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[380px_1fr]">
      <section className="stg-hud-panel-glow p-5">
        <h2 className="mb-4 text-lg font-black uppercase text-white">Gestao de Torneios</h2>
        <div className="space-y-3">
          <input className="stg-admin-input" placeholder="Titulo" value={form.title || ""} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <textarea className="stg-admin-input min-h-24" placeholder="Descricao" value={form.description || ""} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <input className="stg-admin-input" placeholder="Imagem URL" value={form.imageUrl || ""} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} />
          <input className="stg-admin-input" placeholder="Status" value={form.status || ""} onChange={(e) => setForm({ ...form, status: e.target.value })} />
          <div className="grid gap-3 md:grid-cols-2">
            <input className="stg-admin-input" type="date" value={form.startDate || ""} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
            <input className="stg-admin-input" type="date" value={form.endDate || ""} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
          </div>
          <input className="stg-admin-input" placeholder="Premiacao" value={form.prize || ""} onChange={(e) => setForm({ ...form, prize: e.target.value })} />
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
            {form.id ? "Salvar torneio" : "Criar torneio"}
          </button>
        </div>
      </section>

      <section className="space-y-3">
        {items.map((item) => (
          <div key={item.id} className="stg-hud-panel flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="font-black uppercase text-white">{item.title}</p>
              <p className="text-xs text-[#94a3b8]">{item.status || "status"} - prioridade {item.priority} - {item.isFeatured ? "destaque" : "normal"}</p>
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => setForm(item)} className="stg-button-secondary px-3 py-2 text-xs">Editar</button>
              <button type="button" onClick={async () => { await deleteTournamentItem(item.id); await load(); }} className="border border-[#ef4444]/40 bg-[#ef4444]/10 px-3 py-2 text-xs font-black uppercase text-[#ef4444]">
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
