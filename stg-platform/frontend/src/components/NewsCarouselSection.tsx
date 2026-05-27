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
}

export function NewsCarouselSection({ title, description, categories, items }: NewsCarouselSectionProps) {
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
    <section className="space-y-3">
      <div>
        <h2 className="text-2xl font-black uppercase tracking-[0.06em] text-white">{title}</h2>
        <p className="mt-1 text-sm text-[#94a3b8]">{description}</p>
      </div>
      <HeroCarousel
        compact
        slides={slides}
        fallbackTitle={title}
        fallbackDescription="Nenhum conteudo ativo nesta categoria no momento."
      />
    </section>
  );
}
