import { Server } from 'socket.io';

export function setupSocketIO(io: Server) {
  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);
    
    socket.on('join', (userId: string) => {
      socket.join(userId);
      console.log(`User ${userId} joined`);
    });
    
    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });
}
