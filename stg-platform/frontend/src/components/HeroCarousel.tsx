import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";

export interface HeroSlide {
  id: string;
  title: string;
  subtitle?: string;
  description?: string;
  imageUrl?: string;
  badge?: string;
  actionLabel?: string;
  actionUrl?: string;
}

interface HeroCarouselProps {
  slides: HeroSlide[];
  fallbackTitle: string;
  fallbackDescription: string;
  autoplay?: boolean;
  compact?: boolean;
}

export function HeroCarousel({
  slides,
  fallbackTitle,
  fallbackDescription,
  autoplay = true,
  compact = false,
}: HeroCarouselProps) {
  const activeSlides = slides.length > 0 ? slides : [
    {
      id: "fallback",
      title: fallbackTitle,
      description: fallbackDescription,
      badge: "STG",
    },
  ];
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    setActiveIndex(0);
  }, [slides.length]);

  useEffect(() => {
    if (!autoplay || activeSlides.length <= 1) return;
    const interval = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % activeSlides.length);
    }, 6500);
    return () => window.clearInterval(interval);
  }, [activeSlides.length, autoplay]);

  const goToPrevious = () => setActiveIndex((current) => (current - 1 + activeSlides.length) % activeSlides.length);
  const goToNext = () => setActiveIndex((current) => (current + 1) % activeSlides.length);

  return (
    <div className={`relative overflow-hidden border border-[#a855f7]/25 bg-[#050608] ${compact ? "min-h-[320px]" : "min-h-[430px]"}`}>
      <div
        className="absolute inset-0 flex transition-transform duration-700 ease-out"
        style={{ transform: `translateX(-${activeIndex * 100}%)` }}
      >
        {activeSlides.map((slide, index) => (
          <div
            key={slide.id}
            className="relative min-h-[inherit] w-full shrink-0 bg-cover bg-center"
            style={{
              backgroundImage: slide.imageUrl
                ? `linear-gradient(90deg, rgba(5,5,8,.95), rgba(30,13,49,.72), rgba(5,5,8,.68)), url("${slide.imageUrl}")`
                : "linear-gradient(110deg, rgba(6,6,12,.96), rgba(72,28,118,.72), rgba(7,8,10,.96)), url('/assets/tactical-ops-bg.png')",
            }}
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_76%_30%,rgba(168,85,247,.28),transparent_24rem)]" />
            <div className="relative z-10 flex min-h-[inherit] items-center p-5 md:p-8">
              <div className="max-w-3xl">
                <div className="mb-4 flex flex-wrap items-center gap-3">
                  <span className="border border-[#a855f7]/40 bg-[#a855f7]/15 px-3 py-1 text-xs font-black uppercase tracking-[0.14em] text-[#c084fc]">
                    {slide.badge || "STG"}
                  </span>
                  <span className="text-xs font-black uppercase tracking-[0.14em] text-[#94a3b8]">
                    {index + 1}/{activeSlides.length}
                  </span>
                </div>
                {slide.subtitle && (
                  <p className="mb-2 text-sm font-black uppercase tracking-[0.12em] text-[#84cc16]">
                    {slide.subtitle}
                  </p>
                )}
                <h2 className="max-w-4xl text-4xl font-black uppercase leading-[0.95] tracking-[0.04em] text-white md:text-6xl">
                  {slide.title}
                </h2>
                {slide.description && (
                  <p className="mt-5 max-w-2xl text-base font-semibold leading-7 text-[#cbd5e1]">
                    {slide.description}
                  </p>
                )}
                {slide.actionUrl && (
                  <Link
                    to={slide.actionUrl}
                    className="mt-7 inline-flex items-center gap-2 border border-[#a855f7]/40 bg-[#a855f7] px-5 py-3 text-sm font-black uppercase tracking-[0.08em] text-white transition-colors hover:bg-[#c084fc]"
                  >
                    {slide.actionLabel || "Abrir"}
                    <ExternalLink size={16} />
                  </Link>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {activeSlides.length > 1 && (
        <>
          <button
            type="button"
            onClick={goToPrevious}
            className="absolute bottom-5 right-20 z-20 border border-[#a855f7]/35 bg-black/55 p-3 text-white transition-colors hover:bg-[#a855f7]/25"
            aria-label="Slide anterior"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            type="button"
            onClick={goToNext}
            className="absolute bottom-5 right-5 z-20 border border-[#a855f7]/35 bg-black/55 p-3 text-white transition-colors hover:bg-[#a855f7]/25"
            aria-label="Proximo slide"
          >
            <ChevronRight size={20} />
          </button>
          <div className="absolute bottom-6 left-5 z-20 flex gap-2">
            {activeSlides.map((slide, index) => (
              <button
                key={slide.id}
                type="button"
                onClick={() => setActiveIndex(index)}
                className={`h-2 transition-all ${index === activeIndex ? "w-10 bg-[#84cc16]" : "w-3 bg-white/30 hover:bg-white/60"}`}
                aria-label={`Ir para slide ${index + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
