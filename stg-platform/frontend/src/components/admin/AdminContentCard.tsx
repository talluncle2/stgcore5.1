import { SettingsActionMenu } from "../settings/SettingsActionMenu";

interface AdminContentCardProps {
  title: string;
  subtitle?: string;
  description?: string;
  imageUrl?: string;
  badges?: string[];
  onEdit: () => void;
  onDelete: () => void;
}

export function AdminContentCard({
  title,
  subtitle,
  description,
  imageUrl,
  badges = [],
  onEdit,
  onDelete,
}: AdminContentCardProps) {
  return (
    <article className="stg-hud-panel overflow-hidden">
      {imageUrl && (
        <div className="h-36 border-b border-[#a855f7]/20 bg-[#050608]">
          <img src={imageUrl} alt={title} className="size-full object-cover" />
        </div>
      )}
      <div className="flex flex-col gap-4 p-4 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap gap-2">
            {badges.filter(Boolean).map((badge) => (
              <span key={badge} className="stg-badge-purple">
                {badge}
              </span>
            ))}
          </div>
          <p className="font-black uppercase tracking-[0.04em] text-white">{title}</p>
          {subtitle && <p className="mt-1 text-xs font-bold uppercase tracking-[0.06em] text-[#94a3b8]">{subtitle}</p>}
          {description && <p className="mt-2 line-clamp-2 text-sm text-[#94a3b8]">{description}</p>}
        </div>
        <div className="shrink-0">
          <SettingsActionMenu
            actions={[
              { label: "Editar", onClick: onEdit },
              { label: "Excluir", onClick: onDelete, danger: true },
            ]}
          />
        </div>
      </div>
    </article>
  );
}
