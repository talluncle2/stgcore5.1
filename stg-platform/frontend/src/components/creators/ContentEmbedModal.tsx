import { ExternalLink, X } from "lucide-react";
import { CreatorContent } from "../../types/api";

interface ContentEmbedModalProps {
  content: CreatorContent | null;
  onClose: () => void;
}

function withTwitchParent(embedUrl: string): string {
  if (!embedUrl.includes("twitch.tv")) return embedUrl;
  try {
    const url = new URL(embedUrl);
    if (!url.searchParams.has("parent")) {
      url.searchParams.set("parent", window.location.hostname || "localhost");
    }
    return url.toString();
  } catch {
    return embedUrl;
  }
}

export function ContentEmbedModal({ content, onClose }: ContentEmbedModalProps) {
  if (!content) return null;

  const creatorName = content.creator?.public_name || content.creator?.display_name || content.creator?.username || "Criador STG";
  const embedUrl = content.embed_url ? withTwitchParent(content.embed_url) : "";

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/82 p-3 backdrop-blur-sm" role="dialog" aria-modal="true">
      <div className="w-full max-w-5xl overflow-hidden border border-[#a855f7]/45 bg-[#050608] shadow-[0_0_70px_rgba(168,85,247,0.24)]">
        <div className="flex items-start justify-between gap-4 border-b border-[#a855f7]/20 p-4">
          <div className="min-w-0">
            <p className="text-xs font-black uppercase tracking-[0.12em] text-[#a855f7]">{creatorName} / {content.platform}</p>
            <h2 className="mt-1 line-clamp-2 text-xl font-black uppercase tracking-[0.04em] text-white">{content.title || "Conteudo STG"}</h2>
          </div>
          <button type="button" onClick={onClose} className="shrink-0 border border-[#a855f7]/25 p-2 text-[#94a3b8] hover:text-white" aria-label="Fechar player">
            <X size={20} />
          </button>
        </div>

        {embedUrl ? (
          <div className="aspect-video bg-black">
            <iframe
              src={embedUrl}
              title={content.title || "Player STG"}
              className="size-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          </div>
        ) : (
          <div className="grid min-h-[280px] place-items-center p-6 text-center">
            <div>
              <p className="text-sm font-bold text-[#94a3b8]">Este conteudo nao possui player incorporado. Abra o perfil na plataforma.</p>
              {content.content_url && (
                <a href={content.content_url} target="_blank" rel="noreferrer" className="stg-button-primary mt-5 inline-flex items-center gap-2">
                  Abrir na plataforma <ExternalLink size={16} />
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
