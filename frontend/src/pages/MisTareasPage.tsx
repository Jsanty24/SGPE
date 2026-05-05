import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { tareaService } from '../services/apiService';
import { useToast } from '../context/ToastContext';
import KanbanBoard from '../components/KanbanBoard';
import LoadingSkeleton from '../components/LoadingSkeleton';
import type { Tarea, EstadoTarea } from '../types';

export default function MisTareasPage() {
  const navigate = useNavigate();
  const { error: toastError } = useToast();
  const [tareas, setTareas] = useState<Tarea[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTareas = useCallback(async () => {
    try {
      const { data } = await tareaService.getMyTasks();
      if (data.success && data.data) setTareas(data.data);
    } catch {
      toastError('Error', 'No se pudieron cargar tus tareas');
    }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchTareas(); }, [fetchTareas]);

  const onEstadoChange = async (tareaId: string, nuevoEstado: EstadoTarea) => {
    setTareas(prev => prev.map(t => t.id === tareaId ? { ...t, estado: nuevoEstado } : t));
    try {
      const payload: any = {};
      if (nuevoEstado === 'TERMINADA' && navigator.geolocation) {
        try {
          const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
          });
          payload.lat = pos.coords.latitude;
          payload.lng = pos.coords.longitude;
        } catch {}
      }
      await tareaService.changeEstado(tareaId, nuevoEstado, payload);
    } catch (err: any) {
      toastError('Error', err.response?.data?.message || 'No se pudo cambiar el estado');
      fetchTareas();
    }
  };

  if (loading) return <LoadingSkeleton />;

  const pendientes  = tareas.filter(t => t.estado === 'PENDIENTE').length;
  const enProgreso  = tareas.filter(t => t.estado === 'EN_PROGRESO').length;
  const enRevision  = tareas.filter(t => t.estado === 'EN_REVISION').length;
  const completadas = tareas.filter(t => t.estado === 'TERMINADA').length;
  const vencidas    = tareas.filter(t => new Date(t.fechaLimite) < new Date() && t.estado !== 'TERMINADA').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--text-color)' }}>Mis Tareas</h1>
        <p className="text-sm" style={{ color: 'var(--muted-color)' }}>
          {tareas.length} tarea{tareas.length !== 1 ? 's' : ''} asignada{tareas.length !== 1 ? 's' : ''}
        </p>
      </motion.div>

      {/* Stats mini row */}
      {tareas.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.07 }}
          className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { label: 'Pendientes', value: pendientes, color: '#6366f1' },
            { label: 'En Progreso', value: enProgreso, color: '#f59e0b' },
            { label: 'En Revisión', value: enRevision, color: '#8b5cf6' },
            { label: 'Completadas', value: completadas, color: '#10b981' },
            { label: 'Vencidas', value: vencidas, color: '#ef4444' },
          ].map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 + i * 0.05 }}
              className="glass-card rounded-xl px-4 py-3 flex items-center gap-3">
              <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: s.color }} />
              <div>
                <p className="text-xl font-black" style={{ color: 'var(--text-color)' }}>{s.value}</p>
                <p className="text-xs" style={{ color: 'var(--muted-color)' }}>{s.label}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Kanban */}
      <AnimatePresence mode="wait">
        {tareas.length === 0 ? (
          <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="text-center py-20 glass-card rounded-2xl">
            <div className="text-6xl mb-4">✅</div>
            <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-color)' }}>No tienes tareas asignadas</h3>
            <p className="text-sm" style={{ color: 'var(--muted-color)' }}>Cuando te asignen una tarea, aparecerá aquí</p>
          </motion.div>
        ) : (
          <motion.div key="kanban" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <KanbanBoard tareas={tareas} onEstadoChange={onEstadoChange} onTareaClick={(t) => navigate(`/tareas/${t.id}`)} showFilter={false} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
