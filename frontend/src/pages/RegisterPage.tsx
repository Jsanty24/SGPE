import { useState, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Sphere, MeshDistortMaterial } from '@react-three/drei';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../context/AuthContext';
import { useDevicePerformance } from '../hooks/useDevicePerformance';

const schema = z.object({
  nombre: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  correo: z.string().email('Correo inválido'),
  contrasena: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
  confirmarContrasena: z.string(),
  rol: z.enum(['GERENTE', 'MIEMBRO', 'CLIENTE', 'VIEWER']).default('VIEWER'),
}).refine(data => data.contrasena === data.confirmarContrasena, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmarContrasena'],
});

type FormData = z.infer<typeof schema>;

export default function RegisterPage() {
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [registrado, setRegistrado] = useState(false);
  const { isLowEnd, isHighEnd } = useDevicePerformance();

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema)
  });

  const onSubmit = async (data: FormData) => {
    try {
      setError('');
      setLoading(true);
      await registerUser({ nombre: data.nombre, correo: data.correo, contrasena: data.contrasena, rol: data.rol });
      setRegistrado(true);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al registrarse');
    } finally {
      setLoading(false);
    }
  };

  if (registrado) {
    return (
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #0d1f2d, #01696f)' }}>
        <div className="relative z-10 w-full max-w-md mx-4 text-center">
          <div className="glass-card rounded-2xl p-8">
            <div className="text-5xl mb-6">📧</div>
            <h2 className="text-2xl font-bold text-dark-text mb-4">¡Registro exitoso!</h2>
            <p className="text-dark-muted mb-4 leading-relaxed">
              Te enviamos un correo de verificación a <strong className="text-primary-400">{/* no tenemos el correo a mano */}</strong>.
            </p>
            <p className="text-dark-muted mb-6 leading-relaxed">
              Revisa tu bandeja de entrada y haz clic en el enlace para verificar tu cuenta.
              Luego podrás iniciar sesión.
            </p>
            <div className="text-sm text-dark-muted mb-6 p-3 rounded-lg bg-dark-bg/50">
              💡 Si no lo encuentras, revisa la carpeta de spam.
            </div>
            <Link to="/login"
              className="inline-block w-full py-3 rounded-xl text-white font-semibold shimmer-btn text-center">
              Ir a iniciar sesión
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{ background: isLowEnd ? 'linear-gradient(135deg, #0d1f2d, #01696f, #0d1f2d)' : 'var(--bg-color, #09090f)', backgroundSize: isLowEnd ? '400% 400%' : undefined, animation: isLowEnd ? 'gradientShift 8s ease infinite' : undefined }}>
      {!isLowEnd && (
        <div className="absolute inset-0 opacity-20">
          <Canvas camera={{ position: [0, 0, 5] }}>
            <ambientLight intensity={0.5} />
            <Suspense fallback={null}>
              <Sphere args={[1, isHighEnd ? 64 : 32, isHighEnd ? 64 : 32]} position={[0, 0, 0]}>
                <MeshDistortMaterial color="#6366f1" distort={0.3} speed={2} roughness={0.2} metalness={0.8} />
              </Sphere>
            </Suspense>
            <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={0.5} />
          </Canvas>
        </div>
      )}

      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-dark-bg/50 to-dark-bg" />

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-md mx-4"
      >
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-dark-text mb-1">Crear Cuenta</h1>
          <p className="text-dark-muted text-sm">Únete a SGPE</p>
        </div>

        <div className="glass-card rounded-2xl p-8">
          {error && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="mb-4 p-3 rounded-lg bg-danger/10 border border-danger/30 text-danger text-sm text-center">
              {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-dark-muted mb-1">Nombre completo</label>
              <input {...register('nombre')} className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-xl text-dark-text focus:outline-none focus:border-primary-500 transition-all" placeholder="Tu nombre" />
              {errors.nombre && <p className="text-danger text-xs mt-1">{errors.nombre.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-dark-muted mb-1">Correo</label>
              <input {...register('correo')} type="email" className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-xl text-dark-text focus:outline-none focus:border-primary-500 transition-all" placeholder="correo@ejemplo.com" />
              {errors.correo && <p className="text-danger text-xs mt-1">{errors.correo.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-dark-muted mb-1">Contraseña</label>
              <input {...register('contrasena')} type="password" className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-xl text-dark-text focus:outline-none focus:border-primary-500 transition-all" placeholder="Mínimo 8 caracteres" />
              {errors.contrasena && <p className="text-danger text-xs mt-1">{errors.contrasena.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-dark-muted mb-1">Confirmar contraseña</label>
              <input {...register('confirmarContrasena')} type="password" className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-xl text-dark-text focus:outline-none focus:border-primary-500 transition-all" placeholder="Repite la contraseña" />
              {errors.confirmarContrasena && <p className="text-danger text-xs mt-1">{errors.confirmarContrasena.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-dark-muted mb-1">Rol</label>
              <select {...register('rol')} className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-xl text-dark-text focus:outline-none focus:border-primary-500 transition-all">
                <option value="VIEWER">Visitante (solo lectura)</option>
                <option value="CLIENTE">Cliente</option>
                <option value="MIEMBRO">Miembro del equipo</option>
                <option value="GERENTE">Gerente de proyectos</option>
              </select>
              {errors.rol && <p className="text-danger text-xs mt-1">{errors.rol.message}</p>}
            </div>

            <motion.button type="submit" disabled={loading} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              className="w-full py-3 rounded-xl text-white font-semibold shimmer-btn disabled:opacity-50">
              {loading ? 'Registrando...' : 'Crear Cuenta'}
            </motion.button>
          </form>

          <p className="mt-6 text-center text-sm text-dark-muted">
            ¿Ya tienes cuenta? <Link to="/login" className="text-primary-400 hover:text-primary-300 font-medium">Inicia sesión</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
