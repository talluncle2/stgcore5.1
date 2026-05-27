import { apiRequest, authedApiRequest } from "./api";
import { deleteContent, readContent, upsertContent } from "./contentStorage";
import { NewsItem } from "../types/api";

const KEY = "news";
const now = new Date().toISOString();

export const defaultNewsItems: NewsItem[] = [
  {
    id: "stg-core-live",
    title: "STG Core em operacao",
    subtitle: "Arquitetura conectada",
    description: "Frontend, API, bot e Supabase operam com fonte de dados centralizada e segura.",
    category: "sistema",
    imageUrl: "/assets/tactical-ops-bg.png",
    badge: "Sistema",
    actionLabel: "Ver dashboard",
    actionUrl: "/dashboard",
    isActive: true,
    isFeatured: true,
    priority: 10,
    publishedAt: now,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "maintenance-window",
    title: "Janela de manutencao programada",
    subtitle: "Aviso operacional",
    description: "Mudancas planejadas da plataforma serao comunicadas com antecedencia para toda a comunidade.",
    category: "anuncio",
    imageUrl: "/assets/tactical-ops-bg.png",
    badge: "Comunicado",
    actionLabel: "Ver comunidade",
    actionUrl: "/comunidade",
    isActive: true,
    isFeatured: false,
    priority: 7,
    publishedAt: now,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "temporada-prep",
    title: "Previa da proxima temporada",
    subtitle: "Operacao competitiva",
    description: "Novas chamadas para temporadas, torneios e rankings especiais serao publicadas aqui.",
    category: "temporada",
    imageUrl: "/assets/stg-elite-league.png",
    badge: "Temporada",
    actionLabel: "Ver torneios",
    actionUrl: "/torneios",
    isActive: true,
    isFeatured: true,
    priority: 8,
    publishedAt: now,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "ranking-special",
    title: "Ranking especial em preparacao",
    subtitle: "Chamada competitiva",
    description: "Operacoes ranqueadas e torneios relampago serao destacados conforme o calendario oficial.",
    category: "torneio",
    imageUrl: "/assets/stg-elite-league.png",
    badge: "Torneio",
    actionLabel: "Ver ranking",
    actionUrl: "/ranking",
    isActive: true,
    isFeatured: false,
    priority: 5,
    publishedAt: now,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "community-rules",
    title: "Comunicados oficiais da administracao",
    subtitle: "Avisos da comunidade",
    description: "Regras, eventos importantes e mensagens da equipe STG ficam organizados neste centro.",
    category: "anuncio",
    imageUrl: "/assets/stg-hero-operator.png",
    badge: "Anuncio",
    actionLabel: "Ver comunidade",
    actionUrl: "/comunidade",
    isActive: true,
    isFeatured: false,
    priority: 6,
    publishedAt: now,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "bot-updates",
    title: "Atualizacoes do bot e painel",
    subtitle: "Novidades do sistema",
    description: "Sincronizacao, cargos, metricas e ferramentas administrativas evoluem sem expor secrets no frontend.",
    category: "sistema",
    imageUrl: "/assets/tactical-ops-bg.png",
    badge: "Sistema",
    actionLabel: "Ver painel",
    actionUrl: "/dashboard",
    isActive: true,
    isFeatured: true,
    priority: 9,
    publishedAt: now,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "game-updates",
    title: "Radar de novidades do jogo",
    subtitle: "Intel da comunidade",
    description: "Mudancas relevantes de gameplay, temporadas e eventos podem ser publicadas pela equipe STG.",
    category: "jogo",
    imageUrl: "/assets/stg-elite-league.png",
    badge: "Jogo",
    actionLabel: "Ler noticias",
    actionUrl: "/noticias",
    isActive: true,
    isFeatured: false,
    priority: 4,
    publishedAt: now,
    createdAt: now,
    updatedAt: now,
  },
];

function normalize(data: unknown): NewsItem[] {
  if (Array.isArray(data)) return data as NewsItem[];
  if (data && typeof data === "object" && Array.isArray((data as Record<string, unknown>).news)) {
    return (data as Record<string, unknown>).news as NewsItem[];
  }
  return [];
}

export async function getNewsItems(): Promise<NewsItem[]> {
  try {
    const data = await apiRequest<unknown>("/public/news");
    const items = normalize(data);
    if (items.length > 0) return items;
  } catch {
    // TODO: integrate with Replit API when /public/news is available.
  }
  return readContent<NewsItem>(KEY, defaultNewsItems);
}

export async function getFeaturedNewsItems(): Promise<NewsItem[]> {
  const items = await getNewsItems();
  return items.filter((item) => item.isActive && item.isFeatured);
}

export async function saveNewsItem(payload: Partial<NewsItem> & { id?: string }): Promise<NewsItem> {
  try {
    const path = payload.id ? `/admin/news/${payload.id}` : "/admin/news";
    return await authedApiRequest<NewsItem>(path, {
      method: payload.id ? "PUT" : "POST",
      body: JSON.stringify(payload),
    });
  } catch {
    // TODO: replace local fallback when Replit API exposes /admin/news.
  }
  return upsertContent<NewsItem>(KEY, defaultNewsItems, payload);
}

export async function deleteNewsItem(id: string): Promise<void> {
  try {
    await authedApiRequest<void>(`/admin/news/${id}`, { method: "DELETE" });
    return;
  } catch {
    // TODO: replace local fallback when Replit API exposes /admin/news/:id.
  }
  deleteContent<NewsItem>(KEY, defaultNewsItems, id);
}
