import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { proyectoService } from '../services/apiService';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import ProjectCard from '../components/ProjectCard';
import LoadingSkeleton from '../components/LoadingSkeleton';
import type { Proyecto } from '../types';

const ESTADOS = ['TODOS', 'ACTIVO', 'EN_PAUSA', 'CERRADO'] as const;
const VIEWS   = ['grid', 'lista'] as const;

type Estado = typeof ESTADOS[number];
type View   = typeof VIEWS[number];

const estadoColors: Record<string, string> = {
  ACTIVO: 'badge-success', EN_PAUSA: 'badge-warning', CERRADO: 'badge-gray',
};

export default function ProyectosListPage() {
  const navigate = useNavigate();
  const { usuario } = useAuth();
  const { error: toastError } = useToast();
  const [proyectos, setProyectos] = useState<Proyecto[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState<Estado>('TODOS');
  const [search, setSearch] = useState('');
  const [view, setView] = useState<View>('grid');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const ITEMS_PER_PAGE = 12;

  const fetchProyectos = useCallback(async () => {
    try {
      const { data } = await proyectoService.getAll(page, ITEMS_PER_PAGE);
      if (data.success && data.data) {
        setProyectos(data.data);
        setTotalPages(data.totalPages || 1);
      }
    } catch {
      toastError('Error', 'No se pudieron cargar los proyectos');
    }
    finally { setLoading(false); }
  }, [page]);

  useEffect(() => { fetchProyectos(); }, [fetchProyectos]);

  if (loading) return <LoadingSkeleton />;

  const filtrados = proyectos
    .filter(p => filtro === 'TODOS' || p.estado === filtro)
    .filter(p => !search || p.nombre.toLowerCase().includes(search.toLowerCase())
      || p.descripcion?.toLowerCase().includes(search.toLowerCase())
      || (p.cliente || '').toLowerCase().includes(search.toLowerCase()));

  const isAdmin = usuario?.rol === 'ADMIN' || usuario?.rol === 'GERENTE';

  return (
    <div>
      {/* ── Header ── */}
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-color)' }}>Proyectos</h1>
          <p className="text-sm" style={{ color: 'var(--muted-color)' }}>
            {proyectos.length} proyecto{proyectos.length !== 1 ? 's' : ''} en total
          </p>
        </div>
        {isAdmin && (
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/proyectos/nuevo')}
            className="px-5 py-2.5 rounded-xl text-white font-semibold text-sm shimmer-btn flex items-center gap-2">
            <span>+</span> Nuevo Proyecto
          </motion.button>
        )}
      </motion.div>

      {/* ── Toolbar ── */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.07 }}
        className="flex flex-col sm:flex-row gap-4 mb-6">
        {/* Search */}
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm pointer-events-none z-10" style={{ color: 'var(--muted-color)' }}>🔍</span>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar proyectos, clientes..."
            className="glass-input"
            style={{ paddingLeft: '2.5rem' }}
          />
        </div>

        {/* Estado filter pills */}
        <div className="flex gap-2 flex-wrap">
          {ESTADOS.map(f => (
            <button key={f} onClick={() => setFiltro(f)}
              className={`filter-pill ${filtro === f ? 'active' : ''}`}>
              {f.replace('_', ' ')}
            </button>
          ))}
        </div>

        {/* View toggle */}
        <div className="flex rounded-xl overflow-hidden border" style={{ borderColor: 'var(--glass-border)' }}>
          {VIEWS.map(v => (
            <button key={v} onClick={() => setView(v)}
              className="px-3 py-2 text-sm transition-all"
              style={{
                background: view === v ? 'rgba(99,102,241,0.2)' : 'transparent',
                color: view === v ? '#818cf8' : 'var(--muted-color)',
              }}>
              {v === 'grid' ? '⊞' : '☰'}
            </button>
          ))}
        </div>
      </motion.div>

      {/* ── Content ── */}
      <AnimatePresence mode="wait">
        {filtrados.length === 0 ? (
          <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="text-center py-20 glass-card rounded-2xl">
            <div className="text-6xl mb-4">📁</div>
            <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-color)' }}>
              {search ? 'Sin resultados' : 'No hay proyectos'}
            </h3>
            <p className="text-sm" style={{ color: 'var(--muted-color)' }}>
              {search ? `No coincide ningún proyecto con "${search}"` :
                isAdmin ? 'Crea tu primer proyecto para comenzar' : 'Aún no eres miembro de ningún proyecto'}
            </p>
          </motion.div>
        ) : view === 'grid' ? (
          <motion.div key="grid" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtrados.map((p, i) => {
              const total = (p.tareas || []).length;
              const completadas = (p.tareas || []).filter(t => t.estado === 'TERMINADA').length;
              return (
                <motion.div key={p.id} initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}>
                  <ProjectCard
                    nombre={p.nombre}
                    descripcion={p.descripcion}
                    estado={p.estado}
                    totalTareas={total}
                    completadas={completadas}
                    gerente={p.gerente?.nombre || 'Sin Gerente'}
                    cliente={p.cliente}
                    miembros={(p.miembros || []).map((m: any) => ({ 
                      nombre: m.usuario?.nombre || 'Usuario' 
                    }))}
                    fechaFin={p.fechaFin}
                    onClick={() => navigate(`/proyectos/${p.id}`)}
                  />
                </motion.div>
              );
            })}
          </motion.div>
        ) : (
          /* ── Lista view ── */
          <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="glass-table-container">
            <table className="glass-table">
              <thead>
                <tr>
                  <th>Proyecto</th>
                  <th>Estado</th>
                  <th>Progreso</th>
                  <th>Gerente</th>
                  <th>Fecha fin</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {filtrados.map((p, i) => {
                    const total = (p.tareas || []).length;
                    const ok = (p.tareas || []).filter(t => t.estado === 'TERMINADA').length;
                    const pct = total ? Math.round((ok / total) * 100) : 0;
                    return (
                      <motion.tr key={p.id}
                        initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0 }} transition={{ delay: i * 0.04 }}
                        onClick={() => navigate(`/proyectos/${p.id}`)}
                        style={{ cursor: 'pointer' }}>
                        <td>
                          <p className="font-semibold" style={{ color: 'var(--text-color)' }}>{p.nombre}</p>
                          {p.cliente && <p className="text-xs" style={{ color: 'var(--muted-color)' }}>🏢 {p.cliente}</p>}
                        </td>
                        <td><span className={`badge ${estadoColors[p.estado] || 'badge-gray'}`}>{p.estado.replace('_', ' ')}</span></td>
                        <td>
                          <div className="flex items-center gap-2 min-w-[130px]">
                            <div className="progress-track flex-1">
                              <motion.div className="progress-fill" initial={{ width: 0 }}
                                animate={{ width: `${pct}%` }} transition={{ duration: 0.8, ease: 'easeOut' }} />
                            </div>
                            <span className="text-xs font-semibold" style={{ color: 'var(--muted-color)' }}>{pct}%</span>
                          </div>
                        </td>
                        <td>
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold"
                              style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
                              {p.gerente?.nombre?.charAt(0) || '?'}
                            </div>
                            <span className="text-sm" style={{ color: 'var(--text-color)' }}>{p.gerente?.nombre || 'Sin Gerente'}</span>
                          </div>
                        </td>
                        <td>
                          <span className="text-sm" style={{ color: 'var(--muted-color)' }}>
                            {p.fechaFin ? new Date(p.fechaFin).toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                          </span>
                        </td>
                        <td>
                          {isAdmin && (
                            <button onClick={e => { e.stopPropagation(); navigate(`/proyectos/${p.id}/editar`); }}
                              className="text-xs px-3 py-1.5 rounded-lg transition-colors"
                              style={{ color: 'var(--muted-color)', border: '1px solid var(--glass-border)', background: 'transparent' }}>
                              ✏️ Editar
                            </button>
                          )}
                        </td>
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
              </tbody>
            </table>
          </motion.div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 mt-8">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}
              className="px-4 py-2 rounded-xl text-sm font-medium transition-all disabled:opacity-30"
              style={{ border: '1px solid var(--glass-border)', color: 'var(--text-color)' }}>
              ← Anterior
            </button>
            <span className="text-sm" style={{ color: 'var(--muted-color)' }}>
              Página {page} de {totalPages}
            </span>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
              className="px-4 py-2 rounded-xl text-sm font-medium transition-all disabled:opacity-30"
              style={{ border: '1px solid var(--glass-border)', color: 'var(--text-color)' }}>
              Siguiente →
            </button>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
