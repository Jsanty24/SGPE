import { useState, useRef, Suspense, useMemo, useEffect, useCallback } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Points, PointMaterial } from '@react-three/drei';
import { motion, useMotionValue, useSpring } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import * as THREE from 'three';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useDevicePerformance } from '../hooks/useDevicePerformance';

const schema = z.object({
  correo: z.string().email('Correo inválido'),
  contrasena: z.string().min(1, 'La contraseña es requerida'),
});
type FormData = z.infer<typeof schema>;

/* ─── Particle Field ──────────────────────────────────────── */
function ParticleSwarm({ count = 2500 }: { count?: number }) {
  const ref = useRef<any>();
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < arr.length; i += 3) {
      const r = 3 + Math.random() * 6;
      const theta = 2 * Math.PI * Math.random();
      const phi = Math.acos(2 * Math.random() - 1);
      arr[i]     = r * Math.sin(phi) * Math.cos(theta);
      arr[i + 1] = r * Math.sin(phi) * Math.sin(theta);
      arr[i + 2] = r * Math.cos(phi);
    }
    return arr;
  }, [count]);

  useFrame(state => {
    if (ref.current) {
      ref.current.rotation.x = state.clock.elapsedTime * 0.04;
      ref.current.rotation.y = state.clock.elapsedTime * 0.08;
    }
  });

  return (
    <Points ref={ref} positions={positions} stride={3} frustumCulled={false}>
      <PointMaterial transparent color="#8b5cf6" size={0.04} sizeAttenuation depthWrite={false} blending={THREE.AdditiveBlending} />
    </Points>
  );
}

function Scene3D({ count = 2500 }: { count?: number }) {
  return (
    <Canvas camera={{ position: [0, 0, 8] }} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', willChange: 'transform' }}>
      <ambientLight intensity={0.4} />
      <Suspense fallback={null}>
        <ParticleSwarm count={count} />
      </Suspense>
      <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={0.4} />
    </Canvas>
  );
}

/* ─── 3D tilt card ────────────────────────────────────────── */
function TiltCard({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const rotX = useMotionValue(0);
  const rotY = useMotionValue(0);
  const springX = useSpring(rotX, { stiffness: 300, damping: 30 });
  const springY = useSpring(rotY, { stiffness: 300, damping: 30 });

  const onMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    rotX.set(((e.clientY - cy) / rect.height) * -12);
    rotY.set(((e.clientX - cx) / rect.width) * 12);
  }, [rotX, rotY]);

  const onLeave = useCallback(() => { rotX.set(0); rotY.set(0); }, [rotX, rotY]);

  return (
    <motion.div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      style={{ rotateX: springX, rotateY: springY, transformStyle: 'preserve-3d', perspective: 1200 }}
    >
      {children}
    </motion.div>
  );
}

/* ─── Page ────────────────────────────────────────────────── */
export default function LoginPage() {
  const { login } = useAuth();
  const { error: toastError } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [capsLock, setCapsLock] = useState(false);
  const emailRef = useRef<HTMLInputElement>(null);
  const { isLowEnd, isHighEnd } = useDevicePerformance();

  const particleCount = isLowEnd ? 500 : isHighEnd ? 2500 : 1500;

  // Auto-focus on email
  useEffect(() => { setTimeout(() => emailRef.current?.focus(), 400); }, []);

  // Caps lock detection
  useEffect(() => {
    const handler = (e: KeyboardEvent) => setCapsLock(e.getModifierState('CapsLock'));
    window.addEventListener('keydown', handler);
    window.addEventListener('keyup', handler);
    return () => { window.removeEventListener('keydown', handler); window.removeEventListener('keyup', handler); };
  }, []);

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<FormData>({ resolver: zodResolver(schema) });
  const { ref: correoRef, ...correoRest } = register('correo');

  const onSubmit = async (data: FormData) => {
    try {
      setLoading(true);
      await login(data.correo, data.contrasena);
      navigate('/proyectos');
    } catch (err: any) {
      toastError('Error al iniciar sesión', err.response?.data?.message || 'Credenciales inválidas');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{ background: 'var(--bg-color, #09090f)' }}>
      {/* 3D particles — adaptativo segun dispositivo */}
      <div className="absolute inset-0 opacity-45 pointer-events-none">
        <Scene3D count={particleCount} />
      </div>

      {/* Gradient overlay */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at 60% 40%, rgba(99,102,241,0.12) 0%, transparent 60%), radial-gradient(ellipse at 20% 80%, rgba(139,92,246,0.08) 0%, transparent 50%)' }} />

      {/* Floating orbs */}
      <motion.div animate={{ y: [-20, 20, -20], x: [-10, 10, -10] }} transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-1/4 left-1/5 w-72 h-72 rounded-full blur-3xl pointer-events-none"
        style={{ background: 'rgba(99,102,241,0.08)' }} />
      <motion.div animate={{ y: [20, -20, 20], x: [10, -10, 10] }} transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
        className="absolute bottom-1/4 right-1/5 w-64 h-64 rounded-full blur-3xl pointer-events-none"
        style={{ background: 'rgba(139,92,246,0.08)' }} />

      <div className="relative z-10 w-full max-w-md mx-4">
        {/* Logo */}
        <motion.div initial={{ opacity: 0, y: -30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}
          className="text-center mb-8">
          <motion.div initial={{ scale: 0, rotate: -180 }} animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.2 }}
            className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center shadow-2xl"
            style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', boxShadow: '0 16px 48px rgba(99,102,241,0.35)' }}>
            <span className="text-3xl font-black text-white">S</span>
          </motion.div>
          <h1 className="text-3xl font-bold mb-1" style={{ color: 'var(--text-color)' }}>SGPE</h1>
          <p className="text-sm" style={{ color: 'var(--muted-color)' }}>Sistema de Gestión de Proyectos</p>
        </motion.div>

        {/* Card */}
        <motion.div initial={{ opacity: 0, y: 32 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.15 }}>
          <TiltCard>
            <div className="glass-card rounded-3xl p-8">
              <h2 className="text-xl font-bold mb-6 text-center" style={{ color: 'var(--text-color)' }}>Iniciar Sesión</h2>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
                {/* Email */}
                <div>
                  <label className="glass-label">Correo electrónico</label>
                  <input
                    {...correoRest}
                    ref={e => { correoRef(e); (emailRef as any).current = e; }}
                    type="email"
                    autoComplete="email"
                    className="glass-input"
                    placeholder="correo@empresa.com"
                  />
                  {errors.correo && <p className="glass-error">⚠ {errors.correo.message}</p>}
                </div>

                {/* Password */}
                <div>
                  <label className="glass-label">Contraseña</label>
                  <div className="relative">
                    <input
                      {...register('contrasena')}
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      className="glass-input pr-12"
                      placeholder="••••••••"
                    />
                    <button type="button" onClick={() => setShowPassword(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-base text-dark-muted hover:text-primary-400 transition-colors"
                      aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}>
                      {showPassword ? '🙈' : '👁️'}
                    </button>
                  </div>
                  {capsLock && (
                    <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="glass-error">
                      ⚠ Mayúsculas activadas
                    </motion.p>
                  )}
                  {errors.contrasena && <p className="glass-error">⚠ {errors.contrasena.message}</p>}
                </div>

                {/* Forgot */}
                <div className="text-right">
                  <Link to="/forgot-password" className="text-sm text-primary-400 hover:text-primary-300 transition-colors">
                    ¿Olvidaste tu contraseña?
                  </Link>
                </div>

                {/* Submit */}
                <motion.button
                  type="submit"
                  disabled={loading}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  className="w-full py-3 rounded-2xl text-white font-semibold shimmer-btn disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <motion.div animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                        className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />
                      Ingresando...
                    </>
                  ) : 'Iniciar Sesión →'}
                </motion.button>
              </form>

              <p className="mt-6 text-center text-sm" style={{ color: 'var(--muted-color)' }}>
                ¿No tienes cuenta?{' '}
                <Link to="/register" className="text-primary-400 hover:text-primary-300 font-medium transition-colors">
                  Regístrate aquí
                </Link>
              </p>
            </div>
          </TiltCard>
        </motion.div>
      </div>
    </div>
  );
}
