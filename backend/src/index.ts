import express from 'express';
import { createServer } from 'http';
import { Server as SocketServer } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import compression from 'compression';
import swaggerUi from 'swagger-ui-express';
import { prisma } from './lib/prisma';
import { setIO } from './lib/socket';
import cron from 'node-cron';

dotenv.config();

// Crear directorios de uploads antes de importar rutas
const BASE_UPLOADS = path.join(__dirname, '..', 'uploads');
const AVATARS_DIR = path.join(BASE_UPLOADS, 'avatars');
[BASE_UPLOADS, AVATARS_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`Directorio creado: ${dir}`);
  }
});

import authRoutes from './routes/auth.routes';
import usuarioRoutes from './routes/usuario.routes';
import proyectoRoutes from './routes/proyecto.routes';
import tareaRoutes from './routes/tarea.routes';
import comentarioRoutes from './routes/comentario.routes';
import archivoRoutes from './routes/archivo.routes';
import archivoProyectoRoutes from './routes/archivoProyecto.routes';
import notificacionRoutes from './routes/notificacion.routes';
import reporteRoutes from './routes/reporte.routes';
import historialRoutes from './routes/historial.routes';
import actividadRoutes from './routes/actividad.routes';
import calendarioRoutes from './routes/calendario.routes';
import chatRoutes from './routes/chat.routes';
import verificacionRoutes from './routes/verificacion.routes';
import cuentaRoutes from './routes/cuenta.routes';
import backupRoutes from './routes/backup.routes';
import { errorHandler } from './middlewares/errorHandler';
// import { sanitizeInput } from './middlewares/sanitize'; // Comentado: jsdom causa error en Railway
import { verificarTareasVencimiento } from './services/cron.service';

const app = express();
const server = createServer(app);
const io = new SocketServer(server, {
  cors: { origin: process.env.FRONTEND_URL || 'http://localhost:5173', credentials: true },
  pingInterval: 30000,
  pingTimeout: 60000,
});
setIO(io);

const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET no esta definido en las variables de entorno');
}

// Socket.IO auth middleware
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error('Token requerido'));
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; rol: string };
    socket.data.userId = decoded.id;
    socket.data.userRol = decoded.rol;
    next();
  } catch { next(new Error('Token inválido')); }
});

io.on('connection', async (socket) => {
  const userId = socket.data.userId;
  console.log(`Usuario conectado: ${userId}`);

  await prisma.usuario.update({ where: { id: userId }, data: { estado: 'ACTIVO', ultimaConexion: new Date() } }).catch(() => {});
  io.emit('presencia:actualizar', { usuarioId: userId, estado: 'ACTIVO', ultimaConexion: new Date().toISOString() });

  socket.on('proyecto:unirse', (proyectoId: string) => {
    socket.join(`proyecto:${proyectoId}`);
  });

  socket.on('proyecto:salir', (proyectoId: string) => {
    socket.leave(`proyecto:${proyectoId}`);
  });

  socket.on('comentario:escribiendo', (data: { tareaId: string; usuarioId: string; nombre: string }) => {
    socket.broadcast.emit('comentario:escribiendo', data);
  });

  socket.on('comentario:dejoDeEscribir', (data: { tareaId: string; usuarioId: string }) => {
    socket.broadcast.emit('comentario:dejoDeEscribir', data);
  });

  socket.on('disconnect', async () => {
    console.log(`Usuario desconectado: ${userId}`);
    await prisma.usuario.update({
      where: { id: userId },
      data: { estado: 'INACTIVO', ultimaConexion: new Date() }
    }).catch(() => {});
    io.emit('presencia:actualizar', { usuarioId: userId, estado: 'INACTIVO', ultimaConexion: new Date().toISOString() });
  });
});

app.use(helmet({
  contentSecurityPolicy: process.env.NODE_ENV === 'production' ? undefined : false,
}));
app.use(compression({ level: 6, threshold: 1024 }));
app.use(cors({
  origin: (origin, callback) => {
    const allowed = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173').split(',');
    if (!origin || allowed.includes(origin)) callback(null, true);
    else callback(new Error('CORS no permitido'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400,
}));

const generalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  message: { success: false, message: 'Demasiadas peticiones' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', generalLimiter);

app.use('/api/uploads', express.static(BASE_UPLOADS));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
// app.use(sanitizeInput); // Comentado: jsdom causa error en Railway

app.get('/api/health', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version,
      database: 'connected',
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024 * 100) / 100,
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024 * 100) / 100,
      }
    });
  } catch {
    res.status(503).json({ status: 'error', database: 'disconnected' });
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/usuarios', usuarioRoutes);
app.use('/api/proyectos', proyectoRoutes);
app.use('/api/tareas', tareaRoutes);
app.use('/api/comentarios', comentarioRoutes);
app.use('/api/archivos', archivoRoutes);
app.use('/api/archivos-proyecto', archivoProyectoRoutes);
app.use('/api/notificaciones', notificacionRoutes);
app.use('/api/reportes', reporteRoutes);
app.use('/api/historial', historialRoutes);
app.use('/api/actividad', actividadRoutes);
app.use('/api/calendario', calendarioRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/verificacion', verificacionRoutes);
app.use('/api/cuenta', cuentaRoutes);
app.use('/api/backup', backupRoutes);

// Swagger en desarrollo
if (process.env.NODE_ENV !== 'production') {
  const swaggerSpec = {
    openapi: '3.0.0',
    info: { title: 'SGPE API', version: '2.0.0', description: 'Sistema de Gestion de Proyectos Empresariales' },
    servers: [{ url: 'http://localhost:5000/api' }],
    components: {
      securitySchemes: { BearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' } },
    },
    paths: {},
  };
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
}

app.use(errorHandler);

// Ejecutar al iniciar y luego cada 15 minutos
verificarTareasVencimiento(prisma);
cron.schedule('*/15 * * * *', async () => {
  console.log('Verificando vencimientos...');
  await verificarTareasVencimiento(prisma);
});

async function main() {
  try {
    await prisma.$connect();
    await prisma.usuario.updateMany({ data: { estado: 'INACTIVO' } });
    console.log('Base de datos conectada correctamente');
    server.listen(PORT, '0.0.0.0', () => {
      console.log(`Servidor corriendo en http://0.0.0.0:${PORT} (WebSocket activo)`);
    });
  } catch (error) {
    console.error('Error al conectar la base de datos:', error);
    process.exit(1);
  }
}

function gracefulShutdown(signal: string) {
  console.log(`\n${signal} recibido. Cerrando servidor...`);
  server.close(async () => {
    await prisma.$disconnect();
    console.log('Servidor cerrado. BD desconectada.');
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10000);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

main();
