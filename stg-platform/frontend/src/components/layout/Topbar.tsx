import { useEffect, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import {
  Bell,
  Circle,
  Crosshair,
  Gauge,
  Menu,
  Newspaper,
  ShieldCheck,
  ShoppingCart,
  Trophy,
  Users,
  X,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { getHealth } from "../../services/api";
import { hasDashboardAccess, hasSettingsAccess } from "../../utils/permissions";
import { UserMenu } from "./UserMenu";

const publicLinks = [
  { label: "Inicio", path: "/", icon: Crosshair },
  { label: "Torneios", path: "/torneios", icon: Trophy },
  { label: "Times/Jogadores", path: "/comunidade", icon: Users },
  { label: "Ranking", path: "/ranking", icon: Gauge },
  { label: "Noticias", path: "/noticias", icon: Newspaper },
  { label: "Loja", path: "/loja", icon: ShoppingCart },
];

type NavItem = {
  label: string;
  path: string;
  icon: typeof Crosshair;
};

export function Topbar() {
  const [apiStatus, setApiStatus] = useState<"online" | "offline">("offline");
  const [apiLoading, setApiLoading] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const { user, profile, isAuthenticated, loginWithDiscord } = useAuth();

  const identity = user ?? profile;
  const canOpenDashboard = hasDashboardAccess(identity);
  const canOpenSettings = hasSettingsAccess(identity);
  const adminLinks: NavItem[] = canOpenDashboard
    ? [
        { label: "Dashboard", path: "/dashboard", icon: Gauge },
        { label: "Admin", path: "/admin", icon: ShieldCheck },
        { label: "Moderacao", path: "/moderation", icon: ShieldCheck },
        ...(canOpenSettings
          ? [{ label: "Configuracoes", path: "/settings", icon: ShieldCheck }]
          : []),
      ]
    : [];

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const result = await getHealth();
        setApiStatus(result.status);
      } catch {
        setApiStatus("offline");
      } finally {
        setApiLoading(false);
      }
    };

    checkHealth();
    const interval = setInterval(checkHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  const mainCompactLinks = [...publicLinks.slice(0, 4), ...adminLinks.slice(0, 2)];
  const moreLinks = [...publicLinks.slice(4), ...adminLinks.slice(2)];

  function renderLink(item: NavItem, compact = false, iconOnly = false) {
    const Icon = item.icon;

    return (
      <NavLink
        key={item.path}
        to={item.path}
        onClick={() => {
          setMobileOpen(false);
          setMoreOpen(false);
        }}
        className={({ isActive }) =>
          [
            "flex min-w-0 items-center gap-2 whitespace-nowrap border border-transparent px-3 py-2 text-xs font-black uppercase tracking-[0.08em] transition-colors",
            compact ? "w-full justify-start" : "h-10 justify-center",
            isActive
              ? "border-[#a855f7]/45 bg-[#a855f7]/15 text-white"
              : "text-[#94a3b8] hover:border-[#a855f7]/30 hover:bg-[#111827]/80 hover:text-white",
          ].join(" ")
        }
        title={item.label}
      >
        <Icon size={15} />
        {!iconOnly && <span className="truncate">{item.label}</span>}
      </NavLink>
    );
  }

  return (
    <header className="stg-premium-topbar fixed left-0 right-0 top-0 z-30 border-b border-[#a855f7]/20 bg-[#050608]/94 text-center shadow-lg shadow-black/25 backdrop-blur-xl">
      <div className="flex h-16 items-center gap-3 px-3 lg:px-5">
        <div className="flex shrink-0 items-center gap-3">
          <button
            type="button"
            onClick={() => setMobileOpen((value) => !value)}
            className="tactical-edge flex size-10 items-center justify-center border border-[#a855f7]/30 bg-[#111827]/85 text-[#f8fafc] lg:hidden"
            aria-label="Abrir navegacao"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          <Link to="/" className="flex min-w-0 items-center gap-3" onClick={() => setMobileOpen(false)}>
            <div className="tactical-edge hidden size-9 items-center justify-center border border-[#a855f7]/35 bg-[#111827] text-[#a855f7] sm:flex">
              <Crosshair size={18} />
            </div>
            <div className="min-w-0 max-w-[150px] sm:max-w-[210px] xl:max-w-[180px] 2xl:max-w-[240px]">
              <p className="tactical-label hidden truncate sm:block">SUPREMO TRIBUNAL GAMER</p>
              <h1 className="truncate text-left text-lg font-black uppercase tracking-[0.07em] gradient-text sm:text-xl">
                STG WARZONE
              </h1>
            </div>
          </Link>
        </div>

        <nav className="hidden min-w-0 flex-1 items-center justify-center gap-1 2xl:flex">
          {publicLinks.map((item) => renderLink(item))}
          {adminLinks.length > 0 && <span className="mx-1 h-7 border-l border-[#a855f7]/20" />}
          {adminLinks.map((item) => renderLink(item))}
        </nav>

        <nav className="hidden min-w-0 flex-1 items-center justify-center gap-1 xl:flex 2xl:hidden">
          {mainCompactLinks.map((item) => renderLink(item))}
          {moreLinks.length > 0 && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setMoreOpen((value) => !value)}
                className="flex h-10 items-center gap-2 whitespace-nowrap border border-transparent px-3 py-2 text-xs font-black uppercase tracking-[0.08em] text-[#94a3b8] transition-colors hover:border-[#a855f7]/30 hover:bg-[#111827]/80 hover:text-white"
              >
                <Menu size={15} />
                Mais
              </button>
              {moreOpen && (
                <div className="stg-hud-panel-glow absolute left-1/2 top-12 z-50 w-56 -translate-x-1/2 overflow-hidden border-[#a855f7]/30 p-2">
                  <div className="grid gap-1">
                    {moreLinks.map((item) => renderLink(item, true))}
                  </div>
                </div>
              )}
            </div>
          )}
        </nav>

        <nav className="hidden min-w-0 flex-1 items-center justify-center gap-1 lg:flex xl:hidden">
          {mainCompactLinks.slice(0, 6).map((item) => renderLink(item, false, true))}
        </nav>

        <div className="ml-auto flex shrink-0 items-center gap-2">
          <div className="tactical-edge hidden items-center gap-2 border border-[#84cc16]/25 bg-[#111827]/90 px-3 py-2 2xl:flex">
            <Circle
              size={8}
              className={`fill-current ${
                apiLoading
                  ? "text-[#94a3b8]"
                  : apiStatus === "online"
                    ? "text-[#84cc16]"
                    : "text-[#f97316]"
              }`}
            />
            <span className="text-xs font-bold uppercase tracking-[0.08em] text-[#94a3b8]">
              {apiLoading ? "Verificando..." : apiStatus === "online" ? "API ONLINE" : "API OFFLINE"}
            </span>
          </div>

          <button
            type="button"
            className="tactical-edge hidden border border-[#a855f7]/20 bg-[#111827]/80 p-2 text-[#94a3b8] transition-colors hover:border-[#a855f7]/45 hover:text-[#a855f7] xl:block"
            title="Modulo aguardando backend"
          >
            <Bell size={20} />
          </button>

          {!isAuthenticated && (
            <button
              type="button"
              onClick={loginWithDiscord}
              className="tactical-edge flex items-center gap-2 bg-[#a855f7] px-4 py-2 text-sm font-black uppercase tracking-[0.08em] text-white transition-colors hover:bg-[#c084fc] glow-purple"
            >
              Conectar-se
            </button>
          )}
          {isAuthenticated && <UserMenu />}
        </div>
      </div>

      {mobileOpen && (
        <div className="border-t border-[#a855f7]/20 bg-[#050608]/98 px-3 py-3 shadow-xl shadow-black/40 lg:hidden">
          <div className="grid gap-2">
            {publicLinks.map((item) => renderLink(item, true))}
            {adminLinks.length > 0 && <div className="my-1 border-t border-[#a855f7]/20" />}
            {adminLinks.map((item) => renderLink(item, true))}
          </div>
          <div className="mt-3 flex items-center gap-2 border border-[#84cc16]/20 bg-[#111827]/75 px-3 py-2">
            <Circle
              size={8}
              className={`fill-current ${apiStatus === "online" ? "text-[#84cc16]" : "text-[#f97316]"}`}
            />
            <span className="text-xs font-bold uppercase tracking-[0.08em] text-[#94a3b8]">
              {apiLoading ? "Verificando API" : apiStatus === "online" ? "API Online" : "API Offline"}
            </span>
          </div>
        </div>
      )}
    </header>
  );
}
