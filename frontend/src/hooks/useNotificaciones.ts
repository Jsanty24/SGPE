import { useState, useEffect, useCallback, useRef } from 'react';
import { notificacionService } from '../services/apiService';
import type { Notificacion } from '../types';

export const useNotificaciones = () => {
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
  const [noLeidas, setNoLeidas] = useState(0);
  const [loading, setLoading] = useState(false);
  const prevNotificaciones = useRef<Notificacion[]>([]);
  const prevNoLeidas = useRef(0);

  const fetch = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await notificacionService.getAll();
      if (data.success && data.data) {
        setNotificaciones(data.data.notificaciones);
        setNoLeidas(data.data.noLeidas);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch();
    const interval = setInterval(fetch, 30000);
    return () => clearInterval(interval);
  }, [fetch]);

  const markRead = async (id: string) => {
    prevNotificaciones.current = notificaciones;
    prevNoLeidas.current = noLeidas;
    setNotificaciones(prev => prev.map(n => n.id === id ? { ...n, leida: true } : n));
    setNoLeidas(prev => Math.max(0, prev - 1));
    try {
      await notificacionService.markRead(id);
    } catch {
      setNotificaciones(prevNotificaciones.current);
      setNoLeidas(prevNoLeidas.current);
    }
  };

  const markAllRead = async () => {
    prevNotificaciones.current = notificaciones;
    prevNoLeidas.current = noLeidas;
    setNotificaciones(prev => prev.map(n => ({ ...n, leida: true })));
    setNoLeidas(0);
    try {
      await notificacionService.markAllRead();
    } catch {
      setNotificaciones(prevNotificaciones.current);
      setNoLeidas(prevNoLeidas.current);
    }
  };

  return { notificaciones, noLeidas, loading, fetch, markRead, markAllRead };
};
