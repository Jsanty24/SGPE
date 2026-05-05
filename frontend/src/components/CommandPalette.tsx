import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { proyectoService, tareaService, usuarioService } from '../services/apiService';
import type { Proyecto, Tarea, Usuario } from '../types';

// ─── Command Palette Global (Ctrl+K) ────────────────────────────────────────
// Uso: importar en App.tsx y renderizar una sola vez globalmente

interface CommandItem {
  id: string;
  type: 'proyecto' | 'tarea' | 'usuario' | 'nav';
  label: string;
  sub: string;
  icon: string;
  href: string;
}

const NAV_ITEMS: CommandItem[] = [
  { id: 'nav-dashboard',       type: 'nav', icon: '🏠', label: 'Dashboard',        sub: 'Ir a inicio',         href: '/dashboard' },
  { id: 'nav-proyectos',       type: 'nav', icon: '📁', label: 'Proyectos',         sub: 'Lista de proyectos',  href: '/proyectos' },
  { id: 'nav-mis-tareas',      type: 'nav', icon: '✅', label: 'Mis Tareas',        sub: 'Kanban personal',     href: '/mis-tareas' },
  { id: 'nav-notificaciones',  type: 'nav', icon: '🔔', label: 'Notificaciones',    sub: 'Centro de alertas',   href: '/notificaciones' },
  { id: 'nav-equipo',          type: 'nav', icon: '👥', label: 'Equipo',            sub: 'Miembros del sistema',href: '/equipo' },
  { id: 'nav-perfil',          type: 'nav', icon: '👤', label: 'Mi Perfil',         sub: 'Editar cuenta',       href: '/perfil' },
  { id: 'nav-nuevo-proyecto',  type: 'nav', icon: '✨', label: 'Nuevo Proyecto',    sub: 'Crear proyecto',      href: '/proyectos/nuevo' },
];

export default function CommandPalette() {
  const navigate = useNavigate();
  const [open, setOpen]         = useState(false);
  const [query, setQuery]       = useState('');
  const [items, setItems]       = useState<CommandItem[]>([]);
  const [loading, setLoading]   = useState(false);
  const [selected, setSelected] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // ── Keyboard shortcut ──────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(o => !o);
        setQuery('');
        setSelected(0);
      }
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Focus input on open
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
  }, [open]);

  // ── Search ─────────────────────────────────────────────────
  const search = useCallback(async (q: string) => {
    if (!q.trim()) { setItems(NAV_ITEMS); return; }
    setLoading(true);
    try {
      const qLower = q.toLowerCase();
      const [proyRes, tareasRes, usrRes] = await Promise.all([
        proyectoService.getAll(),
        tareaService.getMyTasks().catch(() => ({ data: { data: [] } })),
        usuarioService.buscar(q).catch(() => ({ data: { data: [] } })),
      ]);

      const proyectos: CommandItem[] = (proyRes.data.data || [])
        .filter((p: Proyecto) => p.nombre.toLowerCase().includes(qLower) || (p.cliente || '').toLowerCase().includes(qLower))
        .slice(0, 4)
        .map((p: Proyecto) => ({
          id: `p-${p.id}`, type: 'proyecto' as const, icon: '📁',
          label: p.nombre, sub: p.cliente || p.estado, href: `/proyectos/${p.id}`,
        }));

      const tareas: CommandItem[] = (tareasRes.data.data || [])
        .filter((t: Tarea) => t.nombre.toLowerCase().includes(qLower))
        .slice(0, 3)
        .map((t: Tarea) => ({
          id: `t-${t.id}`, type: 'tarea' as const, icon: '📋',
          label: t.nombre, sub: t.estado, href: `/tareas/${t.id}`,
        }));

      const usuarios: CommandItem[] = (usrRes.data.data || [])
        .slice(0, 3)
        .map((u: Usuario) => ({
          id: `u-${u.id}`, type: 'usuario' as const, icon: '👤',
          label: u.nombre, sub: u.rol, href: `/perfil`,
        }));

      const navFiltered = NAV_ITEMS.filter(n =>
        n.label.toLowerCase().includes(qLower) ||
        n.sub.toLowerCase().includes(qLower)
      );
      setItems([...navFiltered, ...proyectos, ...tareas, ...usuarios]);
    } finally {
      setLoading(false);
      setSelected(0);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => search(query), 200);
    return () => clearTimeout(t);
  }, [query, search]);

  useEffect(() => { if (open && !query) setItems(NAV_ITEMS); }, [open, query]);

  // ── Keyboard nav ────────────────────────────────────────────
  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelected(s => Math.min(s + 1, items.length - 1)); }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setSelected(s => Math.max(s - 1, 0)); }
    if (e.key === 'Enter' && items[selected]) {
      navigate(items[selected].href);
      setOpen(false);
    }
  };

  const typeColor: Record<string, string> = {
    nav: '#6366f1', proyecto: '#10b981', tarea: '#f59e0b', usuario: '#8b5cf6',
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-50"
            style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} />

          {/* Palette */}
          <motion.div
            initial={{ opacity: 0, y: -24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -24, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="fixed top-[12%] left-1/2 -translate-x-1/2 w-full max-w-xl z-50 rounded-2xl overflow-hidden"
            style={{
              background: 'var(--glass-bg)',
              backdropFilter: 'blur(40px)',
              border: '1px solid var(--glass-border)',
              boxShadow: '0 32px 64px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.05)',
            }}>

            {/* Search input */}
            <div className="flex items-center gap-2 px-4 py-4" style={{ borderBottom: '1px solid var(--glass-border)' }}>
              <span className="text-lg flex-shrink-0">🔍</span>
              <input
                ref={inputRef}
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={onKey}
                placeholder="Buscar proyectos, páginas..."
                className="flex-1 text-base outline-none pl-1"
                style={{ background: 'transparent', color: 'var(--text-color)' }}
              />
              <kbd className="text-xs px-2 py-1 rounded-lg" style={{ border: '1px solid var(--glass-border)', color: 'var(--muted-color)', background: 'var(--surface-color)' }}>ESC</kbd>
            </div>

            {/* Results */}
            <div className="max-h-72 overflow-y-auto py-2">
              {loading && (
                <p className="text-center py-6 text-sm" style={{ color: 'var(--muted-color)' }}>Buscando...</p>
              )}
              {!loading && items.length === 0 && (
                <p className="text-center py-6 text-sm" style={{ color: 'var(--muted-color)' }}>Sin resultados para "{query}"</p>
              )}
              {!loading && items.map((item, i) => (
                <motion.button key={item.id}
                  initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.025 }}
                  onClick={() => { navigate(item.href); setOpen(false); }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left transition-all"
                  style={{
                    background: i === selected ? 'rgba(99,102,241,0.12)' : 'transparent',
                    borderLeft: i === selected ? '2px solid var(--color-primary)' : '2px solid transparent',
                  }}
                  onMouseEnter={() => setSelected(i)}>
                  <span className="text-xl w-8 text-center flex-shrink-0">{item.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: 'var(--text-color)' }}>{item.label}</p>
                    <p className="text-xs truncate" style={{ color: 'var(--muted-color)' }}>{item.sub}</p>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded-full flex-shrink-0"
                    style={{ background: `${typeColor[item.type]}22`, color: typeColor[item.type] }}>
                    {item.type}
                  </span>
                </motion.button>
              ))}
            </div>

            {/* Footer */}
            <div className="flex items-center gap-4 px-4 py-2.5 text-xs" style={{ borderTop: '1px solid var(--glass-border)', color: 'var(--muted-color)' }}>
              <span>↑↓ navegar</span>
              <span>↵ abrir</span>
              <span className="ml-auto">Ctrl+K para cerrar</span>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
