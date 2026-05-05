import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, RadialBarChart, RadialBar
} from 'recharts';
import { reporteService } from '../services/apiService';
import { useToast } from '../context/ToastContext';
import LoadingSkeleton from '../components/LoadingSkeleton';

// [A3-UI] Upgraded ReportePage — glass cards, progress arcs, member detail table

const COLORS = ['#6366f1', '#f59e0b', '#10b981'];

const glassTooltipStyle = {
  background: 'rgba(10,10,20,0.85)',
  backdropFilter: 'blur(16px)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '12px',
  color: '#e8eaf6',
  fontSize: '12px',
};

export default function ReportePage() {
  const { id: proyectoId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { error: toastError, success } = useToast();
  const [datos, setDatos] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [descargando, setDescargando] = useState(false);

  useEffect(() => {
    reporteService.getDatos(proyectoId!).then(({ data }) => {
      if (data.success && data.data) setDatos(data.data);
    }).catch(() => {
      toastError('Error', 'No se pudieron cargar los datos del reporte');
    }).finally(() => setLoading(false));
  }, [proyectoId]);

  const descargarPDF = async () => {
    try {
      setDescargando(true);
      const response = await reporteService.downloadPDF(proyectoId!);
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.download = `reporte-sgpe.pdf`;
      link.click();
      window.URL.revokeObjectURL(url);
      success('PDF descargado', 'El reporte se ha generado correctamente');
    } catch {
      toastError('Error', 'No se pudo generar el PDF. Verifica que los datos estén cargados.');
    } finally {
      setDescargando(false);
    }
  };

  const descargarCSV = () => {
    if (!datos?.rendimiento) {
      toastError('Error', 'No hay datos disponibles para exportar');
      return;
    }
    const header = ['Miembro', 'Total Tareas', 'Pendientes', 'En Progreso', 'En Revisión', 'Terminadas', 'Eficiencia (%)'];
    const rows = datos.rendimiento.map((r: any) => {
      const eficiencia = r.total > 0 ? Math.round((r.completadas / r.total) * 100) : 0;
      return `"${r.nombre}",${r.total},${r.pendientes},${r.enProgreso || 0},${r.completadas},${eficiencia}`;
    });
    const csvContent = '\uFEFF' + [header.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `rendimiento_sgpe.csv`;
    link.click();
    URL.revokeObjectURL(url);
    success('CSV descargado', 'El archivo Excel se ha generado correctamente');
  };

  if (loading) return <LoadingSkeleton />;
  if (!datos) return <div className="text-center py-16"><p className="text-dark-muted">No se pudieron cargar los datos</p></div>;

  const progresoPct = datos.totalTareas > 0
    ? Math.round((datos.tareasPorEstado.TERMINADA / datos.totalTareas) * 100)
    : 0;

  const estadoData = [
    { name: 'Pendiente', value: datos.tareasPorEstado.PENDIENTE, fill: '#6366f1' },
    { name: 'En Progreso', value: datos.tareasPorEstado.EN_PROGRESO, fill: '#f59e0b' },
    { name: 'Terminada', value: datos.tareasPorEstado.TERMINADA, fill: '#10b981' },
  ];

  const radialData = [{ name: 'Progreso', value: progresoPct, fill: '#6366f1' }];

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <button onClick={() => navigate(-1)} className="text-sm text-dark-muted hover:text-dark-text mb-2 transition-colors flex items-center gap-1">
            ← Volver
          </button>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-color)' }}>Reporte del Proyecto</h1>
          <p className="text-dark-muted text-sm">Análisis completo de rendimiento y tareas</p>
        </div>
        <div className="flex gap-2">
          <motion.button
            onClick={descargarCSV}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors flex items-center gap-2"
            style={{ border: '1px solid var(--glass-border)', color: 'var(--text-color)' }}
          >
            📊 Excel / CSV
          </motion.button>
          <motion.button
            onClick={descargarPDF}
            disabled={descargando}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            className="px-5 py-2.5 rounded-xl text-white font-semibold text-sm shimmer-btn disabled:opacity-50 flex items-center gap-2"
          >
            {descargando ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                />
                Generando…
              </>
            ) : '📄 Descargar PDF'}
          </motion.button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Tareas', value: datos.totalTareas, color: 'text-primary-400' },
          { label: 'Pendientes', value: datos.tareasPorEstado.PENDIENTE, color: 'text-blue-400' },
          { label: 'En Progreso', value: datos.tareasPorEstado.EN_PROGRESO, color: 'text-warning' },
          { label: 'Completadas', value: datos.tareasPorEstado.TERMINADA, color: 'text-success' },
        ].map((kpi, i) => (
          <motion.div
            key={kpi.label}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07, type: 'spring', stiffness: 260 }}
            className="glass-card rounded-2xl p-5"
          >
            <p className="text-xs text-dark-muted mb-2 uppercase tracking-wider">{kpi.label}</p>
            <p className={`text-4xl font-bold ${kpi.color}`}>{kpi.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Pie chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="glass-card rounded-2xl p-6"
        >
          <h3 className="text-base font-semibold mb-4" style={{ color: 'var(--text-color)' }}>Distribución por Estado</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={estadoData} cx="50%" cy="50%" outerRadius={75} innerRadius={35} dataKey="value" paddingAngle={3}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                labelLine={false}
              >
                {estadoData.map((entry, i) => <Cell key={i} fill={COLORS[i]} />)}
              </Pie>
              <Tooltip contentStyle={glassTooltipStyle} />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Radial progress */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="glass-card rounded-2xl p-6 flex flex-col items-center justify-center"
        >
          <h3 className="text-base font-semibold mb-4" style={{ color: 'var(--text-color)' }}>Progreso Global</h3>
          <div className="relative">
            <ResponsiveContainer width={180} height={180}>
              <RadialBarChart cx="50%" cy="50%" innerRadius="60%" outerRadius="90%" data={radialData} startAngle={90} endAngle={-270}>
                <RadialBar background={{ fill: 'rgba(99,102,241,0.1)' }} dataKey="value" />
              </RadialBarChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex items-center justify-center flex-col">
              <span className="text-4xl font-bold text-primary-400">{progresoPct}%</span>
              <span className="text-xs text-dark-muted">completado</span>
            </div>
          </div>
        </motion.div>

        {/* Bar chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="glass-card rounded-2xl p-6"
        >
          <h3 className="text-base font-semibold mb-4" style={{ color: 'var(--text-color)' }}>Rendimiento por Miembro</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={datos.rendimiento} layout="vertical" margin={{ left: 8 }}>
              <XAxis type="number" tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <YAxis type="category" dataKey="nombre" tick={{ fill: '#94a3b8', fontSize: 11 }} width={80} />
              <Tooltip contentStyle={glassTooltipStyle} />
              <Bar dataKey="completadas" fill="#10b981" name="Completadas" radius={[0, 6, 6, 0]} />
              <Bar dataKey="total" fill="#6366f1" name="Total" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Member Detail Table */}
      {datos.rendimiento.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <h3 className="text-base font-semibold mb-4" style={{ color: 'var(--text-color)' }}>Detalle por Miembro</h3>
          <div className="glass-table-container">
            <table className="glass-table">
              <thead>
                <tr>
                  <th>Miembro</th>
                  <th>Total</th>
                  <th>Completadas</th>
                  <th>En Progreso</th>
                  <th>Pendientes</th>
                  <th>Eficiencia</th>
                </tr>
              </thead>
              <tbody>
                {datos.rendimiento.map((r: any, i: number) => {
                  const eficiencia = r.total > 0 ? Math.round((r.completadas / r.total) * 100) : 0;
                  return (
                    <motion.tr key={i} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}>
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-md"
                            style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
                            {r.nombre.charAt(0)}
                          </div>
                          <span className="font-medium" style={{ color: 'var(--text-color)' }}>{r.nombre}</span>
                        </div>
                      </td>
                      <td className="text-dark-muted">{r.total}</td>
                      <td><span className="text-success font-medium">{r.completadas}</span></td>
                      <td><span className="text-warning font-medium">{r.enProgreso}</span></td>
                      <td><span className="text-primary-400 font-medium">{r.pendientes}</span></td>
                      <td>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-dark-border rounded-full h-2 max-w-[80px]">
                            <div className="h-2 rounded-full transition-all duration-500"
                              style={{ width: `${eficiencia}%`, background: eficiencia >= 70 ? 'var(--color-success)' : eficiencia >= 40 ? 'var(--color-warning)' : 'var(--color-danger)' }} />
                          </div>
                          <span className="text-xs text-dark-muted">{eficiencia}%</span>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}
    </div>
  );
}
