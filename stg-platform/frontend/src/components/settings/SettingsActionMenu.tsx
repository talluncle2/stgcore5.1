import { MoreVertical } from "lucide-react";

export interface SettingsAction {
  label: string;
  onClick: () => void;
  danger?: boolean;
}

interface SettingsActionMenuProps {
  actions: SettingsAction[];
  label?: string;
}

export function SettingsActionMenu({ actions, label = "Acoes" }: SettingsActionMenuProps) {
  return (
    <details className="group relative">
      <summary className="tactical-edge flex cursor-pointer list-none items-center gap-2 border border-[#a855f7]/30 bg-[#111827]/90 px-3 py-2 text-xs font-black uppercase tracking-[0.08em] text-[#c4b5fd] transition-colors hover:border-[#a855f7]/60 hover:text-white">
        <MoreVertical size={15} />
        <span>{label}</span>
      </summary>
      <div className="stg-hud-panel-glow absolute right-0 top-11 z-30 min-w-44 overflow-hidden border-[#a855f7]/35 p-1">
        {actions.map((action) => (
          <button
            key={action.label}
            type="button"
            onClick={(event) => {
              event.currentTarget.closest("details")?.removeAttribute("open");
              action.onClick();
            }}
            className={[
              "block w-full px-3 py-2 text-left text-xs font-black uppercase tracking-[0.06em] transition-colors",
              action.danger
                ? "text-[#fecaca] hover:bg-[#ef4444]/15"
                : "text-[#f8fafc] hover:bg-[#a855f7]/15",
            ].join(" ")}
          >
            {action.label}
          </button>
        ))}
      </div>
    </details>
  );
}
