import { Server as SocketServer } from 'socket.io';

let ioInstance: SocketServer | null = null;

export function setIO(io: SocketServer) {
  ioInstance = io;
}

export function getIO(): SocketServer {
  if (!ioInstance) throw new Error('Socket.IO no esta inicializado');
  return ioInstance;
}
