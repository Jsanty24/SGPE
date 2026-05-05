import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { calendarioService } from '../services/apiService';
import { useToast } from '../context/ToastContext';
import LoadingSkeleton from '../components/LoadingSkeleton';

const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const DIAS_SEMANA = ['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom'];

interface CalendarioTarea {
  id: string; nombre: string; estado: string; fechaLimite: string; prioridad: string;
  proyecto: { id: string; nombre: string };
}

interface CalendarioHito {
  id: string; titulo: string; fecha: string; completado: boolean;
  proyecto: { id: string; nombre: string };
}

export default function CalendarioPage() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [data, setData] = useState<{ tareas: CalendarioTarea[]; hitos: CalendarioHito[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const { error: toastError } = useToast();
  const navigate = useNavigate();

  const mesKey = `${year}-${String(month + 1).padStart(2, '0')}`;

  const fetchMonth = useCallback(async () => {
    setLoading(true);
    setSelectedDay(null);
    try {
      const res = await calendarioService.getMes(mesKey);
      if (res.data.success) setData(res.data.data);
    } catch {
      toastError('Error', 'No se pudo cargar el calendario');
    } finally { setLoading(false); }
  }, [mesKey]);

  useEffect(() => { fetchMonth(); }, [fetchMonth]);

  const prev = () => { if (month === 0) { setYear(y => y - 1); setMonth(11); } else setMonth(m => m - 1); };
  const next = () => { if (month === 11) { setYear(y => y + 1); setMonth(0); } else setMonth(m => m + 1); };

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startOffset = (firstDay.getDay() + 6) % 7;
  const totalDays = lastDay.getDate();

  const getItems = (day: number) => {
    if (!data) return { tareas: [] as CalendarioTarea[], hitos: [] as CalendarioHito[] };
    const tareas = data.tareas.filter(t => new Date(t.fechaLimite).getDate() === day);
    const hitos = data.hitos.filter(h => new Date(h.fecha).getDate() === day);
    return { tareas, hitos };
  };

  const estadoColor: Record<string, string> = {
    PENDIENTE: '#6366f1', EN_PROGRESO: '#f59e0b', EN_REVISION: '#8b5cf6', TERMINADA: '#10b981',
  };

  if (loading) return <LoadingSkeleton />;

  const selectedItems = selectedDay ? getItems(selectedDay) : null;

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-color)' }}>Calendario</h1>
        <p className="text-sm" style={{ color: 'var(--muted-color)' }}>Tareas e hitos de tus proyectos</p>
      </motion.div>

      {/* Month nav */}
      <div className="flex items-center justify-between">
        <button onClick={prev} className="px-4 py-2 rounded-xl text-sm font-medium"
          style={{ border: '1px solid var(--glass-border)', color: 'var(--text-color)' }}>
          &lt; Anterior
        </button>
        <h2 className="text-xl font-bold" style={{ color: 'var(--text-color)' }}>
          {MESES[month]} {year}
        </h2>
        <button onClick={next} className="px-4 py-2 rounded-xl text-sm font-medium"
          style={{ border: '1px solid var(--glass-border)', color: 'var(--text-color)' }}>
          Siguiente &gt;
        </button>
      </div>

      <div className="flex gap-6">
        {/* Calendar grid */}
        <div className="flex-1">
          <div className="glass-card rounded-2xl p-4 overflow-hidden">
            {/* Day headers */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {DIAS_SEMANA.map(d => (
                <div key={d} className="text-center text-xs font-semibold py-2" style={{ color: 'var(--muted-color)' }}>
                  {d}
                </div>
              ))}
            </div>
            {/* Days grid */}
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: startOffset }).map((_, i) => (
                <div key={`empty-${i}`} className="aspect-square" />
              ))}
              {Array.from({ length: totalDays }).map((_, i) => {
                const day = i + 1;
                const { tareas, hitos } = getItems(day);
                const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
                const hasVencidas = tareas.some(t => new Date(t.fechaLimite) < today && t.estado !== 'TERMINADA');
                const isSelected = selectedDay === day;

                return (
                  <motion.button key={day} whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.95 }}
                    onClick={() => setSelectedDay(isSelected ? null : day)}
                    className="aspect-square rounded-xl flex flex-col items-center justify-center p-1 transition-all relative"
                    style={{
                      background: isSelected ? 'rgba(99,102,241,0.15)' : isToday ? 'rgba(99,102,241,0.06)' : 'transparent',
                      border: isToday ? '1px solid rgba(99,102,241,0.3)' : '1px solid transparent',
                      opacity: hasVencidas ? 0.8 : 1,
                    }}>
                    <span className="text-xs font-semibold" style={{
                      color: isToday ? 'var(--color-primary)' : 'var(--text-color)',
                    }}>{day}</span>
                    <div className="flex gap-0.5 mt-0.5">
                      {tareas.slice(0, 3).map(t => (
                        <span key={t.id} className="w-1.5 h-1.5 rounded-full" style={{ background: estadoColor[t.estado] || 'var(--color-primary)' }} />
                      ))}
                      {hitos.slice(0, 2).map(h => (
                        <span key={h.id} className="w-1.5 h-1.5 rotate-45 rounded-sm" style={{ background: 'var(--color-success)' }} />
                      ))}
                    </div>
                    {(tareas.length + hitos.length) > 4 && (
                      <span className="text-[8px] mt-0.5" style={{ color: 'var(--muted-color)' }}>+{tareas.length + hitos.length - 4}</span>
                    )}
                    {hasVencidas && <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full" style={{ background: 'var(--color-danger)' }} />}
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-4 mt-4 text-xs">
            {Object.entries(estadoColor).map(([estado, color]) => (
              <div key={estado} className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
                <span style={{ color: 'var(--muted-color)' }}>{estado.replace('_', ' ')}</span>
              </div>
            ))}
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rotate-45 rounded-sm" style={{ background: 'var(--color-success)' }} />
              <span style={{ color: 'var(--muted-color)' }}>Hito</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--color-danger)' }} />
              <span style={{ color: 'var(--muted-color)' }}>Vencida</span>
            </div>
          </div>
        </div>

        {/* Day detail panel */}
        <AnimatePresence>
          {selectedItems && selectedDay && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
              className="w-72 glass-card rounded-2xl p-4 flex-shrink-0">
              <h3 className="font-bold mb-3" style={{ color: 'var(--text-color)' }}>
                {selectedDay} de {MESES[month]}
              </h3>

              {selectedItems.tareas.length === 0 && selectedItems.hitos.length === 0 && (
                <p className="text-sm" style={{ color: 'var(--muted-color)' }}>Sin actividades</p>
              )}

              {selectedItems.tareas.length > 0 && (
                <div className="mb-3">
                  <p className="text-xs font-semibold mb-2" style={{ color: 'var(--muted-color)' }}>TAREAS</p>
                  {selectedItems.tareas.map(t => (
                    <button key={t.id} onClick={() => navigate(`/tareas/${t.id}`)}
                      className="w-full text-left p-2 rounded-lg mb-1 transition-colors hover:bg-primary-500/10 block">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: estadoColor[t.estado] }} />
                        <span className="text-sm truncate" style={{ color: 'var(--text-color)' }}>{t.nombre}</span>
                      </div>
                      <p className="text-xs ml-4" style={{ color: 'var(--muted-color)' }}>{t.proyecto.nombre}</p>
                    </button>
                  ))}
                </div>
              )}

              {selectedItems.hitos.length > 0 && (
                <div>
                  <p className="text-xs font-semibold mb-2" style={{ color: 'var(--muted-color)' }}>HITOS</p>
                  {selectedItems.hitos.map(h => (
                    <div key={h.id} className="p-2 rounded-lg mb-1">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rotate-45 rounded-sm flex-shrink-0"
                          style={{ background: h.completado ? 'var(--color-success)' : 'var(--color-warning)' }} />
                        <span className="text-sm" style={{ color: 'var(--text-color)' }}>{h.titulo}</span>
                      </div>
                      <p className="text-xs ml-4" style={{ color: 'var(--muted-color)' }}>{h.proyecto.nombre}</p>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
