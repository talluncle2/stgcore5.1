import { ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { Topbar } from "./Topbar";

interface LayoutProps {
  children: ReactNode;
}

const pageMeta: Record<string, { title: string; subtitle: string; code: string }> = {
  loja: {
    title: "Loja Tatica",
    subtitle: "Arsenal, recompensas e itens premium da comunidade STG.",
    code: "ARSENAL",
  },
  store: {
    title: "Loja Tatica",
    subtitle: "Arsenal, recompensas e itens premium da comunidade STG.",
    code: "ARSENAL",
  },
  torneios: {
    title: "Campeonatos",
    subtitle: "Operacoes competitivas, ligas abertas e desafios oficiais.",
    code: "LEAGUE",
  },
  tournaments: {
    title: "Campeonatos",
    subtitle: "Operacoes competitivas, ligas abertas e desafios oficiais.",
    code: "LEAGUE",
  },
  ranking: {
    title: "Ranking Global",
    subtitle: "Placar operacional dos melhores jogadores da STG.",
    code: "RANK",
  },
  profile: {
    title: "Perfil Operador",
    subtitle: "Identidade, progresso e historico da sua conta.",
    code: "PROFILE",
  },
  dashboard: {
    title: "Dashboard",
    subtitle: "Centro de comando para acompanhar indicadores e operacoes.",
    code: "COMMAND",
  },
  admin: {
    title: "Admin",
    subtitle: "Controle administrativo, auditoria e gestao da plataforma.",
    code: "ADMIN",
  },
  moderation: {
    title: "Moderador",
    subtitle: "Ferramentas de moderacao e seguranca da comunidade.",
    code: "MOD",
  },
  players: {
    title: "Jogadores",
    subtitle: "Base de operadores, membros e estatisticas da comunidade.",
    code: "SQUAD",
  },
  comunidade: {
    title: "Times e Jogadores",
    subtitle: "Base publica da comunidade, operadores e indicadores sincronizados pela API.",
    code: "SQUAD",
  },
  times: {
    title: "Times e Jogadores",
    subtitle: "Base publica da comunidade, operadores e indicadores sincronizados pela API.",
    code: "SQUAD",
  },
  noticias: {
    title: "Noticias",
    subtitle: "Comunicados, operacoes ativas e atualizacoes oficiais da STG.",
    code: "NEWS",
  },
  settings: {
    title: "Configuracoes",
    subtitle: "Preferencias operacionais e conexoes externas.",
    code: "CONFIG",
  },
};

export function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const pageKey = location.pathname.replace("/", "") || "home";
  const meta = pageMeta[pageKey] ?? {
    title: "Operacao STG",
    subtitle: "Ambiente premium do Supremo Tribunal Gamer.",
    code: "STG",
  };

  return (
    <div className="stg-premium-shell tactical-shell min-h-screen" data-page={pageKey}>
      <div className="scanline-overlay" />
      <div className="stg-premium-bg" aria-hidden="true" />
      <Topbar />
      <main className="stg-premium-main relative z-10 mt-16 p-4 text-left lg:p-6">
        <div className="stg-premium-content">
          <section className="stg-page-banner mb-7">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-[#a855f7]">// {meta.code}</p>
              <h1 className="mt-2 text-4xl font-black uppercase tracking-[0.08em] text-white md:text-5xl">
                {meta.title}
              </h1>
              <p className="mt-2 max-w-2xl text-sm font-semibold text-white/62 md:text-base">
                {meta.subtitle}
              </p>
            </div>
            <div className="hidden text-right lg:block">
              <span className="inline-flex border border-[#a855f7]/45 bg-black/35 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-[#c084fc]">
                OPERACAO STG
              </span>
            </div>
          </section>
          {children}
        </div>
      </main>
    </div>
  );
}
