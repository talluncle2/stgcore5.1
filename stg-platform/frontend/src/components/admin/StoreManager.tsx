import { useEffect, useState } from "react";
import { Plus, Save, Trash2 } from "lucide-react";
import { deleteStoreItem, getStoreItems, saveStoreItem } from "../../services/storeService";
import { StoreItem } from "../../types/api";

const emptyForm: Partial<StoreItem> = {
  name: "",
  description: "",
  category: "",
  imageUrl: "",
  priceCoins: 0,
  salePriceCoins: undefined,
  priceBrl: 0,
  salePriceBrl: undefined,
  discountPercent: 0,
  isActive: true,
  isFeatured: false,
  stock: 0,
};

export function StoreManager() {
  const [items, setItems] = useState<StoreItem[]>([]);
  const [form, setForm] = useState<Partial<StoreItem>>(emptyForm);

  async function load() {
    setItems(await getStoreItems());
  }

  useEffect(() => {
    void load();
  }, []);

  async function save() {
    if (!form.name) return;
    await saveStoreItem({
      ...form,
      priceCoins: Number(form.priceCoins || 0),
      salePriceCoins: form.salePriceCoins ? Number(form.salePriceCoins) : undefined,
      priceBrl: Number(form.priceBrl || 0),
      salePriceBrl: form.salePriceBrl ? Number(form.salePriceBrl) : undefined,
      discountPercent: Number(form.discountPercent || 0),
      stock: Number(form.stock || 0),
      isActive: form.isActive !== false,
      isFeatured: form.isFeatured === true,
    });
    setForm(emptyForm);
    await load();
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[380px_1fr]">
      <section className="stg-hud-panel-glow p-5">
        <h2 className="mb-4 text-lg font-black uppercase text-white">Gestao da Loja</h2>
        <div className="space-y-3">
          <input className="stg-admin-input" placeholder="Nome" value={form.name || ""} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <textarea className="stg-admin-input min-h-24" placeholder="Descricao" value={form.description || ""} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <input className="stg-admin-input" placeholder="Categoria" value={form.category || ""} onChange={(e) => setForm({ ...form, category: e.target.value })} />
          <input className="stg-admin-input" placeholder="Imagem URL" value={form.imageUrl || ""} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} />
          <div className="grid gap-3 md:grid-cols-2">
            <input className="stg-admin-input" type="number" placeholder="Preco coins" value={form.priceCoins ?? 0} onChange={(e) => setForm({ ...form, priceCoins: Number(e.target.value) })} />
            <input className="stg-admin-input" type="number" placeholder="Promo coins" value={form.salePriceCoins ?? ""} onChange={(e) => setForm({ ...form, salePriceCoins: e.target.value ? Number(e.target.value) : undefined })} />
            <input className="stg-admin-input" type="number" placeholder="Preco BRL" value={form.priceBrl ?? 0} onChange={(e) => setForm({ ...form, priceBrl: Number(e.target.value) })} />
            <input className="stg-admin-input" type="number" placeholder="Promo BRL" value={form.salePriceBrl ?? ""} onChange={(e) => setForm({ ...form, salePriceBrl: e.target.value ? Number(e.target.value) : undefined })} />
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <input className="stg-admin-input" type="number" placeholder="Desconto %" value={form.discountPercent ?? 0} onChange={(e) => setForm({ ...form, discountPercent: Number(e.target.value) })} />
            <input className="stg-admin-input" type="number" placeholder="Estoque" value={form.stock ?? 0} onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })} />
          </div>
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
            {form.id ? "Salvar item" : "Criar item"}
          </button>
        </div>
      </section>

      <section className="space-y-3">
        {items.map((item) => (
          <div key={item.id} className="stg-hud-panel flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="font-black uppercase text-white">{item.name}</p>
              <p className="text-xs text-[#94a3b8]">{item.category || "geral"} - {item.isActive ? "ativo" : "inativo"} - {item.isFeatured ? "destaque" : "normal"}</p>
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => setForm(item)} className="stg-button-secondary px-3 py-2 text-xs">Editar</button>
              <button type="button" onClick={async () => { await deleteStoreItem(item.id); await load(); }} className="border border-[#ef4444]/40 bg-[#ef4444]/10 px-3 py-2 text-xs font-black uppercase text-[#ef4444]">
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
