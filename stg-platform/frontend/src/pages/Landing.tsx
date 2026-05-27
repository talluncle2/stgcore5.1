import { Link, useNavigate } from "react-router-dom";
import {
  ChevronLeft,
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
import { UserMenu } from "../components/layout/UserMenu";
import { useAuth } from "../context/AuthContext";
import { hasDashboardAccess } from "../utils/permissions";

const navItems = [
  { label: "INICIO", to: "/", active: true },
  { label: "TORNEIOS", to: "/torneios" },
  { label: "TIMES", to: "/comunidade" },
  { label: "RANKING", to: "/ranking" },
  { label: "NOTICIAS", to: "/preview" },
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
            <span className="stg-mark" aria-hidden="true" />
            <span className="leading-none">
              <span className="block text-4xl font-black italic tracking-[-0.04em] text-white drop-shadow-[0_0_12px_rgba(168,85,247,0.55)]">
                STG
              </span>
              <span className="mt-1 block text-[9px] font-black uppercase tracking-[0.16em] text-white/70">
                Supremo Tribunal Gamer
              </span>
            </span>
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
        <div className="absolute inset-0 bg-[url('/assets/premium-theme/IMG/COD-HP_Hero_Desktop_XL.webp')] bg-cover bg-[68%_center]" />
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
              <span className="stg-metal-text block">SUPREMO</span>
              <span className="stg-purple-text block">TRIBUNAL GAMER</span>
            </h1>
            <p className="mt-5 max-w-[560px] text-lg font-medium text-white/78">
              Domine o campo digital com a tropa de elite da STG.
            </p>

            <div className="mt-6 flex flex-wrap gap-4">
              <Link to="/torneios" className="stg-primary-cta">
                VER TORNEIOS
                <ChevronRight size={18} />
              </Link>
              <button type="button" onClick={handleArenaEntry} className="stg-secondary-cta">
                ENTRAR NA ARENA
                <ChevronRight size={18} />
              </button>
            </div>
          </div>

          <div className="mt-10 hidden items-center lg:flex">
            <div className="stg-season-panel w-full p-7">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-white/45">OPERACAO ATIVA</p>
              <div className="mt-1 flex items-center justify-between">
                <h2 className="text-2xl font-black uppercase tracking-[0.08em] text-[#a855f7]">TEMPORADA 2024</h2>
                <Trophy className="text-[#c084fc]" size={21} />
              </div>
              <div className="mt-7 border-t border-white/10 pt-5">
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-white/45">MISSAO DA SEMANA</p>
                <div className="mt-3 flex items-center justify-between text-sm text-white/80">
                  <span>Venca 5 partidas ranqueadas</span>
                  <span>3 / 5</span>
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
            CAMPEONATO EM DESTAQUE
          </div>

          <div className="relative overflow-hidden rounded-[6px] border border-white/10">
            <div className="absolute inset-0 bg-[url('/assets/premium-theme/IMG/COD-HP_Primary-Tout_Desktop-LG.webp')] bg-cover bg-center" />
            <div className="absolute inset-0 bg-gradient-to-r from-black via-black/45 to-black/20" />

            <button className="stg-carousel-button left-5" aria-label="Anterior">
              <ChevronLeft />
            </button>
            <button className="stg-carousel-button right-5" aria-label="Proximo">
              <ChevronRight />
            </button>

            <div className="relative min-h-[248px] px-8 py-7 md:min-h-[274px] md:px-24 lg:px-40">
              <span className="inline-flex items-center gap-2 rounded-md border border-white/15 bg-black/55 px-3 py-1 text-xs font-black uppercase text-white/90">
                <span className="size-2 rounded-full bg-red-600 shadow-[0_0_12px_#dc2626]" />
                AO VIVO
              </span>
              <div className="mt-8 max-w-[560px] text-center md:text-left">
                <p className="text-3xl font-black uppercase tracking-[0.38em] text-white md:text-[34px]">COPA STG</p>
                <h2 className="mt-1 text-5xl font-black uppercase leading-none text-white drop-shadow-[0_0_16px_rgba(255,255,255,0.2)] md:text-[64px]">
                  ELITE LEAGUE
                </h2>
                <p className="mt-2 text-2xl font-black uppercase tracking-[0.12em] text-[#a855f7] md:text-[28px]">
                  TEMPORADA 2024
                </p>
                <p className="mx-auto mt-4 max-w-[360px] text-base text-white/78 md:mx-0">
                  As melhores equipes. Batalhas epicas. So uma sera coroada campea.
                </p>
                <Link to="/torneios" className="stg-watch-button mt-5 inline-flex items-center gap-2">
                  ASSISTA AGORA
                  <span className="grid size-4 place-items-center rounded-sm border border-[#a855f7] text-[10px]">▶</span>
                </Link>
              </div>

              <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2">
                <span className="h-2 w-4 rounded-full bg-[#a855f7]" />
                <span className="size-2 rounded-full bg-white/25" />
                <span className="size-2 rounded-full bg-white/25" />
              </div>
            </div>
          </div>
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
          <div className="text-5xl font-black italic tracking-[-0.06em] text-white drop-shadow-[0_0_14px_rgba(168,85,247,0.6)]">
            STG
          </div>
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
