import { useEffect, useMemo, useState } from "react";
import { Radio, RefreshCw, Users, Video } from "lucide-react";
import { Layout } from "../components/layout/Layout";
import { CreatorCard } from "../components/creators/CreatorCard";
import { LiveContentCard } from "../components/creators/LiveContentCard";
import { getCreators, getLatestCreatorContent, getLiveCreators } from "../services/creatorsService";
import { ContentCreator, CreatorContent } from "../types/api";

export function Creators() {
  const [creators, setCreators] = useState<ContentCreator[]>([]);
  const [liveContent, setLiveContent] = useState<CreatorContent[]>([]);
  const [latestContent, setLatestContent] = useState<CreatorContent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const [creatorData, liveData, latestData] = await Promise.all([
        getCreators(),
        getLiveCreators(),
        getLatestCreatorContent(),
      ]);
      setCreators(creatorData);
      setLiveContent(liveData);
      setLatestContent(latestData);
      setLoading(false);
    }
    void load();
  }, []);

  const liveByCreator = useMemo(() => {
    const map = new Map<string, CreatorContent>();
    liveContent.forEach((item) => map.set(item.creator_id, item));
    return map;
  }, [liveContent]);

  return (
    <Layout>
      <div className="space-y-8">
        <section className="cod-military-bg overflow-hidden rounded-lg border-2 border-[#a855f7]/50 p-6 md:p-8">
          <div className="grid gap-6 md:grid-cols-[1fr_auto] md:items-end">
            <div>
              <p className="tactical-label mb-3">Comunidade oficial</p>
              <h1 className="text-4xl font-black uppercase tracking-[0.08em] text-white md:text-5xl">
                Criadores de Conteudo STG
              </h1>
              <p className="mt-4 max-w-3xl text-[#94a3b8]">
                Lives, videos recentes e canais vinculados aos membros com cargo de Criador de Conteudo no Discord.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="stg-hud-panel p-4"><Radio className="mx-auto text-[#ef4444]" /><p className="mt-2 text-2xl font-black text-white">{liveContent.length}</p><p className="text-[10px] uppercase text-[#94a3b8]">Ao vivo</p></div>
              <div className="stg-hud-panel p-4"><Users className="mx-auto text-[#a855f7]" /><p className="mt-2 text-2xl font-black text-white">{creators.length}</p><p className="text-[10px] uppercase text-[#94a3b8]">Criadores</p></div>
              <div className="stg-hud-panel p-4"><Video className="mx-auto text-[#84cc16]" /><p className="mt-2 text-2xl font-black text-white">{latestContent.length}</p><p className="text-[10px] uppercase text-[#94a3b8]">Videos</p></div>
            </div>
          </div>
        </section>

        {loading ? (
          <div className="stg-hud-panel p-10 text-center text-[#94a3b8]">
            <RefreshCw className="mx-auto mb-3 animate-spin text-[#a855f7]" />
            Carregando criadores STG...
          </div>
        ) : (
          <>
            <section className="space-y-4">
              <h2 className="text-2xl font-black uppercase tracking-[0.08em] text-white">Ao vivo agora</h2>
              {liveContent.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {liveContent.map((content) => <LiveContentCard key={content.id} content={content} />)}
                </div>
              ) : (
                <div className="stg-hud-panel p-6 text-[#94a3b8]">Nenhuma live ativa detectada. Exibindo videos recentes abaixo.</div>
              )}
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-black uppercase tracking-[0.08em] text-white">Ultimos videos</h2>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {latestContent.slice(0, 6).map((content) => <LiveContentCard key={content.id} content={content} />)}
              </div>
              {latestContent.length === 0 && <div className="stg-hud-panel p-6 text-[#94a3b8]">Videos aguardando sincronizacao das plataformas.</div>}
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-black uppercase tracking-[0.08em] text-white">Criadores vinculados</h2>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {creators.map((creator) => (
                  <CreatorCard key={creator.id} creator={creator} liveContent={liveByCreator.get(creator.id)} />
                ))}
              </div>
              {creators.length === 0 && <div className="stg-hud-panel p-6 text-[#94a3b8]">Nenhum criador ativo sincronizado ainda.</div>}
            </section>
          </>
        )}
      </div>
    </Layout>
  );
}
