import { FormEvent, useEffect, useMemo, useState, type ElementType, type ReactNode } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Activity,
  AlertTriangle,
  AtSign,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Crosshair,
  ExternalLink,
  Eye,
  EyeOff,
  Flame,
  ImageIcon,
  Link as LinkIcon,
  Lock,
  Play,
  Plus,
  Radio,
  RefreshCw,
  Save,
  Shield,
  Sword,
  Trash2,
  TrendingUp,
  User as UserIcon,
  Video,
} from "lucide-react";
import { Layout } from "../components/layout/Layout";
import { useAuth } from "../context/AuthContext";
import {
  addMyCreatorChannel,
  disableMyCreatorChannel,
  getMyCreatorProfile,
  registerMyCreatorProfile,
  syncMyCreatorProfile,
  updateMyCreatorChannel,
} from "../services/creatorsService";
import { getMyPublicProfile, updateMyPublicProfile } from "../services/profileService";
import { AuthUser, ContentCreator, CreatorChannel, CreatorChannelPayload, CreatorPlatform, PublicProfilePayload } from "../types/api";
import { hasAdminAccess, hasCreatorAccess } from "../utils/permissions";

type ProfileTab = "resumo" | "publico" | "criador" | "privacidade";

const platforms: CreatorPlatform[] = ["youtube", "twitch", "kick", "tiktok"];
const MAX_PROFILE_IMAGE_BYTES = 5 * 1024 * 1024;

const platformColors: Record<string, string> = {
  youtube: "#FF0000",
  twitch: "#9146FF",
  kick: "#53FC18",
  tiktok: "#ff0050",
  instagram: "#E1306C",
  x: "#e7e9ea",
  twitter: "#e7e9ea",
};

const platformLabels: Record<string, string> = {
  youtube: "YouTube",
  twitch: "Twitch",
  kick: "Kick",
  tiktok: "TikTok",
  instagram: "Instagram",
  x: "X / Twitter",
  twitter: "X / Twitter",
};

const emptyProfile: PublicProfilePayload = {
  public_name: "",
  public_avatar_url: "",
  public_banner_url: "",
  bio: "",
  public_email: "",
  location_optional: "",
  pronouns: "",
  sexual_orientation: "",
  sexual_orientation_visibility: "private",
  profile_visibility: "public",
};

const emptyChannel: CreatorChannelPayload = {
  platform: "youtube",
  channel_url: "",
  is_active: true,
};

function createLocalCreatorProfile(user: AuthUser, channel?: CreatorChannel): ContentCreator {
  return {
    id: channel?.creator_id || String(user.discord_id || user.id || "me"),
    discord_id: String(user.discord_id || ""),
    display_name: user.display_name || user.global_name || user.username || user.discord_username,
    username: user.username || user.discord_username,
    avatar_url: user.avatar_url || user.discord_avatar_url,
    is_active: true,
    is_featured: false,
    sort_order: 0,
    channels: channel ? [channel] : [],
    latest_content: [],
    latest_contents: [],
  };
}

function getChannelLabel(channel: CreatorChannel): string {
  if (channel.channel_name) return channel.channel_name;
  if (channel.handle) return channel.handle;
  if (!channel.channel_url) return "Canal cadastrado";
  try {
    const url = new URL(channel.channel_url);
    const cleanPath = url.pathname.replace(/^\/+|\/+$/g, "");
    return cleanPath || url.hostname.replace(/^www\./, "");
  } catch {
    return channel.channel_url;
  }
}

function formatCompactNumber(value?: number): string {
  if (value === undefined || value === null) return "N/A";
  return Intl.NumberFormat("pt-BR", { notation: "compact", maximumFractionDigits: 1 }).format(value);
}

function getChannelSyncStatus(channel?: CreatorChannel | null): string {
  if (!channel) return "pending";
  const metadata = channel.metadata_json || {};
  const status = metadata.content_sync_status || metadata.profile_sync_status;
  if (typeof status === "string" && status.trim()) return status.toLowerCase();
  return channel.last_checked_at ? "ok" : "pending";
}

function getChannelSyncLabel(channel?: CreatorChannel | null): string {
  const status = getChannelSyncStatus(channel);
  if (status === "ok") return "Sincronizado";
  if (status === "not_configured") return "API nao configurada";
  if (status === "not_implemented") return "Nao implementado";
  if (status === "not_found") return "Canal nao encontrado";
  if (status === "error") return "Erro de sync";
  return "Pendente";
}

function normalizeChannelIdentifier(value?: string): string {
  return String(value || "").trim().toLowerCase().replace(/^@/, "");
}

function normalizeChannelUrl(value?: string): string {
  const raw = String(value || "").trim();
  if (!raw) return "";
  try {
    const url = new URL(raw);
    url.hash = "";
    url.search = "";
    url.hostname = url.hostname.replace(/^www\./, "").toLowerCase();
    url.pathname = url.pathname.replace(/\/+$/g, "");
    return url.toString().replace(/\/+$/g, "").toLowerCase();
  } catch {
    return raw.replace(/\/+$/g, "").toLowerCase();
  }
}

function isSameCreatorChannel(channel: CreatorChannel, payload: CreatorChannelPayload): boolean {
  if (normalizeChannelIdentifier(channel.platform) !== normalizeChannelIdentifier(payload.platform)) return false;
  return (
    Boolean(channel.channel_id && payload.channel_id && normalizeChannelIdentifier(channel.channel_id) === normalizeChannelIdentifier(payload.channel_id)) ||
    Boolean(channel.handle && payload.handle && normalizeChannelIdentifier(channel.handle) === normalizeChannelIdentifier(payload.handle)) ||
    Boolean(channel.channel_url && payload.channel_url && normalizeChannelUrl(channel.channel_url) === normalizeChannelUrl(payload.channel_url))
  );
}

function Corners({ size = 10, color = "rgba(168,85,247,0.7)" }: { size?: number; color?: string }) {
  const s = `${size}px`;
  const b = `1.5px solid ${color}`;
  return (
    <>
      <span style={{ position: "absolute", top: 0, left: 0, width: s, height: s, borderTop: b, borderLeft: b }} />
      <span style={{ position: "absolute", top: 0, right: 0, width: s, height: s, borderTop: b, borderRight: b }} />
      <span style={{ position: "absolute", bottom: 0, left: 0, width: s, height: s, borderBottom: b, borderLeft: b }} />
      <span style={{ position: "absolute", bottom: 0, right: 0, width: s, height: s, borderBottom: b, borderRight: b }} />
    </>
  );
}

function Scanlines({ opacity = 0.04 }: { opacity?: number }) {
  return (
    <div
      aria-hidden
      style={{
        position: "absolute",
        inset: 0,
        backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,1) 2px, rgba(0,0,0,1) 4px)",
        opacity,
        pointerEvents: "none",
      }}
    />
  );
}

function PlatformBadge({ platform }: { platform?: string }) {
  const normalized = String(platform || "youtube").toLowerCase();
  const color = platformColors[normalized] || "#a855f7";
  const label = platformLabels[normalized] || platform || "Canal";
  return (
    <span
      style={{ borderColor: `${color}55`, color, background: `${color}12` }}
      className="inline-flex items-center gap-1.5 border px-2.5 py-0.5 text-[10px] font-black uppercase tracking-widest"
    >
      <span style={{ width: 5, height: 5, borderRadius: "50%", background: color, boxShadow: `0 0 5px ${color}`, display: "inline-block", flexShrink: 0 }} />
      {label}
    </span>
  );
}

function HudPanel({ children, className = "", accent = false }: { children: ReactNode; className?: string; accent?: boolean }) {
  return (
    <div
      className={`relative border border-purple-500/20 bg-[#08090e] ${className}`}
      style={{ boxShadow: accent ? "0 0 0 1px rgba(168,85,247,0.08) inset, 0 8px 40px rgba(0,0,0,0.7), 0 0 20px rgba(168,85,247,0.05)" : "0 4px 24px rgba(0,0,0,0.5)" }}
    >
      <div className="absolute left-0 top-0 h-[1px] w-20 bg-gradient-to-r from-purple-500/80 to-transparent" />
      <div className="absolute bottom-0 right-0 h-[1px] w-12 bg-gradient-to-l from-purple-500/30 to-transparent" />
      <Corners size={8} />
      {children}
    </div>
  );
}

function StatCard({ label, value, icon: Icon, sub }: { label: string; value: string | number; icon: ElementType; sub?: string }) {
  return (
    <div
      className="relative overflow-hidden border border-purple-500/20 bg-[#08090e] p-5"
      style={{ boxShadow: "0 0 30px rgba(0,0,0,0.6), 0 0 0 1px rgba(168,85,247,0.04) inset" }}
    >
      <Corners size={8} />
      <div aria-hidden className="pointer-events-none absolute -right-4 -top-4 h-20 w-20 rounded-full opacity-10" style={{ background: "radial-gradient(circle, #a855f7 0%, transparent 70%)" }} />
      <div className="mb-4 flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center border border-purple-500/30 bg-purple-500/10">
          <Icon size={13} className="text-purple-400" />
        </div>
        <p className="text-[9px] font-black uppercase tracking-[0.18em] text-purple-400/80">{label}</p>
      </div>
      <p className="break-all font-mono text-2xl font-black text-white" style={{ textShadow: "0 0 20px rgba(168,85,247,0.3)" }}>{value}</p>
      {sub && <p className="mt-1 text-[10px] font-bold text-slate-600">{sub}</p>}
    </div>
  );
}

function TacticalInput({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[9px] font-black uppercase tracking-[0.18em] text-purple-400/80">{label}</span>
      <div className="relative">
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className="w-full border border-purple-500/15 bg-black/60 px-3 py-2.5 text-sm text-white outline-none placeholder:text-slate-700 focus:border-purple-500/50 focus:bg-black/80"
          style={{ boxShadow: "inset 0 1px 0 rgba(168,85,247,0.04)" }}
        />
      </div>
    </label>
  );
}

function TacticalTextarea({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[9px] font-black uppercase tracking-[0.18em] text-purple-400/80">{label}</span>
      <div className="relative">
        <textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className="min-h-28 w-full resize-y border border-purple-500/15 bg-black/60 px-3 py-2.5 text-sm text-white outline-none placeholder:text-slate-700 focus:border-purple-500/50 focus:bg-black/80"
          style={{ boxShadow: "inset 0 1px 0 rgba(168,85,247,0.04)" }}
        />
        <div className="pointer-events-none absolute bottom-0 right-0 h-2 w-2 border-b border-r border-purple-500/40" />
      </div>
    </label>
  );
}

function TacticalSelect({ label, value, onChange, children }: { label: string; value: string; onChange: (value: string) => void; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[9px] font-black uppercase tracking-[0.18em] text-purple-400/80">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full border border-purple-500/15 bg-black/60 px-3 py-2.5 text-sm text-white outline-none focus:border-purple-500/50"
        style={{ boxShadow: "inset 0 1px 0 rgba(168,85,247,0.04)" }}
      >
        {children}
      </select>
    </label>
  );
}

function ImageUploadField({ label, variant, value, fallbackPreview, onChange }: { label: string; variant: "avatar" | "banner"; value: string; fallbackPreview?: string; onChange: (value: string) => void }) {
  const isAvatar = variant === "avatar";
  const preview = value || fallbackPreview || "";
  const hasPreview = Boolean(preview);
  const isUploadedImage = value.startsWith("data:image/");

  function handleFile(file?: File) {
    if (!file) return;
    if (!file.type.startsWith("image/")) return;
    if (file.size > MAX_PROFILE_IMAGE_BYTES) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        onChange(reader.result);
      }
    };
    reader.readAsDataURL(file);
  }

  return (
    <div className={isAvatar ? "" : "md:col-span-2"}>
      <p className="mb-1.5 text-[9px] font-black uppercase tracking-[0.18em] text-purple-400/80">{label}</p>
      <label
        className={`relative flex cursor-pointer overflow-hidden border transition-all duration-200 hover:border-purple-500/45 ${hasPreview ? "border-purple-500/35 bg-black/40" : "border-purple-500/20 bg-black/40"} ${isAvatar ? "h-36 w-36 max-w-full rounded-full" : "h-32 w-full"}`}
      >
        <Corners size={7} color="rgba(168,85,247,0.4)" />
        {hasPreview ? (
          <>
            <img src={preview} alt={label} className={`h-full w-full object-cover ${isAvatar ? "rounded-full" : ""}`} style={isAvatar ? undefined : { filter: "brightness(0.75) saturate(1.05)" }} />
            <div className="absolute inset-x-0 bottom-0 bg-black/70 p-2">
              <p className="truncate text-center text-[9px] font-black uppercase tracking-[0.15em] text-purple-300">{isUploadedImage ? "Upload local" : "Imagem atual"}</p>
            </div>
          </>
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 p-4">
            <div className="flex h-9 w-9 items-center justify-center border border-purple-500/30 bg-purple-500/10">
              <ImageIcon size={16} className="text-purple-400/60" />
            </div>
            <p className="text-center text-[10px] font-black text-slate-500">Selecionar imagem</p>
          </div>
        )}
        <input
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          className="sr-only"
          onChange={(event) => {
            handleFile(event.target.files?.[0]);
            event.currentTarget.value = "";
          }}
        />
      </label>
      <div className="mt-3 flex flex-wrap gap-2">
        <label className="cursor-pointer border border-purple-500/25 bg-purple-500/10 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.15em] text-purple-300 transition-colors hover:border-purple-400/50">
          {hasPreview ? "Trocar imagem" : "Selecionar imagem"}
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            className="sr-only"
            onChange={(event) => {
              handleFile(event.target.files?.[0]);
              event.currentTarget.value = "";
            }}
          />
        </label>
        {value && (
          <button type="button" onClick={() => onChange("")} className="border border-red-500/20 bg-red-500/10 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.15em] text-red-300 transition-colors hover:border-red-400/40">
            Remover imagem
          </button>
        )}
        <p className="basis-full text-[9px] font-bold text-slate-600">PNG, JPG, WEBP ou GIF ate 5 MB.</p>
      </div>
    </div>
  );
}

function SectionHeader({ icon: Icon, title }: { icon: ElementType; title: string }) {
  return (
    <div className="flex items-center gap-3 border-b border-purple-500/10 px-5 py-4">
      <div className="flex h-6 w-6 items-center justify-center border border-purple-500/30 bg-purple-500/10">
        <Icon size={12} className="text-purple-400" />
      </div>
      <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-purple-300">{title}</h3>
      <div className="ml-auto h-[1px] w-12 bg-gradient-to-l from-transparent to-purple-500/30" />
    </div>
  );
}

function TacticalSubmitButton({ saving, children }: { saving?: boolean; children: ReactNode }) {
  return (
    <button
      type="submit"
      disabled={saving}
      className="group relative overflow-hidden border border-purple-500/50 px-5 py-2.5 text-xs font-black uppercase tracking-[0.15em] text-white transition-all hover:border-purple-400/80 disabled:opacity-50"
      style={{ background: "linear-gradient(135deg, rgba(88,28,135,0.3) 0%, rgba(126,34,206,0.15) 100%)" }}
    >
      <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-purple-400/8 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
      <span className="relative flex items-center justify-center gap-2">{children}</span>
    </button>
  );
}

function VideoCarousel({ videos }: { videos: Array<{ id: string; title?: string; thumbnail_url?: string; content_url?: string; published_at?: string; view_count?: number }> }) {
  const [active, setActive] = useState(0);
  if (!videos.length) return null;

  const current = videos[Math.min(active, videos.length - 1)];
  const prev = () => setActive((index) => (index - 1 + videos.length) % videos.length);
  const next = () => setActive((index) => (index + 1) % videos.length);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <div className="flex h-6 w-6 items-center justify-center border border-purple-500/30 bg-purple-500/10">
          <Play size={11} className="text-purple-400" />
        </div>
        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-purple-400/70">Ultimos Videos</p>
        <div className="h-[1px] flex-1 bg-gradient-to-r from-purple-500/20 to-transparent" />
        <span className="text-[9px] font-black text-slate-600">{active + 1} / {videos.length}</span>
      </div>

      <a href={current.content_url || "#"} target="_blank" rel="noreferrer" className="group relative block overflow-hidden border border-purple-500/25 transition-all duration-300 hover:border-purple-500/50" style={{ boxShadow: "0 0 40px rgba(168,85,247,0.08)" }}>
        <Corners size={10} />
        <div className="relative h-52 overflow-hidden bg-black/60">
          {current.thumbnail_url && <img src={current.thumbnail_url} alt={current.title || "Video"} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" style={{ filter: "brightness(0.6) saturate(1.1)" }} />}
          <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(2,3,7,0.98) 0%, rgba(2,3,7,0.55) 40%, rgba(46,16,101,0.18) 70%, transparent 100%)" }} />
          <div className="absolute inset-0" style={{ background: "linear-gradient(90deg, rgba(2,3,7,0.7) 0%, transparent 50%)" }} />
          <Scanlines opacity={0.05} />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex h-16 w-16 items-center justify-center border-2 border-white/20 bg-black/40 transition-all duration-300 group-hover:border-purple-400/60 group-hover:bg-purple-500/20" style={{ backdropFilter: "blur(4px)", boxShadow: "0 0 30px rgba(168,85,247,0.2)" }}>
              <Play size={24} className="ml-1 text-white/80 transition-colors group-hover:text-purple-300" fill="currentColor" />
            </div>
          </div>
          {active === 0 && (
            <div className="absolute left-4 top-4 flex items-center gap-1.5 border border-orange-500/50 bg-orange-500/15 px-2.5 py-1">
              <Flame size={10} className="text-orange-400" />
              <span className="text-[9px] font-black uppercase tracking-[0.2em] text-orange-300">Destaque</span>
            </div>
          )}
          <div className="absolute right-4 top-4 border border-purple-500/30 bg-black/60 px-2 py-0.5" style={{ backdropFilter: "blur(4px)" }}>
            <span className="font-mono text-[9px] font-black text-purple-300">#{String(active + 1).padStart(2, "0")}</span>
          </div>
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <p className="line-clamp-2 text-base font-black leading-snug text-white" style={{ textShadow: "0 2px 8px rgba(0,0,0,0.8)" }}>{current.title || "Video publicado"}</p>
            <div className="mt-2 flex items-center gap-4">
              <span className="flex items-center gap-1.5 text-[10px] font-bold text-purple-300">
                <Eye size={10} /> {formatCompactNumber(current.view_count)} views
              </span>
              <span className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400">
                <CalendarDays size={10} />
                {current.published_at ? new Date(current.published_at).toLocaleDateString("pt-BR") : "Data pendente"}
              </span>
            </div>
          </div>
          {videos.length > 1 && (
            <>
              <button type="button" onClick={(event) => { event.preventDefault(); prev(); }} className="absolute left-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center border border-white/15 bg-black/50 text-white/60 transition-all hover:border-purple-400/50 hover:bg-purple-500/20 hover:text-white">
                <ChevronLeft size={16} />
              </button>
              <button type="button" onClick={(event) => { event.preventDefault(); next(); }} className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center border border-white/15 bg-black/50 text-white/60 transition-all hover:border-purple-400/50 hover:bg-purple-500/20 hover:text-white">
                <ChevronRight size={16} />
              </button>
            </>
          )}
        </div>
      </a>

      {videos.length > 1 && (
        <>
          <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${videos.length}, 1fr)` }}>
            {videos.map((video, index) => (
              <button
                key={video.id}
                type="button"
                onClick={() => setActive(index)}
                className={`group relative overflow-hidden border text-left transition-all duration-200 ${index === active ? "border-purple-500/60" : "border-purple-500/12 opacity-60 hover:border-purple-500/35 hover:opacity-80"}`}
                style={index === active ? { boxShadow: "0 0 16px rgba(168,85,247,0.2)" } : {}}
              >
                <Corners size={5} color={index === active ? "rgba(168,85,247,0.8)" : "rgba(168,85,247,0.3)"} />
                <div className="relative h-16 overflow-hidden">
                  {video.thumbnail_url && <img src={video.thumbnail_url} alt={video.title || "Video"} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" style={{ filter: index === active ? "brightness(0.65) saturate(1.1)" : "brightness(0.4) saturate(0.8)" }} />}
                  <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(2,3,7,0.85) 0%, transparent 60%)" }} />
                  {index === active && <div className="absolute inset-x-0 bottom-0 h-[2px] bg-gradient-to-r from-transparent via-purple-500 to-transparent" />}
                  <span className={`absolute right-1.5 top-1.5 font-mono text-[8px] font-black ${index === active ? "text-purple-300" : "text-slate-600"}`}>#{String(index + 1).padStart(2, "0")}</span>
                </div>
                <div className="p-2">
                  <p className={`line-clamp-2 text-[10px] font-black leading-tight ${index === active ? "text-white" : "text-slate-500"}`}>{video.title || "Video publicado"}</p>
                  <p className="mt-1 flex items-center gap-1 text-[9px] text-slate-600"><Eye size={8} /> {formatCompactNumber(video.view_count)}</p>
                </div>
              </button>
            ))}
          </div>
          <div className="flex justify-center gap-1.5 pt-1">
            {videos.map((video, index) => (
              <button
                key={`${video.id}-dot`}
                type="button"
                onClick={() => setActive(index)}
                className="transition-all duration-200"
                style={{ width: index === active ? 20 : 6, height: 4, background: index === active ? "linear-gradient(90deg, #9333ea, #a855f7)" : "rgba(168,85,247,0.25)", boxShadow: index === active ? "0 0 8px rgba(168,85,247,0.5)" : "none" }}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export function Profile() {
  const { user, profile, refreshUser } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedTab = searchParams.get("tab") as ProfileTab | null;
  const [activeTab, setActiveTabState] = useState<ProfileTab>(requestedTab || "resumo");
  const [publicForm, setPublicForm] = useState<PublicProfilePayload>(emptyProfile);
  const [creatorProfile, setCreatorProfile] = useState<ContentCreator | null>(null);
  const [channelForm, setChannelForm] = useState<CreatorChannelPayload>(emptyChannel);
  const [editingChannel, setEditingChannel] = useState<CreatorChannel | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [syncingCreator, setSyncingCreator] = useState(false);
  const [creatorApiError, setCreatorApiError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const identity = user ?? profile;
  const canManageCreator = hasCreatorAccess(identity);
  const isAdmin = hasAdminAccess(identity);
  const username = profile?.username || user?.display_name || user?.username || user?.discord_username || "Operador";
  const avatarUrl = publicForm.public_avatar_url || profile?.avatar_url || user?.avatar_url || user?.discord_avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=a855f7&color=fff`;
  const visibleCreatorProfile = user ? (creatorProfile || (!creatorApiError && canManageCreator ? createLocalCreatorProfile(user) : null)) : null;
  const primaryCreatorChannel = visibleCreatorProfile?.channels.find((channel) => channel.is_active) || visibleCreatorProfile?.channels[0] || null;
  const primaryChannelContent = primaryCreatorChannel
    ? (visibleCreatorProfile?.latest_content || visibleCreatorProfile?.latest_contents || []).filter((content) => content.channel_id === primaryCreatorChannel.id).slice(0, 3)
    : [];
  const primaryChannelName = primaryCreatorChannel?.channel_name || (primaryCreatorChannel ? getChannelLabel(primaryCreatorChannel) : "Nenhuma plataforma cadastrada");
  const primaryChannelAvatarUrl = primaryCreatorChannel?.thumbnail_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(primaryChannelName)}&background=111827&color=c084fc`;
  const primaryChannelSyncStatus = getChannelSyncStatus(primaryCreatorChannel);
  const primaryChannelSyncLabel = getChannelSyncLabel(primaryCreatorChannel);
  const usedPlatforms = visibleCreatorProfile?.channels.filter((channel) => channel.is_active).map((channel) => channel.platform) || [];
  const showCreatorChannelForm = !loading && !creatorApiError && Boolean(canManageCreator);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setCreatorApiError(null);
      try {
        const publicProfile = await getMyPublicProfile();
        let creator: ContentCreator | null = null;

        if (canManageCreator) {
          try {
            creator = await getMyCreatorProfile();
            if (!creator) {
              const registeredCreator = await registerMyCreatorProfile();
              creator = registeredCreator?.creator ?? null;
            }
            if (!creator) {
              setCreatorApiError("A API de criadores nao retornou o perfil do usuario autenticado.");
            }
          } catch (err) {
            setCreatorApiError(err instanceof Error ? err.message : "Nao foi possivel conectar a API de criadores.");
          }
        }

        setPublicForm({
          ...emptyProfile,
          public_name: publicProfile?.public_name || user?.public_name || username,
          public_avatar_url: publicProfile?.public_avatar_url || user?.public_avatar_url || "",
          public_banner_url: publicProfile?.public_banner_url || user?.public_banner_url || "",
          bio: publicProfile?.bio || user?.bio || "",
          public_email: publicProfile?.public_email || user?.public_email || "",
          location_optional: publicProfile?.location_optional || user?.location_optional || "",
          pronouns: publicProfile?.pronouns || user?.pronouns || "",
          sexual_orientation: publicProfile?.sexual_orientation || user?.sexual_orientation || "",
          sexual_orientation_visibility: publicProfile?.sexual_orientation_visibility || user?.sexual_orientation_visibility || "private",
          profile_visibility: publicProfile?.profile_visibility || user?.profile_visibility || "public",
        });
        setCreatorProfile(creator);
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [canManageCreator, user, username]);

  const tabs = useMemo(
    () => [
      { id: "resumo" as const, label: "Resumo", icon: UserIcon },
      { id: "publico" as const, label: "Perfil Publico", icon: AtSign },
      ...(canManageCreator ? [{ id: "criador" as const, label: "Contas de Criador", icon: Video }] : []),
      { id: "privacidade" as const, label: "Privacidade", icon: Lock },
    ],
    [canManageCreator]
  );

  const setActiveTab = (tab: ProfileTab) => {
    setActiveTabState(tab);
    setSearchParams(tab === "resumo" ? {} : { tab });
  };

  if (!user || !profile) {
    return (
      <Layout>
        <div className="stg-hud-panel p-8 text-center text-[#94a3b8]">Carregando perfil do operador...</div>
      </Layout>
    );
  }

  async function savePublicProfile(event?: FormEvent) {
    event?.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await updateMyPublicProfile(publicForm);
      await refreshUser();
      setNotice("Perfil publico salvo com sucesso.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nao foi possivel salvar o perfil publico.");
    } finally {
      setSaving(false);
    }
  }

  async function syncCreatorProfile() {
    setSyncingCreator(true);
    setError(null);
    setCreatorApiError(null);
    try {
      const syncedCreator = await syncMyCreatorProfile();
      if (syncedCreator) {
        setCreatorProfile(syncedCreator);
      }
      setNotice("Dados reais da plataforma sincronizados.");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Nao foi possivel sincronizar com a API de criadores.";
      setCreatorApiError(message);
      setError(message);
    } finally {
      setSyncingCreator(false);
    }
  }

  async function saveChannel(event: FormEvent) {
    event.preventDefault();
    const currentUser = user;
    if (!currentUser) return;
    const duplicateChannel = !editingChannel && visibleCreatorProfile?.channels.find((channel) => isSameCreatorChannel(channel, channelForm));
    if (duplicateChannel) {
      setError("Esta conta de criador ja esta cadastrada. Use editar ou remova a conta atual antes de adicionar outra.");
      setChannelForm(emptyChannel);
      return;
    }
    const samePlatformActiveChannel = !editingChannel && visibleCreatorProfile?.channels.some((channel) => channel.is_active && channel.platform === channelForm.platform);
    if (samePlatformActiveChannel) {
      setError("Voce ja possui uma conta cadastrada nesta plataforma. Remova ou edite a conta existente antes de adicionar outra.");
      setChannelForm(emptyChannel);
      return;
    }
    setSaving(true);
    setError(null);
    try {
      if (editingChannel) {
        const updatedChannel = await updateMyCreatorChannel(editingChannel.id, channelForm);
        setCreatorProfile((current) => {
          const base = current || createLocalCreatorProfile(currentUser, updatedChannel);
          return {
            ...base,
            channels: base.channels.map((channel) => channel.id === updatedChannel.id ? updatedChannel : channel),
          };
        });
        setNotice("Canal atualizado.");
      } else {
        const createdChannel = await addMyCreatorChannel(channelForm);
        setCreatorProfile((current) => {
          const base = current || createLocalCreatorProfile(currentUser, createdChannel);
          return {
            ...base,
            channels: [...base.channels.filter((channel) => channel.id !== createdChannel.id), createdChannel],
          };
        });
        setNotice("Canal cadastrado para monitoramento.");
      }
      setChannelForm(emptyChannel);
      setEditingChannel(null);
      const refreshedCreator = await syncMyCreatorProfile().catch(() => getMyCreatorProfile());
      if (refreshedCreator) {
        setCreatorProfile(refreshedCreator);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nao foi possivel salvar o canal.");
    } finally {
      setSaving(false);
    }
  }

  async function removeChannel(channel: CreatorChannel) {
    setSaving(true);
    setError(null);
    try {
      await disableMyCreatorChannel(channel.id);
      setNotice("Canal removido/desativado.");
      setCreatorProfile((current) => current ? {
        ...current,
        channels: current.channels.filter((item) => item.id !== channel.id),
      } : current);
      const refreshedCreator = await getMyCreatorProfile().catch(() => null);
      if (refreshedCreator) {
        setCreatorProfile(refreshedCreator);
      }
    } catch {
      setError("Recurso aguardando integração da API para remover canais.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Layout>
      <div className="relative mx-auto max-w-6xl space-y-5 bg-[#020307] p-4 pb-16 pt-6 font-sans">
        <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden">
          <div className="absolute -left-40 top-0 h-[500px] w-[500px] rounded-full opacity-[0.04]" style={{ background: "radial-gradient(circle, #a855f7 0%, transparent 70%)" }} />
          <div className="absolute -right-20 top-40 h-[300px] w-[300px] rounded-full opacity-[0.03]" style={{ background: "radial-gradient(circle, #7c3aed 0%, transparent 70%)" }} />
        </div>

        <section className="relative overflow-hidden border border-purple-500/25" style={{ background: "#040508", boxShadow: "0 0 80px rgba(168,85,247,0.06), 0 0 0 1px rgba(168,85,247,0.03) inset" }}>
          <Corners size={14} color="rgba(168,85,247,0.6)" />
          <div
            className="relative h-52 bg-cover bg-center"
            style={{ backgroundImage: `linear-gradient(160deg, rgba(0,0,0,.95) 0%, rgba(46,16,101,.4) 55%, rgba(0,0,0,.90) 100%), url("${publicForm.public_banner_url || primaryChannelContent[0]?.thumbnail_url || "/assets/tactical-ops-bg.png"}")` }}
          >
            <Scanlines opacity={0.06} />
            <div aria-hidden className="pointer-events-none absolute inset-0 opacity-[0.025]" style={{ backgroundImage: "linear-gradient(rgba(168,85,247,1) 1px, transparent 1px), linear-gradient(90deg, rgba(168,85,247,1) 1px, transparent 1px)", backgroundSize: "48px 48px" }} />
            <div aria-hidden className="absolute right-8 top-1/2 flex -translate-y-1/2 flex-col gap-1.5 opacity-[0.12]">
              {[80, 56, 40, 28, 18, 10].map((width, index) => (
                <div key={index} className="h-[1px] bg-gradient-to-l from-purple-400 to-transparent" style={{ width }} />
              ))}
            </div>
            <div className="absolute bottom-4 right-5 text-right opacity-20">
              <p className="font-mono text-[8px] font-bold uppercase tracking-[0.3em] text-purple-300">SUPREMO TRIBUNAL GAMER</p>
              <p className="font-mono text-[8px] text-purple-400/80">OPERADOR // PERFIL v2.6</p>
            </div>
          </div>

          <div className="-mt-16 flex flex-col gap-4 px-6 pb-6 md:flex-row md:items-end">
            <div className="relative shrink-0">
              <div aria-hidden className="absolute -inset-1.5 rounded-full opacity-40" style={{ background: "conic-gradient(from 0deg, transparent 0%, #a855f7 30%, transparent 60%, #7c3aed 80%, transparent 100%)" }} />
              <div className="absolute -inset-1.5 rounded-full opacity-20" style={{ background: "conic-gradient(from 180deg, transparent 0%, #a855f7 30%, transparent 60%, #7c3aed 80%, transparent 100%)" }} />
              <img src={avatarUrl} alt={username} className="relative size-28 rounded-full border-2 border-[#040508] object-cover" style={{ boxShadow: "0 0 0 2px rgba(168,85,247,0.5), 0 0 40px rgba(168,85,247,0.3)" }} />
              <span className="absolute bottom-1 right-1 flex h-4 w-4">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-50" />
                <span className="relative inline-flex h-4 w-4 rounded-full border-2 border-[#040508] bg-green-500" style={{ boxShadow: "0 0 6px #4ade80" }} />
              </span>
            </div>

            <div className="min-w-0 flex-1 pb-1">
              <div className="flex items-center gap-2 text-[9px]">
                <Crosshair size={9} className="text-purple-400/60" />
                <span className="font-black uppercase tracking-[0.25em] text-purple-400/60">Perfil Operacional</span>
                <div className="h-[1px] max-w-24 flex-1 bg-gradient-to-r from-purple-500/30 to-transparent" />
              </div>
              <h1 className="mt-1.5 text-3xl font-black uppercase tracking-[0.07em] text-white" style={{ textShadow: "0 0 40px rgba(168,85,247,0.25)" }}>{publicForm.public_name || username}</h1>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="flex items-center gap-1.5 border border-purple-500/45 bg-purple-500/12 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.18em] text-purple-300"><Radio size={9} /> Discord Sincronizado</span>
                {user.is_content_creator && <span className="flex items-center gap-1.5 border border-red-500/45 bg-red-500/12 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.18em] text-red-300"><Video size={9} /> Criador STG</span>}
                {isAdmin && <span className="flex items-center gap-1.5 border border-green-500/45 bg-green-500/12 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.18em] text-green-300"><Shield size={9} /> Admin</span>}
              </div>
            </div>

            <div className="hidden shrink-0 gap-6 md:flex">
              <div className="text-right">
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-purple-400/60">Rank</p>
                <p className="font-mono text-xl font-black text-white" style={{ textShadow: "0 0 16px rgba(168,85,247,0.3)" }}>{profile.level || "N/A"}</p>
              </div>
              <div className="text-right">
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-purple-400/60">Coins</p>
                <p className="font-mono text-xl font-black text-white" style={{ textShadow: "0 0 16px rgba(168,85,247,0.3)" }}>{profile.coins || 0}</p>
              </div>
            </div>
          </div>
        </section>

        <div className="relative flex flex-wrap gap-1.5">
          <div className="absolute inset-x-0 bottom-0 h-[1px] bg-purple-500/10" />
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`group relative overflow-hidden border px-5 py-2.5 text-[10px] font-black uppercase tracking-[0.18em] transition-all duration-200 ${
                  active ? "border-purple-500/50 text-white" : "border-purple-500/12 text-slate-500 hover:border-purple-500/25 hover:text-slate-300"
                }`}
                style={active ? { background: "linear-gradient(160deg, rgba(88,28,135,0.25) 0%, rgba(126,34,206,0.12) 100%)", boxShadow: "0 0 20px rgba(168,85,247,0.08)" } : { background: "rgba(8,9,14,0.8)" }}
              >
                {active && (
                  <>
                    <span className="absolute inset-x-0 bottom-0 h-[2px] bg-gradient-to-r from-transparent via-purple-500 to-transparent" />
                    <span className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-purple-400/30 to-transparent" />
                  </>
                )}
                <span className="relative flex items-center gap-2">
                  <Icon size={12} className={active ? "text-purple-400" : "text-slate-600 group-hover:text-slate-400"} />
                  {tab.label}
                  {active && <ChevronRight size={10} className="text-purple-500" />}
                </span>
              </button>
            );
          })}
          <div className="ml-auto flex items-center gap-2 self-center pr-1">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-50" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-green-400" />
            </span>
            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-600">Live</span>
          </div>
        </div>

        {notice && (
          <div className="relative border border-[#84cc16]/35 bg-[#84cc16]/10 p-3">
            <Corners size={6} color="rgba(132,204,22,0.5)" />
            <p className="text-sm font-bold text-[#bef264]">{notice}</p>
          </div>
        )}
        {error && (
          <div className="relative border border-[#ef4444]/35 bg-[#ef4444]/10 p-3">
            <Corners size={6} color="rgba(239,68,68,0.5)" />
            <p className="text-sm font-bold text-[#fecaca]">{error}</p>
          </div>
        )}

        {activeTab === "resumo" && (
          <section className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <StatCard label="Discord ID" value={user.discord_id || profile.discord_id || "N/A"} icon={Radio} sub="Conta vinculada" />
              <StatCard label="Rank" value={profile.level || "N/A"} icon={Sword} sub="Temporada atual" />
              <StatCard label="STG Coins" value={formatCompactNumber(profile.coins)} icon={Activity} sub="Disponiveis" />
            </div>

            <HudPanel className="p-5">
              <div className="flex items-start gap-3">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center border border-purple-500/30 bg-purple-500/10">
                  <Shield size={12} className="text-purple-400" />
                </div>
                <div>
                  <p className="text-[9px] font-black uppercase tracking-[0.18em] text-purple-400/80">Campos Protegidos</p>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    Cargos, Discord ID, flags de admin/moderador/criador e role_ids vem da API/Discord e <span className="font-bold text-purple-300/90">nao podem ser alterados pelo site</span>. Sincronizados automaticamente com sua conta Discord vinculada.
                  </p>
                </div>
              </div>
            </HudPanel>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="relative border border-purple-500/20 bg-[#08090e] p-5" style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.5)" }}>
                <Corners size={8} />
                <p className="mb-2 text-[9px] font-black uppercase tracking-[0.18em] text-purple-400/80">Username</p>
                <p className="break-all font-mono text-sm text-white">@{user.username || user.discord_username || profile.username || username}</p>
              </div>
              <div className="relative border border-purple-500/20 bg-[#08090e] p-5" style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.5)" }}>
                <Corners size={8} />
                <p className="mb-2 text-[9px] font-black uppercase tracking-[0.18em] text-purple-400/80">Status Operacional</p>
                <div className="flex items-center gap-3">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-60" />
                    <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-green-400" style={{ boxShadow: "0 0 8px #4ade80" }} />
                  </span>
                  <span className="text-sm font-black uppercase tracking-widest text-green-400">Operacional</span>
                </div>
              </div>
            </div>
          </section>
        )}

        {activeTab === "publico" && (
          <form onSubmit={savePublicProfile}>
            <HudPanel accent>
              <SectionHeader icon={AtSign} title="Perfil Publico" />
              <div className="grid gap-5 p-5 md:grid-cols-2">
                <TacticalInput label="Nome publico" value={publicForm.public_name || ""} onChange={(value) => setPublicForm({ ...publicForm, public_name: value })} />
                <TacticalInput label="Email publico" value={publicForm.public_email || ""} onChange={(value) => setPublicForm({ ...publicForm, public_email: value })} />
                <TacticalInput label="Localizacao opcional" value={publicForm.location_optional || ""} onChange={(value) => setPublicForm({ ...publicForm, location_optional: value })} />
                <TacticalInput label="Pronomes" value={publicForm.pronouns || ""} onChange={(value) => setPublicForm({ ...publicForm, pronouns: value })} />
                <ImageUploadField label="Avatar publico" variant="avatar" value={publicForm.public_avatar_url || ""} fallbackPreview={avatarUrl} onChange={(value) => setPublicForm({ ...publicForm, public_avatar_url: value })} />
                <ImageUploadField label="Banner publico" variant="banner" value={publicForm.public_banner_url || ""} fallbackPreview="/assets/tactical-ops-bg.png" onChange={(value) => setPublicForm({ ...publicForm, public_banner_url: value })} />
                <div className="md:col-span-2">
                  <TacticalTextarea label="Bio" value={publicForm.bio || ""} onChange={(value) => setPublicForm({ ...publicForm, bio: value })} />
                </div>
                <div className="md:col-span-2 flex justify-end">
                  <TacticalSubmitButton saving={saving || loading}>
                    {saving ? <RefreshCw className="animate-spin" size={13} /> : <Save size={13} />}
                    Salvar perfil
                  </TacticalSubmitButton>
                </div>
              </div>
            </HudPanel>
          </form>
        )}

        {activeTab === "privacidade" && (
          <form onSubmit={savePublicProfile}>
            <HudPanel accent>
              <SectionHeader icon={Lock} title="Privacidade & Visibilidade" />
              <div className="grid gap-5 p-5 md:grid-cols-2">
                <TacticalSelect label="Visibilidade do perfil" value={publicForm.profile_visibility || "public"} onChange={(value) => setPublicForm({ ...publicForm, profile_visibility: value as PublicProfilePayload["profile_visibility"] })}>
                  <option value="public">Publico</option>
                  <option value="members">Membros</option>
                  <option value="private">Privado</option>
                </TacticalSelect>
                <TacticalInput label="Orientacao sexual opcional" value={publicForm.sexual_orientation || ""} onChange={(value) => setPublicForm({ ...publicForm, sexual_orientation: value })} />
                <TacticalSelect label="Visibilidade da orientacao" value={publicForm.sexual_orientation_visibility || "private"} onChange={(value) => setPublicForm({ ...publicForm, sexual_orientation_visibility: value as PublicProfilePayload["sexual_orientation_visibility"] })}>
                  <option value="private">Privada</option>
                  <option value="public">Publica</option>
                </TacticalSelect>
                <div className="relative border border-yellow-500/20 p-4" style={{ background: "linear-gradient(135deg, rgba(234,179,8,0.06) 0%, rgba(234,179,8,0.02) 100%)" }}>
                  <Corners size={7} color="rgba(234,179,8,0.5)" />
                  <div className="flex items-start gap-3">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center border border-yellow-500/30 bg-yellow-500/10">
                      <AlertTriangle size={11} className="text-yellow-400" />
                    </div>
                    <p className="text-sm leading-6 text-yellow-200/70">
                      <span className="font-black text-yellow-300">Email publico</span> so sera exibido quando a API considerar o campo publico.
                    </p>
                  </div>
                </div>
                <div className="md:col-span-2 flex justify-end">
                  <TacticalSubmitButton saving={saving || loading}>
                    {saving ? <RefreshCw className="animate-spin" size={13} /> : <Save size={13} />}
                    Salvar perfil
                  </TacticalSubmitButton>
                </div>
              </div>
            </HudPanel>
          </form>
        )}

        {false && activeTab === "resumo" && (
          <section className="grid gap-4 md:grid-cols-3">
            <div className="stg-hud-panel p-5"><p className="tactical-label">Discord ID</p><p className="mt-2 break-all font-mono text-sm text-white">{user?.discord_id || profile?.discord_id || "N/A"}</p></div>
            <div className="stg-hud-panel p-5"><p className="tactical-label">Rank</p><p className="mt-2 text-2xl font-black text-white">{profile?.level}</p></div>
            <div className="stg-hud-panel p-5"><p className="tactical-label">Coins</p><p className="mt-2 text-2xl font-black text-white">{profile?.coins}</p></div>
            <div className="stg-hud-panel md:col-span-3 p-5">
              <p className="tactical-label">Campos protegidos</p>
              <p className="mt-2 text-sm text-[#94a3b8]">Cargos, Discord ID, flags de admin/moderador/criador e role_ids vêm da API/Discord e nao podem ser alterados pelo site.</p>
            </div>
          </section>
        )}

        {false && (activeTab === "publico" || activeTab === "privacidade") && (
          <form onSubmit={savePublicProfile} className="stg-hud-panel grid gap-4 p-5 md:grid-cols-2">
            {activeTab === "publico" ? (
              <>
                <ProfileInput label="Nome publico" value={publicForm.public_name || ""} onChange={(value) => setPublicForm({ ...publicForm, public_name: value })} />
                <ProfileInput label="Email publico" value={publicForm.public_email || ""} onChange={(value) => setPublicForm({ ...publicForm, public_email: value })} />
                <ProfileInput label="Avatar publico URL" value={publicForm.public_avatar_url || ""} onChange={(value) => setPublicForm({ ...publicForm, public_avatar_url: value })} />
                <ProfileInput label="Banner publico URL" value={publicForm.public_banner_url || ""} onChange={(value) => setPublicForm({ ...publicForm, public_banner_url: value })} />
                <ProfileInput label="Localizacao opcional" value={publicForm.location_optional || ""} onChange={(value) => setPublicForm({ ...publicForm, location_optional: value })} />
                <ProfileInput label="Pronomes" value={publicForm.pronouns || ""} onChange={(value) => setPublicForm({ ...publicForm, pronouns: value })} />
                <label className="md:col-span-2">
                  <span className="text-xs font-black uppercase tracking-[0.08em] text-[#94a3b8]">Bio</span>
                  <textarea value={publicForm.bio || ""} onChange={(e) => setPublicForm({ ...publicForm, bio: e.target.value })} className="mt-2 min-h-28 w-full border border-[#a855f7]/25 bg-black/40 px-3 py-2 text-white outline-none focus:border-[#a855f7]/60" />
                </label>
              </>
            ) : (
              <>
                <label>
                  <span className="text-xs font-black uppercase tracking-[0.08em] text-[#94a3b8]">Visibilidade do perfil</span>
                  <select value={publicForm.profile_visibility} onChange={(e) => setPublicForm({ ...publicForm, profile_visibility: e.target.value as PublicProfilePayload["profile_visibility"] })} className="mt-2 w-full border border-[#a855f7]/25 bg-black/40 px-3 py-2 text-white">
                    <option value="public">Publico</option>
                    <option value="members">Membros</option>
                    <option value="private">Privado</option>
                  </select>
                </label>
                <ProfileInput label="Orientacao sexual opcional" value={publicForm.sexual_orientation || ""} onChange={(value) => setPublicForm({ ...publicForm, sexual_orientation: value })} />
                <label>
                  <span className="text-xs font-black uppercase tracking-[0.08em] text-[#94a3b8]">Visibilidade da orientacao</span>
                  <select value={publicForm.sexual_orientation_visibility} onChange={(e) => setPublicForm({ ...publicForm, sexual_orientation_visibility: e.target.value as PublicProfilePayload["sexual_orientation_visibility"] })} className="mt-2 w-full border border-[#a855f7]/25 bg-black/40 px-3 py-2 text-white">
                    <option value="private">Privada</option>
                    <option value="public">Publica</option>
                  </select>
                </label>
                <div className="stg-hud-panel md:col-span-2 p-4">
                  <p className="flex items-center gap-2 text-sm font-bold text-[#94a3b8]"><EyeOff size={16} /> Email publico so sera exibido quando a API considerar o campo publico.</p>
                </div>
              </>
            )}
            <button type="submit" disabled={saving || loading} className="stg-button-primary md:col-span-2 inline-flex items-center justify-center gap-2 disabled:opacity-50">
              {saving ? <RefreshCw className="animate-spin" size={16} /> : <Save size={16} />} Salvar perfil
            </button>
          </form>
        )}

        {activeTab === "criador" && canManageCreator && (
          <section className="space-y-5">
            {creatorApiError && (
              <HudPanel>
                <div className="flex flex-col gap-3 p-5 md:flex-row md:items-center md:justify-between">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="mt-0.5 shrink-0 text-red-400" size={16} />
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-red-300">API de criadores indisponivel</p>
                      <p className="mt-1 text-sm text-slate-400">{creatorApiError}</p>
                    </div>
                  </div>
                  <button type="button" onClick={() => void syncCreatorProfile()} disabled={syncingCreator} className="inline-flex items-center justify-center gap-2 border border-purple-500/30 bg-purple-500/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.14em] text-purple-200 disabled:opacity-50">
                    <RefreshCw className={syncingCreator ? "animate-spin" : ""} size={13} /> Tentar novamente
                  </button>
                </div>
              </HudPanel>
            )}

            {showCreatorChannelForm && (
              <form onSubmit={saveChannel}>
                <HudPanel>
                  <SectionHeader icon={editingChannel ? LinkIcon : Plus} title={editingChannel ? "Editar Canal" : "Adicionar Canal"} />
                  <div className="grid gap-4 p-5 md:grid-cols-[220px_1fr_auto] md:items-end">
                    <TacticalSelect label="Plataforma" value={channelForm.platform || "youtube"} onChange={(value) => setChannelForm({ ...channelForm, platform: value as CreatorPlatform })}>
                      {platforms.map((platform) => {
                        const isPlatformTaken = !editingChannel && usedPlatforms.includes(platform);
                        return (
                          <option key={platform} value={platform} disabled={isPlatformTaken}>
                            {platformLabels[platform] || platform}{isPlatformTaken ? " (já cadastrada)" : ""}
                          </option>
                        );
                      })}
                    </TacticalSelect>
                    <TacticalInput label="URL Publica do Canal / Perfil" value={channelForm.channel_url || ""} onChange={(value) => setChannelForm({ ...channelForm, channel_url: value })} placeholder="https://youtube.com/@seucanal" />
                    <div className="flex gap-2">
                      <TacticalSubmitButton saving={saving}><Plus size={13} /> {editingChannel ? "Atualizar" : "Adicionar"}</TacticalSubmitButton>
                      {editingChannel && (
                        <button type="button" onClick={() => { setEditingChannel(null); setChannelForm(emptyChannel); }} className="border border-slate-700/50 bg-slate-900/60 px-4 py-2.5 text-xs font-black uppercase tracking-[0.12em] text-slate-500 hover:border-slate-600 hover:text-slate-300">
                          Cancelar
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="px-5 pb-4 text-[10px] text-slate-600">Informe apenas URLs publicas. A plataforma permanece cadastrada ate voce remover manualmente.</p>
                </HudPanel>
              </form>
            )}

            {visibleCreatorProfile && (
              <section className="relative overflow-hidden border border-purple-500/25" style={{ background: "#050608", boxShadow: "0 0 60px rgba(168,85,247,0.07), 0 0 0 1px rgba(168,85,247,0.04) inset" }}>
                <Corners size={12} color="rgba(168,85,247,0.5)" />
                <div
                  className="relative min-h-52 bg-cover bg-center"
                  style={{
                    backgroundImage: `linear-gradient(160deg, rgba(0,0,0,.97) 0%, rgba(46,16,101,.45) 50%, rgba(0,0,0,.88) 100%), url("${primaryChannelContent[0]?.thumbnail_url || "/assets/tactical-ops-bg.png"}")`,
                  }}
                >
                  <Scanlines opacity={0.05} />
                  <div aria-hidden className="pointer-events-none absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "linear-gradient(rgba(168,85,247,1) 1px, transparent 1px), linear-gradient(90deg, rgba(168,85,247,1) 1px, transparent 1px)", backgroundSize: "40px 40px" }} />
                  <div className="absolute right-5 top-4 flex flex-col items-end gap-2 text-right">
                    <div className="opacity-45">
                      <p className="font-mono text-[9px] font-bold uppercase tracking-[0.25em] text-purple-300">STG // CREATOR INTEL</p>
                      <p className="font-mono text-[9px] text-purple-400">SYNC {primaryCreatorChannel?.last_checked_at ? `OK ${new Date(primaryCreatorChannel.last_checked_at).toLocaleDateString("pt-BR")}` : "PENDENTE"}</p>
                    </div>
                    {primaryCreatorChannel && (
                      <button type="button" onClick={() => void syncCreatorProfile()} disabled={syncingCreator || saving} className="inline-flex items-center gap-1.5 border border-purple-500/25 bg-black/45 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.14em] text-purple-200 backdrop-blur transition-colors hover:border-purple-400/50 hover:text-white disabled:opacity-50" title="Sincronizar dados reais da plataforma cadastrada">
                        <RefreshCw className={syncingCreator ? "animate-spin" : ""} size={11} /> Sincronizar
                      </button>
                    )}
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 flex flex-col justify-end gap-5 p-5 md:flex-row md:items-end md:justify-between">
                    <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-end">
                      <div className="relative shrink-0">
                        <div className="absolute -inset-1 rounded-full opacity-50" style={{ background: "conic-gradient(from 0deg, #a855f7, transparent, #a855f7)" }} />
                        <img src={primaryChannelAvatarUrl} alt={primaryChannelName} className="relative size-[76px] rounded-full border-2 border-purple-500/60 object-cover" style={{ boxShadow: "0 0 24px rgba(168,85,247,0.5)" }} />
                        <span className="absolute -bottom-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full border-2 border-[#050608] bg-green-500" style={{ boxShadow: "0 0 8px #4ade80" }} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[9px] font-black uppercase tracking-[0.22em] text-purple-400/70">Perfil Publico Sincronizado</p>
                        <h2 className="mt-1 text-2xl font-black uppercase tracking-[0.06em] text-white" style={{ textShadow: "0 0 30px rgba(168,85,247,0.3)" }}>
                          {primaryChannelName}
                        </h2>
                        <div className="mt-2.5 flex flex-wrap gap-2">
                          {primaryCreatorChannel && <PlatformBadge platform={primaryCreatorChannel.platform} />}
                          <span className="border border-purple-500/35 bg-purple-500/12 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-widest text-purple-300">{visibleCreatorProfile.channels.length} Plataformas</span>
                          {primaryCreatorChannel?.is_active && (
                            <span className={`flex items-center gap-1.5 border px-2.5 py-0.5 text-[10px] font-black uppercase tracking-widest ${primaryChannelSyncStatus === "ok" ? "border-green-500/35 bg-green-500/10 text-green-400" : "border-amber-500/35 bg-amber-500/10 text-amber-300"}`}>
                              <span className="relative flex h-1.5 w-1.5"><span className={`relative inline-flex h-1.5 w-1.5 rounded-full ${primaryChannelSyncStatus === "ok" ? "bg-green-400" : "bg-amber-300"}`} /></span>
                              {primaryChannelSyncLabel}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 md:min-w-80">
                      {[
                        { label: "Inscritos", value: formatCompactNumber(primaryCreatorChannel?.subscriber_count) },
                        { label: "Videos", value: formatCompactNumber(primaryCreatorChannel?.video_count) },
                        { label: "Views", value: formatCompactNumber(primaryCreatorChannel?.view_count) },
                      ].map((stat) => (
                        <div key={stat.label} className="relative border border-purple-500/20 p-3 text-center" style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)" }}>
                          <p className="text-[9px] font-black uppercase tracking-[0.15em] text-purple-400/70">{stat.label}</p>
                          <p className="mt-1 font-mono text-lg font-black text-white" style={{ textShadow: "0 0 12px rgba(168,85,247,0.4)" }}>{stat.value}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-6 p-5">
                  <VideoCarousel videos={primaryChannelContent} />
                  <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
                  <div className="space-y-4">
                    <div>
                      <div className="relative border border-purple-500/15 bg-black/25 p-4" style={{ boxShadow: "inset 0 1px 0 rgba(168,85,247,0.06)" }}>
                        <Corners size={6} />
                        <p className="mb-2 text-[9px] font-black uppercase tracking-[0.2em] text-purple-400/70">Bio Publica</p>
                        <p className="text-sm leading-6 text-slate-400">{primaryCreatorChannel?.description || "A bio publica da plataforma ainda nao foi sincronizada."}</p>
                      </div>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="border border-[#a855f7]/20 bg-black/25 p-3">
                        <p className="tactical-label">Canal</p>
                        <p className="mt-1 break-all text-sm font-bold text-white">{primaryCreatorChannel?.handle || primaryCreatorChannel?.channel_id || "Nao identificado"}</p>
                      </div>
                      <div className="border border-[#a855f7]/20 bg-black/25 p-3">
                        <p className="tactical-label">Ultima verificacao</p>
                        <p className="mt-1 text-sm font-bold uppercase text-white">{primaryCreatorChannel?.last_checked_at ? new Date(primaryCreatorChannel.last_checked_at).toLocaleDateString("pt-BR") : "Pendente"}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-3 pb-1">
                      <p className="text-[9px] font-black uppercase tracking-[0.2em] text-purple-400/70">Plataformas Cadastradas</p>
                      <div className="h-[1px] flex-1 bg-gradient-to-r from-purple-500/20 to-transparent" />
                      <span className="text-[9px] font-black text-slate-600">{visibleCreatorProfile.channels.length} ativas</span>
                    </div>

                    {visibleCreatorProfile.channels.length === 0 && (
                      <div className="relative border border-purple-500/12 bg-[#0a0b10] p-4 text-sm font-bold text-slate-500">
                        <Corners size={6} />
                        Nenhuma plataforma cadastrada
                      </div>
                    )}

                    {visibleCreatorProfile.channels.map((channel) => (
                      <div key={channel.id} className="group relative border border-purple-500/12 bg-[#0a0b10] transition-all duration-200 hover:border-purple-500/30" style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.35)" }}>
                        <Corners size={6} />
                        {channel.is_active && <div className="absolute inset-y-0 left-0 w-[2px] bg-gradient-to-b from-transparent via-purple-500/60 to-transparent" />}
                        <div className="flex flex-col gap-3 px-4 py-3 md:flex-row md:items-center">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: platformColors[channel.platform] || "#a855f7", boxShadow: `0 0 6px ${platformColors[channel.platform] || "#a855f7"}` }} />
                              <p className="truncate text-sm font-black uppercase tracking-[0.04em] text-white">{getChannelLabel(channel)}</p>
                            </div>
                            <p className="mt-0.5 truncate pl-4 text-[9px] font-bold text-slate-600">
                              {platformLabels[channel.platform] || channel.platform}{channel.handle ? ` - ${channel.handle}` : channel.channel_id ? ` - ${channel.channel_id}` : ""}
                            </p>
                          </div>
                          <div className="flex flex-wrap items-center gap-2 md:shrink-0">
                            <span className="flex items-center gap-1 border border-purple-500/15 bg-black/30 px-2 py-1 text-[9px] font-black text-slate-400" title="Inscritos">
                              <TrendingUp size={9} className="text-purple-400/60" /> {formatCompactNumber(channel.subscriber_count)}
                            </span>
                            <span className="flex items-center gap-1 border border-purple-500/15 bg-black/30 px-2 py-1 text-[9px] font-black text-slate-400" title="Views">
                              <Eye size={9} className="text-purple-400/60" /> {formatCompactNumber(channel.view_count)}
                            </span>
                            {channel.channel_url && (
                              <a href={channel.channel_url} target="_blank" rel="noreferrer" className="flex h-7 w-7 items-center justify-center border border-purple-500/20 bg-black/30 text-purple-400/50 transition-colors hover:border-purple-400/50 hover:text-purple-300" title="Abrir canal">
                                <ExternalLink size={11} />
                              </a>
                            )}
                            <button type="button" onClick={() => { setEditingChannel(channel); setChannelForm({ platform: channel.platform, channel_url: channel.channel_url || "", is_active: channel.is_active }); }} title="Editar" className="flex h-7 w-7 items-center justify-center border border-purple-500/20 bg-purple-500/8 text-purple-400/70 transition-all hover:border-purple-400/50 hover:text-purple-300">
                              <LinkIcon size={11} />
                            </button>
                            <button type="button" onClick={() => void removeChannel(channel)} title="Remover" className="flex h-7 w-7 items-center justify-center border border-red-500/15 bg-red-500/6 text-red-500/50 transition-all hover:border-red-400/40 hover:bg-red-500/15 hover:text-red-400">
                              <Trash2 size={11} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  </div>
                </div>
              </section>
            )}

            <div className="hidden">
              {(creatorProfile?.channels ?? []).map((channel) => (
                <div key={channel.id} className="stg-hud-panel flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between">
                  <div className="min-w-0">
                    <PlatformBadge platform={channel.platform} />
                    <p className="mt-2 break-all text-sm font-bold text-white">{channel.channel_url || channel.handle || "Canal sem URL retornada"}</p>
                  </div>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => { setEditingChannel(channel); setChannelForm({ platform: channel.platform, channel_url: channel.channel_url || "", is_active: channel.is_active }); }} className="stg-button-outline inline-flex items-center gap-2 px-3 py-2 text-xs"><LinkIcon size={14} /> Editar</button>
                    <button type="button" onClick={() => void removeChannel(channel)} className="stg-button-danger inline-flex items-center gap-2 px-3 py-2 text-xs"><Trash2 size={14} /> Remover</button>
                  </div>
                </div>
              ))}
              {!creatorProfile && <div className="stg-hud-panel p-5 text-[#94a3b8]">Recurso aguardando integração da API para retornar seu perfil de criador.</div>}
              {creatorProfile && creatorProfile.channels.length === 0 && <div className="stg-hud-panel p-5 text-[#94a3b8]">Nenhum canal cadastrado ainda.</div>}
            </div>
          </section>
        )}
      </div>
    </Layout>
  );
}

function ProfileInput({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label>
      <span className="text-xs font-black uppercase tracking-[0.08em] text-[#94a3b8]">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 w-full border border-[#a855f7]/25 bg-black/40 px-3 py-2 text-white outline-none placeholder:text-[#64748b] focus:border-[#a855f7]/60"
      />
    </label>
  );
}
