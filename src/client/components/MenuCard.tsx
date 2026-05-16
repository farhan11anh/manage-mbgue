import { Link } from 'react-router-dom';

interface MenuCardProps {
  menu: {
    id: number;
    menuName: string;
    actualMenuName?: string;
    dayOfWeek: string;
    mealType: string;
    status: string;
    description?: string;
    isLateProposal?: boolean;
    isLocked?: boolean;
  };
  votes?: { up: number; down: number };
  commentCount?: number;
  onDelete?: (id: number) => void;
}

export default function MenuCard({ menu, votes, commentCount, onDelete }: MenuCardProps) {
  const statusLabel: Record<string, { class: string; text: string }> = {
    proposed: { class: 'badge-proposed', text: '⏳ Menunggu' },
    approved: { class: 'badge-approved', text: '✅ Disetujui' },
    rejected: { class: 'badge-rejected', text: '❌ Ditolak' },
  };
  const badge = statusLabel[menu.status] ?? statusLabel.proposed;
  const hasActual = !!menu.actualMenuName;

  return (
    <div className="glass-card p-4 hover:border-primary/30 hover:shadow-neon/20 transition-all duration-300 hover:-translate-y-1 relative">
      {menu.isLateProposal && (
        <span className="absolute -top-2 -right-2 px-2 py-0.5 rounded-full text-[10px] font-bold bg-secondary/20 text-secondary border border-secondary/30">
          ⚠️ Telat
        </span>
      )}
      <Link to={`/menus/${menu.id}`} className="block">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1 min-w-0">
            <h3 className={`font-heading font-bold text-lg ${hasActual ? 'line-through text-text-muted/60 text-base' : 'text-text-main'}`}>
              {menu.menuName}
            </h3>
            {hasActual && (
              <h3 className="font-heading font-bold text-lg text-success">
                → {menu.actualMenuName}
              </h3>
            )}
          </div>
          <span className={`${badge.class} shrink-0 ml-2`}>{badge.text}</span>
        </div>
        <p className="text-xs text-text-muted mb-2">{menu.mealType}</p>
        {menu.description && (
          <p className="text-sm text-text-muted mb-3 line-clamp-2">{menu.description}</p>
        )}
        <div className="flex items-center gap-4 text-sm text-text-muted">
          {votes && (
            <>
              <span className="flex items-center gap-1">👍 {votes.up}</span>
              <span className="flex items-center gap-1">👎 {votes.down}</span>
            </>
          )}
          {commentCount !== undefined && (
            <span className="flex items-center gap-1">💬 {commentCount}</span>
          )}
        </div>
      </Link>
      {onDelete && (
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(menu.id); }}
          className="absolute bottom-3 right-3 text-xs text-text-muted hover:text-danger transition-colors"
          title="Hapus menu"
        >
          🗑️
        </button>
      )}
    </div>
  );
}
