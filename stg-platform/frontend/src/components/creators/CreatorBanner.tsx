import { Radio } from "lucide-react";
import { ContentCreator, CreatorContent } from "../../types/api";
import { CreatorPlatformBadge } from "./CreatorPlatformBadge";

interface CreatorBannerProps {
  creator: ContentCreator;
  liveContent?: CreatorContent;
}

export function CreatorBanner({ creator, liveContent }: CreatorBannerProps) {
  const name = creator.public_name || creator.display_name || creator.username || "Criador STG";
  const avatar = creator.public_avatar_url || creator.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=a855f7&color=fff`;
  const banner = creator.public_banner_url || creator.banner_url || "/assets/tactical-ops-bg.png";

  return (
    <article className="relative overflow-hidden border border-[#a855f7]/35 bg-[#050608]">
      <div className="absolute inset-0 bg-cover bg-center opacity-42" style={{ backgroundImage: `url("${banner}")` }} />
      <div className="absolute inset-0 bg-gradient-to-r from-black via-black/76 to-[#19082d]/72" />
      <div className="relative grid gap-5 p-5 md:grid-cols-[auto_1fr_auto] md:items-center">
        <img src={avatar} alt={name} className="size-20 rounded-full border-2 border-[#a855f7] object-cover shadow-lg shadow-[#a855f7]/20" />
        <div className="min-w-0">
          <div className="flex flex-wrap gap-2">
            <span className="stg-badge-purple">Criador STG</span>
            {creator.is_featured && <span className="stg-badge-success">Destaque</span>}
            {creator.is_verified && <span className="stg-badge-info">Verificado</span>}
            {liveContent?.is_live && <span className="stg-badge-danger inline-flex items-center gap-1"><Radio size={13} /> Ao vivo</span>}
          </div>
          <h3 className="mt-3 text-2xl font-black uppercase tracking-[0.06em] text-white">{name}</h3>
          <p className="mt-1 line-clamp-2 max-w-2xl text-sm text-[#cbd5e1]">{creator.bio || "Criador oficial da comunidade STG."}</p>
        </div>
        <div className="flex flex-wrap gap-2 md:justify-end">
          {creator.channels?.filter((channel) => channel.is_active !== false).slice(0, 4).map((channel) => (
            <CreatorPlatformBadge key={channel.id} platform={channel.platform} />
          ))}
        </div>
      </div>
    </article>
  );
}
