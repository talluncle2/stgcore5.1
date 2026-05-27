import { useEffect, useState } from "react";
import { Filter, ShoppingCart, Package } from "lucide-react";
import { Layout } from "../components/layout/Layout";
import { getProducts } from "../services/api";
import { Product } from "../types/api";

export function Store() {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [category, setCategory] = useState("todos");
  const [loading, setLoading] = useState(true);
  const categories = ["todos", "digital", "fisico", "premium"];

  useEffect(() => {
    const loadProducts = async () => {
      setLoading(true);
      const categoryFilter = category === "todos" ? undefined : category;
      const data = await getProducts(categoryFilter, 100);
      setProducts(data);
      setFilteredProducts(data);
      setLoading(false);
    };

    loadProducts();
  }, [category]);

  return (
    <Layout>
      <div className="flex flex-col gap-8">
        <div>
          <p className="tactical-label mb-2">🛡️ ARSENAL DE RECOMPENSAS</p>
          <h1 className="mb-2 text-4xl font-black uppercase tracking-[0.08em] text-[#f8fafc]">
            Loja Tática
          </h1>
          <p className="text-[#94a3b8]">Adquira equipamentos exclusivos com coins</p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`tactical-edge flex items-center gap-2 px-4 py-2 font-black uppercase tracking-[0.06em] transition-all rounded-lg ${
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

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {[
            ["Total de Itens", products.length, "text-[#f8fafc]"],
            ["Em Estoque", products.filter((p) => (p.stock ?? 0) > 0).length, "text-[#84cc16]"],
            ["Sem Estoque", products.filter((p) => (p.stock ?? 0) === 0).length, "text-[#f97316]"],
            ["Destaque", products.filter((p) => p.featured || p.is_featured).length, "text-[#a855f7]"],
          ].map(([label, value, color]) => (
            <div key={String(label)} className="stg-hud-panel p-4 text-center border-[#7c3aed]/30">
              <p className="tactical-label mb-2">{label}</p>
              <p className={`text-3xl font-black ${color}`}>{value}</p>
            </div>
          ))}
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="py-12 text-center">
            <div className="inline-block animate-spin">
              <div className="size-8 rounded-full border-4 border-[#a855f7] border-t-[#84cc16]" />
            </div>
            <p className="mt-4 text-[#94a3b8]">Carregando arsenal...</p>
          </div>
        ) : filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredProducts.map((product) => (
              <div
                key={product.product_id}
                className={`stg-card-hover overflow-hidden transition-all ${
                  product.featured || product.is_featured
                    ? "border-[#a855f7] ring-2 ring-[#a855f7]/30 shadow-lg shadow-[#a855f7]/20"
                    : "border-[#a855f7]/20 hover:border-[#84cc16]/45"
                }`}
              >
                {/* Item Image/Icon */}
                <div className="relative flex h-24 items-center justify-center border-b border-[#7c3aed]/20 bg-gradient-to-br from-[#a855f7]/10 to-[#111827]">
                  <div className="text-6xl">{product.emoji}</div>
                  {(product.featured || product.is_featured) && (
                    <div className="absolute right-2 top-2 stg-badge-purple">
                      ⭐ Destaque
                    </div>
                  )}
                </div>

                {/* Item Details */}
                <div className="relative p-4">
                  <h3 className="mb-2 line-clamp-2 font-black uppercase tracking-[0.04em] text-[#f8fafc]">
                    {product.name}
                  </h3>
                  <p className="mb-4 text-xs capitalize text-[#94a3b8]">{product.category}</p>

                  <div className="mb-4 flex flex-col gap-3">
                    <div className="stg-hud-panel flex items-center justify-between border-[#7c3aed]/20 p-3">
                      <span className="text-sm text-[#94a3b8]">Preço:</span>
                      <span className="font-black text-[#a855f7]">💰 {product.price}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-[#94a3b8]">Disponível:</span>
                      <span className={`font-black ${(product.stock ?? 0) > 0 ? "text-[#84cc16]" : "text-[#f97316]"}`}>
                        {(product.stock ?? 0) === 0 ? "Esgotado" : `${product.stock} un.`}
                      </span>
                    </div>
                  </div>

                  <button
                    disabled={(product.stock ?? 0) === 0}
                    className={`tactical-edge flex w-full items-center justify-center gap-2 px-4 py-2 font-black uppercase tracking-[0.06em] transition-all rounded-lg ${
                      (product.stock ?? 0) > 0
                        ? "stg-button-primary glow-purple"
                        : "cursor-not-allowed bg-[#111827] text-[#475569] border border-[#1e293b]"
                    }`}
                  >
                    <Package size={16} />
                    {(product.stock ?? 0) > 0 ? "Comprar" : "Indisponível"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="stg-hud-panel p-12 text-center">
            <ShoppingCart className="mx-auto mb-3 text-[#94a3b8]" size={40} />
            <p className="text-[#94a3b8]">Arsenal vazio por enquanto. Novas operações em breve!</p>
          </div>
        )}
      </div>
    </Layout>
  );
}
