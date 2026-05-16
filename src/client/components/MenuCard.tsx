import { Link } from 'react-router-dom';

interface MenuCardProps {
  menu: {
    id: number;
    menuName: string;
    dayOfWeek: string;
    mealType: string;
    status: string;
    description?: string;
  };
  votes?: { up: number; down: number };
  commentCount?: number;
}

export default function MenuCard({ menu, votes, commentCount }: MenuCardProps) {
  const statusBadge = {
    proposed: 'badge-proposed',
    approved: 'badge-approved',
    rejected: 'badge-rejected',
  }[menu.status] ?? 'badge-proposed';

  return (
    <Link to={`/menus/${menu.id}`} className="block">
      <div className="glass-card p-4 hover:border-primary/30 hover:shadow-neon/20 transition-all duration-300 hover:-translate-y-1">
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-heading font-bold text-lg text-text-main">{menu.menuName}</h3>
          <span className={statusBadge}>{menu.status}</span>
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
      </div>
    </Link>
  );
}
