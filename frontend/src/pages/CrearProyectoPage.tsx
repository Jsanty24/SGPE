import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { proyectoService, usuarioService } from '../services/apiService';
import { useToast } from '../context/ToastContext';
import type { Usuario } from '../types';

// ─── Validation schema with cross-field date rules ──────────
const today = new Date(); today.setHours(0, 0, 0, 0);

const schema = z.object({
  nombre: z.string().min(3, 'El nombre debe tener al menos 3 caracteres'),
  descripcion: z.string().min(10, 'La descripción debe tener al menos 10 caracteres'),
  cliente: z.string().optional(),
  fechaInicio: z.string().min(1, 'La fecha de inicio es requerida'),
  fechaFin: z.string().min(1, 'La fecha de fin es requerida'),
}).refine(data => {
  if (!data.fechaInicio || !data.fechaFin) return true;
  return new Date(data.fechaFin) > new Date(data.fechaInicio);
}, {
  message: 'La fecha de fin debe ser posterior a la fecha de inicio',
  path: ['fechaFin'],
});

type FormData = z.infer<typeof schema>;

export default function CrearProyectoPage() {
  const navigate = useNavigate();
  const { success, error } = useToast();
  const [loading, setLoading] = useState(false);
  const [miembrosSeleccionados, setMiembrosSeleccionados] = useState<Usuario[]>([]);
  const [searchMiembro, setSearchMiembro] = useState('');
  const [resultadosBusqueda, setResultadosBusqueda] = useState<Usuario[]>([]);
  const [buscando, setBuscando] = useState(false);

  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormData>({ resolver: zodResolver(schema) });
  const fechaInicioVal = watch('fechaInicio');

  const buscarUsuarios = useCallback(async (q: string) => {
    if (q.length < 1) { setResultadosBusqueda([]); return; }
    setBuscando(true);
    try {
      const { data } = await usuarioService.buscar(q);
      if (data.success && data.data) {
        setResultadosBusqueda(data.data.filter((u: Usuario) =>
          u.rol !== 'ADMIN' && !miembrosSeleccionados.find(m => m.id === u.id)
        ));
      }
    } catch { setResultadosBusqueda([]); }
    finally { setBuscando(false); }
  }, [miembrosSeleccionados]);

  useEffect(() => {
    const timer = setTimeout(() => buscarUsuarios(searchMiembro), 300);
    return () => clearTimeout(timer);
  }, [searchMiembro, buscarUsuarios]);

  const toggleMiembro = (usuario: Usuario) => {
    setMiembrosSeleccionados(prev =>
      prev.find(m => m.id === usuario.id)
        ? prev.filter(m => m.id !== usuario.id)
        : [...prev, usuario]
    );
    setSearchMiembro('');
    setResultadosBusqueda([]);
  };

  const onSubmit = async (data: FormData) => {
    try {
      setLoading(true);
      const { data: resp } = await proyectoService.create({ ...data, miembros: miembrosSeleccionados.map(m => m.id) });
      if (resp.success) {
        success('Proyecto creado', `"${data.nombre}" fue creado exitosamente`);
        navigate('/proyectos');
      }
    } catch (err: any) {
      error('Error al crear proyecto', err.response?.data?.message || 'Intenta de nuevo');
    } finally { setLoading(false); }
  };

  const rolColor: Record<string, string> = { GERENTE: 'badge-primary', MIEMBRO: 'badge-gray', CLIENTE: 'badge-gray', VIEWER: 'badge-gray' };

  return (
    <div className="max-w-2xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--text-color)' }}>Nuevo Proyecto</h1>
        <p className="text-sm mb-8" style={{ color: 'var(--muted-color)' }}>Crea un proyecto y conforma tu equipo</p>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="glass-card rounded-3xl p-8">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>

          {/* Nombre */}
          <div>
            <label className="glass-label">Nombre del proyecto *</label>
            <input {...register('nombre')} className="glass-input" placeholder="Ej: Sistema de Inventarios" />
            {errors.nombre && <p className="glass-error">⚠ {errors.nombre.message}</p>}
          </div>

          {/* Descripción */}
          <div>
            <label className="glass-label">Descripción *</label>
            <textarea {...register('descripcion')} rows={3} className="glass-input resize-none" placeholder="Describe el objetivo del proyecto..." />
            {errors.descripcion && <p className="glass-error">⚠ {errors.descripcion.message}</p>}
          </div>

          {/* Cliente */}
          <div>
            <label className="glass-label">Cliente / Empresa</label>
            <input {...register('cliente')} className="glass-input" placeholder="Ej: Empresa ABC S.A.C." />
          </div>

          {/* Fechas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="glass-label">Fecha de inicio *</label>
              <input {...register('fechaInicio')} type="date" className="glass-input"
                min={new Date(today.getTime() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]} />
              {errors.fechaInicio && <p className="glass-error">⚠ {errors.fechaInicio.message}</p>}
            </div>
            <div>
              <label className="glass-label">Fecha de fin *</label>
              <input {...register('fechaFin')} type="date" className="glass-input"
                min={fechaInicioVal || today.toISOString().split('T')[0]} />
              {errors.fechaFin && <p className="glass-error">⚠ {errors.fechaFin.message}</p>}
            </div>
          </div>

          {/* Miembros */}
          <div>
            <label className="glass-label">Equipo del proyecto ({miembrosSeleccionados.length} seleccionados)</label>
            {miembrosSeleccionados.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {miembrosSeleccionados.map(m => (
                  <span key={m.id} className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs"
                    style={{ background: 'rgba(99,102,241,0.15)', color: 'var(--text-color)', border: '1px solid rgba(99,102,241,0.3)' }}>
                    {m.nombre}
                    <button type="button" onClick={() => toggleMiembro(m)} className="ml-1 hover:text-danger">✕</button>
                  </span>
                ))}
              </div>
            )}
            <div className="relative">
              <input
                value={searchMiembro}
                onChange={e => setSearchMiembro(e.target.value)}
                className="glass-input"
                placeholder="Buscar por nombre, correo o código (ej: #2)..."
              />
              {buscando && <p className="text-xs mt-1" style={{ color: 'var(--muted-color)' }}>Buscando...</p>}
              {resultadosBusqueda.length > 0 && (
                <div className="absolute z-20 w-full mt-1 rounded-xl overflow-hidden shadow-lg"
                  style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', backdropFilter: 'blur(20px)' }}>
                  {resultadosBusqueda.map(u => (
                    <button key={u.id} type="button" onClick={() => toggleMiembro(u)}
                      className="w-full flex items-center gap-3 p-3 text-left hover:bg-white/5 transition-colors">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
                        style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
                        {u.nombre.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium" style={{ color: 'var(--text-color)' }}>{u.nombre} <span className="text-xs" style={{ color: 'var(--muted-color)' }}>#{u.codigo}</span></p>
                        <p className="text-xs" style={{ color: 'var(--muted-color)' }}>{u.correo} · <span className={`badge ${rolColor[u.rol] || 'badge-gray'} text-xs`}>{u.rol}</span></p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => navigate('/proyectos')}
              className="flex-1 py-3 rounded-xl text-sm font-medium transition-all"
              style={{ border: '1px solid var(--glass-border)', color: 'var(--muted-color)', background: 'transparent' }}>
              Cancelar
            </button>
            <motion.button type="submit" disabled={loading} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
              className="flex-1 py-3 rounded-xl text-white font-semibold shimmer-btn disabled:opacity-50 flex items-center justify-center gap-2">
              {loading ? (
                <>
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                    className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />
                  Creando...
                </>
              ) : 'Crear Proyecto'}
            </motion.button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
