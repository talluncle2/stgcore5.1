import { Link, useLocation } from "react-router-dom";
import {
  Crosshair,
  Gauge,
  Home,
  LogIn,
  Menu,
  Settings,
  Shield,
  ShoppingCart,
  Trophy,
  Users,
  X,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { hasDashboardAccess } from "../../utils/permissions";
import { BrandLogo } from "../BrandLogo";
import { SidebarUserSection } from "./SidebarUserSection";

const mainNavigation = [
  { name: "Home", path: "/", icon: Home },
  { name: "Loja", path: "/loja", icon: ShoppingCart },
  { name: "Torneios", path: "/torneios", icon: Trophy },
  { name: "Ranking", path: "/ranking", icon: Trophy },
];

const authNavigation = [
  { name: "Jogadores", path: "/players", icon: Users },
  { name: "Meu Perfil", path: "/profile", icon: Users },
  { name: "Configurações", path: "/settings", icon: Settings },
];

const adminNavigation = [
  { name: "Dashboard", path: "/dashboard", icon: Gauge },
  { name: "Moderação", path: "/moderation", icon: Shield },
  { name: "Admin", path: "/admin", icon: Zap },
];

type NavigationItem = {
  name: string;
  path: string;
  icon: typeof Home;
};

export function Sidebar() {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, profile, isAuthenticated } = useAuth();
  const canOpenDashboard = hasDashboardAccess(user ?? profile);

  const renderItem = (item: NavigationItem, tone: "default" | "admin" = "default") => {
    const Icon = item.icon;
    const isActive = location.pathname === item.path;
    const active = tone === "admin"
      ? "border-[#84cc16]/60 bg-[#84cc16]/12 text-[#f8fafc] shadow-[inset_3px_0_0_#84cc16] glow-green"
      : "border-[#a855f7]/60 bg-[#a855f7]/12 text-[#f8fafc] shadow-[inset_3px_0_0_#a855f7] glow-purple";
    const idle = tone === "admin"
      ? "border-transparent text-[#94a3b8] hover:border-[#84cc16]/35 hover:bg-[#111827]/80 hover:text-[#f8fafc]"
      : "border-transparent text-[#94a3b8] hover:border-[#a855f7]/35 hover:bg-[#111827]/80 hover:text-[#f8fafc]";

    return (
      <Link
        key={item.path}
        to={item.path}
        onClick={() => setMobileOpen(false)}
        className={`tactical-edge flex items-center gap-3 border px-4 py-2.5 transition-all ${isActive ? active : idle}`}
      >
        <Icon size={18} />
        <span className="text-sm font-black uppercase tracking-[0.08em]">{item.name}</span>
      </Link>
    );
  };

  return (
    <>
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="tactical-edge fixed left-4 top-4 z-50 border border-[#a855f7]/40 bg-[#a855f7] p-2 text-white lg:hidden"
      >
        {mobileOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      <aside
        className={`stg-premium-sidebar fixed left-0 top-0 z-40 flex h-screen w-64 max-w-[82vw] flex-col border-r border-[#a855f7]/20 bg-[#050608]/96 shadow-2xl shadow-black/60 backdrop-blur-xl transition-transform duration-300 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="border-b border-[#a855f7]/20 p-6">
          <Link to="/" className="flex items-center gap-3">
            <BrandLogo imageClassName="h-12 w-12" compactText />
          </Link>
        </div>

        <nav className="flex flex-1 flex-col gap-2 overflow-y-auto px-4 py-6">
          <div className="mb-1 flex items-center gap-2 px-4 text-[#a855f7]">
            <Crosshair size={14} />
            <span className="text-[10px] font-black uppercase tracking-[0.18em] text-[#7c3aed]">
              Operações
            </span>
          </div>
          {mainNavigation.map((item) => renderItem(item))}

          {isAuthenticated && (
            <>
              <div className="pb-2 pt-4">
                <p className="px-4 text-xs font-black uppercase tracking-[0.16em] text-[#7c3aed]">
                  Conta
                </p>
              </div>
              {authNavigation.map((item) => renderItem(item))}
            </>
          )}

          {isAuthenticated && canOpenDashboard && (
            <>
              <div className="pb-2 pt-4">
                <p className="px-4 text-xs font-black uppercase tracking-[0.16em] text-[#84cc16]">
                  Administração
                </p>
              </div>
              {adminNavigation.map((item) => renderItem(item, "admin"))}
            </>
          )}
        </nav>

        <div className="border-t border-[#a855f7]/20 p-4">
          {isAuthenticated ? (
            <SidebarUserSection onNavigate={() => setMobileOpen(false)} />
          ) : (
            <Link
              to="/login"
              onClick={() => setMobileOpen(false)}
              className="tactical-edge flex items-center gap-3 bg-[#a855f7] px-4 py-3 font-black uppercase tracking-[0.08em] text-white transition-all hover:bg-[#c084fc] glow-purple"
            >
              <LogIn size={18} />
              <span className="text-sm font-black">Fazer Login</span>
            </Link>
          )}
        </div>

        <div className="border-t border-[#a855f7]/20 p-4 text-xs uppercase tracking-[0.08em] text-[#7c3aed]">
          <p>STG © 2026</p>
          <p>Supremo Tribunal Gamer</p>
        </div>
      </aside>
    </>
  );
}
