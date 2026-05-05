import { motion, AnimatePresence } from 'framer-motion';
import { useNotificaciones } from '../hooks/useNotificaciones';
import LoadingSkeleton from '../components/LoadingSkeleton';

const tipoIcon: Record<string, string> = {
  TAREA_ASIGNADA: '📋',
  COMENTARIO:     '💬',
  ESTADO_CAMBIO:  '🔄',
  VENCIMIENTO:    '⚠️',
  SISTEMA:        '🔔',
  default:        '🔔',
};

function timeAgo(dateStr: string): string {
  const d = new Date(dateStr);
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)  return 'Ahora mismo';
  if (mins < 60) return `Hace ${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `Hace ${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days < 7)  return `Hace ${days}d`;
  return d.toLocaleDateString('es', { day: 'numeric', month: 'short' });
}

export default function NotificacionesPage() {
  const { notificaciones, loading, markRead, markAllRead } = useNotificaciones();

  if (loading) return <LoadingSkeleton />;

  const noLeidas = notificaciones.filter(n => !n.leida).length;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-color)' }}>Notificaciones</h1>
          <p className="text-sm" style={{ color: 'var(--muted-color)' }}>
            {noLeidas > 0 ? `${noLeidas} sin leer` : 'Todas leídas ✓'}
          </p>
        </div>
        {noLeidas > 0 && (
          <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
            onClick={markAllRead}
            className="px-4 py-2 rounded-xl text-sm font-medium transition-all"
            style={{ border: '1px solid rgba(99,102,241,0.4)', color: 'var(--color-primary)', background: 'rgba(99,102,241,0.08)' }}>
            ✓ Marcar todas
          </motion.button>
        )}
      </motion.div>

      {/* List */}
      <div className="space-y-2">
        <AnimatePresence>
          {notificaciones.length === 0 ? (
            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="text-center py-20 glass-card rounded-2xl">
              <div className="text-6xl mb-4">🔔</div>
              <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-color)' }}>Sin notificaciones</h3>
              <p className="text-sm" style={{ color: 'var(--muted-color)' }}>Aquí aparecerán tus alertas y notificaciones</p>
            </motion.div>
          ) : (
            notificaciones.map((n, i) => {
              const tipo = (n as any).tipo || 'default';
              const icon = tipoIcon[tipo] || tipoIcon.default;
              return (
                <motion.div key={n.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: i * 0.03, type: 'spring', stiffness: 300, damping: 28 }}
                  onClick={() => !n.leida && markRead(n.id)}
                  className="group cursor-pointer rounded-2xl p-4 transition-all"
                  style={{
                    background: !n.leida ? 'rgba(99,102,241,0.06)' : 'var(--glass-bg)',
                    backdropFilter: 'blur(20px)',
                    border: !n.leida
                      ? '1px solid rgba(99,102,241,0.3)'
                      : '1px solid var(--glass-border)',
                    borderLeft: !n.leida ? '3px solid var(--color-primary)' : '1px solid var(--glass-border)',
                  }}
                >
                  <div className="flex items-start gap-3">
                    {/* Icon badge */}
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                      style={{ background: !n.leida ? 'rgba(99,102,241,0.15)' : 'var(--glass-bg)' }}>
                      {icon}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm leading-snug"
                        style={{ color: !n.leida ? 'var(--text-color)' : 'var(--muted-color)', fontWeight: !n.leida ? 500 : 400 }}>
                        {n.mensaje}
                      </p>
                      <p className="text-xs mt-1" style={{ color: 'var(--muted-color)' }}>
                        {timeAgo(n.createdAt)}
                      </p>
                    </div>

                    {!n.leida && (
                      <span className="w-2 h-2 rounded-full flex-shrink-0 mt-2"
                        style={{ background: 'var(--color-primary)', boxShadow: '0 0 6px rgba(99,102,241,0.6)' }} />
                    )}
                  </div>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
