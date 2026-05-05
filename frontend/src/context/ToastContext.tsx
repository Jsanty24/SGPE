import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ─── Types ────────────────────────────────────────────────
type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
}

interface ToastContextValue {
  toast: (type: ToastType, title: string, message?: string) => void;
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
  warning: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

// ─── Icons ────────────────────────────────────────────────
const icons: Record<ToastType, string> = {
  success: '✅',
  error:   '❌',
  warning: '⚠️',
  info:    'ℹ️',
};

const colors: Record<ToastType, { bar: string; glow: string }> = {
  success: { bar: '#10b981', glow: 'rgba(16,185,129,0.25)' },
  error:   { bar: '#ef4444', glow: 'rgba(239,68,68,0.25)' },
  warning: { bar: '#f59e0b', glow: 'rgba(245,158,11,0.25)' },
  info:    { bar: '#6366f1', glow: 'rgba(99,102,241,0.25)' },
};

// ─── Single Toast Item ────────────────────────────────────
function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  const c = colors[toast.type];
  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 80, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 80, scale: 0.9, transition: { duration: 0.2 } }}
      transition={{ type: 'spring', stiffness: 380, damping: 28 }}
      className="relative flex items-start gap-3 p-4 rounded-2xl w-80 cursor-pointer select-none overflow-hidden"
      style={{
        background: 'rgba(10,10,20,0.82)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        border: '1px solid rgba(255,255,255,0.1)',
        boxShadow: `0 8px 32px rgba(0,0,0,0.3), 0 0 0 1px ${c.glow}`,
      }}
      onClick={onDismiss}
    >
      {/* Colored left bar */}
      <span className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl" style={{ background: c.bar }} />

      {/* Animated progress line */}
      <motion.span
        className="absolute bottom-0 left-0 h-0.5 rounded-b-xl"
        style={{ background: c.bar }}
        initial={{ width: '100%' }}
        animate={{ width: '0%' }}
        transition={{ duration: 4, ease: 'linear' }}
      />

      <span className="text-lg flex-shrink-0 mt-0.5">{icons[toast.type]}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-white leading-tight">{toast.title}</p>
        {toast.message && <p className="text-xs text-white/60 mt-0.5 leading-relaxed">{toast.message}</p>}
      </div>
      <button onClick={onDismiss} className="text-white/40 hover:text-white/80 text-lg leading-none transition-colors flex-shrink-0">×</button>
    </motion.div>
  );
}

// ─── Provider ─────────────────────────────────────────────
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const toast = useCallback((type: ToastType, title: string, message?: string) => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts(prev => [...prev.slice(-4), { id, type, title, message }]);
    setTimeout(() => dismiss(id), 4200);
  }, [dismiss]);

  const value: ToastContextValue = {
    toast,
    success: (t, m) => toast('success', t, m),
    error:   (t, m) => toast('error', t, m),
    warning: (t, m) => toast('warning', t, m),
    info:    (t, m) => toast('info', t, m),
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 items-end pointer-events-none">
        <AnimatePresence mode="popLayout">
          {toasts.map(t => (
            <div key={t.id} className="pointer-events-auto">
              <ToastItem toast={t} onDismiss={() => dismiss(t.id)} />
            </div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────
export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
