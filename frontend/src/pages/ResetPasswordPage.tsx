import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { authService } from '../services/apiService';

const schema = z.object({
  contrasena: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
  confirmar: z.string(),
}).refine(data => data.contrasena === data.confirmar, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmar'],
});

type FormData = z.infer<typeof schema>;

export default function ResetPasswordPage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    try {
      setError('');
      setLoading(true);
      if (!token) {
        setError('Token no valido. Solicita un nuevo enlace de recuperacion.');
        return;
      }
      await authService.resetPassword(token, data.contrasena);
      setSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al restablecer contraseña');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-bg">
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md mx-4">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-dark-text mb-1">Nueva Contraseña</h1>
        </div>
        <div className="glass-card rounded-2xl p-8">
          {success ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
              <div className="text-4xl mb-4">✅</div>
              <h3 className="text-lg font-semibold text-dark-text mb-2">Contraseña actualizada</h3>
              <p className="text-dark-muted text-sm mb-6">Ya puedes iniciar sesión con tu nueva contraseña.</p>
              <button onClick={() => navigate('/login')} className="px-6 py-2 rounded-xl text-white font-semibold shimmer-btn">Ir al login</button>
            </motion.div>
          ) : (
            <>
              {error && <div className="mb-4 p-3 rounded-lg bg-danger/10 border border-danger/30 text-danger text-sm text-center">{error}</div>}
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-dark-muted mb-2">Nueva contraseña</label>
                  <input {...register('contrasena')} type="password" className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-xl text-dark-text focus:outline-none focus:border-primary-500 transition-all" placeholder="Mínimo 8 caracteres" />
                  {errors.contrasena && <p className="text-danger text-xs mt-1">{errors.contrasena.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark-muted mb-2">Confirmar contraseña</label>
                  <input {...register('confirmar')} type="password" className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-xl text-dark-text focus:outline-none focus:border-primary-500 transition-all" placeholder="Repite la contraseña" />
                  {errors.confirmar && <p className="text-danger text-xs mt-1">{errors.confirmar.message}</p>}
                </div>
                <motion.button type="submit" disabled={loading} whileHover={{ scale: 1.02 }} className="w-full py-3 rounded-xl text-white font-semibold shimmer-btn disabled:opacity-50">
                  {loading ? 'Actualizando...' : 'Restablecer contraseña'}
                </motion.button>
              </form>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
