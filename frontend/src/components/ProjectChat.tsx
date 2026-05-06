import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { chatService } from '../services/apiService';
import api from '../services/api';
import UserAvatar from './UserAvatar';

interface Mensaje {
  id: string; contenido: string; proyectoId: string; autorId: string;
  autorNombre: string; autorAvatar: string | null; createdAt: string; editado: boolean;
}

interface Props {
  proyectoId: string;
  isOpen: boolean;
  onToggle: () => void;
}

function timeAgo(dateStr: string) {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (diff < 60) return 'ahora';
  if (diff < 3600) return `hace ${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `hace ${Math.floor(diff / 3600)}h`;
  return new Date(dateStr).toLocaleDateString();
}

export default function ProjectChat({ proyectoId, isOpen, onToggle }: Props) {
  const { usuario } = useAuth();
  const { error: toastError } = useToast();
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [texto, setTexto] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [noLeidos, setNoLeidos] = useState(0);

  const fetchMensajes = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await chatService.getMensajes(proyectoId);
      if (data.success) setMensajes(data.data);
    } catch {
      toastError('Error', 'No se pudo cargar el chat');
    } finally { setLoading(false); }
  }, [proyectoId]);

  useEffect(() => { fetchMensajes(); }, [fetchMensajes]);

  // Scroll to bottom on new messages
  const scrollToBottom = useCallback(() => {
    if (isAtBottom && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [isAtBottom]);

  useEffect(() => { scrollToBottom(); }, [mensajes, scrollToBottom]);

  // Track scroll position
  const onScroll = useCallback(() => {
    if (!listRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = listRef.current;
    setIsAtBottom(scrollHeight - scrollTop - clientHeight < 60);
  }, []);

  // Socket listener for new messages
  useEffect(() => {
    const handler = (msg: Mensaje) => {
      if (msg.proyectoId !== proyectoId) return;
      setMensajes(prev => [...prev, msg]);
      if (!isOpen || document.visibilityState !== 'visible') {
        setNoLeidos(n => n + 1);
      }
    };

    // Listen on window for socket emission
    const w = window as any;
    if (!w.__chatListeners) w.__chatListeners = {};
    if (!w.__chatListeners[proyectoId]) {
      w.__chatListeners[proyectoId] = handler;
    }

    return () => {
      if (w.__chatListeners) delete w.__chatListeners[proyectoId];
    };
  }, [proyectoId, isOpen]);

  // Clear unread count when chat opens
  useEffect(() => {
    if (isOpen) setNoLeidos(0);
  }, [isOpen]);

  const enviar = async () => {
    const txt = texto.trim();
    if (!txt || enviando) return;
    setEnviando(true);
    try {
      const { data } = await chatService.enviarMensaje(proyectoId, txt);
      if (data.success) {
        setMensajes(prev => [...prev, { ...data.data, autorNombre: data.data.autor.nombre, autorAvatar: data.data.autor.avatar, autorId: data.data.autor.id }]);
      }
      setTexto('');
    } catch {
      toastError('Error', 'No se pudo enviar');
    } finally { setEnviando(false); }
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); enviar(); }
  };

  return (
    <>
      {/* Floating button */}
      <motion.button onClick={onToggle} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
        className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-lg"
        style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', boxShadow: '0 8px 32px rgba(99,102,241,0.4)' }}>
        💬
        {noLeidos > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-danger text-white text-[10px] font-bold flex items-center justify-center">
            {noLeidos > 9 ? '9+' : noLeidos}
          </span>
        )}
      </motion.button>

      {/* Chat panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div initial={{ opacity: 0, y: 20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 350, damping: 28 }}
            className="fixed bottom-20 right-6 z-40 w-80 sm:w-96 h-[500px] max-h-[70vh] rounded-2xl overflow-hidden flex flex-col"
            style={{ background: 'var(--glass-bg)', backdropFilter: 'var(--glass-blur)', border: '1px solid var(--glass-border)', boxShadow: 'var(--glass-shadow)' }}>
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid var(--glass-border)' }}>
              <h3 className="font-bold text-sm" style={{ color: 'var(--text-color)' }}>Chat del proyecto</h3>
              <button onClick={onToggle} className="text-sm" style={{ color: 'var(--muted-color)' }}>✕</button>
            </div>

            {/* Messages */}
            <div ref={listRef} onScroll={onScroll} className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
              {loading && <p className="text-center text-sm" style={{ color: 'var(--muted-color)' }}>Cargando...</p>}
              {!loading && mensajes.length === 0 && (
                <p className="text-center text-sm py-8" style={{ color: 'var(--muted-color)' }}>No hay mensajes. Se el primero en escribir.</p>
              )}
              {mensajes.map(msg => {
                const esMio = msg.autorId === usuario?.id;
                return (
                  <div key={msg.id} className={`flex gap-2 ${esMio ? 'flex-row-reverse' : ''}`}>
                    <div className="w-7 h-7 rounded-full flex-shrink-0 overflow-hidden mt-1">
                      <UserAvatar usuario={{ id: msg.autorId, nombre: msg.autorNombre, avatar: msg.autorAvatar } as any} size="sm" />
                    </div>
                    <div className={esMio ? 'text-right' : ''}>
                      <div className="flex items-center gap-2 mb-0.5" style={{ flexDirection: esMio ? 'row-reverse' : 'row' }}>
                        <span className="text-xs font-semibold" style={{ color: 'var(--text-color)' }}>{msg.autorNombre}</span>
                        <span className="text-[10px]" style={{ color: 'var(--muted-color)' }}>{timeAgo(msg.createdAt)}</span>
                        {msg.editado && <span className="text-[10px] italic" style={{ color: 'var(--muted-color)' }}>(editado)</span>}
                      </div>
                      <div className="inline-block px-3 py-2 rounded-xl text-sm max-w-[220px] break-words"
                        style={{
                          background: esMio ? 'var(--color-primary)' : 'var(--surface-color)',
                          color: esMio ? '#fff' : 'var(--text-color)',
                          borderRadius: esMio ? '12px 4px 12px 12px' : '4px 12px 12px 12px',
                        }}>
                        {msg.contenido}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="px-3 py-3 flex gap-2" style={{ borderTop: '1px solid var(--glass-border)' }}>
              <textarea value={texto} onChange={e => setTexto(e.target.value)} onKeyDown={onKeyDown}
                placeholder="Escribe un mensaje..."
                rows={1}
                className="flex-1 resize-none rounded-xl px-3 py-2 text-sm outline-none"
                style={{ background: 'var(--surface-color)', border: '1px solid var(--glass-border)', color: 'var(--text-color)' }} />
              <motion.button onClick={enviar} disabled={!texto.trim() || enviando} whileTap={{ scale: 0.9 }}
                className="px-4 rounded-xl text-white font-semibold text-sm disabled:opacity-50 flex-shrink-0"
                style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
                {enviando ? '...' : 'Enviar'}
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
