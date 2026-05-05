import { useEffect, useState, useRef, useCallback } from 'react';
import { motion, useInView } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, RadialBarChart, RadialBar,
} from 'recharts';
import gsap from 'gsap';
import { proyectoService } from '../services/apiService';
import { useToast } from '../context/ToastContext';
import { useDevicePerformance } from '../hooks/useDevicePerformance';
import LoadingSkeleton from '../components/LoadingSkeleton';
import type { Proyecto } from '../types';

/* ─── Color palette ──────────────────────────────────────── */
const C = {
  primary: '#6366f1', violet: '#8b5cf6', success: '#10b981',
  warning: '#f59e0b', danger: '#ef4444', info: '#3b82f6',
};
const PIE_COLORS = [C.primary, C.warning, C.success];
const chartStyle = {
  background: 'transparent', border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '12px', color: 'var(--text-color)', fontSize: '12px',
};

/* ─── Animated counter ───────────────────────────────────── */
function AnimatedNumber({ value, suffix = '' }: { value: number; suffix?: string }) {
  const [display, setDisplay] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const inc = Math.max(1, Math.ceil(value / 60));
    const timer = setInterval(() => {
      start = Math.min(start + inc, value);
      setDisplay(start);
      if (start >= value) clearInterval(timer);
    }, 20);
    return () => clearInterval(timer);
  }, [inView, value]);

  return <span ref={ref}>{display}{suffix}</span>;
}

/* ─── KPI card ───────────────────────────────────────────── */
function KpiCard({
  title, value, icon, trend, color, delay = 0, suffix = '',
}: {
  title: string; value: number; icon: string; trend?: number;
  color: string; delay?: number; suffix?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 28, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay, type: 'spring', stiffness: 280, damping: 24 }}
      className="glass-card rounded-2xl p-5 overflow-hidden relative"
    >
      {/* BG glow */}
      <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full blur-2xl opacity-20"
        style={{ background: color }} />
      <div className="flex items-start justify-between mb-3 relative">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider mb-0.5" style={{ color: 'var(--muted-color)' }}>{title}</p>
          <p className="text-3xl font-black" style={{ color: 'var(--text-color)' }}>
            <AnimatedNumber value={value} suffix={suffix} />
          </p>
        </div>
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
          style={{ background: `${color}22`, border: `1px solid ${color}33` }}>
          {icon}
        </div>
      </div>
      {trend !== undefined && (
        <p className="text-xs" style={{ color: trend >= 0 ? C.success : C.danger }}>
          {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}% vs mes anterior
        </p>
      )}
    </motion.div>
  );
}

/* ─── Custom Tooltip ─────────────────────────────────────── */
function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl p-3 text-sm" style={chartStyle}>
      {label && <p className="font-semibold mb-1 opacity-80">{label}</p>}
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color }}>{p.name}: <strong>{p.value}</strong></p>
      ))}
    </div>
  );
}

/* ─── Page ────────────────────────────────────────────────── */
export default function DashboardPage() {
  const navigate = useNavigate();
  const [proyectos, setProyectos] = useState<Proyecto[]>([]);
  const [loading, setLoading] = useState(true);
  const { error: toastError } = useToast();
  const sectionRef = useRef<HTMLDivElement>(null);
  const { isLowEnd } = useDevicePerformance();

  useEffect(() => {
    proyectoService.getAll().then(({ data }) => {
      if (data.success && data.data) setProyectos(data.data);
    }).catch(() => {
      toastError('Error', 'No se pudieron cargar los datos del dashboard');
    }).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!loading && sectionRef.current && !isLowEnd) {
      gsap.from(sectionRef.current.querySelectorAll('.gsap-item'), {
        y: 40, opacity: 0, stagger: 0.08, duration: 0.7,
        ease: 'power3.out', delay: 0.2,
      });
    }
  }, [loading, isLowEnd]);

  if (loading) return <LoadingSkeleton />;

  /* ─── Derived metrics ──────────────────────────────────── */
  const allTareas  = proyectos.flatMap(p => (p.tareas || []).map(t => ({ ...t, proyectoNombre: p.nombre })));
  const activos    = proyectos.filter(p => p.estado === 'ACTIVO').length;
  const pausa      = proyectos.filter(p => p.estado === 'EN_PAUSA').length;
  const cerrados   = proyectos.filter(p => p.estado === 'CERRADO').length;
  
  const completadas = allTareas.filter(t => t.estado === 'TERMINADA').length;
  const enProgreso  = allTareas.filter(t => t.estado === 'EN_PROGRESO').length;
  const pendientes  = allTareas.filter(t => t.estado === 'PENDIENTE').length;
  
  const vencidas    = allTareas.filter(t => {
    if (!t.fechaLimite) return false;
    return new Date(t.fechaLimite) < new Date() && t.estado !== 'TERMINADA';
  }).length;
  
  const eficiencia  = allTareas.length ? Math.round((completadas / allTareas.length) * 100) : 0;
  const miembros    = new Set(proyectos.flatMap(p =>
    (p.miembros || []).map(m => m.id || m.usuarioId)
  )).size;

  const hoyStr = new Date().toISOString().split('T')[0];
  const venciendoHoy = allTareas.filter(t => {
    if (!t.fechaLimite || t.estado === 'TERMINADA') return false;
    const fStr = typeof t.fechaLimite === 'string' ? t.fechaLimite : new Date(t.fechaLimite).toISOString();
    return fStr.split('T')[0] === hoyStr;
  }).sort((a, b) => new Date(a.fechaLimite).getTime() - new Date(b.fechaLimite).getTime())
    .slice(0, 5);

  /* ─── Chart data ───────────────────────────────────────── */
  const pieEstados = [
    { name: 'Pendiente', value: pendientes },
    { name: 'En Progreso', value: enProgreso },
    { name: 'Terminada', value: completadas },
  ];

  const barProyectos = proyectos.slice(0, 8).map(p => {
    const pTareas = p.tareas || [];
    const pName = p.nombre || 'Sin nombre';
    return {
      name: pName.length > 12 ? pName.substring(0, 12) + '…' : pName,
      total: pTareas.length,
      ok: pTareas.filter(t => t.estado === 'TERMINADA').length,
      progreso: pTareas.length
        ? Math.round((pTareas.filter(t => t.estado === 'TERMINADA').length / pTareas.length) * 100)
        : 0,
    };
  });

  const radialData = [
    { name: 'Eficiencia', value: eficiencia, fill: C.success },
    { name: 'Activos', value: proyectos.length > 0 ? Math.round((activos / proyectos.length) * 100) : 0, fill: C.primary },
  ];

  // Simulated monthly trend (last 6 months from tasks)
  const monthNames = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
  const now = new Date();
  const areaData = Array.from({ length: 6 }, (_, i) => {
    const m = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
    const mes = monthNames[m.getMonth()];
    const creadas = allTareas.filter(t => {
      const d = new Date(t.createdAt || t.fechaLimite || now);
      return d.getMonth() === m.getMonth() && d.getFullYear() === m.getFullYear();
    }).length;
    const termin = allTareas.filter(t => {
      if (!t.fechaLimite) return false;
      const d = new Date(t.fechaLimite);
      return t.estado === 'TERMINADA' && d.getMonth() === m.getMonth() && d.getFullYear() === m.getFullYear();
    }).length;
    return { mes, creadas, terminadas: termin };
  });

  const priChart = [
    { name: 'Alta', value: allTareas.filter(t => t.prioridad === 'ALTA').length, fill: C.danger },
    { name: 'Media', value: allTareas.filter(t => t.prioridad === 'MEDIA').length, fill: C.warning },
    { name: 'Baja', value: allTareas.filter(t => t.prioridad === 'BAJA').length, fill: C.success },
  ];

  /* ─── Render ───────────────────────────────────────────── */
  return (
    <div ref={sectionRef} className="space-y-8">

      {/* ── Banner ── */}
      <div className="gsap-item rounded-3xl p-8 aurora-bg overflow-hidden relative">
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 70% 50%, rgba(255,255,255,0.15) 0%, transparent 60%)' }} />
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-white mb-1">Dashboard</h1>
            <p className="text-white/70">Resumen ejecutivo · {new Date().toLocaleDateString('es', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>
          <div className="flex gap-3">
            <div className="text-center bg-white/10 rounded-xl px-4 py-2">
              <p className="text-2xl font-black text-white">{eficiencia}%</p>
              <p className="text-xs text-white/70">Eficiencia</p>
            </div>
            <div className="text-center bg-white/10 rounded-xl px-4 py-2">
              <p className="text-2xl font-black text-white">{proyectos.length}</p>
              <p className="text-xs text-white/70">Proyectos</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── KPI row ── */}
      <div className="gsap-item grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard title="Proyectos Activos"    value={activos}    icon="🚀" color={C.primary}  delay={0}    trend={12} />
        <KpiCard title="Tareas Completadas"   value={completadas} icon="✅" color={C.success}  delay={0.06} trend={8} />
        <KpiCard title="Tareas Vencidas"      value={vencidas}   icon="🔴" color={C.danger}   delay={0.12} trend={-3} />
        <KpiCard title="Miembros del equipo"  value={miembros}   icon="👥" color={C.violet}   delay={0.18} />
      </div>

      {/* ── Charts row 1 ── */}
      <div className="gsap-item grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Area chart — tendencia */}
        <div className="lg:col-span-2 glass-card rounded-2xl p-6">
          <h3 className="font-bold mb-1" style={{ color: 'var(--text-color)' }}>Tendencia de Tareas</h3>
          <p className="text-xs mb-5" style={{ color: 'var(--muted-color)' }}>Últimos 6 meses</p>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={areaData}>
              <defs>
                <linearGradient id="gcreadas" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={C.primary} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={C.primary} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gterm" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={C.success} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={C.success} stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="mes" tick={{ fill: 'var(--muted-color)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'var(--muted-color)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTooltip />} />
              <Legend formatter={v => <span style={{ color: 'var(--text-color)', fontSize: 12 }}>{v}</span>} />
              <Area type="monotone" dataKey="creadas" name="Creadas" stroke={C.primary} fill="url(#gcreadas)" strokeWidth={2} dot={{ r: 3, fill: C.primary }} isAnimationActive={!isLowEnd} />
              <Area type="monotone" dataKey="terminadas" name="Terminadas" stroke={C.success} fill="url(#gterm)" strokeWidth={2} dot={{ r: 3, fill: C.success }} isAnimationActive={!isLowEnd} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Pie — estados */}
        <div className="glass-card rounded-2xl p-6">
          <h3 className="font-bold mb-1" style={{ color: 'var(--text-color)' }}>Estado de Tareas</h3>
          <p className="text-xs mb-3" style={{ color: 'var(--muted-color)' }}>{allTareas.length} tareas en total</p>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={pieEstados} cx="50%" cy="50%" innerRadius={48} outerRadius={75} dataKey="value" paddingAngle={3} isAnimationActive={!isLowEnd}>
                {pieEstados.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} strokeWidth={0} />)}
              </Pie>
              <Tooltip content={<ChartTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2 mt-2">
            {pieEstados.map((e, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: PIE_COLORS[i] }} />
                  <span style={{ color: 'var(--muted-color)' }}>{e.name}</span>
                </div>
                <span className="font-semibold" style={{ color: 'var(--text-color)' }}>{e.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Charts row 2 ── */}
      <div className="gsap-item grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bar — proyectos */}
        <div className="lg:col-span-2 glass-card rounded-2xl p-6">
          <h3 className="font-bold mb-1" style={{ color: 'var(--text-color)' }}>Progreso por Proyecto</h3>
          <p className="text-xs mb-5" style={{ color: 'var(--muted-color)' }}>Tareas totales vs completadas</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={barProyectos} barGap={4}>
              <XAxis dataKey="name" tick={{ fill: 'var(--muted-color)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'var(--muted-color)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTooltip />} />
              <Legend formatter={v => <span style={{ color: 'var(--text-color)', fontSize: 12 }}>{v}</span>} />
              <Bar dataKey="total" name="Total" fill={`${C.primary}55`} radius={[6, 6, 0, 0]} isAnimationActive={!isLowEnd} />
              <Bar dataKey="ok" name="Completadas" fill={C.success} radius={[6, 6, 0, 0]} isAnimationActive={!isLowEnd} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Radial + prioridad */}
        <div className="flex flex-col gap-4">
          <div className="glass-card rounded-2xl p-5 flex-1">
            <h3 className="font-bold text-sm mb-3" style={{ color: 'var(--text-color)' }}>Eficiencia Global</h3>
            <ResponsiveContainer width="100%" height={140}>
              <RadialBarChart cx="50%" cy="50%" innerRadius="40%" outerRadius="90%" barSize={14} data={radialData} startAngle={180} endAngle={-180}>
                <RadialBar dataKey="value" cornerRadius={8} isAnimationActive={!isLowEnd} />
                <Tooltip content={<ChartTooltip />} />
              </RadialBarChart>
            </ResponsiveContainer>
            <p className="text-center text-3xl font-black mt-1" style={{ color: C.success }}>{eficiencia}%</p>
          </div>
        </div>
      </div>

      {/* ── Charts row 3 — Prioridades + línea estados proyectos ── */}
      <div className="gsap-item grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bar horizontal — prioridades */}
        <div className="glass-card rounded-2xl p-6">
          <h3 className="font-bold mb-1" style={{ color: 'var(--text-color)' }}>Tareas por Prioridad</h3>
          <div className="mt-4 space-y-4">
            {priChart.map(p => (
              <div key={p.name}>
                <div className="flex justify-between text-sm mb-1">
                  <span style={{ color: 'var(--muted-color)' }}>{p.name}</span>
                  <span className="font-semibold" style={{ color: 'var(--text-color)' }}>{p.value}</span>
                </div>
                <div className="progress-track">
                  <motion.div
                    className="progress-fill"
                    style={{ background: p.fill }}
                    initial={{ width: 0 }}
                    animate={{ width: `${allTareas.length ? (p.value / allTareas.length) * 100 : 0}%` }}
                    transition={{ duration: 1.2, ease: 'easeOut', delay: 0.3 }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* États proyectos bar simple */}
        <div className="glass-card rounded-2xl p-6 lg:col-span-2">
          <h3 className="font-bold mb-1" style={{ color: 'var(--text-color)' }}>Distribución de Proyectos</h3>
          <p className="text-xs mb-5" style={{ color: 'var(--muted-color)' }}>Por estado</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={[{ name: 'Estados', Activos: activos, 'En Pausa': pausa, Cerrados: cerrados }]}>
              <XAxis dataKey="name" hide />
              <YAxis tick={{ fill: 'var(--muted-color)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTooltip />} />
              <Legend formatter={v => <span style={{ color: 'var(--text-color)', fontSize: 12 }}>{v}</span>} />
              <Bar dataKey="Activos" fill={C.success} radius={[8, 8, 0, 0]} isAnimationActive={!isLowEnd} />
              <Bar dataKey="En Pausa" fill={C.warning} radius={[8, 8, 0, 0]} isAnimationActive={!isLowEnd} />
              <Bar dataKey="Cerrados" fill={C.info} radius={[8, 8, 0, 0]} isAnimationActive={!isLowEnd} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Bottom Section ── */}
      <div className="gsap-item grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Proyectos recientes */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-lg" style={{ color: 'var(--text-color)' }}>Proyectos Recientes</h3>
            <button onClick={() => navigate('/proyectos')}
              className="text-sm text-primary-400 hover:text-primary-300 transition-colors">Ver todos →</button>
          </div>
          <div className="glass-table-container">
            <table className="glass-table">
              <thead>
                <tr>
                  <th>Proyecto</th>
                  <th>Estado</th>
                  <th>Progreso</th>
                  <th>Tareas</th>
                </tr>
              </thead>
              <tbody>
                {proyectos.slice(0, 5).map(p => {
                  const total = (p.tareas || []).length;
                  const ok = (p.tareas || []).filter(t => t.estado === 'TERMINADA').length;
                  const pct = total ? Math.round((ok / total) * 100) : 0;
                  const estadoColors: Record<string, string> = {
                    ACTIVO: 'badge-success', EN_PAUSA: 'badge-warning', CERRADO: 'badge-gray',
                  };
                  return (
                    <motion.tr key={p.id} whileHover={{ scale: 1.01 }}
                      onClick={() => navigate(`/proyectos/${p.id}`)}
                      style={{ cursor: 'pointer' }}>
                      <td>
                        <p className="font-medium" style={{ color: 'var(--text-color)' }}>{p.nombre}</p>
                        {p.cliente && <p className="text-xs" style={{ color: 'var(--muted-color)' }}>{p.cliente}</p>}
                      </td>
                      <td><span className={`badge ${estadoColors[p.estado] || 'badge-gray'}`}>{p.estado.replace('_', ' ')}</span></td>
                      <td>
                        <div className="flex items-center gap-2 min-w-[100px]">
                          <div className="progress-track flex-1">
                            <motion.div className="progress-fill" initial={{ width: 0 }}
                              animate={{ width: `${pct}%` }} transition={{ duration: 1, ease: 'easeOut' }} />
                          </div>
                          <span className="text-xs font-semibold" style={{ color: 'var(--muted-color)' }}>{pct}%</span>
                        </div>
                      </td>
                      <td><span style={{ color: 'var(--muted-color)' }}>{ok}/{total}</span></td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Tareas Venciendo Hoy */}
        <div className="glass-card rounded-2xl p-6 lg:col-span-1">
          <h3 className="font-bold text-lg mb-1" style={{ color: 'var(--text-color)' }}>Vencimiento Hoy</h3>
          <p className="text-xs mb-4" style={{ color: 'var(--muted-color)' }}>Tareas que requieren atención</p>
          <div className="space-y-3">
            {venciendoHoy.length === 0 ? (
              <div className="text-center py-6">
                <span className="text-2xl mb-2 block">🎉</span>
                <p className="text-sm" style={{ color: 'var(--muted-color)' }}>Nada vence hoy</p>
              </div>
            ) : (
              venciendoHoy.map((t, i) => (
                <motion.div key={t.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
                  onClick={() => navigate(`/tareas/${t.id}`)}
                  className="p-3 rounded-xl cursor-pointer group transition-all"
                  style={{ background: 'var(--surface-color)', border: '1px solid var(--glass-border)' }}
                  whileHover={{ scale: 1.02 }}
                >
                  <div className="flex justify-between items-start mb-1">
                    <p className="font-medium text-sm group-hover:text-primary-400 transition-colors line-clamp-1 flex-1 pr-2" style={{ color: 'var(--text-color)' }}>{t.nombre}</p>
                    <span className={`badge ${{ ALTA: 'badge-danger', MEDIA: 'badge-warning', BAJA: 'badge-success' }[t.prioridad] || 'badge-gray'} flex-shrink-0 text-[10px]`}>{t.prioridad}</span>
                  </div>
                  {t.proyectoNombre && (
                    <p className="text-xs mb-2 line-clamp-1" style={{ color: 'var(--muted-color)' }}>📁 {t.proyectoNombre}</p>
                  )}
                  <div className="flex items-center justify-between mt-2 pt-2" style={{ borderTop: '1px dotted var(--glass-border)' }}>
                    <span className="text-xs font-semibold text-warning">⏳ Vence hoy</span>
                    {t.asignadoA ? (
                      <span className="text-xs" style={{ color: 'var(--muted-color)' }}>👤 {t.asignadoA.nombre.split(' ')[0]}</span>
                    ) : (
                      <span className="text-xs italic" style={{ color: 'var(--muted-color)' }}>Sin asignar</span>
                    )}
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
