import { LucideIcon } from "lucide-react";

interface SettingsTabHeaderProps {
  icon: LucideIcon;
  eyebrow: string;
  title: string;
  description: string;
  action?: React.ReactNode;
}

export function SettingsTabHeader({ icon: Icon, eyebrow, title, description, action }: SettingsTabHeaderProps) {
  return (
    <div className="stg-hud-panel-glow flex flex-col gap-5 p-5 md:flex-row md:items-center md:justify-between">
      <div className="flex items-start gap-4">
        <div className="tactical-edge flex size-12 shrink-0 items-center justify-center border border-[#a855f7]/50 bg-[#a855f7]/10 text-[#c084fc]">
          <Icon size={24} />
        </div>
        <div>
          <p className="tactical-label mb-2">{eyebrow}</p>
          <h2 className="text-2xl font-black uppercase tracking-[0.06em] text-[#f8fafc] md:text-3xl">{title}</h2>
          <p className="mt-2 max-w-3xl text-sm text-[#94a3b8]">{description}</p>
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
