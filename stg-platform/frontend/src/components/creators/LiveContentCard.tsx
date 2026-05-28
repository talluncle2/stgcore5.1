import { ExternalLink, Play, Radio } from "lucide-react";
import { CreatorContent } from "../../types/api";
import { CreatorPlatformBadge } from "./CreatorPlatformBadge";

interface LiveContentCardProps {
  content: CreatorContent;
  onWatch?: (content: CreatorContent) => void;
}

export function LiveContentCard({ content, onWatch }: LiveContentCardProps) {
  const creatorName = content.creator?.public_name || content.creator?.display_name || content.creator?.username || "Criador STG";
  const avatarUrl =
    content.creator?.public_avatar_url ||
    content.creator?.avatar_url ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(creatorName)}&background=a855f7&color=fff`;
  const canEmbed = Boolean(content.embed_url);

  return (
    <article className={`stg-hud-panel overflow-hidden ${content.is_live ? "border-[#ef4444]/55 shadow-[0_0_30px_rgba(239,68,68,0.16)]" : ""}`}>
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
        <div className="mb-3 flex items-center gap-3">
          <img src={avatarUrl} alt={creatorName} className="size-9 rounded-full border border-[#a855f7]/40 object-cover" />
          <div className="min-w-0">
            <p className="truncate text-sm font-black uppercase text-white">{creatorName}</p>
            <CreatorPlatformBadge platform={content.platform} />
          </div>
        </div>
        <h3 className="line-clamp-2 text-lg font-black uppercase tracking-[0.04em] text-white">{content.title || "Conteudo STG"}</h3>
        <p className="mt-2 text-xs font-bold uppercase tracking-[0.08em] text-[#94a3b8]">
          {content.started_at || content.published_at ? new Date(content.started_at || content.published_at || "").toLocaleString("pt-BR") : "Aguardando sincronizacao"}
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => {
              if (canEmbed && onWatch) onWatch(content);
              else if (content.content_url) window.open(content.content_url, "_blank", "noopener,noreferrer");
            }}
            className="stg-button-primary inline-flex items-center gap-2 px-4 py-2 text-xs"
            disabled={!content.content_url && !content.embed_url}
          >
            <Play size={15} /> Assistir
          </button>
          {content.content_url && (
            <a href={content.content_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-xs font-black uppercase text-[#c084fc] hover:text-white">
              Abrir plataforma <ExternalLink size={14} />
            </a>
          )}
        </div>
      </div>
    </article>
  );
}
