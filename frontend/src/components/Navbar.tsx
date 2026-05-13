import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotificaciones } from '../hooks/useNotificaciones';
import { usuarioService } from '../services/apiService';
import { useToast } from '../context/ToastContext';
import UserAvatar from './UserAvatar';

const ESTADOS = [
  { id: 'ACTIVO', label: 'Activo', color: '#10b981' },
  { id: 'AUSENTE', label: 'Ausente', color: '#f59e0b' },
  { id: 'NO_MOLESTAR', label: 'No molestar', color: '#ef4444' },
  { id: 'INACTIVO', label: 'Inactivo', color: '#6b7280' },
];

// [A3-UI] Liquid Glass Navbar — invisible at top, glass reveal on scroll + breadcrumb + search hint

interface NavbarProps {
  onMenuToggle: () => void;
}

function buildBreadcrumb(pathname: string): string[] {
  const map: Record<string, string> = {
    '': 'Inicio',
    proyectos: 'Proyectos',
    dashboard: 'Dashboard',
    'mis-tareas': 'Mis Tareas',
    usuarios: 'Usuarios',
    equipo: 'Equipo',
    perfil: 'Perfil',
    notificaciones: 'Notificaciones',
    nuevo: 'Nuevo',
    editar: 'Editar',
    reporte: 'Reporte',
    tareas: 'Tarea',
  };
  return pathname.split('/').filter(Boolean).map(seg => map[seg] ?? (seg.length > 8 ? seg.slice(0, 6) + '…' : seg));
}

export default function Navbar({ onMenuToggle }: NavbarProps) {
  const { usuario, logout, refreshUser, presenciaUsuarios } = useAuth() as any;
  const { notificaciones, noLeidas, markRead, markAllRead } = useNotificaciones();
  const { success, error: toastError } = useToast();
  const [showNotifs, setShowNotifs] = useState(false);
  const [showAvatar, setShowAvatar] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const avatarRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Dark/Light theme
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'system');
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'system') {
      root.removeAttribute('data-theme');
      localStorage.removeItem('theme');
    } else {
      root.setAttribute('data-theme', theme);
      localStorage.setItem('theme', theme);
    }
    if (theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(t =>
      t === 'dark' || (t === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
        ? 'light' : 'dark'
    );
  };
  const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  // Use real-time presence from WebSocket, fallback to login data
  const presencia = presenciaUsuarios?.[usuario?.id];
  const estadoReal = presencia?.estado || usuario?.estado || 'ACTIVO';

  const saveLocation = () => {
    if (!navigator.geolocation) { toastError('Ubicación', 'Geolocalización no disponible'); return; }
    navigator.geolocation.getCurrentPosition(async (pos) => {
      try {
        await usuarioService.updateUbicacion(usuario.id, pos.coords.latitude, pos.coords.longitude);
        success('Ubicación guardada', `${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`);
      } catch { toastError('Error', 'No se pudo guardar la ubicación'); }
    }, () => toastError('Ubicación', 'Permiso denegado'));
  };

  // Scroll detection — glass reveal
  useEffect(() => {
    const main = document.querySelector('main');
    if (!main) return;
    const handler = () => setScrolled(main.scrollTop > 10);
    main.addEventListener('scroll', handler);
    return () => main.removeEventListener('scroll', handler);
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setShowNotifs(false);
      if (avatarRef.current && !avatarRef.current.contains(e.target as Node)) setShowAvatar(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const breadcrumb = buildBreadcrumb(location.pathname);

  const dispatchCommandPalette = () => {
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }));
  };

  return (
    <motion.header
      animate={{ background: scrolled ? 'var(--glass-bg)' : 'transparent' }}
      transition={{ duration: 0.4 }}
      className="h-16 flex items-center justify-between px-4 md:px-6 gap-4 z-30 sticky top-0"
      style={{
        backdropFilter: scrolled ? 'var(--glass-blur)' : 'none',
        borderBottom: scrolled ? '1px solid var(--glass-border)' : '1px solid transparent',
        transition: 'all 0.4s var(--ease-liquid)',
      }}
    >
      {/* Left — hamburger + breadcrumb */}
      <div className="flex items-center gap-3 min-w-0">
        <button onClick={onMenuToggle} className="p-2 rounded-lg text-dark-muted hover:text-dark-text transition-colors md:hidden" aria-label="Toggle menú">
          ☰
        </button>
        {/* Breadcrumb */}
        <nav className="hidden sm:flex items-center gap-1 text-sm min-w-0">
          {breadcrumb.map((seg, i) => (
            <span key={i} className="flex items-center gap-1">
              {i > 0 && <span className="text-dark-muted/50">/</span>}
              <span className={i === breadcrumb.length - 1 ? 'font-semibold' : 'text-dark-muted'} style={{ color: i === breadcrumb.length - 1 ? 'var(--text-color)' : undefined }}>
                {seg}
              </span>
            </span>
          ))}
        </nav>
      </div>

      {/* Middle - Search Hint */}
      <div className="hidden md:block flex-1 max-w-md px-4">
        <button onClick={dispatchCommandPalette}
          className="w-full flex items-center justify-between px-4 py-1.5 rounded-full text-sm transition-all"
          style={{ background: 'var(--search-bg, rgba(100,100,100,0.1))', border: '1px solid var(--glass-border)', color: 'var(--muted-color)' }}>
          <span className="flex items-center gap-2"><span>🔍</span> Buscar...</span>
          <kbd className="px-2 py-0.5 rounded text-xs" style={{ background: 'var(--surface-color)', boxShadow: '0 1px 1px rgba(0,0,0,0.1)' }}>Ctrl K</kbd>
        </button>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-2 shrink-0">

        {/* Dark/Light toggle */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.92 }}
          onClick={toggleTheme}
          className="p-2 rounded-xl text-dark-muted hover:text-dark-text transition-all duration-200"
          style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)' }}
          aria-label="Alternar tema"
          title={isDark ? 'Cambiar a claro' : 'Cambiar a oscuro'}
        >
          <span className="text-base">{isDark ? '☀️' : '🌙'}</span>
        </motion.button>

        {/* Ubicación / GPS */}
        <motion.button
          whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.92 }}
          onClick={saveLocation}
          className="p-2 rounded-xl text-dark-muted hover:text-dark-text transition-all duration-200"
          style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)' }}
          title="Guardar ubicación actual"
          aria-label="Guardar ubicación"
        >
          <span className="text-base">📍</span>
        </motion.button>

        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.92 }}
            onClick={() => setShowNotifs(v => !v)}
            className="relative p-2 rounded-xl text-dark-muted hover:text-dark-text transition-all duration-200"
            style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)' }}
            aria-label="Notificaciones"
          >
            🔔
            {noLeidas > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-1 -right-1 w-5 h-5 bg-danger text-white text-xs rounded-full flex items-center justify-center pulse-high font-bold"
              >
                {noLeidas > 9 ? '9+' : noLeidas}
              </motion.span>
            )}
          </motion.button>

          <AnimatePresence>
            {showNotifs && (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 340, damping: 28 }}
                className="absolute right-0 top-12 w-[90vw] sm:w-80 rounded-2xl overflow-hidden z-50 origin-top-right"
                style={{ background: 'var(--glass-bg)', backdropFilter: 'var(--glass-blur)', border: '1px solid var(--glass-border)', boxShadow: 'var(--glass-shadow)' }}
              >
                <div className="p-4 flex items-center justify-between" style={{ borderBottom: '1px solid var(--glass-border)' }}>
                  <h3 className="font-semibold text-sm" style={{ color: 'var(--text-color)' }}>Notificaciones</h3>
                  {noLeidas > 0 && (
                    <button onClick={markAllRead} className="text-xs text-primary-400 hover:text-primary-300 transition-colors">
                      Marcar todas leídas
                    </button>
                  )}
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notificaciones.length === 0 ? (
                    <p className="p-6 text-center text-dark-muted text-sm">Sin notificaciones</p>
                  ) : (
                    notificaciones.slice(0, 10).map(n => (
                      <button key={n.id} onClick={() => { markRead(n.id); navigate('/notificaciones'); setShowNotifs(false); }}
                        className={`w-full text-left p-3 transition-all hover:bg-white/5 ${!n.leida ? 'bg-primary-500/5' : ''}`}
                        style={{ borderBottom: '1px solid var(--glass-border)' }}
                      >
                        <p className="text-sm line-clamp-2" style={{ color: 'var(--text-color)' }}>{n.mensaje}</p>
                        <p className="text-xs text-dark-muted mt-1">
                          {new Date(n.createdAt).toLocaleDateString('es', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </button>
                    ))
                  )}
                </div>
                <button onClick={() => { navigate('/notificaciones'); setShowNotifs(false); }}
                  className="w-full p-3 text-center text-sm text-primary-400 hover:bg-primary-500/5 transition-colors"
                  style={{ borderTop: '1px solid var(--glass-border)' }}>
                  Ver todas
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Avatar dropdown */}
        <div className="relative" ref={avatarRef}>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowAvatar(v => !v)}
            className="relative"
            aria-label="Menú usuario"
          >
            <UserAvatar usuario={usuario} size="md" />
            <span 
              className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2"
              style={{ 
                backgroundColor: ESTADOS.find(e => e.id === estadoReal)?.color || '#10b981',
                borderColor: 'var(--surface-color)'
              }}
              title={ESTADOS.find(e => e.id === estadoReal)?.label || 'Activo'}
            />
          </motion.button>
          <AnimatePresence>
            {showAvatar && (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 340, damping: 28 }}
                className="absolute right-0 top-12 w-52 rounded-2xl overflow-hidden z-50"
                style={{ background: 'var(--glass-bg)', backdropFilter: 'var(--glass-blur)', border: '1px solid var(--glass-border)', boxShadow: 'var(--glass-shadow)' }}
              >
                <div className="p-4" style={{ borderBottom: '1px solid var(--glass-border)' }}>
                  <p className="font-semibold text-sm" style={{ color: 'var(--text-color)' }}>{usuario?.nombre}</p>
                  <p className="text-xs text-dark-muted">{usuario?.correo}</p>
                  <span className="mt-1 inline-block text-xs px-2 py-0.5 rounded-full bg-primary-500/20 text-primary-400 border border-primary-500/30">{usuario?.rol}</span>
                </div>
                <div className="px-4 py-2" style={{ borderBottom: '1px solid var(--glass-border)' }}>
                  <p className="text-xs text-dark-muted mb-2">Estado</p>
                  <div className="flex gap-2">
                    {ESTADOS.map(estado => (
                      <button
                        key={estado.id}
                        onClick={async () => {
                          try {
                            await usuarioService.update(usuario.id, { estado: estado.id as any });
                            refreshUser({ estado: estado.id });
                          } catch (err) { console.error(err); }
                        }}
                        className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-medium transition-all hover:scale-105 ${usuario?.estado === estado.id ? 'ring-2 ring-primary-500' : ''}`}
                        style={{ 
                          background: usuario?.estado === estado.id ? `${estado.color}30` : 'rgba(99,102,241,0.1)', 
                          color: 'var(--text-color)',
                          border: '1px solid var(--glass-border)'
                        }}
                        title={estado.label}
                      >
                        {estado.id === 'ACTIVO' && '🟢'}
                        {estado.id === 'AUSENTE' && '🟡'}
                        {estado.id === 'NO_MOLESTAR' && '🔴'}
                        {estado.id === 'INACTIVO' && '⚫'}
                      </button>
                    ))}
                  </div>
                </div>
                <button
                  onClick={() => { navigate('/perfil'); setShowAvatar(false); }}
                  className="w-full flex items-center gap-2 px-4 py-3 text-sm text-dark-muted hover:text-primary-400 transition-all"
                  style={{ background: 'transparent', borderBottom: '1px solid var(--glass-border)' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(99,102,241,0.08)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  👤 Mi Perfil
                </button>
                <button
                  onClick={() => { logout(); setShowAvatar(false); }}
                  className="w-full flex items-center gap-2 px-4 py-3 text-sm text-dark-muted hover:text-danger transition-all"
                  style={{ background: 'transparent' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(239,68,68,0.08)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  🚪 Cerrar sesión
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.header>
  );
}
