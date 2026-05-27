interface SettingsSectionCardProps {
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

export function SettingsSectionCard({ title, description, children, className = "" }: SettingsSectionCardProps) {
  return (
    <section className={`stg-hud-panel-glow overflow-hidden p-0 ${className}`}>
      {(title || description) && (
        <div className="border-b border-[#7c3aed]/25 p-5">
          {title && <h3 className="text-lg font-black uppercase tracking-[0.06em] text-[#f8fafc]">{title}</h3>}
          {description && <p className="mt-1 text-sm text-[#94a3b8]">{description}</p>}
        </div>
      )}
      <div className="p-5">{children}</div>
    </section>
  );
}
