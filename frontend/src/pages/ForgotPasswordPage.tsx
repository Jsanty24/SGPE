import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { authService } from '../services/apiService';

const schema = z.object({ correo: z.string().email('Correo inválido') });
type FormData = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    try {
      setError('');
      setLoading(true);
      await authService.forgotPassword(data.correo);
      setSent(true);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al enviar correo');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-bg">
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md mx-4">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-dark-text mb-1">Recuperar Contraseña</h1>
          <p className="text-dark-muted text-sm">Te enviaremos un enlace para restablecer tu contraseña</p>
        </div>

        <div className="glass-card rounded-2xl p-8">
          {sent ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
              <div className="text-4xl mb-4">📧</div>
              <h3 className="text-lg font-semibold text-dark-text mb-2">Revisa tu correo</h3>
              <p className="text-dark-muted text-sm mb-6">Si el correo existe, recibirás un enlace de recuperación.</p>
              <Link to="/login" className="text-primary-400 hover:text-primary-300 font-medium">Volver al inicio de sesión</Link>
            </motion.div>
          ) : (
            <>
              {error && <div className="mb-4 p-3 rounded-lg bg-danger/10 border border-danger/30 text-danger text-sm text-center">{error}</div>}
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-dark-muted mb-2">Correo electrónico</label>
                  <input {...register('correo')} type="email" className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-xl text-dark-text focus:outline-none focus:border-primary-500 transition-all" placeholder="correo@ejemplo.com" />
                  {errors.correo && <p className="text-danger text-xs mt-1">{errors.correo.message}</p>}
                </div>
                <motion.button type="submit" disabled={loading} whileHover={{ scale: 1.02 }} className="w-full py-3 rounded-xl text-white font-semibold shimmer-btn disabled:opacity-50">
                  {loading ? 'Enviando...' : 'Enviar enlace'}
                </motion.button>
              </form>
              <p className="mt-4 text-center text-sm"><Link to="/login" className="text-primary-400 hover:text-primary-300">Volver al login</Link></p>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
