import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { proyectoService } from '../services/apiService';
import { useToast } from '../context/ToastContext';

const schema = z.object({
  nombre:      z.string().min(3, 'Mínimo 3 caracteres'),
  descripcion: z.string().min(10, 'Mínimo 10 caracteres'),
  cliente:     z.string().optional(),
  fechaInicio: z.string().min(1, 'Requerido'),
  fechaFin:    z.string().min(1, 'Requerido'),
  estado:      z.enum(['ACTIVO', 'EN_PAUSA', 'CERRADO']),
}).refine(data => {
  if (!data.fechaInicio || !data.fechaFin) return true;
  return new Date(data.fechaFin) > new Date(data.fechaInicio);
}, {
  message: 'La fecha de fin debe ser posterior a la fecha de inicio',
  path: ['fechaFin'],
});

type FormData = z.infer<typeof schema>;

export default function EditarProyectoPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { success, error: toastError } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<FormData>({ resolver: zodResolver(schema) });
  const fechaInicioVal = watch('fechaInicio');

  useEffect(() => {
    proyectoService.getById(id!).then(({ data }) => {
      if (data.success && data.data) {
        const p = data.data;
        setValue('nombre', p.nombre);
        setValue('descripcion', p.descripcion);
        setValue('cliente', p.cliente || '');
        setValue('fechaInicio', p.fechaInicio.split('T')[0]);
        setValue('fechaFin', p.fechaFin.split('T')[0]);
        setValue('estado', p.estado);
      }
      setLoading(false);
    }).catch(() => { setLoading(false); toastError('Error', 'No se pudo cargar el proyecto'); });
  }, [id, setValue, toastError]);

  const onSubmit = async (data: FormData) => {
    try {
      setSaving(true);
      await proyectoService.update(id!, data);
      success('Proyecto actualizado', 'Los cambios fueron guardados');
      navigate(`/proyectos/${id}`);
    } catch (err: any) {
      toastError('Error al guardar', err.response?.data?.message || 'Intenta de nuevo');
    } finally { setSaving(false); }
  };

  if (loading) return (
    <div className="max-w-2xl mx-auto space-y-4 animate-pulse">
      <div className="h-8 rounded-lg w-1/3" style={{ background: 'var(--glass-bg)' }} />
      <div className="h-64 rounded-2xl" style={{ background: 'var(--glass-bg)' }} />
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}>
        <button onClick={() => navigate(`/proyectos/${id}`)}
          className="text-sm mb-4 flex items-center gap-1 transition-colors hover:text-primary-400"
          style={{ color: 'var(--muted-color)' }}>
          ← Volver al proyecto
        </button>
        <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--text-color)' }}>Editar Proyecto</h1>
        <p className="text-sm mb-8" style={{ color: 'var(--muted-color)' }}>Modifica los datos del proyecto</p>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="glass-card rounded-3xl p-8">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>

          <div>
            <label className="glass-label">Nombre *</label>
            <input {...register('nombre')} className="glass-input" />
            {errors.nombre && <p className="glass-error">⚠ {errors.nombre.message}</p>}
          </div>

          <div>
            <label className="glass-label">Descripción *</label>
            <textarea {...register('descripcion')} rows={3} className="glass-input resize-none" />
            {errors.descripcion && <p className="glass-error">⚠ {errors.descripcion.message}</p>}
          </div>

          <div>
            <label className="glass-label">Cliente / Empresa</label>
            <input {...register('cliente')} className="glass-input" placeholder="Ej: Empresa ABC" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="glass-label">Fecha de inicio</label>
              <input {...register('fechaInicio')} type="date" className="glass-input" />
              {errors.fechaInicio && <p className="glass-error">⚠ {errors.fechaInicio.message}</p>}
            </div>
            <div>
              <label className="glass-label">Fecha de fin</label>
              <input {...register('fechaFin')} type="date" className="glass-input"
                min={fechaInicioVal || ''} />
              {errors.fechaFin && <p className="glass-error">⚠ {errors.fechaFin.message}</p>}
            </div>
          </div>

          <div>
            <label className="glass-label">Estado</label>
            <select {...register('estado')} className="glass-select">
              <option value="ACTIVO">Activo</option>
              <option value="EN_PAUSA">En Pausa</option>
              <option value="CERRADO">Cerrado</option>
            </select>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => navigate(`/proyectos/${id}`)}
              className="flex-1 py-3 rounded-xl text-sm font-medium transition-all"
              style={{ border: '1px solid var(--glass-border)', color: 'var(--muted-color)', background: 'transparent' }}>
              Cancelar
            </button>
            <motion.button type="submit" disabled={saving} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
              className="flex-1 py-3 rounded-xl text-white font-semibold shimmer-btn disabled:opacity-50 flex items-center justify-center gap-2">
              {saving ? (
                <>
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                    className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />
                  Guardando...
                </>
              ) : 'Guardar Cambios'}
            </motion.button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
