import { RankingEntry } from "../../types/api";
import { Zap } from "lucide-react";

interface RankingCardProps {
  entry: RankingEntry;
  position?: number;
}

const getMedalEmoji = (position: number) => {
  if (position === 1) return "🥇";
  if (position === 2) return "🥈";
  if (position === 3) return "🥉";
  return `#${position}`;
};

const getMedalColor = (position: number) => {
  switch (position) {
    case 1:
      return "from-yellow-400 to-yellow-600 text-black";
    case 2:
      return "from-slate-300 to-slate-400 text-black";
    case 3:
      return "from-orange-400 to-orange-600 text-white";
    default:
      return "from-[#a855f7] to-[#7c3aed] text-white";
  }
};

export function RankingCard({ entry, position }: RankingCardProps) {
  const displayName = entry.username || entry.discord_username || "Operador";
  const displayId = entry.discord_id?.toString() || "N/A";
  const pos = position || entry.position || 0;

  return (
    <div className="stg-card-hover border-[#a855f7]/20 hover:border-[#a855f7]/50 p-4 transition-all">
      <div className="flex items-center gap-4">
        <div
          className={`tactical-edge flex size-10 flex-shrink-0 items-center justify-center bg-gradient-to-br ${getMedalColor(pos)} font-black rounded-lg shadow-lg`}
        >
          {pos <= 3 ? getMedalEmoji(pos) : `#${pos}`}
        </div>

        <div className="flex-1 min-w-0">
          <p className="truncate font-black uppercase tracking-[0.05em] text-[#f8fafc]">{displayName}</p>
          <p className="text-xs text-[#94a3b8]">ID: {displayId}</p>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="text-right">
            <p className="flex items-center gap-1 text-sm font-black text-[#a855f7]">
              <Zap size={14} />
              {entry.xp.toLocaleString()}
            </p>
            <p className="text-xs font-bold uppercase tracking-[0.08em] text-[#94a3b8]">Nível {entry.level || 1}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
