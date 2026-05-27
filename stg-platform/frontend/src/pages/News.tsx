import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Edit3, Newspaper, Search } from "lucide-react";
import { Layout } from "../components/layout/Layout";
import { NewsCarouselSection } from "../components/NewsCarouselSection";
import { useAuth } from "../context/AuthContext";
import { getNewsItems } from "../services/newsService";
import { NewsItem } from "../types/api";
import { canManageContent } from "../utils/permissions";

export function News() {
  const [items, setItems] = useState<NewsItem[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const { user, profile } = useAuth();

  useEffect(() => {
    async function load() {
      setLoading(true);
      setItems(await getNewsItems());
      setLoading(false);
    }
    void load();
  }, []);

  const filteredItems = useMemo(() => {
    const value = query.trim().toLowerCase();
    if (!value) return items;
    return items.filter((item) =>
      [item.title, item.subtitle, item.description, item.category, item.badge]
        .filter(Boolean)
        .some((field) => String(field).toLowerCase().includes(value))
    );
  }, [items, query]);

  return (
    <Layout>
      <div className="space-y-8">
        <div className="flex flex-col gap-3 border border-[#a855f7]/20 bg-[#050608]/70 p-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="tactical-label">Central de anuncios</p>
            <h2 className="text-xl font-black uppercase tracking-[0.06em] text-white">
              Noticias, temporadas e novidades
            </h2>
            <p className="mt-1 text-sm text-[#94a3b8]">
              Comunicados STG, previas competitivas e atualizacoes do sistema ou jogo.
            </p>
          </div>
          <div className="flex flex-col gap-2 md:flex-row md:items-center">
            <div className="relative min-w-0 md:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748b]" size={18} />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Buscar conteudo"
                className="w-full border border-[#a855f7]/20 bg-[#111827] py-3 pl-10 pr-4 text-sm font-bold text-white outline-none placeholder:text-[#64748b] focus:border-[#a855f7]/55"
              />
            </div>
            {canManageContent(user ?? profile) && (
              <Link to="/admin/noticias" className="stg-button-secondary inline-flex items-center justify-center gap-2 px-4 py-3 text-sm">
                <Edit3 size={16} />
                Gerir
              </Link>
            )}
          </div>
        </div>

        {loading ? (
          <div className="stg-hud-panel p-10 text-center text-[#94a3b8]">Carregando noticias...</div>
        ) : (
          <>
            <NewsCarouselSection
              title="Anuncios STG"
              description="Avisos oficiais, regras novas, eventos importantes e comunicados da comunidade."
              categories={["anuncio"]}
              items={filteredItems}
            />
            <NewsCarouselSection
              title="Temporadas e Torneios"
              description="Previas de temporadas, campeonatos, operacoes competitivas e rankings especiais."
              categories={["temporada", "torneio"]}
              items={filteredItems}
            />
            <NewsCarouselSection
              title="Atualizacoes e Novidades"
              description="Mudancas no sistema STG, bot, site, loja e novidades relevantes do jogo."
              categories={["sistema", "jogo"]}
              items={filteredItems}
            />
          </>
        )}

        {!loading && filteredItems.length === 0 && (
          <div className="stg-hud-panel p-8 text-center">
            <Newspaper className="mx-auto mb-3 text-[#a855f7]" size={38} />
            <p className="font-black uppercase text-white">Nenhum conteudo encontrado</p>
          </div>
        )}
      </div>
    </Layout>
  );
}
