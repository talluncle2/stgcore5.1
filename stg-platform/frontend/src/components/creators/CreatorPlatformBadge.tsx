import { Instagram, Radio, Tv, Video, Youtube } from "lucide-react";
import { CreatorPlatform } from "../../types/api";

interface CreatorPlatformBadgeProps {
  platform?: CreatorPlatform | string;
}

const labels: Record<string, string> = {
  youtube: "YouTube",
  twitch: "Twitch",
  kick: "Kick",
  tiktok: "TikTok",
  instagram: "Instagram",
  x: "X/Twitter",
  twitter: "X/Twitter",
};

export function CreatorPlatformBadge({ platform = "canal" }: CreatorPlatformBadgeProps) {
  const normalized = String(platform).toLowerCase();
  const Icon =
    normalized === "youtube"
      ? Youtube
      : normalized === "instagram"
        ? Instagram
        : normalized === "twitch" || normalized === "kick"
          ? Tv
          : normalized === "tiktok"
            ? Video
            : Radio;

  return (
    <span className="inline-flex items-center gap-1.5 border border-[#a855f7]/35 bg-[#a855f7]/12 px-2.5 py-1 text-[11px] font-black uppercase tracking-[0.06em] text-[#d8b4fe]">
      <Icon size={13} />
      {labels[normalized] || platform}
    </span>
  );
}
