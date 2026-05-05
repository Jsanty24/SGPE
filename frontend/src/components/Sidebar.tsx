import { NavLink } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

// [A3-UI] Liquid Glass Sidebar — macOS Tahoe 26 style

interface SidebarProps {
  open: boolean;
  onToggle: () => void;
}

const menuItems = [
  { path: '/proyectos', icon: '📁', label: 'Proyectos', roles: ['ADMIN', 'GERENTE', 'MIEMBRO', 'CLIENTE'] },
  { path: '/dashboard', icon: '📊', label: 'Dashboard', roles: ['ADMIN', 'GERENTE'] },
  { path: '/mis-tareas', icon: '✅', label: 'Mis Tareas', roles: ['MIEMBRO', 'ADMIN', 'GERENTE'] },
  { path: '/equipo', icon: '👥', label: 'Equipo', roles: ['ADMIN', 'GERENTE', 'MIEMBRO', 'CLIENTE'] },
  { path: '/calendario', icon: '📅', label: 'Calendario', roles: ['ADMIN', 'GERENTE', 'MIEMBRO', 'CLIENTE'] },
  { path: '/usuarios', icon: '⚙️', label: 'Ajustes Usuarios', roles: ['ADMIN'] },
  { path: '/notificaciones', icon: '🔔', label: 'Notificaciones', roles: ['ADMIN', 'GERENTE', 'MIEMBRO', 'CLIENTE'] },
];

export default function Sidebar({ open, onToggle }: SidebarProps) {
  const { usuario } = useAuth();
  const filteredItems = menuItems.filter(item => usuario && item.roles.includes(usuario.rol));

  return (
    <>
      <AnimatePresence mode="wait">
        {open ? (
          // Full expanded sidebar
          <motion.aside
            key="sidebar-open"
            initial={{ x: -280, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -280, opacity: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 220 }}
            className="fixed md:relative z-40 h-full w-64 flex flex-col"
            style={{
              background: 'var(--glass-bg, rgba(15,15,25,0.75))',
              backdropFilter: 'var(--glass-blur)',
              WebkitBackdropFilter: 'var(--glass-blur)',
              borderRight: '1px solid var(--glass-border)',
            }}
          >
            {/* Logo Header */}
            <div className="p-5 pb-4">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg"
                  style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}
                >
                  S
                </div>
                <div>
                  <h1 className="text-base font-bold" style={{ color: 'var(--text-color)' }}>SGPE</h1>
                  <p className="text-xs text-dark-muted leading-none">Gestión de Proyectos</p>
                </div>
                {/* Toggle collapse button */}
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={onToggle}
                  className="ml-auto p-1.5 rounded-lg text-dark-muted hover:text-dark-text transition-colors"
                  style={{ background: 'var(--glass-bg)' }}
                  aria-label="Contraer sidebar"
                >
                  ◂
                </motion.button>
              </div>
            </div>

            {/* Nav */}
            <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto mt-2">
              {filteredItems.map((item, index) => (
                <motion.div
                  key={item.path}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.04, type: 'spring', stiffness: 300 }}
                >
                  <NavLink
                    to={item.path}
                    className={({ isActive }) =>
                      `group flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 relative ${
                        isActive
                          ? 'text-primary-400'
                          : 'text-dark-muted hover:text-dark-text'
                      }`
                    }
                    style={({ isActive }) => isActive ? {
                      background: 'var(--glass-bg)',
                      backdropFilter: 'blur(12px)',
                      border: '1px solid var(--glass-border)',
                      boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.25), 0 4px 12px rgba(0,0,0,0.15)',
                    } : {}}
                  >
                    {({ isActive }) => (
                      <>
                        {/* Tahoe top-border highlight on active */}
                        {isActive && (
                          <span
                            className="absolute top-0 left-4 right-4 h-px rounded-full"
                            style={{ background: 'linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,0.35), rgba(255,255,255,0))' }}
                          />
                        )}
                        <span className="text-lg leading-none">{item.icon}</span>
                        <span>{item.label}</span>
                      </>
                    )}
                  </NavLink>
                </motion.div>
              ))}
            </nav>

            {/* User Footer */}
            <div className="p-4" style={{ borderTop: '1px solid var(--glass-border)' }}>
              <div className="flex items-center gap-3 mb-3 px-2">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-md"
                  style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}
                >
                  {usuario?.nombre.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: 'var(--text-color)' }}>{usuario?.nombre}</p>
                  <p className="text-xs text-dark-muted">{usuario?.rol}</p>
                </div>
              </div>
            </div>
          </motion.aside>
        ) : (
          // Collapsed icons-only mini sidebar
          <motion.aside
            key="sidebar-collapsed"
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 72, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 280, damping: 26 }}
            className="hidden md:flex relative z-40 h-full flex-col items-center py-4 gap-1 overflow-visible"
            style={{
              background: 'var(--glass-bg)',
              backdropFilter: 'var(--glass-blur)',
              WebkitBackdropFilter: 'var(--glass-blur)',
              borderRight: '1px solid var(--glass-border)',
            }}
          >
            {/* Expand button */}
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={onToggle}
              className="w-10 h-10 rounded-xl flex items-center justify-center text-dark-muted hover:text-dark-text mb-4 transition-colors mt-2"
              style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)' }}
              aria-label="Expandir sidebar"
              title="Expandir"
            >
              ▸
            </motion.button>

            {filteredItems.map((item, index) => (
              <motion.div
                key={item.path}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: index * 0.04 }}
                className="relative group mb-1"
              >
                <NavLink
                  to={item.path}
                  className={({ isActive }) =>
                    `w-10 h-10 rounded-xl flex items-center justify-center text-lg transition-all duration-200 ${
                      isActive ? 'text-primary-400' : 'text-dark-muted hover:text-dark-text'
                    }`
                  }
                  style={({ isActive }) => isActive ? {
                    background: 'var(--glass-bg)',
                    border: '1px solid var(--glass-border)',
                    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.25)',
                  } : {}}
                  title={item.label}
                  aria-label={item.label}
                >
                  {item.icon}
                </NavLink>
                {/* Tooltip */}
                <div className="absolute left-14 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-50 shadow-md"
                  style={{ background: 'var(--glass-bg)', backdropFilter: 'blur(12px)', border: '1px solid var(--glass-border)', color: 'var(--text-color)' }}>
                  {item.label}
                </div>
              </motion.div>
            ))}
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}
