import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { proyectoService, tareaService, usuarioService, archivoProyectoService } from '../services/apiService';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import KanbanBoard from '../components/KanbanBoard';
import Modal from '../components/Modal';
import ConfirmDeleteModal from '../components/ConfirmDeleteModal';
import ProjectChat from '../components/ProjectChat';
import LoadingSkeleton from '../components/LoadingSkeleton';
import type { Proyecto, Usuario, EstadoTarea, Hito } from '../types';

// ─── Validaciones ─────────────────────────────────────────
const today = new Date().toISOString().split('T')[0];

const tareaSchema = z.object({
  nombre:      z.string().min(3, 'Mínimo 3 caracteres'),
  descripcion: z.string().min(5, 'Mínimo 5 caracteres'),
  prioridad:   z.enum(['ALTA', 'MEDIA', 'BAJA']),
  fechaLimite: z.string().min(1, 'Requerida').refine(
    d => new Date(d) >= new Date(today),
    { message: 'La fecha no puede ser en el pasado' }
  ),
  asignadoAId: z.string().optional(),
});

const hitoSchema = z.object({
  titulo:      z.string().min(3, 'Mínimo 3 caracteres'),
  descripcion: z.string().optional(),
  fecha:       z.string().min(1, 'Requerida'),
});

type TareaFormData = z.infer<typeof tareaSchema>;
type HitoFormData  = z.infer<typeof hitoSchema>;

const estadoColors: Record<string, string> = {
  ACTIVO:   'badge-success',
  EN_PAUSA: 'badge-warning',
  CERRADO:  'badge-gray',
};

export default function ProyectoDetailPage() {
  const { id }    = useParams();
  const navigate  = useNavigate();
  const { usuario } = useAuth();
  const { success, error: toastError } = useToast();
  const [proyecto, setProyecto]   = useState<Proyecto | null>(null);
  const [loading, setLoading]     = useState(true);
  const [showTareaModal, setShowTareaModal]   = useState(false);
  const [showHitoModal, setShowHitoModal]     = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [usuarios, setUsuarios]   = useState<Usuario[]>([]);
  const [memberSearch, setMemberSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'kanban' | 'hitos' | 'miembros' | 'archivos'>('kanban');
  const [proyectoArchivos, setProyectoArchivos] = useState<any[]>([]);
  const [subiendoArchivo, setSubiendoArchivo] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);

  const { register: regTarea, handleSubmit: submitTarea, reset: resetTarea,
    formState: { errors: errTarea } } = useForm<TareaFormData>({ resolver: zodResolver(tareaSchema) });
  const { register: regHito, handleSubmit: submitHito, reset: resetHito,
    formState: { errors: errHito } } = useForm<HitoFormData>({ resolver: zodResolver(hitoSchema) });

  const fetchProyecto = useCallback(async () => {
    try {
      const { data } = await proyectoService.getById(id!);
      if (data.success && data.data) setProyecto(data.data);
    } catch {
      toastError('Error', 'No se pudieron cargar los datos del proyecto');
    }
    finally { setLoading(false); }
  }, [id]);

  useEffect(() => { fetchProyecto(); }, [fetchProyecto]);
  useEffect(() => {
    if (id) {
      archivoProyectoService.getByProyecto(id).then(({ data }) => {
        if (data.success && data.data) setProyectoArchivos(data.data);
      }).catch((err) => console.error('Error al cargar archivos:', err));
    }
  }, [id]);
  useEffect(() => {
    usuarioService.getAllActive().then(({ data }) => {
      if (data.success && data.data) setUsuarios(data.data);
    }).catch((err) => console.error('Error al cargar usuarios:', err));
  }, []);

  const esGerenteOAdmin = usuario?.rol === 'ADMIN' || (proyecto && proyecto.gerenteId === usuario?.id);
  const puedeEditar     = esGerenteOAdmin && proyecto?.estado === 'ACTIVO';

  // ─── Kanban estado change (optimistic) ──────────────────
  const onEstadoChange = async (tareaId: string, nuevoEstado: EstadoTarea) => {
    setProyecto(p => p ? { ...p, tareas: p.tareas.map(t => t.id === tareaId ? { ...t, estado: nuevoEstado } : t) } : p);
    try {
      const payload: any = {};
      if (nuevoEstado === 'TERMINADA' && navigator.geolocation) {
        try {
          const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
          });
          payload.lat = pos.coords.latitude;
          payload.lng = pos.coords.longitude;
        } catch (e) { console.error('Geolocation error:', e); }
      }
      await tareaService.changeEstado(tareaId, nuevoEstado, payload);
    } catch (err: any) {
      toastError('Error', err.response?.data?.message || 'No se pudo cambiar el estado');
      fetchProyecto();
    }
  };

  // ─── Crear tarea ─────────────────────────────────────────
  const onCreateTarea = async (data: TareaFormData) => {
    setSubmitting(true);
    try {
      await tareaService.create(id!, data as any);
      success('Tarea creada', `"${data.nombre}" fue agregada al proyecto`);
      resetTarea();
      setShowTareaModal(false);
      fetchProyecto();
    } catch (err: any) {
      toastError('Error', err.response?.data?.message || 'No se pudo crear la tarea');
    } finally { setSubmitting(false); }
  };

  // ─── Crear hito ──────────────────────────────────────────
  const onCreateHito = async (data: HitoFormData) => {
    setSubmitting(true);
    try {
      await proyectoService.createHito(id!, data as any);
      success('Hito creado');
      resetHito();
      setShowHitoModal(false);
      fetchProyecto();
    } catch (err: any) {
      toastError('Error', err.response?.data?.message || 'Error al crear hito');
    } finally { setSubmitting(false); }
  };

  // ─── Hito toggle / delete ─────────────────────────────────
  const onToggleHito = async (hito: Hito) => {
    try {
      await proyectoService.updateHito(id!, hito.id, { completado: !hito.completado });
      fetchProyecto();
    } catch (err: any) { toastError('Error', err.response?.data?.message || 'No se pudo actualizar el hito'); }
  };
  const onDeleteHito = async (hitoId: string) => {
    try {
      await proyectoService.deleteHito(id!, hitoId);
      success('Hito eliminado');
      fetchProyecto();
    } catch (err: any) { toastError('Error', err.response?.data?.message || 'No se pudo eliminar el hito'); }
  };

  // ─── Proyecto delete ──────────────────────────────────────
  const onDeleteProyecto = async () => {
    try {
      await proyectoService.delete(id!);
      success('Proyecto eliminado');
      navigate('/proyectos');
    } catch (err: any) { toastError('Error', err.response?.data?.message || 'No se pudo eliminar'); }
  };

  // ─── Members ──────────────────────────────────────────────
  const onAddMember = async (usuarioId: string) => {
    try {
      await proyectoService.addMember(id!, usuarioId);
      success('Miembro agregado');
      fetchProyecto();
    } catch (err: any) {
      toastError('Error', err.response?.data?.message || 'No se pudo agregar');
    }
  };
  const onRemoveMember = async (usuarioId: string) => {
    try {
      await proyectoService.removeMember(id!, usuarioId);
      success('Miembro removido');
      fetchProyecto();
    } catch (err: any) { toastError('Error', err.response?.data?.message || 'No se pudo remover'); }
  };

  if (loading)   return <LoadingSkeleton />;
  if (!proyecto) return (
    <div className="text-center py-16">
      <p style={{ color: 'var(--muted-color)' }}>Proyecto no encontrado</p>
    </div>
  );

  const miembrosIds = proyecto.miembros.map(m => m.usuarioId);
  const total       = proyecto.tareas.length;
  const completadas = proyecto.tareas.filter(t => t.estado === 'TERMINADA').length;
  const pct         = total ? Math.round((completadas / total) * 100) : 0;

  // Filter available users for member modal
  const availableUsers = usuarios.filter(u =>
    !miembrosIds.includes(u.id) &&
    (!memberSearch || u.nombre.toLowerCase().includes(memberSearch.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* ── Back nav ── */}
      <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        onClick={() => navigate('/proyectos')}
        className="text-sm flex items-center gap-1 transition-colors hover:text-primary-400"
        style={{ color: 'var(--muted-color)' }}>
        ← Todos los proyectos
      </motion.button>

      {/* ── Header ── */}
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-2xl p-6">
        <div className="flex flex-col lg:flex-row items-start gap-4">
          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <h1 className="text-2xl font-black" style={{ color: 'var(--text-color)' }}>
                {proyecto.nombre}
              </h1>
              <span className={`badge ${estadoColors[proyecto.estado] || 'badge-gray'}`}>
                {proyecto.estado.replace('_', ' ')}
              </span>
              {proyecto.cliente && (
                <span className="badge badge-gray">🏢 {proyecto.cliente}</span>
              )}
            </div>
            <p className="text-sm mb-3" style={{ color: 'var(--muted-color)' }}>{proyecto.descripcion}</p>
            <div className="flex flex-wrap gap-4 text-xs" style={{ color: 'var(--muted-color)' }}>
              <span>📅 {new Date(proyecto.fechaInicio).toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric' })} → {new Date(proyecto.fechaFin).toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
              <span>👤 Gerente: <strong style={{ color: 'var(--text-color)' }}>{proyecto.gerente.nombre}</strong></span>
              <span>📋 {completadas}/{total} tareas</span>
            </div>
            {/* Progress bar */}
            <div className="mt-3 max-w-xs">
              <div className="flex justify-between text-xs mb-1" style={{ color: 'var(--muted-color)' }}>
                <span>Progreso</span>
                <span className="font-semibold">{pct}%</span>
              </div>
              <div className="progress-track">
                <motion.div className="progress-fill" initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }} transition={{ duration: 1.2, ease: 'easeOut' }} />
              </div>
            </div>
          </div>
          {/* Actions */}
          <div className="flex gap-2 flex-wrap shrink-0">
            {esGerenteOAdmin && (
              <>
                <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                  onClick={() => navigate(`/proyectos/${id}/editar`)}
                  className="px-4 py-2 rounded-xl text-sm transition-all"
                  style={{ border: '1px solid var(--glass-border)', color: 'var(--muted-color)', background: 'transparent' }}>
                  ✏️ Editar
                </motion.button>
                <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                  onClick={() => navigate(`/proyectos/${id}/reporte`)}
                  className="px-4 py-2 rounded-xl text-sm transition-all"
                  style={{ border: '1px solid rgba(99,102,241,0.3)', color: 'var(--color-primary)', background: 'rgba(99,102,241,0.08)' }}>
                  📊 Reporte
                </motion.button>
                {usuario?.rol === 'ADMIN' && (
                    <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                      onClick={() => setShowDeleteModal(true)}
                      aria-label="Eliminar proyecto"
                      className="px-4 py-2 rounded-xl text-sm transition-all"
                      style={{ border: '1px solid rgba(239,68,68,0.3)', color: 'var(--color-danger)', background: 'rgba(239,68,68,0.06)' }}>
                    🗑️
                  </motion.button>
                )}
              </>
            )}
          </div>
        </div>
      </motion.div>

      {/* ── Tabs ── */}
      <div className="tab-bar">
        {(['kanban', 'hitos', 'miembros', 'archivos'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`tab-item ${activeTab === tab ? 'active' : ''}`}>
            {tab === 'kanban' ? '📋 Kanban' : tab === 'hitos' ? '🏁 Hitos' : tab === 'miembros' ? '👥 Miembros' : '📎 Archivos'}
          </button>
        ))}
      </div>

      {/* ── Tab: Kanban ── */}
      <AnimatePresence mode="wait">
        {activeTab === 'kanban' && (
          <motion.div key="kanban" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            {puedeEditar && (
              <div className="flex justify-end mb-4">
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                  onClick={() => setShowTareaModal(true)}
                  className="px-5 py-2.5 text-sm text-white font-semibold shimmer-btn rounded-xl">
                  + Nueva Tarea
                </motion.button>
              </div>
            )}
            {proyecto.tareas.length === 0 ? (
              <div className="text-center py-20 glass-card rounded-2xl">
                <div className="text-6xl mb-4">📋</div>
                <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-color)' }}>Sin tareas</h3>
                <p className="text-sm" style={{ color: 'var(--muted-color)' }}>Crea tu primera tarea para comenzar</p>
              </div>
            ) : (
              <KanbanBoard tareas={proyecto.tareas} onEstadoChange={onEstadoChange}
                onTareaClick={t => navigate(`/tareas/${t.id}`)} />
            )}
          </motion.div>
        )}

        {/* ── Tab: Hitos ── */}
        {activeTab === 'hitos' && (
          <motion.div key="hitos" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            {puedeEditar && (
              <div className="flex justify-end mb-4">
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                  onClick={() => setShowHitoModal(true)}
                  className="px-5 py-2.5 text-sm text-white font-semibold shimmer-btn rounded-xl">
                  + Nuevo Hito
                </motion.button>
              </div>
            )}
            {/* Hitos timeline */}
            <div className="relative pl-6 space-y-3" style={{ borderLeft: '2px solid var(--glass-border)' }}>
              {proyecto.hitos.map((hito, i) => (
                <motion.div key={hito.id} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className={`relative glass-card rounded-xl p-4 flex items-center gap-4 ${hito.completado ? 'opacity-70' : ''}`}>
                  <div className="absolute -left-[31px] w-4 h-4 rounded-full border-2"
                    style={{ background: hito.completado ? '#10b981' : 'var(--surface-color)', borderColor: hito.completado ? '#10b981' : 'var(--glass-border)' }} />
                  <button onClick={() => onToggleHito(hito)}
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                      hito.completado ? 'bg-success border-success text-white' : 'hover:border-primary-500'
                    }`}
                    style={{ borderColor: hito.completado ? '#10b981' : 'var(--glass-border)' }}>
                    {hito.completado && '✓'}
                  </button>
                  <div className="flex-1 min-w-0">
                    <h4 className={`font-medium ${hito.completado ? 'line-through' : ''}`}
                      style={{ color: hito.completado ? 'var(--muted-color)' : 'var(--text-color)' }}>
                      {hito.titulo}
                    </h4>
                    {hito.descripcion && <p className="text-xs mt-0.5" style={{ color: 'var(--muted-color)' }}>{hito.descripcion}</p>}
                    <p className="text-xs mt-1" style={{ color: 'var(--muted-color)' }}>
                      {new Date(hito.fecha).toLocaleDateString('es', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                  {puedeEditar && (
                    <button onClick={() => onDeleteHito(hito.id)}
                      aria-label="Eliminar hito"
                      className="text-sm transition-colors hover:opacity-100 opacity-50"
                      style={{ color: 'var(--color-danger)' }}>
                      🗑️
                    </button>
                  )}
                </motion.div>
              ))}
              {proyecto.hitos.length === 0 && (
                <p className="text-center py-8 text-sm" style={{ color: 'var(--muted-color)' }}>No hay hitos definidos</p>
              )}
            </div>
          </motion.div>
        )}

        {/* ── Tab: Miembros ── */}
        {activeTab === 'miembros' && (
          <motion.div key="miembros" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            {esGerenteOAdmin && (
              <div className="flex justify-end mb-4">
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                  onClick={() => setShowMemberModal(true)}
                  className="px-5 py-2.5 text-sm text-white font-semibold shimmer-btn rounded-xl">
                  + Agregar Miembro
                </motion.button>
              </div>
            )}
            {/* Gerente */}
            <div className="mb-3">
              <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--muted-color)' }}>Gerente</p>
              <div className="glass-card rounded-xl p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold relative"
                  style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
                  {proyecto.gerente.nombre.charAt(0)}
                  <span 
                    className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2"
                    style={{ 
                      backgroundColor: ({ ACTIVO: '#10b981', AUSENTE: '#f59e0b', NO_MOLESTAR: '#ef4444', INACTIVO: '#6b7280' } as any)[(proyecto.gerente as any).estado || 'ACTIVO'] || '#10b981',
                      borderColor: 'var(--surface-color)'
                    }}
                  />
                </div>
                <div>
                  <p className="font-medium" style={{ color: 'var(--text-color)' }}>{proyecto.gerente.nombre}</p>
                  <p className="text-xs" style={{ color: 'var(--muted-color)' }}>GERENTE</p>
                </div>
                <span className="ml-auto badge badge-primary">Gerente</span>
              </div>
            </div>
            {/* Members */}
            <p className="text-xs font-semibold uppercase tracking-wider mb-2 mt-4" style={{ color: 'var(--muted-color)' }}>
              Miembros ({proyecto.miembros.length})
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {proyecto.miembros.map((m, i) => (
                <motion.div key={m.id} initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.04 }}
                  className="glass-card rounded-xl p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold relative"
                      style={{ background: 'linear-gradient(135deg,#10b981,#059669)' }}>
                      {m.usuario.nombre.charAt(0)}
                      <span 
                        className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2"
                        style={{ 
                          backgroundColor: ({ ACTIVO: '#10b981', AUSENTE: '#f59e0b', NO_MOLESTAR: '#ef4444', INACTIVO: '#6b7280' } as any)[(m.usuario as any).estado || 'ACTIVO'] || '#10b981',
                          borderColor: 'var(--surface-color)'
                        }}
                      />
                    </div>
                    <div>
                      <p className="font-medium text-sm" style={{ color: 'var(--text-color)' }}>{m.usuario.nombre}</p>
                      <p className="text-xs" style={{ color: 'var(--muted-color)' }}>{m.usuario.correo}</p>
                    </div>
                  </div>
                  {esGerenteOAdmin && proyecto.gerenteId !== m.usuarioId && (
                    <button onClick={() => onRemoveMember(m.usuarioId)}
                      className="text-sm opacity-50 hover:opacity-100 transition-opacity"
                      style={{ color: 'var(--color-danger)' }}>✕</button>
                  )}
                </motion.div>
              ))}
              {proyecto.miembros.length === 0 && (
                <p className="col-span-2 text-center py-6 text-sm" style={{ color: 'var(--muted-color)' }}>No hay miembros adicionales</p>
              )}
            </div>
          </motion.div>
        )}
        {activeTab === 'archivos' && (
          <motion.div key="archivos" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-3">
            {usuario?.rol !== 'CLIENTE' && (
              <div className="glass-card rounded-xl p-4">
                <label className="glass-label mb-2 block">Subir archivo de evidencia del proyecto</label>
                <input type="file" onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  if (file.size > 10 * 1024 * 1024) { toastError('Archivo grande', 'Máximo 10MB'); return; }
                  setSubiendoArchivo(true);
                  try {
                    await archivoProyectoService.upload(id!, file);
                    success('Archivo subido');
                    const { data } = await archivoProyectoService.getByProyecto(id!);
                    if (data.success && data.data) setProyectoArchivos(data.data);
                  } catch { toastError('Error', 'No se pudo subir'); }
                  finally { setSubiendoArchivo(false); }
                }} disabled={subiendoArchivo} className="text-sm"
                  style={{ color: 'var(--muted-color)' }} />
                {subiendoArchivo && <p className="text-xs mt-2" style={{ color: 'var(--muted-color)' }}>Subiendo...</p>}
              </div>
            )}
            {proyectoArchivos.map((a: any) => (
              <div key={a.id} className="glass-card rounded-xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-xl">📎</span>
                  <div>
                    <p className="text-sm font-medium" style={{ color: 'var(--text-color)' }}>{a.nombre}</p>
                    <p className="text-xs" style={{ color: 'var(--muted-color)' }}>{new Date(a.createdAt).toLocaleDateString()} - {a.subidoPor?.nombre}</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <a href={archivoProyectoService.getDownloadUrl(a.id)} download={a.nombre}
                    className="text-sm text-primary-400 hover:text-primary-300">Descargar</a>
                  {(usuario?.rol === 'ADMIN' || usuario?.id === a.subidoPorId) && (
                    <button onClick={async () => {
                      try { await archivoProyectoService.delete(a.id); setProyectoArchivos(prev => prev.filter(x => x.id !== a.id)); success('Archivo eliminado'); }
                      catch { toastError('Error', 'No se pudo eliminar'); }
                    }} className="text-sm" style={{ color: 'var(--color-danger)' }}>Eliminar</button>
                  )}
                </div>
              </div>
            ))}
            {proyectoArchivos.length === 0 && (
              <p className="text-center py-8 text-sm" style={{ color: 'var(--muted-color)' }}>Sin archivos de evidencia</p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Modal: Nueva Tarea ── */}
      <Modal isOpen={showTareaModal} onClose={() => { setShowTareaModal(false); resetTarea(); }} title="Nueva Tarea">
        <form onSubmit={submitTarea(onCreateTarea)} className="space-y-4" noValidate>
          <div>
            <label className="glass-label">Nombre</label>
            <input {...regTarea('nombre')} placeholder="Nombre de la tarea" className="glass-input" />
            {errTarea.nombre && <p className="glass-error">⚠ {errTarea.nombre.message}</p>}
          </div>
          <div>
            <label className="glass-label">Descripción</label>
            <textarea {...regTarea('descripcion')} rows={3} placeholder="Descripción" className="glass-input resize-none" />
            {errTarea.descripcion && <p className="glass-error">⚠ {errTarea.descripcion.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="glass-label">Prioridad</label>
              <select {...regTarea('prioridad')} className="glass-select">
                <option value="ALTA">Alta</option>
                <option value="MEDIA">Media</option>
                <option value="BAJA">Baja</option>
              </select>
            </div>
            <div>
              <label className="glass-label">Fecha límite</label>
              <input {...regTarea('fechaLimite')} type="date" min={today} className="glass-input" />
              {errTarea.fechaLimite && <p className="glass-error">⚠ {errTarea.fechaLimite.message}</p>}
            </div>
          </div>
          <div>
            <label className="glass-label">Asignar a</label>
            <select {...regTarea('asignadoAId')} className="glass-select">
              <option value="">Sin asignar</option>
              {usuarios.filter(u => miembrosIds.includes(u.id) || u.id === proyecto.gerenteId).map(u => (
                <option key={u.id} value={u.id}>{u.nombre}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => { setShowTareaModal(false); resetTarea(); }}
              className="flex-1 py-3 rounded-xl text-sm transition-all"
              style={{ border: '1px solid var(--glass-border)', color: 'var(--muted-color)', background: 'transparent' }}>
              Cancelar
            </button>
            <motion.button type="submit" disabled={submitting} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
              className="flex-1 py-3 rounded-xl text-white font-semibold shimmer-btn disabled:opacity-50">
              {submitting ? '...' : 'Crear Tarea'}
            </motion.button>
          </div>
        </form>
      </Modal>

      {/* ── Modal: Nuevo Hito ── */}
      <Modal isOpen={showHitoModal} onClose={() => { setShowHitoModal(false); resetHito(); }} title="Nuevo Hito">
        <form onSubmit={submitHito(onCreateHito)} className="space-y-4" noValidate>
          <div>
            <label className="glass-label">Título</label>
            <input {...regHito('titulo')} placeholder="Título del hito" className="glass-input" />
            {errHito.titulo && <p className="glass-error">⚠ {errHito.titulo.message}</p>}
          </div>
          <div>
            <label className="glass-label">Descripción (opcional)</label>
            <input {...regHito('descripcion')} placeholder="Descripción" className="glass-input" />
          </div>
          <div>
            <label className="glass-label">Fecha</label>
            <input {...regHito('fecha')} type="date" className="glass-input" />
            {errHito.fecha && <p className="glass-error">⚠ {errHito.fecha.message}</p>}
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => { setShowHitoModal(false); resetHito(); }}
              className="flex-1 py-3 rounded-xl text-sm"
              style={{ border: '1px solid var(--glass-border)', color: 'var(--muted-color)', background: 'transparent' }}>
              Cancelar
            </button>
            <motion.button type="submit" disabled={submitting} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
              className="flex-1 py-3 rounded-xl text-white font-semibold shimmer-btn disabled:opacity-50">
              {submitting ? '...' : 'Crear Hito'}
            </motion.button>
          </div>
        </form>
      </Modal>

      {/* ── Modal: Agregar Miembro ── */}
      <Modal isOpen={showMemberModal} onClose={() => { setShowMemberModal(false); setMemberSearch(''); }} title="Agregar Miembro">
        <div className="mb-3">
          <input value={memberSearch} onChange={e => setMemberSearch(e.target.value)}
            placeholder="Buscar usuario..." className="glass-input" />
        </div>
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {availableUsers.map(u => (
            <button key={u.id} onClick={() => { onAddMember(u.id); setShowMemberModal(false); setMemberSearch(''); }}
              className="w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left"
              style={{ border: '1px solid var(--glass-border)', background: 'transparent' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(99,102,241,0.08)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
                style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
                {u.nombre.charAt(0)}
              </div>
              <div>
                <p className="text-sm font-medium" style={{ color: 'var(--text-color)' }}>{u.nombre}</p>
                <p className="text-xs" style={{ color: 'var(--muted-color)' }}>{u.rol}</p>
              </div>
            </button>
          ))}
          {availableUsers.length === 0 && (
            <p className="text-center py-4 text-sm" style={{ color: 'var(--muted-color)' }}>No hay usuarios disponibles</p>
          )}
        </div>
      </Modal>

      <ConfirmDeleteModal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)}
        onConfirm={onDeleteProyecto} title="Eliminar Proyecto"
        message={`¿Estás seguro de eliminar "${proyecto.nombre}"? Esta acción no se puede deshacer.`} />

      {proyecto && <ProjectChat proyectoId={proyecto.id} isOpen={chatOpen} onToggle={() => setChatOpen(!chatOpen)} />}
    </div>
  );
}
