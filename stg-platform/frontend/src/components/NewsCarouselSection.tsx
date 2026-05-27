import { NewsItem, NewsCategory } from "../types/api";
import { HeroCarousel } from "./HeroCarousel";

const categoryLabels: Record<string, string> = {
  anuncio: "Anuncios STG",
  temporada: "Temporadas e Torneios",
  torneio: "Temporadas e Torneios",
  sistema: "Atualizacoes e Novidades",
  jogo: "Atualizacoes e Novidades",
};

interface NewsCarouselSectionProps {
  title: string;
  description: string;
  categories: NewsCategory[];
  items: NewsItem[];
  fullscreen?: boolean;
}

export function NewsCarouselSection({ title, description, categories, items, fullscreen = false }: NewsCarouselSectionProps) {
  const slides = items
    .filter((item) => item.isActive && categories.includes(item.category))
    .sort((a, b) => b.priority - a.priority || b.publishedAt.localeCompare(a.publishedAt))
    .map((item) => ({
      id: item.id,
      title: item.title,
      subtitle: item.subtitle,
      description: item.description,
      imageUrl: item.imageUrl,
      badge: item.badge || categoryLabels[item.category],
      actionLabel: item.actionLabel,
      actionUrl: item.actionUrl,
    }));

  return (
    <section
      className={
        fullscreen
          ? "flex min-h-[calc(100vh-4rem)] snap-start snap-always flex-col justify-center gap-4 py-5 md:py-7"
          : "space-y-3"
      }
    >
      <div className={fullscreen ? "flex flex-col gap-2 md:flex-row md:items-end md:justify-between" : ""}>
        <div>
          <p className="tactical-label">{categoryLabels[categories[0]] || "STG"}</p>
          <h2 className="mt-1 text-3xl font-black uppercase tracking-[0.06em] text-white md:text-5xl">{title}</h2>
          <p className="mt-2 max-w-3xl text-sm text-[#94a3b8] md:text-base">{description}</p>
        </div>
        {fullscreen && (
          <div className="hidden border border-[#a855f7]/30 bg-black/35 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-[#c084fc] md:block">
            Scroll vertical troca categoria
          </div>
        )}
      </div>
      <HeroCarousel
        compact={!fullscreen}
        className={fullscreen ? "min-h-[min(680px,calc(100vh-14rem))] flex-1" : ""}
        slides={slides}
        fallbackTitle={title}
        fallbackDescription="Nenhum conteudo ativo nesta categoria no momento."
      />
    </section>
  );
}
