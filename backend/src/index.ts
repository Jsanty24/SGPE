import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { PrismaClient } from '@prisma/client';
import { createServer } from 'http';
import { Server } from 'socket.io';
import rateLimit from 'express-rate-limit';
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/usuario.routes';
import projectRoutes from './routes/proyecto.routes';
import taskRoutes from './routes/tarea.routes';
import commentRoutes from './routes/comentario.routes';
import notificationRoutes from './routes/notificacion.routes';
import reportRoutes from './routes/reporte.routes';
import actividadRoutes from './routes/actividad.routes';
import archivoRoutes from './routes/archivo.routes';
import archivoProyectoRoutes from './routes/archivoProyecto.routes';
import calendarioRoutes from './routes/calendario.routes';
import chatRoutes from './routes/chat.routes';
import cuentaRoutes from './routes/cuenta.routes';
import historialRoutes from './routes/historial.routes';
import verificacionRoutes from './routes/verificacion.routes';
import { errorHandler } from './middlewares/errorHandler';
import { setupCronJobs } from './services/cron.service';
import { setupSocketIO } from './services/socketService';

const app = express();
const httpServer = createServer(app);
const prisma = new PrismaClient();

const io = new Server(httpServer, {
  cors: {
    origin: (process.env.ALLOWED_ORIGINS || 'http://localhost:5173,https://sgpe-nu.vercel.app,https://sgpe-production.up.railway.app').split(',').map(o => o.trim()),
    credentials: true,
    methods: ['GET', 'POST'],
  },
});

app.use(helmet({
  contentSecurityPolicy: false,
}));

app.use(compression());

app.use(cors({
  origin: (origin, callback) => {
    const allowed = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173,https://sgpe-nu.vercel.app').split(',').map(o => o.trim());
    if (!origin || allowed.includes(origin)) return callback(null, true);
    callback(new Error('CORS blocked'));
  },
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'production' ? 1000 : 100,
  message: 'Too many requests from this IP, please try again later.',
  skip: (req) => {
    // Skip rate limiting for health checks
    return req.path === '/api/health';
  }
});

app.use('/api/', limiter);

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/activity', actividadRoutes);
app.use('/api/files', archivoRoutes);
app.use('/api/project-files', archivoProyectoRoutes);
app.use('/api/calendar', calendarioRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/cuenta', cuentaRoutes);
app.use('/api/history', historialRoutes);
app.use('/api/verification', verificacionRoutes);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', db: 'connected' });
});

app.use(errorHandler);

setupSocketIO(io);
setupCronJobs();

const PORT = Number(process.env.PORT);
if (!PORT) {
  console.error('PORT environment variable is required');
  process.exit(1);
}
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error('JWT_SECRET is required');
  process.exit(1);
}

httpServer.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});

process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  await prisma.$disconnect();
  httpServer.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully');
  await prisma.$disconnect();
  httpServer.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
