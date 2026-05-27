import { Navigate, useParams } from "react-router-dom";

const sectionToTab: Record<string, string> = {
  noticias: "noticias",
  loja: "loja",
  torneios: "campeonatos",
  campeonatos: "campeonatos",
  home: "home",
  ranking: "ranking",
  criadores: "criadores",
  membros: "membros",
  cargos: "cargos",
  api: "api",
  bot: "bot",
};

export function ContentManagerPage() {
  const { section } = useParams();
  const tab = sectionToTab[section || ""] || "loja";

  return <Navigate to={`/configuracoes?tab=${tab}`} replace />;
}
