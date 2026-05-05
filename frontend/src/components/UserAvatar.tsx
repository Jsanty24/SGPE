import { useState } from 'react';

const AVATAR_COLORS = [
  'linear-gradient(135deg,#6366f1,#8b5cf6)',
  'linear-gradient(135deg,#10b981,#059669)',
  'linear-gradient(135deg,#f59e0b,#d97706)',
  'linear-gradient(135deg,#ef4444,#dc2626)',
  'linear-gradient(135deg,#3b82f6,#2563eb)',
  'linear-gradient(135deg,#ec4899,#be185d)',
  'linear-gradient(135deg,#14b8a6,#0f766e)',
];

export function getAvatarColor(name: string) {
  return AVATAR_COLORS[name.length % AVATAR_COLORS.length];
}

interface UserAvatarProps {
  usuario: { nombre: string; avatar?: string | null; id?: string } | null;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClasses = {
  sm: 'w-7 h-7 text-xs',
  md: 'w-9 h-9 text-sm',
  lg: 'w-20 h-20 text-3xl',
};

export default function UserAvatar({ usuario, size = 'md', className = '' }: UserAvatarProps) {
  const [imgError, setImgError] = useState(false);

  if (!usuario) {
    return (
      <div className={`${sizeClasses[size]} rounded-full flex items-center justify-center text-white font-bold ${className}`}
        style={{ background: 'linear-gradient(135deg,#6b7280,#4b5563)' }}>
        ?
      </div>
    );
  }

  const initials = usuario.nombre?.charAt(0)?.toUpperCase() || '?';
  const bg = getAvatarColor(usuario.nombre || '');

  if (usuario.avatar && !imgError) {
    return (
      <img src={usuario.avatar} alt={usuario.nombre}
        className={`${sizeClasses[size]} rounded-full object-cover ${className}`}
        style={{ minWidth: 'unset' }}
        onError={() => setImgError(true)} />
    );
  }

  return (
    <div className={`${sizeClasses[size]} rounded-full flex items-center justify-center text-white font-bold ${className}`}
      style={{ background: bg }}>
      {initials}
    </div>
  );
}
