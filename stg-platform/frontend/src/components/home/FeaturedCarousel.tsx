import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, ExternalLink, PackageSearch } from "lucide-react";
import { Link } from "react-router-dom";
import { getFeaturedHeroItems } from "../../services/featuredService";
import { FeaturedHeroItem } from "../../types/api";

const typeLabels: Record<FeaturedHeroItem["sourceType"], string> = {
  store: "Loja",
  tournament: "Torneio",
  news: "Noticia",
};

const typeCtas: Record<FeaturedHeroItem["sourceType"], string> = {
  store: "Ver item",
  tournament: "Ver torneio",
  news: "Ler novidade",
};

export function FeaturedCarousel() {
  const [banners, setBanners] = useState<FeaturedHeroItem[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadHighlights = async () => {
      setLoading(true);
      const data = await getFeaturedHeroItems();
      setBanners(data);
      setActiveIndex(0);
      setLoading(false);
    };

    loadHighlights();
  }, []);

  useEffect(() => {
    if (banners.length <= 1) return;

    const interval = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % banners.length);
    }, 7000);

    return () => window.clearInterval(interval);
  }, [banners.length]);

  const activeBanner = banners[activeIndex];

  const fallbackBackground = useMemo(
    () => ({
      backgroundImage:
        "linear-gradient(110deg, rgba(6, 6, 12, 0.92), rgba(42, 19, 76, 0.7), rgba(7, 8, 6, 0.92)), url('/assets/tactical-ops-bg.png')",
    }),
    []
  );

  const goToPrevious = () => {
    setActiveIndex((current) => (current - 1 + banners.length) % banners.length);
  };

  const goToNext = () => {
    setActiveIndex((current) => (current + 1) % banners.length);
  };

  if (loading) {
    return (
      <section className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#08070d]">
        <div className="scanline-overlay" />
        <div className="text-center">
          <div className="mx-auto mb-5 size-12 animate-spin rounded-full border-4 border-[#a855f7] border-t-[#b7ff4a]" />
          <p className="text-sm font-black uppercase tracking-[0.16em] text-[#a7a0b8]">
            Carregando destaques
          </p>
        </div>
      </section>
    );
  }

  if (!activeBanner) {
    return (
      <section className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#08070d] px-4">
        <div className="absolute inset-0 bg-[url('/assets/tactical-ops-bg.png')] bg-cover bg-center opacity-45" />
        <div className="absolute inset-0 bg-gradient-to-br from-[#08070d] via-[#1b1027]/85 to-[#050506]" />
        <div className="scanline-overlay" />
        <div className="tactical-panel tactical-edge relative max-w-xl p-8 text-center">
          <PackageSearch className="mx-auto mb-5 text-[#a855f7]" size={44} />
          <p className="mb-2 text-xs font-black uppercase tracking-[0.18em] text-[#b7ff4a]">
            Destaques STG
          </p>
          <h1 className="mb-4 text-4xl font-black uppercase tracking-[0.06em] text-[#f1f0e7]">
            Nenhum destaque disponível no momento.
          </h1>
          <p className="text-[#b9b3c7]">
            Produtos e torneios aparecerao aqui quando forem marcados como destaque no banco.
          </p>
        </div>
      </section>
    );
  }

  const backgroundStyle = activeBanner.imageUrl
    ? {
        backgroundImage: `linear-gradient(90deg, rgba(5, 5, 8, 0.94), rgba(19, 10, 33, 0.72), rgba(5, 5, 8, 0.5)), url("${activeBanner.imageUrl}")`,
      }
    : fallbackBackground;

  return (
    <section className="relative min-h-screen overflow-hidden bg-[#08070d]">
      <div
        className="absolute inset-0 bg-cover bg-center transition-all duration-700"
        style={backgroundStyle}
      />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_35%,rgba(168,85,247,0.28),transparent_28rem)]" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#050506] via-transparent to-[#050506]/60" />
      <div className="scanline-overlay" />

      <div className="relative z-10 mx-auto flex min-h-screen max-w-7xl items-center px-4 pt-24 lg:px-6">
        <div className="max-w-3xl pb-14">
          <div className="mb-5 flex flex-wrap items-center gap-3">
            <span className="tactical-edge border border-[#b7ff4a]/40 bg-[#b7ff4a]/10 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-[#b7ff4a]">
              {activeBanner.badge || typeLabels[activeBanner.sourceType]}
            </span>
            <span className="text-xs font-black uppercase tracking-[0.18em] text-[#a7a0b8]">
              Destaque {activeIndex + 1}/{banners.length}
            </span>
          </div>

          <h1 className="mb-5 max-w-4xl text-5xl font-black uppercase leading-[0.92] tracking-[0.04em] text-[#f8f5ff] md:text-7xl">
            {activeBanner.title}
          </h1>

          {activeBanner.description && (
            <p className="mb-8 max-w-2xl text-lg font-semibold leading-8 text-[#c8c1d6]">
              {activeBanner.description}
            </p>
          )}

          {activeBanner.actionUrl && (
            <Link
              to={activeBanner.actionUrl}
              className="tactical-edge inline-flex items-center gap-3 bg-[#a855f7] px-7 py-4 text-sm font-black uppercase tracking-[0.1em] text-white shadow-lg shadow-[#a855f7]/25 transition-all hover:bg-[#c084fc]"
            >
              {activeBanner.actionLabel || typeCtas[activeBanner.sourceType]}
              <ExternalLink size={18} />
            </Link>
          )}
        </div>
      </div>

      {banners.length > 1 && (
        <>
          <button
            onClick={goToPrevious}
            className="tactical-edge absolute left-4 top-1/2 z-20 hidden -translate-y-1/2 border border-[#a855f7]/35 bg-[#08070d]/80 p-4 text-[#f1f0e7] backdrop-blur transition-colors hover:bg-[#a855f7]/25 md:block"
            aria-label="Destaque anterior"
          >
            <ChevronLeft size={24} />
          </button>
          <button
            onClick={goToNext}
            className="tactical-edge absolute right-4 top-1/2 z-20 hidden -translate-y-1/2 border border-[#a855f7]/35 bg-[#08070d]/80 p-4 text-[#f1f0e7] backdrop-blur transition-colors hover:bg-[#a855f7]/25 md:block"
            aria-label="Próximo destaque"
          >
            <ChevronRight size={24} />
          </button>

          <div className="absolute bottom-8 left-1/2 z-20 flex -translate-x-1/2 gap-3">
            {banners.map((banner, index) => (
              <button
                key={banner.id}
                onClick={() => setActiveIndex(index)}
                className={`h-2.5 transition-all ${
                  index === activeIndex
                    ? "w-10 bg-[#b7ff4a]"
                    : "w-2.5 bg-[#f1f0e7]/35 hover:bg-[#f1f0e7]/70"
                }`}
                aria-label={`Ir para destaque ${index + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
