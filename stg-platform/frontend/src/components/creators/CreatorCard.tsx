import { ExternalLink, Radio } from "lucide-react";
import { ContentCreator, CreatorContent } from "../../types/api";

interface CreatorCardProps {
  creator: ContentCreator;
  liveContent?: CreatorContent;
}

export function CreatorCard({ creator, liveContent }: CreatorCardProps) {
  const primaryChannel = creator.channels?.find((channel) => channel.is_active) || creator.channels?.[0];
  const isLive = Boolean(liveContent?.is_live);
  const name = creator.display_name || creator.username || "Criador STG";

  return (
    <article className={`stg-hud-panel overflow-hidden ${isLive ? "border-[#ef4444]/55 shadow-[0_0_28px_rgba(239,68,68,0.18)]" : ""}`}>
      <div className="relative h-32 bg-gradient-to-br from-[#111827] via-[#2e1065]/45 to-[#050608]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_20%,rgba(168,85,247,0.28),transparent_16rem)]" />
        {isLive && (
          <span className="absolute right-3 top-3 inline-flex items-center gap-2 border border-[#ef4444]/60 bg-[#ef4444]/20 px-3 py-1 text-xs font-black uppercase text-[#fecaca]">
            <Radio size={14} className="animate-pulse" />
            Ao vivo
          </span>
        )}
      </div>
      <div className="-mt-12 p-5">
        <img
          src={creator.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=a855f7&color=fff`}
          alt={name}
          className="relative size-24 rounded-full border-4 border-[#050608] object-cover shadow-xl shadow-black/50"
        />
        <div className="mt-4 flex flex-wrap gap-2">
          <span className="stg-badge-purple">Criador STG</span>
          {creator.is_featured && <span className="stg-badge-success">Destaque</span>}
          {primaryChannel?.platform && <span className="stg-badge-info">{primaryChannel.platform}</span>}
        </div>
        <h3 className="mt-3 text-xl font-black uppercase tracking-[0.05em] text-white">{name}</h3>
        <p className="mt-2 line-clamp-2 text-sm text-[#94a3b8]">{creator.bio || "Canal oficial vinculado a comunidade STG."}</p>
        <div className="mt-5 flex flex-wrap gap-2">
          {liveContent?.content_url && (
            <a href={liveContent.content_url} target="_blank" rel="noreferrer" className="stg-button-primary inline-flex items-center gap-2 px-4 py-2 text-xs">
              Assistir agora <ExternalLink size={14} />
            </a>
          )}
          {primaryChannel?.channel_url && (
            <a href={primaryChannel.channel_url} target="_blank" rel="noreferrer" className="stg-button-secondary inline-flex items-center gap-2 px-4 py-2 text-xs">
              Ver canal <ExternalLink size={14} />
            </a>
          )}
        </div>
      </div>
    </article>
  );
}
