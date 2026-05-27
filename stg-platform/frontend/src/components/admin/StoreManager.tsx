import { useEffect, useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { AdminContentCard } from "./AdminContentCard";
import { ContentEditorModal } from "./ContentEditorModal";
import { DeleteConfirmDialog } from "./DeleteConfirmDialog";
import { ImageUploadField } from "./ImageUploadField";
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

function formatBrl(value?: number) {
  if (!value) return "";
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function StoreManager() {
  const [items, setItems] = useState<StoreItem[]>([]);
  const [form, setForm] = useState<Partial<StoreItem>>(emptyForm);
  const [editorOpen, setEditorOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<StoreItem | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const savings = useMemo(() => {
    const coins = form.priceCoins && form.salePriceCoins && form.salePriceCoins < form.priceCoins
      ? form.priceCoins - form.salePriceCoins
      : 0;
    const brl = form.priceBrl && form.salePriceBrl && form.salePriceBrl < form.priceBrl
      ? form.priceBrl - form.salePriceBrl
      : 0;
    return { coins, brl };
  }, [form.priceBrl, form.priceCoins, form.salePriceBrl, form.salePriceCoins]);

  async function load() {
    setItems(await getStoreItems());
  }

  useEffect(() => {
    void load();
  }, []);

  function openCreate() {
    setForm({ ...emptyForm });
    setEditorOpen(true);
  }

  function openEdit(item: StoreItem) {
    setForm(item);
    setEditorOpen(true);
  }

  async function save() {
    if (!form.name) return;
    setIsSaving(true);
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
    setIsSaving(false);
    setEditorOpen(false);
    setForm({ ...emptyForm });
    await load();
  }

  async function remove() {
    if (!deleteTarget) return;
    await deleteStoreItem(deleteTarget.id);
    setDeleteTarget(null);
    await load();
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="tactical-label">Economia hibrida</p>
          <h3 className="text-lg font-black uppercase text-white">Itens da loja</h3>
        </div>
        <button type="button" onClick={openCreate} className="stg-button-primary inline-flex items-center justify-center gap-2">
          <Plus size={16} />
          Novo item
        </button>
      </div>

      <section className="grid gap-3">
        {items.map((item) => (
          <AdminContentCard
            key={item.id}
            title={item.name}
            subtitle={`${item.category || "geral"} - ${item.priceCoins || 0} coins ${item.priceBrl ? `- ${formatBrl(item.priceBrl)}` : ""}`}
            description={item.description}
            imageUrl={item.imageUrl}
            badges={[
              item.isActive ? "Ativo" : "Inativo",
              item.isFeatured ? "Destaque" : "",
              item.discountPercent ? `-${item.discountPercent}%` : "",
            ]}
            onEdit={() => openEdit(item)}
            onDelete={() => setDeleteTarget(item)}
          />
        ))}
      </section>

      <ContentEditorModal
        open={editorOpen}
        onOpenChange={setEditorOpen}
        title={form.id ? "Editar item da loja" : "Criar item da loja"}
        description="Configure imagem, precos em STG Coins/BRL, promocao, estoque e destaque."
        onSave={save}
        isSaving={isSaving}
        saveLabel={form.id ? "Salvar item" : "Criar item"}
      >
        <div className="grid gap-5">
          <div className="grid gap-3 md:grid-cols-2">
            <input className="stg-admin-input" placeholder="Nome" value={form.name || ""} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <input className="stg-admin-input" placeholder="Categoria" value={form.category || ""} onChange={(e) => setForm({ ...form, category: e.target.value })} />
          </div>
          <textarea className="stg-admin-input min-h-28" placeholder="Descricao" value={form.description || ""} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <ImageUploadField
            label="Imagem do item"
            value={form.imageUrl}
            onChange={(imageUrl) => setForm({ ...form, imageUrl })}
            helperText="Upload local vira data URL no fallback frontend."
          />
          <div className="grid gap-3 md:grid-cols-2">
            <input className="stg-admin-input" type="number" placeholder="Preco STG Coins" value={form.priceCoins ?? 0} onChange={(e) => setForm({ ...form, priceCoins: Number(e.target.value) })} />
            <input className="stg-admin-input" type="number" placeholder="Promocao STG Coins" value={form.salePriceCoins ?? ""} onChange={(e) => setForm({ ...form, salePriceCoins: e.target.value ? Number(e.target.value) : undefined })} />
            <input className="stg-admin-input" type="number" step="0.01" placeholder="Preco BRL" value={form.priceBrl ?? 0} onChange={(e) => setForm({ ...form, priceBrl: Number(e.target.value) })} />
            <input className="stg-admin-input" type="number" step="0.01" placeholder="Promocao BRL" value={form.salePriceBrl ?? ""} onChange={(e) => setForm({ ...form, salePriceBrl: e.target.value ? Number(e.target.value) : undefined })} />
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <input className="stg-admin-input" type="number" placeholder="Desconto %" value={form.discountPercent ?? 0} onChange={(e) => setForm({ ...form, discountPercent: Number(e.target.value) })} />
            <input className="stg-admin-input" type="number" placeholder="Estoque" value={form.stock ?? 0} onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })} />
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="stg-hud-panel border-[#84cc16]/20 p-3 text-sm text-[#bbf7d0]">
              Economia coins: {savings.coins ? `${savings.coins} STG Coins` : "sem promocao"}
            </div>
            <div className="stg-hud-panel border-[#84cc16]/20 p-3 text-sm text-[#bbf7d0]">
              Economia BRL: {savings.brl ? formatBrl(savings.brl) : "sem promocao"}
            </div>
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
        title="Excluir item"
        description={`Excluir "${deleteTarget?.name || "este item"}" da loja?`}
        onConfirm={remove}
      />
    </div>
  );
}
