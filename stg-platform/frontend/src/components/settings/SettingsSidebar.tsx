import { LucideIcon } from "lucide-react";

export interface SettingsNavItem {
  id: string;
  label: string;
  description: string;
  icon: LucideIcon;
  adminOnly?: boolean;
}

interface SettingsSidebarProps {
  items: SettingsNavItem[];
  activeTab: string;
  onSelect: (tab: string) => void;
  isAdmin: boolean;
}

export function SettingsSidebar({ items, activeTab, onSelect, isAdmin }: SettingsSidebarProps) {
  return (
    <aside className="stg-hud-panel-glow p-3 lg:sticky lg:top-24 lg:self-start">
      <p className="px-3 pb-3 text-[10px] font-black uppercase tracking-[0.18em] text-[#7c3aed]">
        Categorias administrativas
      </p>
      <div className="grid gap-2">
        {items.map((item) => {
          const Icon = item.icon;
          const active = activeTab === item.id;
          const locked = item.adminOnly && !isAdmin;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelect(item.id)}
              disabled={locked}
              className={[
                "tactical-edge flex w-full items-center gap-3 border px-3 py-3 text-left transition-all",
                active
                  ? "border-[#a855f7]/65 bg-[#a855f7]/15 text-white shadow-[inset_3px_0_0_#a855f7]"
                  : "border-transparent text-[#94a3b8] hover:border-[#a855f7]/30 hover:bg-[#111827]/85 hover:text-white",
                locked ? "cursor-not-allowed opacity-50" : "",
              ].join(" ")}
            >
              <Icon size={18} className={active ? "text-[#c084fc]" : "text-[#64748b]"} />
              <span className="min-w-0">
                <span className="block truncate text-sm font-black uppercase tracking-[0.06em]">{item.label}</span>
                <span className="mt-0.5 block truncate text-[11px] font-bold text-[#64748b]">
                  {locked ? "Apenas admin" : item.description}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </aside>
  );
}
