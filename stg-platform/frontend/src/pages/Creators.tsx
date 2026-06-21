import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { Radio, RefreshCw, Users, Video } from "lucide-react";
import { Layout } from "../components/layout/Layout";
import { CreatorCard } from "../components/creators/CreatorCard";
import { CreatorBanner } from "../components/creators/CreatorBanner";
import { CreatorPlatformBadge } from "../components/creators/CreatorPlatformBadge";
import { ContentEmbedModal } from "../components/creators/ContentEmbedModal";
import { LiveContentCard } from "../components/creators/LiveContentCard";
import { getCreatorById, getCreators, getFeaturedCreators, getLatestCreatorContent, getLiveCreators } from "../services/creatorsService";
import { ContentCreator, CreatorContent } from "../types/api";

export function Creators() {
  const { creatorId } = useParams();
  const [creators, setCreators] = useState<ContentCreator[]>([]);
  const [selectedCreator, setSelectedCreator] = useState<ContentCreator | null>(null);
  const [featuredCreators, setFeaturedCreators] = useState<ContentCreator[]>([]);
  const [liveContent, setLiveContent] = useState<CreatorContent[]>([]);
  const [latestContent, setLatestContent] = useState<CreatorContent[]>([]);
  const [selectedContent, setSelectedContent] = useState<CreatorContent | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [creatorData, featuredData, liveData, latestData, selectedData] = await Promise.all([
          getCreators(),
          getFeaturedCreators(),
          getLiveCreators(),
          getLatestCreatorContent(),
          creatorId ? getCreatorById(creatorId) : Promise.resolve(null),
        ]);
        setCreators(creatorData);
        setFeaturedCreators(featuredData);
        setLiveContent(liveData);
        setLatestContent(latestData);
        setSelectedCreator(selectedData);
      } catch {
        setCreators([]);
        setFeaturedCreators([]);
        setLiveContent([]);
        setLatestContent([]);
        setSelectedCreator(null);
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [creatorId]);

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
                Perfis oficiais vinculados por URL, com identidade validada pelo login Discord.
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
            {creatorId && selectedCreator && (
              <section className="space-y-4">
                <CreatorBanner creator={selectedCreator} liveContent={liveByCreator.get(selectedCreator.id)} />
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="stg-hud-panel p-5">
                    <h2 className="text-xl font-black uppercase text-white">Bio publica</h2>
                    <p className="mt-3 text-sm leading-6 text-[#94a3b8]">{selectedCreator.bio || "Este criador ainda nao cadastrou uma bio publica."}</p>
                  </div>
                  <div className="stg-hud-panel p-5">
                    <h2 className="text-xl font-black uppercase text-white">Plataformas</h2>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {selectedCreator.channels.map((channel) => <CreatorPlatformBadge key={channel.id} platform={channel.platform} />)}
                      {selectedCreator.channels.length === 0 && <p className="text-sm text-[#94a3b8]">Nenhuma plataforma publica cadastrada.</p>}
                    </div>
                  </div>
                </div>
              </section>
            )}
            {creatorId && !selectedCreator && (
              <div className="stg-hud-panel p-6 text-[#94a3b8]">Perfil de criador nao encontrado no Supabase.</div>
            )}

            <section className="space-y-4">
              <h2 className="text-2xl font-black uppercase tracking-[0.08em] text-white">Ao vivo agora</h2>
              {liveContent.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {liveContent.map((content) => <LiveContentCard key={content.id} content={content} onWatch={setSelectedContent} />)}
                </div>
              ) : (
                <div className="stg-hud-panel p-6 text-[#94a3b8]">Nenhuma transmissao ao vivo registrada no momento.</div>
              )}
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-black uppercase tracking-[0.08em] text-white">Criadores STG em destaque</h2>
              {featuredCreators.length > 0 ? (
                <div className="grid gap-4">
                  {featuredCreators.slice(0, 3).map((creator) => (
                    <CreatorBanner key={creator.id} creator={creator} liveContent={liveByCreator.get(creator.id)} />
                  ))}
                </div>
              ) : (
                <div className="stg-hud-panel p-6 text-[#94a3b8]">Criadores em destaque aguardando curadoria da equipe STG.</div>
              )}
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-black uppercase tracking-[0.08em] text-white">Ultimos videos da comunidade</h2>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {latestContent.slice(0, 6).map((content) => <LiveContentCard key={content.id} content={content} onWatch={setSelectedContent} />)}
              </div>
              {latestContent.length === 0 && <div className="stg-hud-panel p-6 text-[#94a3b8]">Conteudos recentes ainda nao foram cadastrados no Supabase.</div>}
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
      <ContentEmbedModal content={selectedContent} onClose={() => setSelectedContent(null)} />
    </Layout>
  );
}
