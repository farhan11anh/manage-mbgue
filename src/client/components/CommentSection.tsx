import { useState, useRef, useEffect } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';

interface Comment {
  id: number;
  userId: number;
  content: string;
  displayName: string;
  username: string;
  avatarUrl?: string | null;
  isEdited: number;
  deletedAt: string | null;
  createdAt: string;
  parentId: number | null;
  replies?: Comment[];
}

interface Props {
  menuId: number;
  comments: Comment[];
  onUpdate: () => void;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'baru saja';
  if (mins < 60) return `${mins} menit lalu`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} jam lalu`;
  const days = Math.floor(hours / 24);
  return `${days} hari lalu`;
}

const GRADIENTS = [
  'from-emerald-400 to-cyan-500',
  'from-violet-500 to-purple-600',
  'from-rose-400 to-pink-600',
  'from-amber-400 to-orange-500',
  'from-sky-400 to-blue-600',
  'from-lime-400 to-green-600',
  'from-fuchsia-400 to-pink-500',
  'from-teal-400 to-emerald-500',
  'from-indigo-400 to-violet-500',
  'from-red-400 to-rose-500',
];

function getGradient(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return GRADIENTS[Math.abs(hash) % GRADIENTS.length];
}

function UserAvatar({ name, url, size = 'sm' }: { name: string; url?: string | null; size?: 'sm' | 'md' }) {
  const sizeClass = size === 'sm' ? 'w-8 h-8 text-xs' : 'w-10 h-10 text-sm';
  if (url) {
    return <img src={url} alt={name} className={`${sizeClass} rounded-full object-cover border-2 border-primary/30 shrink-0`} />;
  }
  const gradient = getGradient(name);
  const initial = name.charAt(0).toUpperCase();
  return (
    <div className={`${sizeClass} rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center font-bold text-white shrink-0 select-none`}>
      {initial}
    </div>
  );
}

function CommentBubble({ comment, menuId, onUpdate, isReply = false }: { comment: Comment; menuId: number; onUpdate: () => void; isReply?: boolean }) {
  const { user } = useAuth();
  const [replying, setReplying] = useState(false);
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState('');
  const isOwner = user?.id === comment.userId;
  const isDeleted = !!comment.deletedAt;

  const handleReply = async () => {
    if (!text.trim()) return;
    await api.replyComment(comment.id, text);
    setText('');
    setReplying(false);
    onUpdate();
  };

  const handleEdit = async () => {
    if (!text.trim()) return;
    await api.editComment(comment.id, text);
    setText('');
    setEditing(false);
    onUpdate();
  };

  const handleDelete = async () => {
    await api.deleteComment(comment.id);
    onUpdate();
  };

  return (
    <div className={`${isReply ? 'ml-8 border-l-2 border-primary/30 pl-4' : ''}`}>
      <div className="flex gap-3 mb-3">
        <UserAvatar name={comment.displayName || '?'} url={comment.avatarUrl} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-sm">{comment.displayName}</span>
            <span className="text-xs text-text-muted">{timeAgo(comment.createdAt)}</span>
            {comment.isEdited === 1 && !isDeleted && <span className="text-xs text-text-muted italic">(diedit)</span>}
          </div>
          {isDeleted ? (
            <p className="text-sm text-text-muted italic">Komentar ini telah dihapus</p>
          ) : editing ? (
            <div className="flex gap-2">
              <input className="input-field text-sm flex-1" value={text} onChange={e => setText(e.target.value)} onKeyDown={e => e.key === 'Enter' && e.ctrlKey && handleEdit()} />
              <button onClick={handleEdit} className="btn-primary text-xs !px-3 !py-1.5">Simpan</button>
              <button onClick={() => setEditing(false)} className="text-text-muted text-xs">Batal</button>
            </div>
          ) : (
            <p className="text-sm text-text-main">{comment.content}</p>
          )}
          {!isDeleted && !editing && (
            <div className="flex gap-3 mt-1">
              {!isReply && (
                <button onClick={() => { setReplying(!replying); setText(''); }} className="text-xs text-text-muted hover:text-primary transition-colors">Balas</button>
              )}
              {isOwner && (
                <>
                  <button onClick={() => { setEditing(true); setText(comment.content); }} className="text-xs text-text-muted hover:text-primary transition-colors">Edit</button>
                  <button onClick={handleDelete} className="text-xs text-text-muted hover:text-danger transition-colors">Hapus</button>
                </>
              )}
            </div>
          )}
          {replying && (
            <div className="flex gap-2 mt-2">
              <input className="input-field text-sm flex-1" placeholder="Tulis balasan..." value={text} onChange={e => setText(e.target.value)} onKeyDown={e => e.key === 'Enter' && e.ctrlKey && handleReply()} />
              <button onClick={handleReply} className="btn-primary text-xs !px-3 !py-1.5">Kirim</button>
            </div>
          )}
        </div>
      </div>
      {comment.replies?.map(reply => (
        <CommentBubble key={reply.id} comment={reply} menuId={menuId} onUpdate={onUpdate} isReply />
      ))}
    </div>
  );
}

export default function CommentSection({ menuId, comments, onUpdate }: Props) {
  const [newComment, setNewComment] = useState('');
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [comments]);

  const handleSubmit = async () => {
    if (!newComment.trim()) return;
    await api.addComment(menuId, newComment);
    setNewComment('');
    onUpdate();
  };

  return (
    <div className="glass-card p-6">
      <h3 className="font-heading font-bold text-lg mb-4">💬 Catatan & Diskusi ({comments.length} komentar)</h3>

      <div className="space-y-1 max-h-96 overflow-y-auto mb-4 pr-2">
        {comments.length === 0 && <p className="text-text-muted text-sm text-center py-4">Belum ada komentar</p>}
        {comments.map(comment => (
          <CommentBubble key={comment.id} comment={comment} menuId={menuId} onUpdate={onUpdate} />
        ))}
        <div ref={endRef} />
      </div>

      <div className="flex gap-2">
        <textarea
          className="input-field text-sm flex-1 resize-none"
          rows={2}
          placeholder="Tulis komentar... (Ctrl+Enter untuk kirim)"
          value={newComment}
          onChange={e => setNewComment(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && e.ctrlKey) handleSubmit(); }}
        />
        <button onClick={handleSubmit} className="btn-primary self-end !py-2">Kirim</button>
      </div>
    </div>
  );
}
