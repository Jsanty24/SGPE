import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { tareaService, comentarioService, archivoService, historialService, subtareaService } from '../services/apiService';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Modal from '../components/Modal';
import LoadingSkeleton from '../components/LoadingSkeleton';
import type { Tarea, Comentario, HistorialEstado } from '../types';

// ─── Validation with future date ────────────────────────────
const today = new Date().toISOString().split('T')[0];

const editSchema = z.object({
  nombre:      z.string().min(3, 'Mínimo 3 caracteres'),
  descripcion: z.string().min(5, 'Mínimo 5 caracteres'),
  prioridad:   z.enum(['ALTA', 'MEDIA', 'BAJA']),
  fechaLimite: z.string().min(1, 'La fecha es requerida').refine(
    d => new Date(d) >= new Date(today),
    { message: 'La fecha límite no puede ser en el pasado' }
  ),
  horasEstimadas: z.union([z.number(), z.string().transform(v => (v === '' ? undefined : Number(v)))]).optional(),
  horasReales: z.union([z.number(), z.string().transform(v => (v === '' ? undefined : Number(v)))]).optional(),
});
type EditFormData = z.infer<typeof editSchema>;

const prioridadStyle: Record<string, string> = {
  ALTA:  'badge-danger',
  MEDIA: 'badge-warning',
  BAJA:  'badge-success',
};
const estadoStyle: Record<string, string> = {
  PENDIENTE:   'badge-primary',
  EN_PROGRESO: 'badge-warning',
  EN_REVISION: 'badge-primary',
  TERMINADA:   'badge-success',
};

export default function TareaDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { usuario } = useAuth();
  const { success, error: toastError } = useToast();
  const [tarea, setTarea]             = useState<Tarea | null>(null);
  const [loading, setLoading]         = useState(true);
  const [comentarios, setComentarios] = useState<Comentario[]>([]);
  const [historial, setHistorial]     = useState<HistorialEstado[]>([]);
  const [nuevoComentario, setNuevoComentario] = useState('');
  const [enviando, setEnviando]       = useState(false);
  const [subiendoArchivo, setSubiendo]= useState(false);
  const [showEdit, setShowEdit]       = useState(false);
  const [activeTab, setActiveTab]     = useState<'subtareas' | 'comentarios' | 'archivos' | 'historial'>('subtareas');
  const [nuevaSubtarea, setNuevaSubtarea] = useState('');
  const [editCommentId, setEditCommentId] = useState<string | null>(null);
  const [editCommentText, setEditCommentText] = useState('');
  const [savingComment, setSavingComment] = useState(false);

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<EditFormData>({ resolver: zodResolver(editSchema) });

  const fetchTarea = useCallback(async () => {
    try {
      const { data } = await tareaService.getById(id!);
      if (data.success && data.data) {
        setTarea(data.data);
        setComentarios(data.data.comentarios || []);
      }
      const h = await historialService.getByTarea(id!);
      if (h.data.success && h.data.data) setHistorial(h.data.data);
    } catch {
      toastError('Error', 'No se pudo cargar la tarea');
    }
    finally { setLoading(false); }
  }, [id]);

  useEffect(() => { fetchTarea(); }, [fetchTarea]);

  useEffect(() => {
    if (tarea) {
      setValue('nombre', tarea.nombre);
      setValue('descripcion', tarea.descripcion);
      setValue('prioridad', tarea.prioridad);
      setValue('fechaLimite', tarea.fechaLimite?.split('T')[0] ?? '');
      setValue('horasEstimadas', tarea.horasEstimadas as any);
      setValue('horasReales', tarea.horasReales as any);
    }
  }, [tarea, setValue]);

  const onEditTarea = async (data: EditFormData) => {
    try {
      await tareaService.update(id!, data as any);
      success('Tarea actualizada', 'Los cambios fueron guardados');
      setShowEdit(false);
      fetchTarea();
    } catch (err: any) {
      toastError('Error', err.response?.data?.message || 'No se pudo actualizar');
    }
  };

  const onCommentSubmit = async () => {
    if (!nuevoComentario.trim()) return;
    setEnviando(true);
    try {
      const { data } = await comentarioService.create(id!, nuevoComentario);
      if (data.success && data.data) {
        setComentarios(prev => [data.data as Comentario, ...prev]);
        setNuevoComentario('');
        success('Comentario enviado');
      }
    } catch { toastError('Error', 'No se pudo enviar el comentario'); }
    finally { setEnviando(false); }
  };

  const onEditComment = (c: Comentario) => {
    setEditCommentId(c.id);
    setEditCommentText(c.contenido);
  };

  const onSaveEditComment = async () => {
    if (!editCommentText.trim() || !editCommentId) return;
    setSavingComment(true);
    try {
      const { data } = await comentarioService.update(editCommentId, editCommentText);
      if (data.success && data.data) {
        setComentarios(prev => prev.map(c => c.id === editCommentId ? { ...c, contenido: editCommentText } : c));
        setEditCommentId(null);
        setEditCommentText('');
        success('Comentario actualizado');
      }
    } catch { toastError('Error', 'No se pudo actualizar el comentario'); }
    finally { setSavingComment(false); }
  };

  const onDeleteComment = async (id: string) => {
    try {
      await comentarioService.delete(id);
      setComentarios(prev => prev.filter(c => c.id !== id));
      success('Comentario eliminado');
    } catch { toastError('Error', 'No se pudo eliminar el comentario'); }
  };

  const onUploadFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { toastError('Archivo demasiado grande', 'Máximo 10MB'); return; }
    setSubiendo(true);
    try {
      await archivoService.upload(id!, file);
      success('Archivo subido correctamente');
      fetchTarea();
    } catch { toastError('Error', 'No se pudo subir el archivo'); }
    finally { setSubiendo(false); }
  };

  const onDeleteArchivo = async (archivoId: string) => {
    try {
      await archivoService.delete(archivoId);
      success('Archivo eliminado');
      fetchTarea();
    } catch { toastError('Error', 'No se pudo eliminar'); }
  };

  const onChangeEstado = async (estado: string) => {
    try {
      const payload: any = {};
      if (estado === 'TERMINADA' && navigator.geolocation) {
        try {
          const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
          });
          payload.lat = pos.coords.latitude;
          payload.lng = pos.coords.longitude;
        } catch {}
      }
      await tareaService.changeEstado(id!, estado, payload);
      fetchTarea();
    } catch { toastError('Error', 'No se pudo cambiar el estado'); }
  };

  const onAddSubtarea = async () => {
    if (!nuevaSubtarea.trim()) return;
    try {
      await subtareaService.create(id!, nuevaSubtarea);
      setNuevaSubtarea('');
      fetchTarea();
    } catch { toastError('Error', 'No se pudo agregar la subtarea'); }
  };

  const onToggleSubtarea = async (subId: string, completada: boolean) => {
    try {
      await subtareaService.update(subId, completada);
      fetchTarea();
    } catch { toastError('Error', 'No se pudo actualizar la subtarea'); }
  };

  const onDeleteSubtarea = async (subId: string) => {
    try {
      await subtareaService.delete(subId);
      fetchTarea();
    } catch { toastError('Error', 'No se pudo eliminar la subtarea'); }
  };

  if (loading) return <LoadingSkeleton />;
  if (!tarea)  return (
    <div className="text-center py-16">
      <p style={{ color: 'var(--muted-color)' }}>Tarea no encontrada</p>
    </div>
  );

  const esEditor = usuario?.rol === 'ADMIN' || tarea.proyecto?.gerenteId === usuario?.id;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back */}
      <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        onClick={() => navigate(`/proyectos/${tarea.proyectoId}`)}
        className="text-sm flex items-center gap-1 transition-colors hover:text-primary-400"
        style={{ color: 'var(--muted-color)' }}>
        ← Volver al proyecto
      </motion.button>

      {/* Main card */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-2xl p-6">
        <div className="flex items-start justify-between mb-4 gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold mb-1" style={{ color: 'var(--text-color)' }}>{tarea.nombre}</h1>
            <p className="text-sm" style={{ color: 'var(--muted-color)' }}>{tarea.descripcion}</p>
          </div>
          {esEditor && (
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={() => setShowEdit(true)}
              className="flex-shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-all"
              style={{ border: '1px solid var(--glass-border)', color: 'var(--muted-color)', background: 'transparent' }}>
              ✏️ Editar
            </motion.button>
          )}
        </div>

        {/* Badges */}
        <div className="flex flex-wrap gap-2 mb-5">
          <span className={`badge ${estadoStyle[tarea.estado]}`}>{tarea.estado.replace('_', ' ')}</span>
          <span className={`badge ${prioridadStyle[tarea.prioridad]}`}>{tarea.prioridad}</span>
          <span className="badge badge-gray">
            📅 {new Date(tarea.fechaLimite).toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric' })}
          </span>
          {tarea.asignadoA && (
            <span className="badge badge-primary">👤 {tarea.asignadoA.nombre}</span>
          )}
          {(tarea.horasEstimadas !== null && tarea.horasEstimadas !== undefined) && (
            <span className="badge badge-gray">⏱️ Est: {tarea.horasEstimadas}h</span>
          )}
          {(tarea.horasReales !== null && tarea.horasReales !== undefined) && (
            <span className="badge badge-gray">⏱️ Real: {tarea.horasReales}h</span>
          )}
        </div>

        {/* Estado buttons */}
        {usuario?.rol !== 'CLIENTE' && (
          <div className="flex gap-2 flex-wrap">
            {(['PENDIENTE', 'EN_PROGRESO', 'EN_REVISION', 'TERMINADA'] as const).map(e => (
              <motion.button key={e} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                onClick={() => onChangeEstado(e)}
                disabled={tarea.estado === e || tarea.proyecto?.estado !== 'ACTIVO'}
                className="px-3 py-1.5 text-xs rounded-xl border transition-all disabled:opacity-40"
                style={{
                  border: tarea.estado === e ? '1px solid rgba(99,102,241,0.5)' : '1px solid var(--glass-border)',
                  background: tarea.estado === e ? 'rgba(99,102,241,0.15)' : 'transparent',
                  color: tarea.estado === e ? 'var(--color-primary)' : 'var(--muted-color)',
                }}>
                {e.replace('_', ' ')}
              </motion.button>
            ))}
          </div>
        )}
      </motion.div>

      {/* Tabs */}
      <div className="tab-bar">
        {(['subtareas', 'comentarios', 'archivos', 'historial'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`tab-item ${activeTab === tab ? 'active' : ''}`}>
            {tab === 'subtareas' ? `✅ Checklist (${tarea.subtareas?.length || 0})`
              : tab === 'comentarios' ? `💬 Comentarios (${comentarios.length})`
              : tab === 'archivos' ? `📎 Archivos (${tarea.archivos?.length || 0})`
              : '📜 Historial'}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <AnimatePresence mode="wait">
        {activeTab === 'subtareas' && (
          <motion.div key="sub" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
            <div className="flex gap-2 mb-4">
              <input type="text" value={nuevaSubtarea} onChange={e => setNuevaSubtarea(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && onAddSubtarea()}
                placeholder="Añadir paso al checklist..." className="glass-input flex-1" />
              <button onClick={onAddSubtarea} disabled={!nuevaSubtarea.trim()}
                className="px-4 rounded-xl text-white font-medium shimmer-btn disabled:opacity-50">
                Añadir
              </button>
            </div>
            
            <div className="space-y-2">
              {(tarea.subtareas || []).map(st => (
                <div key={st.id} className="flex items-center gap-3 p-3 rounded-xl transition-all hover:bg-white/5" style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)' }}>
                  <input type="checkbox" checked={st.completada} onChange={e => onToggleSubtarea(st.id, e.target.checked)}
                    className="w-5 h-5 rounded border-dark-border text-primary-500 focus:ring-primary-500 cursor-pointer" />
                  <span className={`flex-1 transition-all ${st.completada ? 'line-through opacity-50' : ''}`} style={{ color: 'var(--text-color)' }}>
                    {st.titulo}
                  </span>
                  <button onClick={() => onDeleteSubtarea(st.id)} aria-label="Eliminar subtarea" className="text-xl opacity-50 hover:opacity-100 transition-opacity" style={{ color: 'var(--color-danger)' }}>
                    &times;
                  </button>
                </div>
              ))}
              {!(tarea.subtareas?.length) && (
                <p className="text-center py-8 text-sm" style={{ color: 'var(--muted-color)' }}>No hay checklist</p>
              )}
            </div>
          </motion.div>
        )}

        {activeTab === 'comentarios' && (
          <motion.div key="com" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
            {usuario?.rol !== 'CLIENTE' && (
              <div className="glass-card rounded-xl p-4">
                <div className="flex gap-3">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                    style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
                    {usuario?.nombre.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <textarea value={nuevoComentario} onChange={e => setNuevoComentario(e.target.value)}
                      placeholder="Escribe un comentario..." rows={2} className="glass-input resize-none" />
                    <div className="flex justify-end mt-2">
                      <motion.button onClick={onCommentSubmit} whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                        disabled={enviando || !nuevoComentario.trim()}
                        className="px-4 py-2 text-sm rounded-xl text-white font-medium shimmer-btn disabled:opacity-50">
                        {enviando ? '...' : 'Comentar'}
                      </motion.button>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {comentarios.map((c, i) => (
              <motion.div key={c.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }} className="glass-card rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-7 h-7 rounded-full text-white text-xs font-bold flex items-center justify-center"
                    style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
                    {c.autor.nombre.charAt(0)}
                  </div>
                  <span className="text-sm font-semibold" style={{ color: 'var(--text-color)' }}>{c.autor.nombre}</span>
                  <span className="text-xs" style={{ color: 'var(--muted-color)' }}>{new Date(c.createdAt).toLocaleString()}</span>
                </div>
                {editCommentId === c.id ? (
                  <div className="pl-9 space-y-2">
                    <textarea value={editCommentText} onChange={e => setEditCommentText(e.target.value)}
                      className="glass-input resize-none w-full" rows={2} />
                    <div className="flex gap-2">
                      <button onClick={onSaveEditComment} disabled={savingComment || !editCommentText.trim()}
                        className="px-3 py-1 text-xs rounded-lg text-white disabled:opacity-50"
                        style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
                        {savingComment ? '...' : 'Guardar'}
                      </button>
                      <button onClick={() => setEditCommentId(null)}
                        className="px-3 py-1 text-xs rounded-lg" style={{ color: 'var(--muted-color)', border: '1px solid var(--glass-border)' }}>
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm pl-9" style={{ color: 'var(--text-color)' }}>{c.contenido}</p>
                )}
                {(usuario?.id === c.autorId || usuario?.rol === 'ADMIN') && editCommentId !== c.id && (
                  <div className="flex gap-2 pl-9 mt-2">
                    <button onClick={() => onEditComment(c)} className="text-xs hover:underline" style={{ color: 'var(--muted-color)' }}>Editar</button>
                    <button onClick={() => onDeleteComment(c.id)} className="text-xs hover:underline" style={{ color: 'var(--color-danger)' }}>Eliminar</button>
                  </div>
                )}
              </motion.div>
            ))}
            {comentarios.length === 0 && (
              <p className="text-center py-8 text-sm" style={{ color: 'var(--muted-color)' }}>Sin comentarios aún</p>
            )}
          </motion.div>
        )}

        {activeTab === 'archivos' && (
          <motion.div key="arch" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-3">
            {usuario?.rol !== 'CLIENTE' && (
              <div className="glass-card rounded-xl p-4">
                <label className="flex flex-col items-center justify-center gap-2 cursor-pointer py-8 border-2 border-dashed rounded-xl transition-all hover:border-primary-500/50 group"
                  style={{ borderColor: 'var(--glass-border)' }}>
                  <span className="text-3xl">{subiendoArchivo ? '⏳' : '📁'}</span>
                  <span className="text-sm" style={{ color: 'var(--muted-color)' }}>
                    {subiendoArchivo ? 'Subiendo...' : 'Haz clic para seleccionar un archivo (máx 10MB)'}
                  </span>
                  <input type="file" onChange={onUploadFile} disabled={subiendoArchivo} className="hidden" />
                </label>
              </div>
            )}
            {(tarea.archivos || []).map(a => (
              <div key={a.id} className="glass-card rounded-xl p-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">📎</span>
                  <div>
                    <p className="text-sm font-medium" style={{ color: 'var(--text-color)' }}>{a.nombre}</p>
                    <p className="text-xs" style={{ color: 'var(--muted-color)' }}>{new Date(a.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="flex gap-3">
                   <a href={archivoService.getDownloadUrl(a.id)} download={a.nombre} className="text-sm text-primary-400 hover:text-primary-300 transition-colors">Descargar</a>
                  {esEditor && (
                    <button onClick={() => onDeleteArchivo(a.id)} className="text-sm transition-colors" style={{ color: 'var(--color-danger)' }}>Eliminar</button>
                  )}
                </div>
              </div>
            ))}
            {!(tarea.archivos?.length) && (
              <p className="text-center py-8 text-sm" style={{ color: 'var(--muted-color)' }}>Sin archivos adjuntos</p>
            )}
          </motion.div>
        )}

        {activeTab === 'historial' && (
          <motion.div key="hist" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="glass-card rounded-2xl p-6">
            <div className="relative pl-6 space-y-5" style={{ borderLeft: '2px solid var(--glass-border)' }}>
              {historial.map((h, i) => (
                <motion.div key={h.id} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }} className="relative">
                  <div className="absolute -left-[31px] w-4 h-4 rounded-full border-2"
                    style={{ background: 'var(--color-primary)', borderColor: 'var(--surface-color)' }} />
                  <p className="text-sm" style={{ color: 'var(--text-color)' }}>
                    <span className="font-semibold">{h.cambiadoPor?.nombre || 'Sistema'}</span>{' '}cambió de{' '}
                    <span style={{ color: 'var(--color-warning)' }}>{h.estadoAnterior.replace('_', ' ')}</span>{' '}a{' '}
                    <span style={{ color: 'var(--color-success)' }}>{h.estadoNuevo.replace('_', ' ')}</span>
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--muted-color)' }}>
                    {new Date(h.createdAt).toLocaleString()}
                    {h.coordenadas && (
                      <span className="ml-3" style={{ color: 'var(--color-violet)' }}>
                        📍 {h.coordenadas}
                      </span>
                    )}
                  </p>
                </motion.div>
              ))}
              {historial.length === 0 && (
                <p className="text-sm" style={{ color: 'var(--muted-color)' }}>Sin cambios registrados</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit modal */}
      <Modal isOpen={showEdit} onClose={() => setShowEdit(false)} title="Editar Tarea" size="md">
        <form onSubmit={handleSubmit(onEditTarea)} className="space-y-4" noValidate>
          <div>
            <label className="glass-label">Nombre</label>
            <input {...register('nombre')} className="glass-input" />
            {errors.nombre && <p className="glass-error">⚠ {errors.nombre.message}</p>}
          </div>
          <div>
            <label className="glass-label">Descripción</label>
            <textarea {...register('descripcion')} rows={3} className="glass-input resize-none" />
            {errors.descripcion && <p className="glass-error">⚠ {errors.descripcion.message}</p>}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="glass-label">Prioridad</label>
              <select {...register('prioridad')} className="glass-select">
                <option value="ALTA">Alta</option>
                <option value="MEDIA">Media</option>
                <option value="BAJA">Baja</option>
              </select>
            </div>
            <div>
              <label className="glass-label">Fecha límite</label>
              <input {...register('fechaLimite')} type="date" min={today} className="glass-input" />
              {errors.fechaLimite && <p className="glass-error">⚠ {errors.fechaLimite.message}</p>}
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="glass-label">Horas Estimadas</label>
              <input {...register('horasEstimadas')} type="number" step="0.5" min="0" placeholder="Ej. 5.5" className="glass-input" />
              {errors.horasEstimadas && <p className="glass-error">⚠ {errors.horasEstimadas.message}</p>}
            </div>
            <div>
              <label className="glass-label">Horas Reales</label>
              <input {...register('horasReales')} type="number" step="0.5" min="0" placeholder="Ej. 6" className="glass-input" />
              {errors.horasReales && <p className="glass-error">⚠ {errors.horasReales.message}</p>}
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setShowEdit(false)}
              className="flex-1 py-3 rounded-xl text-sm transition-all"
              style={{ border: '1px solid var(--glass-border)', color: 'var(--muted-color)', background: 'transparent' }}>
              Cancelar
            </button>
            <motion.button type="submit" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
              className="flex-1 py-3 rounded-xl text-white font-semibold shimmer-btn">
              Guardar
            </motion.button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
