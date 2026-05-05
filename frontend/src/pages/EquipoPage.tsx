import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usuarioService } from '../services/apiService';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import LoadingSkeleton from '../components/LoadingSkeleton';
import UserAvatar, { getAvatarColor } from '../components/UserAvatar';
import type { Usuario } from '../types';

const ROLS = ['TODOS', 'ADMIN', 'GERENTE', 'MIEMBRO', 'CLIENTE', 'VIEWER'] as const;
type RolFilter = typeof ROLS[number];

const rolColors: Record<string, string> = {
  ADMIN:    'badge-danger',
  GERENTE:  'badge-warning',
  MIEMBRO:  'badge-primary',
  CLIENTE:  'badge-gray',
  VIEWER:   'badge-gray',
};

const ESTADO_COLORS: Record<string, string> = {
  ACTIVO: '#10b981',
  AUSENTE: '#f59e0b',
  NO_MOLESTAR: '#ef4444',
  INACTIVO: '#6b7280',
};

const AVATAR_COLORS = [
  'linear-gradient(135deg,#6366f1,#8b5cf6)',
  'linear-gradient(135deg,#10b981,#059669)',
  'linear-gradient(135deg,#f59e0b,#d97706)',
  'linear-gradient(135deg,#ef4444,#dc2626)',
  'linear-gradient(135deg,#3b82f6,#2563eb)',
  'linear-gradient(135deg,#8b5cf6,#7c3aed)',
];

export default function EquipoPage() {
  const { error: toastError, presenciaUsuarios } = useAuth() as any;
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading]   = useState(true);
  const [filtroRol, setFiltroRol] = useState<RolFilter>('TODOS');
  const [search, setSearch]     = useState('');

  const fetch = useCallback(async () => {
    try {
      const { data } = await usuarioService.getAll();
      if (data.success && data.data) setUsuarios(data.data);
    } catch {
      toastError('Error', 'No se pudo cargar el equipo');
    }
    finally { setLoading(false); }
  }, [toastError]);

  useEffect(() => { fetch(); }, [fetch]);

  const timeSince = (dateStr: string | undefined) => {
    if (!dateStr) return '';
    const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
    if (diff < 60) return 'Ahora';
    if (diff < 3600) return `hace ${Math.floor(diff / 60)} min`;
    if (diff < 86400) return `hace ${Math.floor(diff / 3600)}h`;
    return new Date(dateStr).toLocaleDateString();
  };

  if (loading) return <LoadingSkeleton />;

  const filtrados = usuarios
    .filter(u => filtroRol === 'TODOS' || u.rol === filtroRol)
    .filter(u => !search || u.nombre.toLowerCase().includes(search.toLowerCase()) ||
      u.correo.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      const orden = { ACTIVO: 0, AUSENTE: 1, NO_MOLESTAR: 2, INACTIVO: 3 };
      return (orden[a.estado || 'ACTIVO'] || 0) - (orden[b.estado || 'ACTIVO'] || 0);
    });

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-color)' }}>Equipo</h1>
          <p className="text-sm" style={{ color: 'var(--muted-color)' }}>
            {usuarios.length} miembro{usuarios.length !== 1 ? 's' : ''} en el sistema
          </p>
        </div>
      </motion.div>

      {/* KPI mini */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 }}
        className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {(['ADMIN','GERENTE','MIEMBRO','CLIENTE','VIEWER'] as const).map(rol => {
          const count = usuarios.filter(u => u.rol === rol).length;
          return (
            <div key={rol} className="glass-card rounded-xl p-4 text-center">
              <p className="text-2xl font-black" style={{ color: 'var(--text-color)' }}>{count}</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--muted-color)' }}>{rol}</p>
            </div>
          );
        })}
      </motion.div>

      {/* Toolbar */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm pointer-events-none z-10" style={{ color: 'var(--muted-color)' }}>🔍</span>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nombre o correo..."
            className="glass-input"
            style={{ paddingLeft: '2.5rem' }} />
        </div>
        {/* Rol filter */}
        <div className="flex gap-2 flex-wrap">
          {ROLS.map(r => (
            <button key={r} onClick={() => setFiltroRol(r)}
              className={`filter-pill ${filtroRol === r ? 'active' : ''}`}>
              {r}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Grid */}
      <AnimatePresence mode="wait">
        {filtrados.length === 0 ? (
          <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="text-center py-20 glass-card rounded-2xl">
            <div className="text-6xl mb-4">👥</div>
            <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-color)' }}>Sin resultados</h3>
            <p className="text-sm" style={{ color: 'var(--muted-color)' }}>No hay usuarios con ese filtro</p>
          </motion.div>
        ) : (
          <motion.div key="grid" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="grid gap-4"
            style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gridAutoRows: '1fr' }}>
            {filtrados.map((u, i) => {
              const tareasTotal = u._count?.tareasAsignadas ?? 0;
              const proyectosN  = u._count?.proyectos ?? 0;
              const bgGrad      = getAvatarColor(u.nombre);
              const presencia = presenciaUsuarios[u.id];
              const estadoReal = presencia?.estado || u.estado || 'ACTIVO';
              const lastSeen = presencia?.ultimaConexion || u.ubicacionActualizada;

              return (
                <motion.div key={u.id}
                  initial={{ opacity: 0, y: 24, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ delay: i * 0.04, type: 'spring', stiffness: 280, damping: 24 }}
                  whileHover={{ scale: 1.02, y: -2 }}
                  className="glass-card rounded-2xl p-5 text-center relative overflow-hidden group flex flex-col justify-between"
                  style={{ minHeight: '220px' }}>
                  {/* Glow */}
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-24 h-24 rounded-full blur-2xl opacity-15 transition-opacity group-hover:opacity-25"
                    style={{ background: bgGrad }} />

                  {/* Avatar */}
                  <div className="relative mx-auto mb-3 inline-block">
                    <UserAvatar usuario={u} size="lg" />
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2"
                      style={{ background: ESTADO_COLORS[estadoReal] || '#6b7280', borderColor: 'var(--surface-color)' }}
                      title={estadoReal === 'ACTIVO' ? 'En línea' : estadoReal === 'INACTIVO' ? 'Desconectado' : estadoReal} />
                  </div>

                  <h3 className="font-bold text-base mb-0.5" style={{ color: 'var(--text-color)' }}>{u.nombre}</h3>
                  <p className="text-xs mb-2 truncate" style={{ color: 'var(--muted-color)' }}>{u.correo}</p>
                  <span className={`badge ${rolColors[u.rol] || 'badge-gray'} mb-3`}>{u.rol}</span>
                  <p className="text-xs mb-2" style={{ color: estadoReal === 'ACTIVO' ? 'var(--color-success)' : 'var(--muted-color)' }}>
                    {estadoReal === 'ACTIVO' ? '🟢 En línea' : estadoReal !== 'INACTIVO' ? `🟡 ${estadoReal}` : `⚫ ${timeSince(lastSeen)}`}
                  </p>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-2 mt-3" style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '12px' }}>
                    <div>
                      <p className="text-lg font-black" style={{ color: 'var(--text-color)' }}>{tareasTotal}</p>
                      <p className="text-xs" style={{ color: 'var(--muted-color)' }}>Tareas</p>
                    </div>
                    <div>
                      <p className="text-lg font-black" style={{ color: 'var(--text-color)' }}>{proyectosN}</p>
                      <p className="text-xs" style={{ color: 'var(--muted-color)' }}>Proyectos</p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
