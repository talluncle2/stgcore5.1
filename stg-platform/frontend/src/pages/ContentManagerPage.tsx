import { Navigate, useParams } from "react-router-dom";
import { Layout } from "../components/layout/Layout";
import { NewsManager } from "../components/admin/NewsManager";
import { StoreManager } from "../components/admin/StoreManager";
import { TournamentManager } from "../components/admin/TournamentManager";
import { useAuth } from "../context/AuthContext";
import { canManageContent } from "../utils/permissions";

const titles = {
  noticias: "Gestao de Noticias",
  loja: "Gestao da Loja",
  torneios: "Gestao de Torneios",
};

export function ContentManagerPage() {
  const { section } = useParams();
  const { user, profile } = useAuth();

  if (!canManageContent(user ?? profile)) {
    return <Navigate to="/" replace />;
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="border border-[#a855f7]/20 bg-[#050608]/70 p-4">
          <p className="tactical-label">Conteudo STG</p>
          <h2 className="text-xl font-black uppercase tracking-[0.06em] text-white">
            {titles[section as keyof typeof titles] || "Gestao de conteudo"}
          </h2>
          <p className="mt-1 text-sm text-[#94a3b8]">
            Fallback temporario em localStorage ate os endpoints administrativos da API Replit ficarem disponiveis.
          </p>
        </div>

        {section === "noticias" && <NewsManager />}
        {section === "loja" && <StoreManager />}
        {section === "torneios" && <TournamentManager />}
        {!["noticias", "loja", "torneios"].includes(section || "") && (
          <div className="stg-hud-panel p-6 text-[#94a3b8]">Secao de gestao nao encontrada.</div>
        )}
      </div>
    </Layout>
  );
}
