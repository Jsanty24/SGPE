import { Router, Response } from 'express';
import multer from 'multer';
import path from 'path';
import crypto from 'crypto';
import bcrypt from 'bcrypt';
import { verificarToken, verificarRol, AuthRequest } from '../middlewares/auth';
import { prisma } from '../lib/prisma';

const router = Router();
const AVATARS_DIR = path.join(__dirname, '..', '..', 'uploads', 'avatars');

const avatarUpload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, AVATARS_DIR),
    filename: (_req, file, cb) => cb(null, `${crypto.randomUUID()}-${file.originalname}`)
  }),
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Solo imágenes JPG, PNG, GIF o WebP. Recibido: ${file.mimetype}`));
    }
  }
});

router.get('/', verificarToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.usuario!.id;
    const userRol = req.usuario!.rol;
    let where: any = {};

    if (userRol === 'ADMIN') {
      // Admin ve todos
    } else if (userRol === 'GERENTE') {
      const proyectos = await prisma.proyecto.findMany({ where: { gerenteId: userId }, select: { id: true } });
      const proyectoIds = proyectos.map(p => p.id);
      const miembrosDeProyectos = await prisma.proyectoUsuario.findMany({
        where: { proyectoId: { in: proyectoIds } },
        select: { usuarioId: true }
      });
      const ids = [...new Set(miembrosDeProyectos.map(m => m.usuarioId))];
      ids.push(userId);
      where = { id: { in: ids } };
    } else if (userRol === 'MIEMBRO') {
      const proyectos = await prisma.proyectoUsuario.findMany({ where: { usuarioId: userId }, select: { proyectoId: true } });
      const proyectoIds = proyectos.map(p => p.proyectoId);
      const miembrosDeProyectos = await prisma.proyectoUsuario.findMany({
        where: { proyectoId: { in: proyectoIds } },
        select: { usuarioId: true }
      });
      const ids = [...new Set(miembrosDeProyectos.map(m => m.usuarioId))];
      ids.push(userId);
      where = { id: { in: ids } };
    } else {
      where = { id: userId };
    }

    const usuarios = await prisma.usuario.findMany({
      where,
      select: {
        id: true, codigo: true, nombre: true, correo: true, avatar: true, rol: true, activo: true, estado: true,
        ultimaConexion: true, ubicacionLat: true, ubicacionLng: true, ubicacionActualizada: true, createdAt: true,
        _count: { select: { tareasAsignadas: true, proyectos: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, data: usuarios, message: 'Usuarios obtenidos' });
  } catch (error: any) {
    console.error('Error al obtener usuarios:', error);
    res.status(500).json({ success: false, message: 'Error al obtener usuarios' });
  }
});

router.get('/all', verificarToken, async (_req: AuthRequest, res: Response) => {
  try {
    const usuarios = await prisma.usuario.findMany({
      where: { activo: true },
      select: { id: true, nombre: true, correo: true, avatar: true, rol: true, estado: true, ubicacionLat: true, ubicacionLng: true },
      orderBy: { nombre: 'asc' }
    });
    res.json({ success: true, data: usuarios, message: 'Usuarios obtenidos' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Error al obtener usuarios' });
  }
});

router.get('/buscar', verificarToken, async (req: AuthRequest, res: Response) => {
  try {
    const q = (req.query.q as string || '').trim();
    if (!q || q.length < 1) {
      res.json({ success: true, data: [], message: 'Escribe al menos 1 carácter' });
      return;
    }
    const codigoNum = parseInt(q);
    const usuarios = await prisma.usuario.findMany({
      where: {
        activo: true,
        OR: [
          { correo: { contains: q } },
          { nombre: { contains: q } },
          ...(isNaN(codigoNum) ? [] : [{ codigo: codigoNum }]),
        ]
      },
      select: { id: true, codigo: true, nombre: true, correo: true, avatar: true, rol: true, estado: true },
      take: 10,
      orderBy: { nombre: 'asc' }
    });
    res.json({ success: true, data: usuarios, message: 'Usuarios encontrados' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Error al buscar usuarios' });
  }
});

router.put('/:id', verificarToken, async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const userId = req.usuario?.id;
    const userRol = req.usuario?.rol;
    if (userId !== id && userRol !== 'ADMIN') {
      res.status(403).json({ success: false, message: 'No tienes permiso para editar este usuario' });
      return;
    }
    const { nombre, correo, rol, activo, estado, contrasena } = req.body;
    const data: any = {};
    if (nombre) data.nombre = nombre;
    if (correo) data.correo = correo;
    if (rol && userRol === 'ADMIN') data.rol = rol;
    if (activo !== undefined && userRol === 'ADMIN') data.activo = activo;
    if (estado) data.estado = estado;
    if (contrasena && contrasena.length >= 8) {
      data.contrasena = await bcrypt.hash(contrasena, 12);
    }
    const usuario = await prisma.usuario.update({
      where: { id }, data,
      select: { id: true, nombre: true, correo: true, avatar: true, rol: true, activo: true, estado: true }
    });
    res.json({ success: true, data: usuario, message: 'Usuario actualizado' });
  } catch (error: any) { res.status(500).json({ success: false, message: 'Error al actualizar usuario' }); }
});

router.put('/:id/change-password', verificarToken, async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const userId = req.usuario?.id;
    if (userId !== id) { res.status(403).json({ success: false, message: 'Solo puedes cambiar tu propia contraseña' }); return; }
    const { contrasenaActual, contrasenaNueva } = req.body;
    if (!contrasenaActual || !contrasenaNueva) { res.status(400).json({ success: false, message: 'Contraseña actual y nueva son requeridas' }); return; }
    if (contrasenaNueva.length < 6) { res.status(400).json({ success: false, message: 'Mínimo 6 caracteres' }); return; }
    const usuario = await prisma.usuario.findUnique({ where: { id } });
    if (!usuario) { res.status(404).json({ success: false, message: 'Usuario no encontrado' }); return; }
    const valida = await bcrypt.compare(contrasenaActual, usuario.contrasena);
    if (!valida) { res.status(400).json({ success: false, message: 'La contraseña actual es incorrecta' }); return; }
    const hash = await bcrypt.hash(contrasenaNueva, 12);
    await prisma.usuario.update({ where: { id }, data: { contrasena: hash } });
    res.json({ success: true, message: 'Contraseña actualizada' });
  } catch (error: any) { res.status(500).json({ success: false, message: 'Error al cambiar la contraseña' }); }
});

router.put('/:id/avatar', verificarToken, (req: AuthRequest, res: Response, next) => {
  avatarUpload.single('avatar')(req, res, (err: any) => {
    if (err) {
      const msg = err.code === 'LIMIT_FILE_SIZE' ? 'Imagen máximo 2MB' : err.message || 'Error al subir';
      res.status(400).json({ success: false, message: msg });
      return;
    }
    next();
  });
}, async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    if (req.usuario!.id !== id && req.usuario!.rol !== 'ADMIN') {
      res.status(403).json({ success: false, message: 'No puedes cambiar el avatar de otro usuario' }); return;
    }
    const file = req.file;
    if (!file) { res.status(400).json({ success: false, message: 'No se proporcionó imagen. Usa JPG, PNG, GIF o WebP (máx 2MB).' }); return; }
    const avatarUrl = `/api/uploads/avatars/${file.filename}`;
    const usuario = await prisma.usuario.update({
      where: { id }, data: { avatar: avatarUrl },
      select: { id: true, codigo: true, nombre: true, correo: true, avatar: true, rol: true, estado: true }
    });
    res.json({ success: true, data: usuario, message: 'Avatar actualizado' });
  } catch (error: any) {
    console.error('Error al subir avatar:', error);
    res.status(500).json({ success: false, message: 'Error al subir avatar' });
  }
});

router.put('/:id/ubicacion', verificarToken, async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    if (req.usuario!.id !== id) { res.status(403).json({ success: false, message: 'Solo puedes actualizar tu propia ubicación' }); return; }
    const { lat, lng } = req.body;
    if (typeof lat !== 'number' || typeof lng !== 'number') { res.status(400).json({ success: false, message: 'Coordenadas inválidas' }); return; }
    await prisma.usuario.update({ where: { id }, data: { ubicacionLat: lat, ubicacionLng: lng, ubicacionActualizada: new Date() } });
    res.json({ success: true, message: 'Ubicación actualizada' });
  } catch (error: any) { res.status(500).json({ success: false, message: 'Error al actualizar ubicación' }); }
});

router.delete('/:id', verificarToken, verificarRol('ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const proyectosComoGerente = await prisma.proyecto.findMany({ where: { gerenteId: id, estado: 'ACTIVO' } });
    if (proyectosComoGerente.length > 0) {
      res.status(400).json({ success: false, message: `El usuario es gerente de ${proyectosComoGerente.length} proyecto(s) activo(s). Reasigna antes de eliminar.` });
      return;
    }
    await prisma.tarea.updateMany({ where: { asignadoAId: id }, data: { asignadoAId: null } });
    await prisma.proyectoUsuario.deleteMany({ where: { usuarioId: id } });
    await prisma.comentario.deleteMany({ where: { autorId: id } });
    await prisma.archivo.deleteMany({ where: { subidoPorId: id } });
    await prisma.archivoProyecto.deleteMany({ where: { subidoPorId: id } });
    await prisma.notificacion.deleteMany({ where: { usuarioId: id } });
    await prisma.historialEstado.deleteMany({ where: { cambiadoPorId: id } });
    await prisma.usuario.delete({ where: { id } });
    res.json({ success: true, message: 'Usuario eliminado' });
  } catch (error: any) {
    console.error('Error al eliminar usuario:', error);
    res.status(500).json({ success: false, message: 'Error al eliminar usuario' });
  }
});

export default router;
