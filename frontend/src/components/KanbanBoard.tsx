import { useState, useRef } from 'react';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import type { Tarea, EstadoTarea, Prioridad } from '../types';

const columnas: { key: EstadoTarea; label: string; color: string; glow: string; badge: string }[] = [
  { key: 'PENDIENTE',  label: 'Pendiente',  color: '#6366f1', glow: 'rgba(99,102,241,0.25)',  badge: 'badge-primary' },
  { key: 'EN_PROGRESO',label: 'En Progreso',color: '#f59e0b', glow: 'rgba(245,158,11,0.25)', badge: 'badge-warning' },
  { key: 'EN_REVISION',label: 'En Revisión',color: '#8b5cf6', glow: 'rgba(139,92,246,0.25)', badge: 'badge-primary' },
  { key: 'TERMINADA',  label: 'Terminada',  color: '#10b981', glow: 'rgba(16,185,129,0.25)',  badge: 'badge-success' },
];

const prioridadStyle: Record<Prioridad, { cls: string; dot: string }> = {
  ALTA:  { cls: 'badge-danger',   dot: '#ef4444' },
  MEDIA: { cls: 'badge-warning',  dot: '#f59e0b' },
  BAJA:  { cls: 'badge-success',  dot: '#10b981' },
};

function formatDue(dateStr: string): { label: string; color: string } {
  const d = new Date(dateStr);
  const now = new Date();
  const diffH = (d.getTime() - now.getTime()) / 3600000;
  if (diffH < 0)   return { label: '⚠ Vencida', color: '#ef4444' };
  if (diffH <= 24) return { label: '⏳ Hoy', color: '#f59e0b' };
  if (diffH <= 48) return { label: '⏳ < 48h', color: '#f59e0b' };
  const days = Math.ceil(diffH / 24);
  if (days <= 7) return { label: `📅 en ${days}d`, color: 'var(--muted-color)' };
  return {
    label: `📅 ${d.toLocaleDateString('es', { day: 'numeric', month: 'short' })}`,
    color: 'var(--muted-color)',
  };
}

interface KanbanBoardProps {
  tareas: Tarea[];
  onEstadoChange: (tareaId: string, nuevoEstado: EstadoTarea) => void;
  onTareaClick: (tarea: Tarea) => void;
  showFilter?: boolean;
}

export default function KanbanBoard({ tareas, onEstadoChange, onTareaClick, showFilter = true }: KanbanBoardProps) {
  const { usuario } = useAuth();
  const [dragged, setDragged] = useState<Tarea | null>(null);
  const [dragOver, setDragOver] = useState<EstadoTarea | null>(null);
  const [soloMisTareas, setSoloMisTareas] = useState(false);
  const dragCounter = useRef<Record<string, number>>({});

  const onDrop = (e: React.DragEvent, estado: EstadoTarea) => {
    e.preventDefault();
    if (dragged && dragged.estado !== estado) {
      onEstadoChange(dragged.id, estado);
      if (estado === 'TERMINADA') {
        confetti({ particleCount: 120, spread: 75, origin: { y: 0.6 }, colors: ['#6366f1','#10b981','#f59e0b'] });
      }
    }
    setDragged(null); setDragOver(null);
  };

  const displayTareas = soloMisTareas ? tareas.filter(t => t.asignadoAId === usuario?.id) : tareas;

  return (
    <div>
      {showFilter && (
        <div className="flex justify-end mb-4">
          <label className="flex items-center gap-2 cursor-pointer text-sm" style={{ color: 'var(--text-color)' }}>
            <input type="checkbox" checked={soloMisTareas} onChange={e => setSoloMisTareas(e.target.checked)}
              className="w-4 h-4 rounded border-dark-border bg-dark-bg text-primary-500 focus:ring-primary-500" />
            Solo mis tareas
          </label>
        </div>
      )}
      <div className="relative">
        <div className="flex lg:grid lg:grid-cols-4 gap-5 overflow-x-auto pb-6 snap-x snap-mandatory scrollbar-thin">
          {columnas.map(col => {
          const colTareas = displayTareas.filter(t => t.estado === col.key).sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0));
          const isOver = dragOver === col.key;

        return (
          <div key={col.key}
            onDragEnter={e => {
              e.preventDefault();
              dragCounter.current[col.key] = (dragCounter.current[col.key] || 0) + 1;
              setDragOver(col.key);
            }}
            onDragOver={e => { e.preventDefault(); }}
            onDragLeave={() => {
              dragCounter.current[col.key] = (dragCounter.current[col.key] || 1) - 1;
              if (dragCounter.current[col.key] <= 0) {
                setDragOver(null);
                dragCounter.current[col.key] = 0;
              }
            }}
            onDrop={e => {
              dragCounter.current[col.key] = 0;
              onDrop(e, col.key);
            }}
            className="rounded-2xl p-4 transition-all duration-300 min-w-[85vw] sm:min-w-[45vw] lg:min-w-0 snap-center shrink-0"
            style={{
              background: isOver ? `${col.color}0d` : 'var(--glass-bg)',
              backdropFilter: 'blur(24px)',
              border: `1px solid ${isOver ? col.color + '55' : 'var(--glass-border)'}`,
              boxShadow: isOver ? `0 0 32px ${col.glow}, 0 0 64px ${col.glow}40` : 'var(--glass-shadow)',
              borderTop: `3px solid ${col.color}`,
            }}
          >
            {/* Column header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: col.color }} />
                <h3 className="font-semibold text-sm" style={{ color: 'var(--text-color)' }}>{col.label}</h3>
              </div>
              <span className={`badge ${col.badge}`}>{colTareas.length}</span>
            </div>

            {/* Cards */}
            <div className="space-y-3 min-h-[200px]">
              <AnimatePresence>
                {colTareas.map((tarea, i) => {
                  const due = formatDue(tarea.fechaLimite);
                  const isOverdue = due.color === '#ef4444';
                  const pStyle = prioridadStyle[tarea.prioridad];

                  return (
                    <motion.div
                      key={tarea.id}
                      layout
                      initial={{ opacity: 0, y: 16, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ delay: i * 0.04, type: 'spring', stiffness: 320, damping: 28 }}
                      draggable
                      onDragStart={() => setDragged(tarea)}
                      onDragEnd={() => { setDragged(null); setDragOver(null); }}
                      onClick={() => onTareaClick(tarea)}
                      className={`group rounded-xl p-4 cursor-grab active:cursor-grabbing transition-all ${isOverdue ? 'pulse-high' : ''}`}
                      style={{
                        background: 'var(--glass-bg)',
                        backdropFilter: 'blur(16px)',
                        border: isOverdue
                          ? '1px solid rgba(239,68,68,0.4)'
                          : '1px solid var(--glass-border)',
                        boxShadow: dragged?.id === tarea.id ? '0 16px 32px rgba(0,0,0,0.3)' : 'none',
                        opacity: dragged && dragged.id !== tarea.id ? 0.6 : 1,
                      }}
                    >
                      {/* Top */}
                      <div className="flex items-start justify-between mb-2 gap-2">
                        <h4 className="font-medium text-sm leading-snug line-clamp-2 group-hover:text-primary-400 transition-colors"
                          style={{ color: 'var(--text-color)' }}>
                          {tarea.nombre}
                        </h4>
                        <span className={`badge ${pStyle.cls} flex-shrink-0 text-[10px]`}>{tarea.prioridad}</span>
                      </div>

                      <p className="text-xs line-clamp-2 mb-3" style={{ color: 'var(--muted-color)' }}>{tarea.descripcion}</p>

                      {/* Footer */}
                      <div className="flex items-center justify-between">
                        {tarea.asignadoA ? (
                          <div className="flex items-center gap-1.5">
                            <div className="w-5 h-5 rounded-full text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0"
                              style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
                              {tarea.asignadoA.nombre.charAt(0)}
                            </div>
                            <span className="text-xs truncate max-w-[80px]" style={{ color: 'var(--muted-color)' }}>
                              {tarea.asignadoA.nombre}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs italic" style={{ color: 'var(--muted-color)' }}>Sin asignar</span>
                        )}

                        <span className="text-xs font-medium" style={{ color: due.color }}>{due.label}</span>
                      </div>

                      {/* Comments / files indicator */}
                      {((tarea._count?.comentarios ?? 0) > 0 || (tarea._count?.archivos ?? 0) > 0) && (
                        <div className="flex gap-3 mt-2.5 pt-2.5" style={{ borderTop: '1px solid var(--glass-border)' }}>
                          {(tarea._count?.comentarios ?? 0) > 0 && (
                            <span className="text-xs" style={{ color: 'var(--muted-color)' }}>💬 {tarea._count!.comentarios}</span>
                          )}
                          {(tarea._count?.archivos ?? 0) > 0 && (
                            <span className="text-xs" style={{ color: 'var(--muted-color)' }}>📎 {tarea._count!.archivos}</span>
                          )}
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </AnimatePresence>

              {colTareas.length === 0 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="flex items-center justify-center h-32 rounded-xl border-2 border-dashed transition-colors"
                  style={{
                    borderColor: isOver ? col.color : 'var(--glass-border)',
                    background: isOver ? `${col.color}08` : 'transparent',
                  }}>
                  <p className="text-sm" style={{ color: 'var(--muted-color)' }}>
                    {isOver ? 'Soltar aquí' : 'Sin tareas'}
                  </p>
                </motion.div>
              )}
            </div>
          </div>
        );
      })}
        </div>
        {/* Indicador sutil de scroll en móvil */}
        <div className="lg:hidden absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary-500/30 to-transparent rounded-full mx-8" />
      </div>
    </div>
  );
}
