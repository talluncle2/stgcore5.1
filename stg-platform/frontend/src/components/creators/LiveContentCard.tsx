import { ExternalLink, Play, Radio } from "lucide-react";
import { CreatorContent } from "../../types/api";

interface LiveContentCardProps {
  content: CreatorContent;
}

export function LiveContentCard({ content }: LiveContentCardProps) {
  const creatorName = content.creator?.display_name || content.creator?.username || "Criador STG";

  return (
    <article className={`stg-hud-panel overflow-hidden ${content.is_live ? "border-[#ef4444]/55" : ""}`}>
      <div className="relative aspect-video bg-[#050608]">
        {content.thumbnail_url ? (
          <img src={content.thumbnail_url} alt={content.title || creatorName} className="size-full object-cover" />
        ) : (
          <div className="flex size-full items-center justify-center bg-gradient-to-br from-[#111827] to-[#2e1065] text-[#a855f7]">
            <Play size={42} />
          </div>
        )}
        <span className={`absolute left-3 top-3 inline-flex items-center gap-2 border px-3 py-1 text-xs font-black uppercase ${content.is_live ? "border-[#ef4444]/65 bg-[#ef4444]/25 text-[#fecaca]" : "border-[#a855f7]/50 bg-[#a855f7]/20 text-[#e9d5ff]"}`}>
          {content.is_live ? <Radio size={14} className="animate-pulse" /> : <Play size={14} />}
          {content.is_live ? "Ao vivo" : content.content_type}
        </span>
      </div>
      <div className="p-4">
        <div className="mb-2 flex flex-wrap gap-2">
          <span className="stg-badge-purple">{content.platform}</span>
          <span className="stg-badge-info">{creatorName}</span>
        </div>
        <h3 className="line-clamp-2 text-lg font-black uppercase tracking-[0.04em] text-white">{content.title || "Conteudo STG"}</h3>
        <p className="mt-2 text-xs font-bold uppercase tracking-[0.08em] text-[#94a3b8]">
          {content.started_at || content.published_at ? new Date(content.started_at || content.published_at || "").toLocaleString("pt-BR") : "Aguardando sincronizacao"}
        </p>
        {content.content_url && (
          <a href={content.content_url} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-2 text-sm font-black uppercase text-[#c084fc] hover:text-white">
            Assistir <ExternalLink size={15} />
          </a>
        )}
      </div>
    </article>
  );
}
