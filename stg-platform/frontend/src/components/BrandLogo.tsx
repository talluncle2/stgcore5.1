interface BrandLogoProps {
  className?: string;
  imageClassName?: string;
  showText?: boolean;
  compactText?: boolean;
}

export function BrandLogo({
  className = "",
  imageClassName = "h-12 w-12",
  showText = true,
  compactText = false,
}: BrandLogoProps) {
  return (
    <span className={`inline-flex min-w-0 items-center gap-3 ${className}`}>
      <img
        src="/assets/branding/stg-logo-site.png"
        alt="STG Supremo Tribunal Gamer"
        className={`stg-logo-official shrink-0 object-contain ${imageClassName}`}
      />
      {showText && (
        <span className="min-w-0 leading-none">
          <span className="block truncate text-left text-lg font-black uppercase tracking-[0.08em] text-white">
            STG
          </span>
          <span className="mt-1 block truncate text-left text-[10px] font-black uppercase tracking-[0.14em] text-[#94a3b8]">
            {compactText ? "Tribunal Gamer" : "Supremo Tribunal Gamer"}
          </span>
        </span>
      )}
    </span>
  );
}
