import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../lib/api';
import VoteButton from '../components/VoteButton';
import IngredientTable from '../components/IngredientTable';
import CommentSection from '../components/CommentSection';

export default function MenuDetailPage() {
  const { id } = useParams();
  const menuId = parseInt(id!);
  const [menu, setMenu] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadMenu = useCallback(async () => {
    try {
      const res = await api.getMenu(menuId);
      setMenu(res.menu);
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

  if (loading) return <div className="text-center py-20 text-text-muted">Loading...</div>;
  if (!menu) return <div className="text-center py-20 text-danger">Menu tidak ditemukan</div>;

  const statusBadge = {
    proposed: 'badge-proposed',
    approved: 'badge-approved',
    rejected: 'badge-rejected',
  }[menu.status as string] ?? 'badge-proposed';

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="glass-card p-6">
        <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
          <div>
            <h1 className="font-heading font-extrabold text-2xl">{menu.menuName}</h1>
            <p className="text-text-muted text-sm mt-1">
              {menu.dayOfWeek} · {menu.mealType} · Oleh <span className="text-primary">{menu.proposerName}</span>
            </p>
          </div>
          <span className={statusBadge}>{menu.status}</span>
        </div>
        {menu.description && (
          <p className="text-text-muted mb-4">{menu.description}</p>
        )}
        <VoteButton menuId={menuId} votes={menu.votes} onVoted={loadMenu} />
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
    </div>
  );
}
