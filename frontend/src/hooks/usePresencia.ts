import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

interface PresenciaUpdate {
  usuarioId: string;
  estado: string;
  ultimaConexion: string;
}

type PresenciaCallback = (update: PresenciaUpdate) => void;

export function usePresencia(token: string | null, onUpdate: PresenciaCallback) {
  const socketRef = useRef<Socket | null>(null);
  const onUpdateRef = useRef(onUpdate);
  onUpdateRef.current = onUpdate;

  useEffect(() => {
    if (!token) return;

    const socketUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    const socket = io(socketUrl, {
      auth: { token },
      transports: ['websocket', 'polling'],
    });
    socketRef.current = socket;

    socket.on('connect', () => {});

    socket.on('presencia:actualizar', (data: PresenciaUpdate) => {
      onUpdateRef.current(data);
    });

    socket.on('connect_error', (err) => {
      console.error('Socket error:', err.message);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [token]);

  const unirseAProyecto = (proyectoId: string) => {
    socketRef.current?.emit('proyecto:unirse', proyectoId);
  };

  const salirDeProyecto = (proyectoId: string) => {
    socketRef.current?.emit('proyecto:salir', proyectoId);
  };

  const onTareaEstadoCambiado = (callback: (data: {
    tareaId: string;
    estadoAnterior: string;
    estadoNuevo: string;
    cambiadoPorId: string;
    cambiadoPorNombre: string;
  }) => void) => {
    socketRef.current?.on('tarea:estadoCambiado', callback);
    return () => { socketRef.current?.off('tarea:estadoCambiado', callback); };
  };

  const emitirEscribiendo = (data: { tareaId: string; usuarioId: string; nombre: string }) => {
    socketRef.current?.emit('comentario:escribiendo', data);
  };

  const emitirDejoDeEscribir = (data: { tareaId: string; usuarioId: string }) => {
    socketRef.current?.emit('comentario:dejoDeEscribir', data);
  };

  const onEscribiendo = (callback: (data: { tareaId: string; usuarioId: string; nombre: string }) => void) => {
    socketRef.current?.on('comentario:escribiendo', callback);
    return () => { socketRef.current?.off('comentario:escribiendo', callback); };
  };

  const onDejoDeEscribir = (callback: (data: { tareaId: string; usuarioId: string }) => void) => {
    socketRef.current?.on('comentario:dejoDeEscribir', callback);
    return () => { socketRef.current?.off('comentario:dejoDeEscribir', callback); };
  };

  return {
    unirseAProyecto,
    salirDeProyecto,
    onTareaEstadoCambiado,
    emitirEscribiendo,
    emitirDejoDeEscribir,
    onEscribiendo,
    onDejoDeEscribir,
  };
}

export default usePresencia;
