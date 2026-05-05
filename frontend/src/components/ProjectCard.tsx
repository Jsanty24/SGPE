import { useRef, useState, useCallback } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';

interface ProjectCardProps {
  nombre: string;
  descripcion: string;
  estado: string;
  totalTareas: number;
  completadas: number;
  gerente: string;
  cliente?: string;
  miembros?: { nombre: string }[];
  fechaFin?: string;
  onClick: () => void;
}

const estadoMap: Record<string, { label: string; cls: string }> = {
  ACTIVO:   { label: 'Activo',   cls: 'badge-success' },
  EN_PAUSA: { label: 'En Pausa', cls: 'badge-warning' },
  CERRADO:  { label: 'Cerrado',  cls: 'badge-gray' },
};

function daysUntil(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  const diff = Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (diff < 0) return { label: 'Vencido', color: '#ef4444' };
  if (diff === 0) return { label: 'Hoy', color: '#f59e0b' };
  if (diff <= 7) return { label: `${diff}d`, color: '#f59e0b' };
  return { label: `${diff}d`, color: 'var(--muted-color)' };
}

const AVATAR_COLORS = [
  'linear-gradient(135deg,#6366f1,#8b5cf6)',
  'linear-gradient(135deg,#10b981,#059669)',
  'linear-gradient(135deg,#f59e0b,#d97706)',
  'linear-gradient(135deg,#ef4444,#dc2626)',
  'linear-gradient(135deg,#3b82f6,#2563eb)',
];

export default function ProjectCard({
  nombre, descripcion, estado, totalTareas, completadas, gerente,
  cliente, miembros = [], fechaFin, onClick,
}: ProjectCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const rotX = useMotionValue(0);
  const rotY = useMotionValue(0);
  const springX = useSpring(rotX, { stiffness: 280, damping: 26 });
  const springY = useSpring(rotY, { stiffness: 280, damping: 26 });

  const onMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const r = ref.current.getBoundingClientRect();
    rotX.set(((e.clientY - r.top - r.height / 2) / r.height) * -10);
    rotY.set(((e.clientX - r.left - r.width / 2) / r.width) * 10);
  }, [rotX, rotY]);

  const onLeave = useCallback(() => { rotX.set(0); rotY.set(0); }, [rotX, rotY]);

  const pct = totalTareas > 0 ? Math.round((completadas / totalTareas) * 100) : 0;
  const estadoInfo = estadoMap[estado] ?? { label: estado, cls: 'badge-gray' };
  const due = fechaFin ? daysUntil(fechaFin) : null;
  const visibleMembers = miembros.slice(0, 4);
  const extra = miembros.length - 4;

  return (
    <motion.div
      ref={ref}
      onClick={onClick}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      initial={{ opacity: 0, y: 28, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      whileHover={{ scale: 1.01 }}
      style={{
        rotateX: springX,
        rotateY: springY,
        transformStyle: 'preserve-3d',
        perspective: 1000,
      }}
      className="glass-card rounded-2xl p-5 cursor-pointer group"
    >
      {/* Top decoration */}
      <div className="absolute top-0 right-0 w-28 h-28 rounded-3xl blur-3xl opacity-15 pointer-events-none transition-opacity group-hover:opacity-25"
        style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }} />

      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1 min-w-0 pr-2">
            <h3 className="font-bold text-base leading-tight line-clamp-1 group-hover:text-primary-400 transition-colors"
              style={{ color: 'var(--text-color)' }}>
              {nombre}
            </h3>
            {cliente && (
              <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--muted-color)' }}>
                🏢 {cliente}
              </p>
            )}
          </div>
          <span className={`badge ${estadoInfo.cls} flex-shrink-0`}>{estadoInfo.label}</span>
        </div>

        {/* Description */}
        <p className="text-sm line-clamp-2 mb-4" style={{ color: 'var(--muted-color)' }}>{descripcion}</p>

        {/* Progress */}
        <div className="mb-4">
          <div className="flex justify-between text-xs mb-1.5">
            <span style={{ color: 'var(--muted-color)' }}>Progreso</span>
            <span className="font-semibold" style={{ color: 'var(--text-color)' }}>{pct}%</span>
          </div>
          <div className="progress-track">
            <motion.div
              className="progress-fill"
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 1.2, ease: 'easeOut', delay: 0.3 }}
            />
          </div>
          <p className="text-xs mt-1" style={{ color: 'var(--muted-color)' }}>
            {completadas}/{totalTareas} tareas completadas
          </p>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between">
          {/* Stacked avatars */}
          <div className="flex items-center gap-2">
            <div className="avatar-stack">
              {/* Gerente always first */}
              <div className="avatar-item" title={gerente} style={{ background: AVATAR_COLORS[0] }}>
                {gerente?.charAt(0) || '?'}
              </div>
              {visibleMembers.map((m, i) => (
                <div key={i} className="avatar-item" title={m.nombre}
                  style={{ background: AVATAR_COLORS[(i + 1) % AVATAR_COLORS.length] }}>
                  {m.nombre?.charAt(0) || '?'}
                </div>
              ))}
              {extra > 0 && (
                <div className="avatar-item" style={{ background: 'rgba(99,102,241,0.3)' }}>
                  +{extra}
                </div>
              )}
            </div>
          </div>

          {/* Due date */}
          {due && (
            <span className="text-xs font-medium flex items-center gap-1" style={{ color: due.color }}>
              📅 {due.label}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}
