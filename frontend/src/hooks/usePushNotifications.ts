import { useEffect, useCallback } from 'react';
import { useToast } from '../context/ToastContext';

export function usePushNotifications() {
  const { success } = useToast();

  const requestPermission = useCallback(async () => {
    if (!('Notification' in window)) return;
    const perm = await Notification.requestPermission();
    if (perm === 'granted') {
      success('Notificaciones activadas', 'Recibiras alertas cuando la pestana no este activa');
    }
  }, [success]);

  const sendBrowserNotification = useCallback((titulo: string, opciones?: { body?: string; url?: string }) => {
    if (!('Notification' in window)) return;
    if (Notification.permission !== 'granted') return;
    if (document.visibilityState === 'visible') return;

    const notification = new Notification(titulo, {
      body: opciones?.body || '',
      icon: '/vite.svg',
      tag: 'sgpe-notif',
    });

    if (opciones?.url) {
      notification.onclick = () => {
        window.focus();
        window.location.href = opciones.url!;
      };
    }
  }, []);

  const showPermissionBanner = useCallback(() => {
    if (!('Notification' in window)) return false;
    if (Notification.permission === 'default') return true;
    return false;
  }, []);

  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible' && 'Notification' in window && Notification.permission === 'granted') {
        const notifs = document.querySelectorAll('notification-banner');
        notifs.forEach(n => n.remove());
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, []);

  return { requestPermission, sendBrowserNotification, showPermissionBanner };
}
