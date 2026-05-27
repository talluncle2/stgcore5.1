import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ChevronRight,
  Coins,
  Eye,
  Instagram,
  Radio,
  Search,
  Shield,
  Target,
  Trophy,
  Twitch,
  User,
  Users,
  Youtube,
} from "lucide-react";
import { BrandLogo } from "../components/BrandLogo";
import { HeroCarousel } from "../components/HeroCarousel";
import { UserMenu } from "../components/layout/UserMenu";
import { useAuth } from "../context/AuthContext";
import { getFeaturedHeroItems } from "../services/featuredService";
import { getActiveHomeContent } from "../services/homeService";
import { FeaturedHeroItem, HomeContentItem } from "../types/api";
import { hasDashboardAccess } from "../utils/permissions";

const navItems = [
  { label: "INICIO", to: "/", active: true },
  { label: "TORNEIOS", to: "/torneios" },
  { label: "TIMES", to: "/comunidade" },
  { label: "RANKING", to: "/ranking" },
  { label: "NOTICIAS", to: "/noticias" },
  { label: "LOJA", to: "/loja" },
];

const modeCards = [
  { icon: Shield, title: "RANQUEADO", subtitle: "COMPETITIVO 5V5", to: "/ranking" },
  { icon: Trophy, title: "LIGA AMADORA", subtitle: "COMPETICOES ABERTAS", to: "/torneios" },
  { icon: Target, title: "BATTLE ROYALE", subtitle: "SOBREVIVA. VENCA.", to: "/torneios" },
  { icon: Target, title: "DESAFIOS", subtitle: "MISSOES ESPECIAIS", to: "/dashboard" },
  { icon: Shield, title: "TREINAMENTO", subtitle: "APRIMORE SUAS HABILIDADES", to: "/comunidade" },
];

const stats = [
  { icon: Users, value: "125.890", label: "JOGADORES" },
  { icon: Shield, value: "2.458", label: "EQUIPES" },
  { icon: Trophy, value: "342", label: "CAMPEONATOS" },
  { icon: Coins, value: "R$ 1.250.000", label: "EM PREMIACOES" },
  { icon: Eye, value: "98.765", label: "ESPECTADORES ONLINE" },
  { icon: Radio, value: "24/7", label: "COBERTURA AO VIVO" },
];

export function Landing() {
  const { user, profile, isAuthenticated, loading, loginWithDiscord } = useAuth();
  const navigate = useNavigate();
  const identity = user ?? profile;
  const [featuredItems, setFeaturedItems] = useState<FeaturedHeroItem[]>([]);
  const [homeContent, setHomeContent] = useState<HomeContentItem | null>(null);

  useEffect(() => {
    void getFeaturedHeroItems().then(setFeaturedItems);
    void getActiveHomeContent().then(setHomeContent);
  }, []);

  const handleArenaEntry = () => {
    if (!isAuthenticated) {
      loginWithDiscord();
      return;
    }

    navigate(hasDashboardAccess(identity) ? "/dashboard" : "/profile");
  };

  return (
    <main className="stg-arena min-h-screen bg-[#030305] text-white">
      <div className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(circle_at_70%_10%,rgba(126,34,206,0.22),transparent_30rem)]" />
      <div className="pointer-events-none fixed inset-0 z-0 bg-[linear-gradient(90deg,rgba(0,0,0,0.82),transparent_40%,rgba(0,0,0,0.88))]" />

      <header className="stg-topbar fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-black/78 backdrop-blur-xl">
        <nav className="mx-auto flex h-[70px] max-w-[1840px] items-center px-5 md:px-9">
          <Link to="/" className="stg-brand-panel flex h-full min-w-[250px] items-center gap-4 pr-10">
            <BrandLogo imageClassName="h-14 w-16" />
          </Link>

          <div className="hidden h-full flex-1 items-center justify-center gap-2 lg:flex">
            {navItems.map((item) => (
              <Link
                key={item.label}
                to={item.to}
                className={`stg-nav-link ${item.active ? "stg-nav-link-active" : ""}`}
              >
                {item.label}
              </Link>
            ))}
          </div>

          <div className="ml-auto flex items-center gap-4">
            <button className="hidden text-white/80 transition hover:text-[#a855f7] md:block" aria-label="Buscar">
              <Search size={21} />
            </button>
            {loading ? (
              <div className="h-11 w-36 animate-pulse rounded bg-[#7c3aed]/20" />
            ) : isAuthenticated || profile || user ? (
              <UserMenu />
            ) : (
              <button type="button" onClick={loginWithDiscord} className="stg-login-button inline-flex items-center gap-3">
                <User size={17} fill="currentColor" />
                ENTRAR
              </button>
            )}
          </div>
        </nav>
      </header>

      <section className="relative z-10 min-h-[430px] overflow-hidden pt-[70px] lg:min-h-[410px]">
        <div
          className="absolute inset-0 bg-cover bg-[68%_center]"
          style={{ backgroundImage: `url('${homeContent?.backgroundImageUrl || "/assets/premium-theme/IMG/COD-HP_Hero_Desktop_XL.webp"}')` }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/30 to-black/60" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#030305] to-transparent" />

        <div className="relative mx-auto grid max-w-[1680px] grid-cols-1 px-5 py-7 md:px-9 lg:grid-cols-[1fr_360px] lg:py-8">
          <aside className="absolute left-6 top-32 hidden h-[255px] w-7 border border-[#7c3aed]/50 text-[9px] font-black uppercase tracking-[0.24em] text-[#a855f7] xl:block">
            <span className="absolute left-1/2 top-4 -translate-x-1/2 [writing-mode:vertical-rl]">GMR</span>
            <span className="absolute -bottom-16 left-1/2 h-16 w-px bg-[#7c3aed]" />
          </aside>

          <div className="max-w-[720px] pt-3 lg:pt-7 xl:ml-24">
            <p className="mb-2 text-sm font-black uppercase tracking-[0.18em] text-[#a855f7]">// STG</p>
            <h1 className="stg-hero-title text-[56px] font-black uppercase leading-[0.82] md:text-[78px] lg:text-[96px]">
              <span className="stg-metal-text block">{homeContent?.titleLine1 || "SUPREMO"}</span>
              <span className="stg-purple-text block">{homeContent?.titleLine2 || "TRIBUNAL GAMER"}</span>
            </h1>
            <p className="mt-5 max-w-[560px] text-lg font-medium text-white/78">
              {homeContent?.description || "Domine o campo digital com a tropa de elite da STG."}
            </p>

            <div className="mt-6 flex flex-wrap gap-4">
              <Link to={homeContent?.primaryUrl || "/torneios"} className="stg-primary-cta">
                {homeContent?.primaryLabel || "VER TORNEIOS"}
                <ChevronRight size={18} />
              </Link>
              <button type="button" onClick={handleArenaEntry} className="stg-secondary-cta">
                {homeContent?.secondaryLabel || "ENTRAR NA ARENA"}
                <ChevronRight size={18} />
              </button>
            </div>
          </div>

          <div className="mt-10 hidden items-center lg:flex">
            <div className="stg-season-panel w-full p-7">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-white/45">OPERACAO ATIVA</p>
              <div className="mt-1 flex items-center justify-between">
                <h2 className="text-2xl font-black uppercase tracking-[0.08em] text-[#a855f7]">
                  {homeContent?.seasonTitle || "TEMPORADA 2024"}
                </h2>
                <Trophy className="text-[#c084fc]" size={21} />
              </div>
              <div className="mt-7 border-t border-white/10 pt-5">
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-white/45">MISSAO DA SEMANA</p>
                <div className="mt-3 flex items-center justify-between text-sm text-white/80">
                  <span>{homeContent?.missionTitle || "Venca 5 partidas ranqueadas"}</span>
                  <span>{homeContent?.missionProgress || "3 / 5"}</span>
                </div>
                <div className="mt-4 h-1.5 overflow-hidden bg-white/10">
                  <div className="h-full w-3/5 bg-gradient-to-r from-[#7c3aed] to-[#c084fc]" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative z-20 mx-auto -mt-3 max-w-[1780px] px-5 pb-8 md:px-9">
        <div className="stg-feature-shell p-3 md:p-4">
          <div className="mb-3 px-2 text-base font-black uppercase tracking-[0.08em] text-white/80">
            DESTAQUES STG
          </div>
          <HeroCarousel
            compact
            slides={featuredItems.map((item) => ({
              id: item.id,
              title: item.title,
              subtitle: item.subtitle,
              description: item.description,
              imageUrl: item.imageUrl,
              badge: item.badge,
              actionLabel: item.actionLabel,
              actionUrl: item.actionUrl,
            }))}
            fallbackTitle="Destaques em preparacao"
            fallbackDescription="Itens marcados como destaque em Noticias, Loja e Torneios aparecem automaticamente aqui."
          />
        </div>

        <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          {modeCards.map((card) => {
            const Icon = card.icon;
            return (
              <Link key={card.title} to={card.to} className="stg-mode-card group">
                <Icon className="shrink-0 text-[#a855f7]" size={36} />
                <span className="min-w-0">
                  <span className="block text-lg font-black uppercase tracking-[0.04em] text-white">{card.title}</span>
                  <span className="block text-xs font-bold uppercase tracking-[0.08em] text-white/48">{card.subtitle}</span>
                </span>
                <ChevronRight className="ml-auto text-[#a855f7] transition group-hover:translate-x-1" size={20} />
              </Link>
            );
          })}
        </div>

        <div className="stg-stat-strip mt-3 grid gap-y-5 py-2 md:grid-cols-3 xl:grid-cols-6 xl:py-0">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="flex items-center justify-center gap-4 border-white/10 px-5 xl:border-r xl:last:border-r-0">
                <Icon className="text-[#8b5cf6]" size={34} />
                <div>
                  <p className="text-xl font-semibold tracking-wide text-white">{stat.value}</p>
                  <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-white/48">{stat.label}</p>
                </div>
              </div>
            );
          })}
        </div>

        <footer className="stg-footer mt-3 grid items-center gap-6 p-4 md:grid-cols-[200px_1fr_auto] md:px-24">
          <BrandLogo imageClassName="h-16 w-20" showText={false} />
          <div>
            <p className="text-xl font-black uppercase tracking-[0.08em] text-[#a855f7]">FACA PARTE DA COMUNIDADE STG</p>
            <p className="mt-1 text-sm text-white/72">Conecte-se, evolua e conquiste. Juntos somos imparaveis.</p>
          </div>
          <div className="flex flex-wrap items-center gap-5">
            <div className="flex gap-5 text-white">
              <Instagram />
              <Youtube />
              <Twitch />
            </div>
            <form className="flex min-w-[300px] gap-2">
              <input
                className="h-10 min-w-0 flex-1 border border-white/10 bg-black/45 px-4 text-sm text-white outline-none placeholder:text-white/35 focus:border-[#a855f7]"
                placeholder="Seu melhor e-mail"
              />
              <button className="stg-subscribe-button" type="button">
                INSCREVER
              </button>
            </form>
          </div>
        </footer>
      </section>
    </main>
  );
}
