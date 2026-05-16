import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';
import VoteButton from '../components/VoteButton';
import IngredientTable from '../components/IngredientTable';
import CommentSection from '../components/CommentSection';
import ConfirmModal from '../components/ConfirmModal';

export default function MenuDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const menuId = parseInt(id!);
  const [menu, setMenu] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [actualName, setActualName] = useState('');
  const [editingActual, setEditingActual] = useState(false);
  const [savingActual, setSavingActual] = useState(false);

  const loadMenu = useCallback(async () => {
    try {
      const res = await api.getMenu(menuId);
      setMenu(res.menu);
      setActualName(res.menu.actualMenuName || '');
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [menuId]);

  const loadComments = useCallback(async () => {
    try {
      const res = await api.getComments(menuId);
      setComments(res.comments);
    } catch (e) {
      console.error(e);
    }
  }, [menuId]);

  useEffect(() => {
    loadMenu();
    loadComments();
  }, [loadMenu, loadComments]);

  const handleDelete = async () => {
    try {
      await api.deleteMenu(menuId);
      navigate(-1);
    } catch (e: any) {
      alert(e.message || 'Gagal menghapus');
    }
  };

  const handleSaveActual = async () => {
    if (!actualName.trim()) return;
    setSavingActual(true);
    try {
      await api.setActualMenu(menuId, actualName.trim());
      setEditingActual(false);
      loadMenu();
    } catch (e: any) {
      alert(e.message || 'Gagal menyimpan');
    } finally {
      setSavingActual(false);
    }
  };

  if (loading) return <div className="text-center py-20 text-text-muted">Loading...</div>;
  if (!menu) return <div className="text-center py-20 text-danger">Menu tidak ditemukan</div>;

  const statusLabel: Record<string, { class: string; text: string }> = {
    proposed: { class: 'badge-proposed', text: '⏳ Menunggu' },
    approved: { class: 'badge-approved', text: '✅ Disetujui' },
    rejected: { class: 'badge-rejected', text: '❌ Ditolak' },
  };
  const badge = statusLabel[menu.status as string] ?? statusLabel.proposed;
  const isOwner = user?.id === menu.proposedBy;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="glass-card p-6">
        <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="font-heading font-extrabold text-2xl">{menu.menuName}</h1>
              {menu.isLateProposal && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-secondary/20 text-secondary border border-secondary/30">
                  ⚠️ Diusulkan Telat
                </span>
              )}
            </div>
            <p className="text-text-muted text-sm mt-1">
              {menu.dayOfWeek} · {menu.mealType} · Oleh <span className="text-primary">{menu.proposerName}</span>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className={badge.class}>{badge.text}</span>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="px-3 py-1 rounded-full text-xs font-medium bg-danger/10 text-danger hover:bg-danger/20 transition-colors"
            >
              🗑️ Hapus
            </button>
          </div>
        </div>
        {menu.description && (
          <p className="text-text-muted mb-4">{menu.description}</p>
        )}
        <VoteButton menuId={menuId} votes={menu.votes} onVoted={loadMenu} />
      </div>

      {/* Menu Sebenarnya */}
      <div className="glass-card p-6">
        <h3 className="font-heading font-bold text-lg mb-3">🍽️ Menu Sebenarnya</h3>
        <p className="text-xs text-text-muted mb-3">
          Catat menu yang benar-benar dimasak jika berbeda dari usulan. Menu usulan tetap tercatat di atas.
        </p>
        {menu.actualMenuName && !editingActual ? (
          <div className="flex items-center gap-3">
            <div className="flex-1 px-4 py-3 rounded-xl bg-success/10 border border-success/20">
              <span className="text-success font-semibold">{menu.actualMenuName}</span>
              {menu.actualMenuName !== menu.menuName && (
                <span className="text-xs text-text-muted ml-2">(berbeda dari usulan)</span>
              )}
            </div>
            <button
              onClick={() => setEditingActual(true)}
              className="text-xs text-primary hover:text-cyan-300 transition-colors"
            >
              Ubah
            </button>
          </div>
        ) : (
          <div className="flex gap-2">
            <input
              className="input-field flex-1"
              placeholder="Masukkan nama menu yang benar-benar dimasak..."
              value={actualName}
              onChange={e => setActualName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSaveActual()}
            />
            <button
              onClick={handleSaveActual}
              disabled={savingActual || !actualName.trim()}
              className="btn-primary !py-2"
            >
              {savingActual ? '...' : 'Simpan'}
            </button>
            {editingActual && (
              <button
                onClick={() => { setEditingActual(false); setActualName(menu.actualMenuName || ''); }}
                className="text-text-muted text-sm hover:text-white"
              >
                Batal
              </button>
            )}
          </div>
        )}
      </div>

      {/* Ingredients */}
      <div className="glass-card p-6">
        <h3 className="font-heading font-bold text-lg mb-4">🥬 Bahan Makanan</h3>
        <IngredientTable
          menuId={menuId}
          ingredients={menu.ingredients}
          editable
          onUpdate={loadMenu}
        />
      </div>

      {/* Comments */}
      <CommentSection menuId={menuId} comments={comments} onUpdate={loadComments} />

      {/* Delete confirmation modal */}
      <ConfirmModal
        isOpen={showDeleteModal}
        title="Hapus Menu?"
        message={`Menu "${menu.menuName}" beserta semua bahan, vote, dan komentar akan dihapus permanen. Tindakan ini tidak bisa dibatalkan.`}
        confirmText="Ya, Hapus Menu"
        cancelText="Batal"
        danger
        requireType="HAPUS"
        onConfirm={() => { setShowDeleteModal(false); handleDelete(); }}
        onCancel={() => setShowDeleteModal(false)}
      />
    </div>
  );
}
