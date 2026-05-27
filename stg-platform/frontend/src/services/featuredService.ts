import { FeaturedHeroItem } from "../types/api";
import { getFeaturedNewsItems } from "./newsService";
import { getFeaturedStoreItems } from "./storeService";
import { getFeaturedTournamentItems } from "./tournamentsService";

export async function getFeaturedHeroItems(): Promise<FeaturedHeroItem[]> {
  const [news, store, tournaments] = await Promise.all([
    getFeaturedNewsItems(),
    getFeaturedStoreItems(),
    getFeaturedTournamentItems(),
  ]);

  const items: FeaturedHeroItem[] = [
    ...news.map((item) => ({
      id: `news-${item.id}`,
      sourceType: "news" as const,
      title: item.title,
      subtitle: item.subtitle,
      description: item.description,
      imageUrl: item.imageUrl,
      badge: item.badge || "Noticia",
      actionLabel: item.actionLabel || "Ler novidade",
      actionUrl: item.actionUrl || "/noticias",
      priority: item.priority,
      createdAt: item.publishedAt || item.createdAt,
    })),
    ...store.map((item) => ({
      id: `store-${item.id}`,
      sourceType: "store" as const,
      title: item.name,
      subtitle: item.category,
      description: item.description,
      imageUrl: item.imageUrl,
      badge: "Loja",
      actionLabel: "Ver produto",
      actionUrl: "/loja",
      priority: item.discountPercent || 0,
      createdAt: item.createdAt,
    })),
    ...tournaments.map((item) => ({
      id: `tournament-${item.id}`,
      sourceType: "tournament" as const,
      title: item.title,
      subtitle: item.status,
      description: item.description,
      imageUrl: item.imageUrl,
      badge: "Torneio",
      actionLabel: "Ver torneio",
      actionUrl: "/torneios",
      priority: item.priority,
      createdAt: item.createdAt,
    })),
  ];

  return items.sort((a, b) => b.priority - a.priority || b.createdAt.localeCompare(a.createdAt));
}
