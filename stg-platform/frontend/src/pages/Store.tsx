import { useEffect, useMemo, useState } from "react";
import { Filter, Package, ShoppingCart } from "lucide-react";
import { Layout } from "../components/layout/Layout";
import { getStoreItems } from "../services/storeService";
import { API_BASE_URL } from "../services/api";
import { StoreItem } from "../types/api";

function formatBrl(value?: number) {
  if (!value) return null;
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function coinSaving(item: StoreItem) {
  if (!item.priceCoins || !item.salePriceCoins || item.salePriceCoins >= item.priceCoins) return null;
  return item.priceCoins - item.salePriceCoins;
}

function brlSaving(item: StoreItem) {
  if (!item.priceBrl || !item.salePriceBrl || item.salePriceBrl >= item.priceBrl) return null;
  return item.priceBrl - item.salePriceBrl;
}

export function Store() {
  const [products, setProducts] = useState<StoreItem[]>([]);
  const [category, setCategory] = useState("todos");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProducts() {
      setLoading(true);
      setProducts(await getStoreItems());
      setLoading(false);
    }
    void loadProducts();
  }, []);

  const categories = useMemo(
    () => ["todos", ...Array.from(new Set(products.map((product) => product.category).filter(Boolean) as string[]))],
    [products]
  );
  const filteredProducts = category === "todos" ? products : products.filter((product) => product.category === category);

  return (
    <Layout>
      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="tactical-label mb-2">Arsenal de recompensas</p>
            <h1 className="mb-2 text-4xl font-black uppercase tracking-[0.08em] text-[#f8fafc]">
              Loja Tatica
            </h1>
            <p className="text-[#94a3b8]">Itens com economia hibrida em STG Coins e BRL.</p>
          </div>
        </div>

        {!API_BASE_URL && (
          <div className="border border-[#f97316]/30 bg-[#f97316]/10 p-3 text-sm font-bold text-[#fed7aa]">
            Modo demonstracao: configure a API oficial para carregar a loja sincronizada.
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`tactical-edge flex items-center gap-2 rounded-lg px-4 py-2 font-black uppercase tracking-[0.06em] transition-all ${
                category === cat
                  ? "stg-button-primary"
                  : "border border-[#a855f7]/25 bg-[#111827]/85 text-[#94a3b8] hover:border-[#84cc16]/45 hover:text-[#84cc16]"
              }`}
            >
              <Filter size={16} />
              {cat === "todos" ? "Todos" : cat}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {[
            ["Total de Itens", products.length, "text-[#f8fafc]"],
            ["Ativos", products.filter((p) => p.isActive).length, "text-[#84cc16]"],
            ["Promocoes", products.filter((p) => p.salePriceCoins || p.salePriceBrl).length, "text-[#f97316]"],
            ["Destaque", products.filter((p) => p.isFeatured).length, "text-[#a855f7]"],
          ].map(([label, value, color]) => (
            <div key={String(label)} className="stg-hud-panel border-[#7c3aed]/30 p-4 text-center">
              <p className="tactical-label mb-2">{label}</p>
              <p className={`text-3xl font-black ${color}`}>{value}</p>
            </div>
          ))}
        </div>

        {loading ? (
          <div className="py-12 text-center text-[#94a3b8]">Carregando loja...</div>
        ) : filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredProducts.filter((product) => product.isActive).map((product) => {
              const savedCoins = coinSaving(product);
              const savedBrl = brlSaving(product);
              return (
                <div
                  key={product.id}
                  className={`stg-card-hover overflow-hidden transition-all ${
                    product.isFeatured
                      ? "border-[#a855f7] ring-2 ring-[#a855f7]/30 shadow-lg shadow-[#a855f7]/20"
                      : "border-[#a855f7]/20 hover:border-[#84cc16]/45"
                  }`}
                >
                  <div className="relative flex h-36 items-center justify-center border-b border-[#7c3aed]/20 bg-gradient-to-br from-[#a855f7]/10 to-[#111827]">
                    {product.imageUrl ? (
                      <img src={product.imageUrl} alt={product.name} className="size-full object-cover" />
                    ) : (
                      <Package className="text-[#a855f7]" size={52} />
                    )}
                    {product.discountPercent ? (
                      <div className="absolute left-2 top-2 border border-[#f97316]/40 bg-[#f97316]/15 px-2 py-1 text-xs font-black text-[#fed7aa]">
                        -{product.discountPercent}%
                      </div>
                    ) : null}
                    {product.isFeatured && <div className="absolute right-2 top-2 stg-badge-purple">Destaque</div>}
                  </div>

                  <div className="relative p-4">
                    <h3 className="mb-2 line-clamp-2 font-black uppercase tracking-[0.04em] text-[#f8fafc]">
                      {product.name}
                    </h3>
                    <p className="mb-4 text-xs capitalize text-[#94a3b8]">{product.category || "geral"}</p>
                    {product.description && <p className="mb-4 line-clamp-2 text-sm text-[#94a3b8]">{product.description}</p>}

                    <div className="mb-4 flex flex-col gap-3">
                      {product.priceCoins ? (
                        <div className="stg-hud-panel border-[#7c3aed]/20 p-3">
                          <span className="text-sm text-[#94a3b8]">STG Coins</span>
                          <div className="mt-1 flex items-baseline gap-2">
                            {product.salePriceCoins && <span className="text-xs text-[#64748b] line-through">{product.priceCoins}</span>}
                            <span className="font-black text-[#a855f7]">{product.salePriceCoins || product.priceCoins}</span>
                          </div>
                          {savedCoins && <p className="mt-1 text-xs font-bold text-[#84cc16]">Economize {savedCoins} STG Coins</p>}
                        </div>
                      ) : null}

                      {product.priceBrl ? (
                        <div className="stg-hud-panel border-[#7c3aed]/20 p-3">
                          <span className="text-sm text-[#94a3b8]">BRL</span>
                          <div className="mt-1 flex items-baseline gap-2">
                            {product.salePriceBrl && <span className="text-xs text-[#64748b] line-through">{formatBrl(product.priceBrl)}</span>}
                            <span className="font-black text-[#84cc16]">{formatBrl(product.salePriceBrl || product.priceBrl)}</span>
                          </div>
                          {savedBrl && <p className="mt-1 text-xs font-bold text-[#84cc16]">Economize {formatBrl(savedBrl)}</p>}
                        </div>
                      ) : null}
                    </div>

                    <button
                      disabled
                      title="Checkout indisponivel: aguardando POST /checkout/create na API"
                      className="tactical-edge flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-lg border border-[#1e293b] bg-[#111827] px-4 py-2 font-black uppercase tracking-[0.06em] text-[#64748b]"
                    >
                      <Package size={16} />
                      Checkout indisponivel — aguardando endpoint da API
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="stg-hud-panel p-12 text-center">
            <ShoppingCart className="mx-auto mb-3 text-[#94a3b8]" size={40} />
            <p className="text-[#94a3b8]">Loja aguardando backend</p>
          </div>
        )}
      </div>
    </Layout>
  );
}
