import { useMemo, useState } from "react";
import { CalendarDays, Newspaper, Radio, Search, ShieldAlert, Trophy } from "lucide-react";
import { Layout } from "../components/layout/Layout";

const newsItems = [
  {
    id: "sync-core",
    category: "Infraestrutura",
    title: "STG Core conectado ao Supabase",
    summary:
      "A arquitetura oficial passa a centralizar dados sincronizados do Discord via API, mantendo frontend e bot desacoplados do banco.",
    date: "2026-05-27",
    status: "Operacional",
    icon: Radio,
  },
  {
    id: "discord-admin",
    category: "Discord",
    title: "Painel admin usa dados sincronizados",
    summary:
      "Membros, cargos, canais e eventos agora devem ser lidos pelas rotas administrativas protegidas da API STG Core.",
    date: "2026-05-27",
    status: "Admin",
    icon: ShieldAlert,
  },
  {
    id: "league",
    category: "Competitivo",
    title: "Modulo competitivo aguardando backend dedicado",
    summary:
      "A area de campeonatos segue preparada para consumir endpoints reais quando o backend competitivo estiver disponivel.",
    date: "2026-05-27",
    status: "Roadmap",
    icon: Trophy,
  },
];

export function News() {
  const [query, setQuery] = useState("");

  const filteredNews = useMemo(() => {
    const value = query.trim().toLowerCase();
    if (!value) return newsItems;
    return newsItems.filter((item) =>
      [item.category, item.title, item.summary, item.status]
        .some((field) => field.toLowerCase().includes(value))
    );
  }, [query]);

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 border border-[#a855f7]/20 bg-[#050608]/70 p-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="tactical-label">Central de noticias</p>
            <h2 className="text-xl font-black uppercase tracking-[0.06em] text-white">
              Comunicados e atualizacoes STG
            </h2>
            <p className="mt-1 text-sm text-[#94a3b8]">
              Informacoes publicas sobre operacoes, infraestrutura e modulos em desenvolvimento.
            </p>
          </div>
          <div className="relative min-w-0 md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748b]" size={18} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar noticia"
              className="w-full border border-[#a855f7]/20 bg-[#111827] py-3 pl-10 pr-4 text-sm font-bold text-white outline-none placeholder:text-[#64748b] focus:border-[#a855f7]/55"
            />
          </div>
        </div>

        <section className="grid gap-4 lg:grid-cols-[1.4fr_0.8fr]">
          <div className="space-y-4">
            {filteredNews.map((item) => {
              const Icon = item.icon;
              return (
                <article key={item.id} className="stg-hud-panel-glow p-5">
                  <div className="flex flex-col gap-4 md:flex-row md:items-start">
                    <div className="tactical-edge flex size-12 shrink-0 items-center justify-center border border-[#a855f7]/35 bg-[#a855f7]/15 text-[#c084fc]">
                      <Icon size={24} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <span className="border border-[#a855f7]/30 bg-[#a855f7]/15 px-2 py-1 text-xs font-black uppercase text-[#c084fc]">
                          {item.category}
                        </span>
                        <span className="border border-[#84cc16]/25 bg-[#84cc16]/10 px-2 py-1 text-xs font-black uppercase text-[#84cc16]">
                          {item.status}
                        </span>
                      </div>
                      <h3 className="text-2xl font-black uppercase tracking-[0.04em] text-white">
                        {item.title}
                      </h3>
                      <p className="mt-2 text-sm leading-6 text-[#94a3b8]">{item.summary}</p>
                      <div className="mt-4 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.08em] text-[#64748b]">
                        <CalendarDays size={14} />
                        {new Date(item.date).toLocaleDateString("pt-BR")}
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}

            {filteredNews.length === 0 && (
              <div className="stg-hud-panel p-8 text-center">
                <Newspaper className="mx-auto mb-3 text-[#a855f7]" size={38} />
                <p className="font-black uppercase text-white">Nenhuma noticia encontrada</p>
              </div>
            )}
          </div>

          <aside className="stg-hud-panel-glow h-fit p-5">
            <h3 className="text-lg font-black uppercase tracking-[0.06em] text-white">Radar STG</h3>
            <div className="mt-5 space-y-3">
              {[
                ["API", "Online via Replit"],
                ["Banco", "Supabase como fonte oficial"],
                ["Bot", "Sincronizacao via API"],
                ["Frontend", "Vercel sem secrets sensiveis"],
              ].map(([label, value]) => (
                <div key={label} className="flex items-center justify-between border border-[#a855f7]/10 bg-[#111827]/55 p-3">
                  <span className="tactical-label">{label}</span>
                  <span className="text-sm font-bold text-[#94a3b8]">{value}</span>
                </div>
              ))}
            </div>
          </aside>
        </section>
      </div>
    </Layout>
  );
}
