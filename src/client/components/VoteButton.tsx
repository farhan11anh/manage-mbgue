import { useState } from 'react';
import { api } from '../lib/api';

interface VoteButtonProps {
  menuId: number;
  votes: { up: number; down: number };
  onVoted: () => void;
}

export default function VoteButton({ menuId, votes, onVoted }: VoteButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleVote = async (type: 'up' | 'down') => {
    setLoading(true);
    try {
      await api.vote(menuId, type);
      onVoted();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={() => handleVote('up')}
        disabled={loading}
        className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-success/10 text-success hover:bg-success/20 transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-50"
      >
        <span className="text-lg">👍</span>
        <span className="font-semibold">{votes.up}</span>
      </button>
      <button
        onClick={() => handleVote('down')}
        disabled={loading}
        className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-danger/10 text-danger hover:bg-danger/20 transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-50"
      >
        <span className="text-lg">👎</span>
        <span className="font-semibold">{votes.down}</span>
      </button>
    </div>
  );
}
