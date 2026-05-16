import { useAuth } from '../lib/auth';

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
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return GRADIENTS[Math.abs(hash) % GRADIENTS.length];
}

interface AvatarProps {
  size?: 'sm' | 'md' | 'lg';
  name?: string;
}

export default function Avatar({ size = 'md', name }: AvatarProps) {
  const { user } = useAuth();

  const displayName = name || user?.displayName || '?';

  const sizeClass = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-24 h-24 text-3xl',
  }[size];

  const gradient = getGradient(displayName);
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <div className={`${sizeClass} rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center font-bold text-white shadow-lg select-none`}>
      {initial}
    </div>
  );
}
