import { useCallback, useMemo, useState } from "react";
import { Crosshair, Edit, Plus, Save, ShieldAlert, Trash2 } from "lucide-react";
import { Layout } from "../components/layout/Layout";
import { useAuth } from "../context/AuthContext";
import { usePolling } from "../hooks/usePolling";
import { hasAdminAccess } from "../utils/permissions";
import { getAdminSettings, updateAdminSettings } from "../services/adminService";
import { createMember, deleteMember, getMembers, updateMember } from "../services/membersService";
import { createProduct, deleteProduct, getAdminProducts, updateProduct } from "../services/storeService";
import { createTournament, deleteTournament, getAdminTournaments, updateTournament } from "../services/tournamentsService";
import { AdminMember, AdminSettings, Product, Tournament } from "../types/api";

type Tab = "members" | "tournaments" | "store" | "settings";
type Notice = { type: "success" | "error"; message: string } | null;

const inputClass =
  "w-full rounded-lg border-2 border-[#2d3748] bg-[#0f172a] px-3 py-2 text-sm text-white placeholder-[#64748b] focus:border-[#a855f7] focus:outline-none";

function idOf(item: AdminMember | Product | Tournament): string | number {
  if ("discord_id" in item) return item.discord_id;
  if ("product_id" in item) return item.product_id;
  return item.tournament_id || item.id || "";
}

function AdminBlocked() {
  return (
    <div className="cod-mission-panel failed">
      <div className="mb-3 flex items-center gap-2 text-[#ef4444]">
        <ShieldAlert size={20} />
        <span className="font-black uppercase">Voce nao possui permissao administrativa</span>
      </div>
      <p className="text-sm text-[#94a3b8]">Apenas administradores podem executar esta acao.</p>
    </div>
  );
}

function buildTournamentPayload(form: { id: string; code: string; name: string; description: string; status: string }) {
  return {
    id: form.id,
    code: form.code || form.name,
    description: form.description,
    status: form.status as Tournament["status"],
  };
}

function buildProductPayload(form: { id: string; name: string; description: string; price: string; stock: string; category: string }) {
  return {
    id: form.id,
    name: form.name,
    description: form.description,
    price: Number(form.price || 0),
    price_coins: Number(form.price || 0),
    stock: Number(form.stock || 0),
    category: form.category,
  };
}

export function Admin() {
  const { user } = useAuth();
  const isAdmin = hasAdminAccess(user);
  const [tab, setTab] = useState<Tab>("members");
  const [members, setMembers] = useState<AdminMember[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [settings, setSettings] = useState<AdminSettings | null>(null);
  const [notice, setNotice] = useState<Notice>(null);
  const [loading, setLoading] = useState(false);
  const [memberForm, setMemberForm] = useState({ discord_id: "", username: "", role: "", status: "", notes: "" });
  const [tournamentForm, setTournamentForm] = useState({ id: "", code: "", name: "", description: "", status: "pendente" });
  const [productForm, setProductForm] = useState({ id: "", name: "", description: "", price: "", stock: "", category: "" });
  const [settingsText, setSettingsText] = useState("{}");

  const loadData = useCallback(async () => {
    const [memberData, tournamentData, productData, settingsData] = await Promise.all([
      getMembers(),
      getAdminTournaments(),
      getAdminProducts(),
      getAdminSettings(),
    ]);
    setMembers(memberData);
    setTournaments(tournamentData);
    setProducts(productData);
    setSettings(settingsData);
    setSettingsText(JSON.stringify(settingsData ?? {}, null, 2));
  }, []);

  usePolling(loadData, 20000, isAdmin);

  const activeCount = useMemo(
    () => ({
      members: members.length,
      tournaments: tournaments.length,
      store: products.length,
      settings: settings ? 1 : 0,
    }),
    [members.length, products.length, settings, tournaments.length]
  );

  async function runAdminAction(action: () => Promise<void>) {
    if (!isAdmin) {
      setNotice({ type: "error", message: "Apenas administradores podem executar esta acao." });
      return;
    }

    setLoading(true);
    setNotice(null);
    try {
      await action();
      await loadData();
      setNotice({ type: "success", message: "Dados atualizados com sucesso." });
    } catch (error) {
      setNotice({
        type: "error",
        message: error instanceof Error ? error.message : "Erro ao salvar alteracoes.",
      });
    } finally {
      setLoading(false);
    }
  }

  function editMember(member: AdminMember) {
    setMemberForm({
      discord_id: String(member.discord_id ?? ""),
      username: member.username || member.discord_username || member.display_name || "",
      role: member.role || "",
      status: member.status || "",
      notes: member.notes || "",
    });
  }

  function editTournament(tournament: Tournament) {
    setTournamentForm({
      id: String(idOf(tournament)),
      code: tournament.code || "",
      name: tournament.code || String(tournament.tournament_id),
      description: tournament.description || tournament.ranking || "",
      status: tournament.status || "pendente",
    });
  }

  function editProduct(product: Product) {
    setProductForm({
      id: String(idOf(product)),
      name: product.name || "",
      description: product.description || "",
      price: String(product.price ?? product.price_coins ?? ""),
      stock: String(product.stock ?? ""),
      category: product.category || "",
    });
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="cod-military-bg rounded-lg border-2 border-[#a855f7]/50 p-6">
          <div className="mb-2 flex items-center gap-3">
            <Crosshair className="text-[#a855f7]" size={28} />
            <h1 className="cod-header-highlight">PAINEL ADMINISTRATIVO</h1>
          </div>
          <p className="ml-11 text-sm text-[#94a3b8]">
            Controle sincronizado com a API do Replit. O bot continua isolado no backend.
          </p>
        </div>

        {!isAdmin && <AdminBlocked />}

        {notice && (
          <div className={`rounded-lg border p-3 text-sm font-bold ${notice.type === "success" ? "border-[#22c55e]/30 bg-[#22c55e]/10 text-[#22c55e]" : "border-[#ef4444]/30 bg-[#ef4444]/10 text-[#ef4444]"}`}>
            {notice.message}
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          {[
            ["members", `Membros (${activeCount.members})`],
            ["tournaments", `Campeonatos (${activeCount.tournaments})`],
            ["store", `Loja (${activeCount.store})`],
            ["settings", "Administracao"],
          ].map(([value, label]) => (
            <button
              key={value}
              onClick={() => setTab(value as Tab)}
              className={`rounded-lg px-4 py-2 text-xs font-black uppercase ${tab === value ? "stg-button-primary" : "border border-[#a855f7]/25 bg-[#111827]/85 text-[#94a3b8] hover:border-[#a855f7]"}`}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === "members" && (
          <section className="grid gap-4 lg:grid-cols-[360px_1fr]">
            <div className="cod-mission-panel active">
              <h2 className="mb-4 font-black uppercase text-white">Gestao de Membros</h2>
              <div className="space-y-3">
                <input className={inputClass} placeholder="Discord ID" value={memberForm.discord_id} onChange={(e) => setMemberForm({ ...memberForm, discord_id: e.target.value })} />
                <input className={inputClass} placeholder="Nome/apelido" value={memberForm.username} onChange={(e) => setMemberForm({ ...memberForm, username: e.target.value })} />
                <input className={inputClass} placeholder="Cargo" value={memberForm.role} onChange={(e) => setMemberForm({ ...memberForm, role: e.target.value })} />
                <input className={inputClass} placeholder="Status" value={memberForm.status} onChange={(e) => setMemberForm({ ...memberForm, status: e.target.value })} />
                <textarea className={inputClass} placeholder="Observacoes administrativas" value={memberForm.notes} onChange={(e) => setMemberForm({ ...memberForm, notes: e.target.value })} />
                <div className="grid grid-cols-2 gap-2">
                  <button disabled={!isAdmin || loading} onClick={() => runAdminAction(() => createMember(memberForm, user).then(() => undefined))} className="stg-button-primary flex items-center justify-center gap-2 disabled:opacity-50">
                    <Plus size={16} /> Criar
                  </button>
                  <button disabled={!isAdmin || loading || !memberForm.discord_id} onClick={() => runAdminAction(() => updateMember(memberForm.discord_id, memberForm, user).then(() => undefined))} className="stg-button-secondary flex items-center justify-center gap-2 disabled:opacity-50">
                    <Save size={16} /> Salvar
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              {members.length === 0 ? (
                <div className="cod-mission-panel text-sm text-[#94a3b8]">Dados indisponiveis no momento.</div>
              ) : (
                members.map((member) => (
                  <div key={String(idOf(member))} className="cod-mission-panel flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="font-black text-white">{member.display_name || member.username || member.discord_username || "Membro"}</p>
                      <p className="text-xs text-[#94a3b8]">{member.discord_id} - {member.role || "sem cargo"}</p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => editMember(member)} className="rounded bg-[#a855f7]/20 px-3 py-2 text-[#a855f7]"><Edit size={16} /></button>
                      <button disabled={!isAdmin || loading} onClick={() => runAdminAction(() => deleteMember(idOf(member), user))} className="rounded bg-[#ef4444]/20 px-3 py-2 text-[#ef4444] disabled:opacity-50"><Trash2 size={16} /></button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        )}

        {tab === "tournaments" && (
          <section className="grid gap-4 lg:grid-cols-[360px_1fr]">
            <div className="cod-mission-panel active">
              <h2 className="mb-4 font-black uppercase text-white">Gestao de Campeonatos</h2>
              <div className="space-y-3">
                <input className={inputClass} placeholder="ID para editar" value={tournamentForm.id} onChange={(e) => setTournamentForm({ ...tournamentForm, id: e.target.value })} />
                <input className={inputClass} placeholder="Codigo/nome" value={tournamentForm.code} onChange={(e) => setTournamentForm({ ...tournamentForm, code: e.target.value })} />
                <textarea className={inputClass} placeholder="Descricao/regras/formato" value={tournamentForm.description} onChange={(e) => setTournamentForm({ ...tournamentForm, description: e.target.value })} />
                <select className={inputClass} value={tournamentForm.status} onChange={(e) => setTournamentForm({ ...tournamentForm, status: e.target.value })}>
                  <option value="pendente">Pendente</option>
                  <option value="aprovado">Aprovado</option>
                  <option value="rejeitado">Rejeitado</option>
                </select>
                <div className="grid grid-cols-2 gap-2">
                  <button disabled={!isAdmin || loading} onClick={() => runAdminAction(() => createTournament(buildTournamentPayload(tournamentForm), user).then(() => undefined))} className="stg-button-primary flex items-center justify-center gap-2 disabled:opacity-50"><Plus size={16} /> Criar</button>
                  <button disabled={!isAdmin || loading || !tournamentForm.id} onClick={() => runAdminAction(() => updateTournament(tournamentForm.id, buildTournamentPayload(tournamentForm), user).then(() => undefined))} className="stg-button-secondary flex items-center justify-center gap-2 disabled:opacity-50"><Save size={16} /> Salvar</button>
                </div>
              </div>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {tournaments.map((tournament) => (
                <div key={String(idOf(tournament))} className="cod-mission-panel">
                  <p className="font-black text-white">{tournament.code || `Campeonato ${idOf(tournament)}`}</p>
                  <p className="mb-3 text-xs text-[#94a3b8]">{tournament.status}</p>
                  <div className="flex gap-2">
                    <button onClick={() => editTournament(tournament)} className="rounded bg-[#a855f7]/20 px-3 py-2 text-[#a855f7]"><Edit size={16} /></button>
                    <button disabled={!isAdmin || loading} onClick={() => runAdminAction(() => deleteTournament(idOf(tournament), user))} className="rounded bg-[#ef4444]/20 px-3 py-2 text-[#ef4444] disabled:opacity-50"><Trash2 size={16} /></button>
                  </div>
                </div>
              ))}
              {tournaments.length === 0 && <div className="cod-mission-panel text-sm text-[#94a3b8]">Dados indisponiveis no momento.</div>}
            </div>
          </section>
        )}

        {tab === "store" && (
          <section className="grid gap-4 lg:grid-cols-[360px_1fr]">
            <div className="cod-mission-panel active">
              <h2 className="mb-4 font-black uppercase text-white">Gestao de Loja</h2>
              <div className="space-y-3">
                <input className={inputClass} placeholder="ID para editar" value={productForm.id} onChange={(e) => setProductForm({ ...productForm, id: e.target.value })} />
                <input className={inputClass} placeholder="Nome" value={productForm.name} onChange={(e) => setProductForm({ ...productForm, name: e.target.value })} />
                <textarea className={inputClass} placeholder="Descricao" value={productForm.description} onChange={(e) => setProductForm({ ...productForm, description: e.target.value })} />
                <input className={inputClass} placeholder="Preco" value={productForm.price} onChange={(e) => setProductForm({ ...productForm, price: e.target.value })} />
                <input className={inputClass} placeholder="Estoque" value={productForm.stock} onChange={(e) => setProductForm({ ...productForm, stock: e.target.value })} />
                <input className={inputClass} placeholder="Categoria" value={productForm.category} onChange={(e) => setProductForm({ ...productForm, category: e.target.value })} />
                <div className="grid grid-cols-2 gap-2">
                  <button disabled={!isAdmin || loading} onClick={() => runAdminAction(() => createProduct(buildProductPayload(productForm), user).then(() => undefined))} className="stg-button-primary flex items-center justify-center gap-2 disabled:opacity-50"><Plus size={16} /> Criar</button>
                  <button disabled={!isAdmin || loading || !productForm.id} onClick={() => runAdminAction(() => updateProduct(productForm.id, buildProductPayload(productForm), user).then(() => undefined))} className="stg-button-secondary flex items-center justify-center gap-2 disabled:opacity-50"><Save size={16} /> Salvar</button>
                </div>
              </div>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {products.map((product) => (
                <div key={String(idOf(product))} className="cod-mission-panel">
                  <p className="font-black text-white">{product.name}</p>
                  <p className="mb-3 text-xs text-[#94a3b8]">{product.category || "geral"} - {product.price} coins</p>
                  <div className="flex gap-2">
                    <button onClick={() => editProduct(product)} className="rounded bg-[#a855f7]/20 px-3 py-2 text-[#a855f7]"><Edit size={16} /></button>
                    <button disabled={!isAdmin || loading} onClick={() => runAdminAction(() => deleteProduct(idOf(product), user))} className="rounded bg-[#ef4444]/20 px-3 py-2 text-[#ef4444] disabled:opacity-50"><Trash2 size={16} /></button>
                  </div>
                </div>
              ))}
              {products.length === 0 && <div className="cod-mission-panel text-sm text-[#94a3b8]">Dados indisponiveis no momento.</div>}
            </div>
          </section>
        )}

        {tab === "settings" && (
          <section className="cod-mission-panel active">
            <h2 className="mb-4 font-black uppercase text-white">Configuracoes Administrativas</h2>
            <p className="mb-3 text-sm text-[#94a3b8]">
              Edite JSON conforme contrato da API existente: cargos admin/moderadores, permissoes do painel, canais,
              logs e comandos habilitados.
            </p>
            <textarea className={`${inputClass} min-h-72 font-mono`} value={settingsText} onChange={(e) => setSettingsText(e.target.value)} />
            <button
              disabled={!isAdmin || loading}
              onClick={() =>
                runAdminAction(async () => {
                  const parsed = JSON.parse(settingsText) as AdminSettings;
                  await updateAdminSettings(parsed, user);
                })
              }
              className="stg-button-primary mt-4 flex items-center gap-2 disabled:opacity-50"
            >
              <Save size={16} /> Salvar configuracoes
            </button>
          </section>
        )}
      </div>
    </Layout>
  );
}
