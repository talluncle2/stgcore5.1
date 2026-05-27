interface SettingsStatusBadgeProps {
  tone?: "green" | "purple" | "orange" | "red" | "blue";
  children: React.ReactNode;
}

const tones = {
  green: "border-[#84cc16]/35 bg-[#84cc16]/10 text-[#bef264]",
  purple: "border-[#a855f7]/35 bg-[#a855f7]/10 text-[#d8b4fe]",
  orange: "border-[#f97316]/35 bg-[#f97316]/10 text-[#fed7aa]",
  red: "border-[#ef4444]/35 bg-[#ef4444]/10 text-[#fecaca]",
  blue: "border-[#38bdf8]/35 bg-[#38bdf8]/10 text-[#bae6fd]",
};

export function SettingsStatusBadge({ tone = "purple", children }: SettingsStatusBadgeProps) {
  return (
    <span className={`inline-flex items-center border px-2.5 py-1 text-[11px] font-black uppercase tracking-[0.08em] ${tones[tone]}`}>
      {children}
    </span>
  );
}
