import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { usuarioService, tareaService, proyectoService } from '../services/apiService';
import UserAvatar from '../components/UserAvatar';

const perfilSchema = z.object({
  nombre: z.string().min(2, 'Mínimo 2 caracteres'),
  correo: z.string().email('Correo inválido'),
});

const passwordSchema = z.object({
  contrasenaActual: z.string().min(1, 'Requerido'),
  contrasenaNueva: z.string().min(6, 'Mínimo 6 caracteres'),
  confirmar:        z.string().min(6, 'Mínimo 6 caracteres'),
}).refine(d => d.contrasenaNueva === d.confirmar, {
  message: 'Las contraseñas no coinciden', path: ['confirmar'],
});

type PerfilForm = z.infer<typeof perfilSchema>;
type PasswordForm = z.infer<typeof passwordSchema>;

const AVATAR_COLORS = [
  'linear-gradient(135deg,#6366f1,#8b5cf6)',
  'linear-gradient(135deg,#10b981,#059669)',
  'linear-gradient(135deg,#f59e0b,#d97706)',
  'linear-gradient(135deg,#ef4444,#dc2626)',
  'linear-gradient(135deg,#3b82f6,#2563eb)',
];

export default function PerfilPage() {
  const { usuario, refreshUser } = useAuth() as any;
  const { success, error: toastError } = useToast();
  const [activeTab, setActiveTab] = useState<'info' | 'seguridad' | 'estadisticas' | 'nomolestar'>('info');
  const [stats, setStats] = useState({ tareas: 0, completadas: 0, proyectos: 0 });
  const [savingPerfil, setSavingPerfil] = useState(false);
  const [savingPass, setSavingPass]     = useState(false);
  const [uploadingAvatar, setUploading] = useState(false);
  const [showPass, setShowPass]         = useState({ actual: false, nueva: false, conf: false });
  const [noMolestar, setNoMolestar]     = useState(false);
  const [noMolInicio, setNoMolInicio]   = useState('22:00');
  const [noMolFin, setNoMolFin]         = useState('08:00');
  const [savingNM, setSavingNM]         = useState(false);

  const { register: regPerfil, handleSubmit: submitPerfil, formState: { errors: errPerfil } } =
    useForm<PerfilForm>({ resolver: zodResolver(perfilSchema), defaultValues: { nombre: usuario?.nombre, correo: usuario?.correo } });

  const { register: regPass, handleSubmit: submitPass, reset: resetPass, formState: { errors: errPass } } =
    useForm<PasswordForm>({ resolver: zodResolver(passwordSchema) });

  useEffect(() => {
    Promise.allSettled([
      tareaService.getMyTasks(),
      proyectoService.getAll(),
    ]).then(([tareasRes, proyRes]) => {
      const tareas = tareasRes.status === 'fulfilled' ? tareasRes.value?.data?.data ?? [] : [];
      const proyectos = proyRes.status === 'fulfilled' ? proyRes.value?.data?.data ?? [] : [];
      setStats({
        tareas: tareas.length,
        completadas: tareas.filter((t: any) => t.estado === 'TERMINADA').length,
        proyectos: proyectos.filter((p: any) => p.miembros?.some((m: any) => m.usuarioId === usuario?.id) || p.gerenteId === usuario?.id).length,
      });
    }).catch((err) => console.error('Error al cargar stats:', err));
  }, [usuario?.id]);

  const onSavePerfil = async (data: PerfilForm) => {
    setSavingPerfil(true);
    try {
      const res = await usuarioService.update(usuario!.id, data);
      if (res.data.success && res.data.data) {
        refreshUser(res.data.data);
      }
      success('Perfil actualizado', 'Tus datos fueron guardados');
    } catch (err: any) {
      toastError('Error', err.response?.data?.message || 'No se pudo actualizar');
    } finally { setSavingPerfil(false); }
  };

  const onAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { toastError('Error', 'Imagen máximo 2MB'); return; }
    setUploading(true);
    try {
      const res = await usuarioService.uploadAvatar(usuario!.id, file);
      if (res.data.success && res.data.data) {
        refreshUser(res.data.data);
        success('Avatar actualizado');
      }
    } catch { toastError('Error', 'No se pudo subir la imagen'); }
    finally { setUploading(false); }
  };

  const onSavePass = async (data: PasswordForm) => {
    setSavingPass(true);
    try {
      await usuarioService.changePassword(usuario!.id, data.contrasenaActual, data.contrasenaNueva);
      success('Contraseña actualizada', 'Tu contraseña ha sido cambiada correctamente');
      resetPass();
    } catch (err: any) {
      toastError('Error', err.response?.data?.message || 'No se pudo cambiar la contraseña');
    } finally { setSavingPass(false); }
  };

  const onSaveNoMolestar = async () => {
    setSavingNM(true);
    try {
      await usuarioService.noMolestar(usuario!.id, { activo: noMolestar, inicio: noMolInicio, fin: noMolFin });
      success('Configuracion guardada', 'Modo no molestar actualizado');
    } catch (err: any) {
      toastError('Error', err.response?.data?.message || 'No se pudo guardar');
    } finally { setSavingNM(false); }
  };

  const avatarBg = AVATAR_COLORS[(usuario?.nombre || '').charCodeAt(0) % AVATAR_COLORS.length];
  const eficiencia = stats.tareas > 0 ? Math.round((stats.completadas / stats.tareas) * 100) : 0;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* ── Profile header card ── */}
      <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-2xl p-6 overflow-hidden relative">
        {/* BG glow */}
        <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full blur-3xl opacity-15 pointer-events-none"
          style={{ background: avatarBg }} />
        {/* Aurora top bar */}
        <div className="absolute top-0 left-0 right-0 h-1 aurora-bg rounded-t-2xl" />

        <div className="relative flex flex-col sm:flex-row items-center sm:items-start gap-5 pt-3">
          {/* Avatar */}
          <div className="relative flex-shrink-0 group">
            <label className="cursor-pointer block">
              <UserAvatar usuario={usuario} size="lg" />
              <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-white text-xs font-medium">📷</span>
              </div>
              <input type="file" accept="image/*" className="hidden" onChange={onAvatarUpload} disabled={uploadingAvatar} />
            </label>
            {uploadingAvatar && <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center"><span className="text-white text-xs">...</span></div>}
            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2"
              style={{ background: 'var(--color-success)', borderColor: 'var(--surface-color)' }} />
          </div>
          {/* Info */}
          <div className="flex-1 text-center sm:text-left">
            <h1 className="text-2xl font-black" style={{ color: 'var(--text-color)' }}>{usuario?.nombre}</h1>
            <p className="text-sm" style={{ color: 'var(--muted-color)' }}>{usuario?.correo}</p>
            <div className="flex gap-2 justify-center sm:justify-start mt-2 flex-wrap">
              <span className={`badge ${{ ADMIN: 'badge-danger', GERENTE: 'badge-warning', MIEMBRO: 'badge-primary', CLIENTE: 'badge-gray' }[usuario?.rol as string] || 'badge-gray'}`}>
                {usuario?.rol}
              </span>
              <span className="badge badge-success">Activo</span>
            </div>
          </div>
          {/* Quick stats */}
          <div className="flex gap-4 shrink-0">
            {[
              { label: 'Proyectos', value: stats.proyectos },
              { label: 'Tareas', value: stats.tareas },
              { label: 'Eficiencia', value: `${eficiencia}%` },
            ].map(s => (
              <div key={s.label} className="text-center">
                <p className="text-xl font-black" style={{ color: 'var(--text-color)' }}>{s.value}</p>
                <p className="text-xs" style={{ color: 'var(--muted-color)' }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* ── Tabs ── */}
      <div className="tab-bar">
        {(['info', 'seguridad', 'estadisticas', 'nomolestar'] as const).map(t => (
          <button key={t} onClick={() => setActiveTab(t)} className={`tab-item ${activeTab === t ? 'active' : ''}`}>
            {t === 'info' ? '✏️ Información' : t === 'seguridad' ? '🔐 Contraseña' : t === 'nomolestar' ? '🌙 No Molestar' : '📊 Estadísticas'}
          </button>
        ))}
      </div>

      {/* ── Tab Content ── */}
      <AnimatePresence mode="wait">
        {activeTab === 'info' && (
          <motion.div key="info" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="glass-card rounded-2xl p-6">
            <h2 className="font-bold text-lg mb-4" style={{ color: 'var(--text-color)' }}>Información personal</h2>
            <form onSubmit={submitPerfil(onSavePerfil)} className="space-y-4" noValidate>
              <div>
                <label className="glass-label">Nombre completo</label>
                <input {...regPerfil('nombre')} className="glass-input" />
                {errPerfil.nombre && <p className="glass-error">⚠ {errPerfil.nombre.message}</p>}
              </div>
              <div>
                <label className="glass-label">Correo electrónico</label>
                <input {...regPerfil('correo')} type="email" className="glass-input" />
                {errPerfil.correo && <p className="glass-error">⚠ {errPerfil.correo.message}</p>}
              </div>
              <div>
                <label className="glass-label">Rol en el sistema</label>
                <input value={usuario?.rol} disabled className="glass-input opacity-50" />
                <p className="text-xs mt-1" style={{ color: 'var(--muted-color)' }}>El rol solo puede ser cambiado por un administrador</p>
              </div>
              <div>
                <label className="glass-label">Tu ID de usuario</label>
                <div className="flex items-center gap-2">
                  <code className="glass-input flex-1 text-lg font-bold select-all" style={{ fontFamily: 'monospace', background: 'var(--surface-color)', letterSpacing: '2px' }}>
                    #{usuario?.codigo || usuario?.id?.slice(0, 8)}
                  </code>
                  <motion.button type="button" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                    onClick={() => { navigator.clipboard.writeText(String(usuario?.codigo || '')); success('Copiado', 'ID copiado al portapapeles'); }}
                    className="px-3 py-2 rounded-xl text-xs font-medium shrink-0"
                    style={{ border: '1px solid var(--glass-border)', color: 'var(--text-color)' }}>
                    📋 Copiar
                  </motion.button>
                </div>
              </div>
              <motion.button type="submit" disabled={savingPerfil} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                className="w-full py-3 rounded-xl text-white font-semibold shimmer-btn disabled:opacity-50">
                {savingPerfil ? '💾 Guardando...' : '💾 Guardar cambios'}
              </motion.button>
            </form>
          </motion.div>
        )}

        {activeTab === 'seguridad' && (
          <motion.div key="pass" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="glass-card rounded-2xl p-6">
            <h2 className="font-bold text-lg mb-4" style={{ color: 'var(--text-color)' }}>Cambiar contraseña</h2>
            <form onSubmit={submitPass(onSavePass)} className="space-y-4" noValidate>
              {([
                { name: 'contrasenaActual', label: 'Contraseña actual', key: 'actual' },
                { name: 'contrasenaNueva', label: 'Nueva contraseña', key: 'nueva' },
                { name: 'confirmar',       label: 'Confirmar contraseña', key: 'conf' },
              ] as const).map(f => (
                <div key={f.name}>
                  <label className="glass-label">{f.label}</label>
                  <div className="relative">
                    <input {...regPass(f.name)} type={showPass[f.key] ? 'text' : 'password'} className="glass-input pr-10" />
                    <button type="button" onClick={() => setShowPass(p => ({ ...p, [f.key]: !p[f.key] }))}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-sm"
                      style={{ color: 'var(--muted-color)' }}>
                      {showPass[f.key] ? '🙈' : '👁️'}
                    </button>
                  </div>
                  {errPass[f.name] && <p className="glass-error">⚠ {errPass[f.name]?.message}</p>}
                </div>
              ))}
              <motion.button type="submit" disabled={savingPass} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                className="w-full py-3 rounded-xl text-white font-semibold shimmer-btn disabled:opacity-50">
                {savingPass ? 'Actualizando...' : '🔐 Cambiar contraseña'}
              </motion.button>
            </form>
          </motion.div>
        )}

        {activeTab === 'estadisticas' && (
          <motion.div key="stats" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="glass-card rounded-2xl p-6 space-y-5">
            <h2 className="font-bold text-lg" style={{ color: 'var(--text-color)' }}>Mi rendimiento</h2>
            {[
              { label: 'Proyectos activos', value: stats.proyectos, color: '#6366f1', max: Math.max(stats.proyectos, 10) },
              { label: 'Tareas asignadas', value: stats.tareas, color: '#f59e0b', max: Math.max(stats.tareas, 10) },
              { label: 'Tareas completadas', value: stats.completadas, color: '#10b981', max: Math.max(stats.tareas, 1) },
            ].map(s => (
              <div key={s.label}>
                <div className="flex justify-between text-sm mb-1.5">
                  <span style={{ color: 'var(--muted-color)' }}>{s.label}</span>
                  <span className="font-semibold" style={{ color: 'var(--text-color)' }}>{s.value}</span>
                </div>
                <div className="progress-track">
                  <motion.div className="progress-fill" style={{ background: s.color }}
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min((s.value / s.max) * 100, 100)}%` }}
                    transition={{ duration: 1.2, ease: 'easeOut', delay: 0.3 }} />
                </div>
              </div>
            ))}
            {/* Eficiencia big number */}
            <div className="text-center py-4" style={{ borderTop: '1px solid var(--glass-border)' }}>
              <p className="text-6xl font-black" style={{ color: eficiencia >= 70 ? 'var(--color-success)' : eficiencia >= 40 ? 'var(--color-warning)' : 'var(--color-danger)' }}>
                {eficiencia}%
              </p>
              <p className="text-sm mt-1" style={{ color: 'var(--muted-color)' }}>Eficiencia global</p>
            </div>
          </motion.div>
        )}

        {activeTab === 'nomolestar' && (
          <motion.div key="nm" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="glass-card rounded-2xl p-6 space-y-5">
            <h2 className="font-bold text-lg" style={{ color: 'var(--text-color)' }}>Modo No Molestar</h2>
            <p className="text-sm" style={{ color: 'var(--muted-color)' }}>
              Cuando esta activo, no recibiras notificaciones en el rango horario configurado.
            </p>
            <div className="flex items-center gap-3">
              <label className="text-sm" style={{ color: 'var(--text-color)' }}>Activar:</label>
              <button onClick={() => setNoMolestar(!noMolestar)}
                className={`w-12 h-6 rounded-full transition-all ${noMolestar ? 'bg-success' : 'bg-gray-400'}`}>
                <div className={`w-5 h-5 rounded-full bg-white transition-all ${noMolestar ? 'translate-x-6' : 'translate-x-0.5'}`} />
              </button>
            </div>
            {noMolestar && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="glass-label">Desde</label>
                  <input type="time" value={noMolInicio} onChange={e => setNoMolInicio(e.target.value)}
                    className="glass-input" />
                </div>
                <div>
                  <label className="glass-label">Hasta</label>
                  <input type="time" value={noMolFin} onChange={e => setNoMolFin(e.target.value)}
                    className="glass-input" />
                </div>
              </div>
            )}
            {noMolestar && (
              <p className="text-xs" style={{ color: 'var(--muted-color)' }}>
                No recibiras notificaciones entre las {noMolInicio} y las {noMolFin}
              </p>
            )}
            <motion.button type="button" disabled={savingNM} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
              onClick={onSaveNoMolestar}
              className="w-full py-3 rounded-xl text-white font-semibold shimmer-btn disabled:opacity-50">
              {savingNM ? 'Guardando...' : '💾 Guardar configuracion'}
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
