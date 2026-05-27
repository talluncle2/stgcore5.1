import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { AdminContentCard } from "./AdminContentCard";
import { ContentEditorModal } from "./ContentEditorModal";
import { DeleteConfirmDialog } from "./DeleteConfirmDialog";
import { ImageUploadField } from "./ImageUploadField";
import { deleteRankingItem, getRankingItems, saveRankingItem } from "../../services/rankingService";
import { RankingItem } from "../../types/api";

const emptyForm: Partial<RankingItem> = {
  playerName: "",
  nick: "",
  avatarUrl: "",
  position: 1,
  points: 0,
  wins: 0,
  losses: 0,
  kills: 0,
  deaths: 0,
  kd: 0,
  level: 1,
  badge: "",
  isActive: true,
  isFeatured: false,
};

export function RankingManager() {
  const [items, setItems] = useState<RankingItem[]>([]);
  const [form, setForm] = useState<Partial<RankingItem>>(emptyForm);
  const [editorOpen, setEditorOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<RankingItem | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  async function load() {
    const data = await getRankingItems();
    setItems(data.sort((a, b) => a.position - b.position || b.points - a.points));
  }

  useEffect(() => {
    void load();
  }, []);

  function openCreate() {
    setForm({ ...emptyForm, position: items.length + 1 });
    setEditorOpen(true);
  }

  function openEdit(item: RankingItem) {
    setForm(item);
    setEditorOpen(true);
  }

  async function save() {
    if (!form.playerName) return;
    const kills = Number(form.kills || 0);
    const deaths = Number(form.deaths || 0);
    setIsSaving(true);
    await saveRankingItem({
      ...form,
      position: Number(form.position || 1),
      points: Number(form.points || 0),
      wins: Number(form.wins || 0),
      losses: Number(form.losses || 0),
      kills,
      deaths,
      kd: deaths > 0 ? Number((kills / deaths).toFixed(2)) : kills,
      level: Number(form.level || 1),
      isActive: form.isActive !== false,
      isFeatured: form.isFeatured === true,
    });
    setIsSaving(false);
    setEditorOpen(false);
    setForm({ ...emptyForm });
    await load();
  }

  async function remove() {
    if (!deleteTarget) return;
    await deleteRankingItem(deleteTarget.id);
    setDeleteTarget(null);
    await load();
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="tactical-label">Ranking manual</p>
          <h3 className="text-lg font-black uppercase text-white">Operadores e times</h3>
        </div>
        <button type="button" onClick={openCreate} className="stg-button-primary inline-flex items-center justify-center gap-2">
          <Plus size={16} />
          Nova posicao
        </button>
      </div>

      <section className="grid gap-3">
        {items.map((item) => (
          <AdminContentCard
            key={item.id}
            title={`#${item.position} ${item.playerName}`}
            subtitle={`${item.points} pts - nivel ${item.level} - KD ${item.kd}`}
            description={`${item.wins} vitorias, ${item.losses} derrotas, ${item.kills} kills`}
            imageUrl={item.avatarUrl}
            badges={[item.isActive ? "Ativo" : "Inativo", item.isFeatured ? "Destaque" : "", item.badge || ""]}
            onEdit={() => openEdit(item)}
            onDelete={() => setDeleteTarget(item)}
          />
        ))}
      </section>

      <ContentEditorModal
        open={editorOpen}
        onOpenChange={setEditorOpen}
        title={form.id ? "Editar posicao" : "Criar posicao"}
        description="Edite jogador/time, estatisticas, avatar e status no ranking."
        onSave={save}
        isSaving={isSaving}
      >
        <div className="grid gap-5">
          <div className="grid gap-3 md:grid-cols-2">
            <input className="stg-admin-input" placeholder="Jogador/time" value={form.playerName || ""} onChange={(e) => setForm({ ...form, playerName: e.target.value })} />
            <input className="stg-admin-input" placeholder="Nick" value={form.nick || ""} onChange={(e) => setForm({ ...form, nick: e.target.value })} />
          </div>
          <ImageUploadField
            label="Avatar/logo"
            value={form.avatarUrl}
            onChange={(avatarUrl) => setForm({ ...form, avatarUrl })}
            helperText="Upload local vira data URL no fallback frontend."
          />
          <div className="grid gap-3 md:grid-cols-4">
            <input className="stg-admin-input" type="number" placeholder="Posicao" value={form.position ?? 1} onChange={(e) => setForm({ ...form, position: Number(e.target.value) })} />
            <input className="stg-admin-input" type="number" placeholder="Pontos" value={form.points ?? 0} onChange={(e) => setForm({ ...form, points: Number(e.target.value) })} />
            <input className="stg-admin-input" type="number" placeholder="Vitorias" value={form.wins ?? 0} onChange={(e) => setForm({ ...form, wins: Number(e.target.value) })} />
            <input className="stg-admin-input" type="number" placeholder="Derrotas" value={form.losses ?? 0} onChange={(e) => setForm({ ...form, losses: Number(e.target.value) })} />
            <input className="stg-admin-input" type="number" placeholder="Kills" value={form.kills ?? 0} onChange={(e) => setForm({ ...form, kills: Number(e.target.value) })} />
            <input className="stg-admin-input" type="number" placeholder="Deaths" value={form.deaths ?? 0} onChange={(e) => setForm({ ...form, deaths: Number(e.target.value) })} />
            <input className="stg-admin-input" type="number" placeholder="Nivel/rank" value={form.level ?? 1} onChange={(e) => setForm({ ...form, level: Number(e.target.value) })} />
            <input className="stg-admin-input" placeholder="Badge/status" value={form.badge || ""} onChange={(e) => setForm({ ...form, badge: e.target.value })} />
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <label className="flex items-center gap-2 text-sm font-bold text-[#94a3b8]">
              <input type="checkbox" checked={form.isActive !== false} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
              Ativo
            </label>
            <label className="flex items-center gap-2 text-sm font-bold text-[#94a3b8]">
              <input type="checkbox" checked={form.isFeatured === true} onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })} />
              Destaque
            </label>
          </div>
        </div>
      </ContentEditorModal>

      <DeleteConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Excluir posicao"
        description={`Excluir "${deleteTarget?.playerName || "este operador"}" do ranking?`}
        onConfirm={remove}
      />
    </div>
  );
}
