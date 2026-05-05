import { Router, Response } from 'express';
import { body } from 'express-validator';
import { verificarToken, AuthRequest } from '../middlewares/auth';
import { validate } from '../middlewares/validators';
import { prisma } from '../lib/prisma';
import { getIO } from '../lib/socket';

const router = Router();

router.get('/proyecto/:proyectoId', verificarToken, async (req: AuthRequest, res: Response) => {
  try {
    const proyectoId = (req.params as any).proyectoId as string;
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 50));
    const skip = (page - 1) * limit;

    const [mensajes, total] = await Promise.all([
      prisma.mensajeChat.findMany({
        where: { proyectoId },
        include: { autor: { select: { id: true, nombre: true, avatar: true } } },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.mensajeChat.count({ where: { proyectoId } }),
    ]);

    res.json({
      success: true,
      data: mensajes.reverse(),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      message: 'Mensajes obtenidos',
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Error al obtener mensajes' });
  }
});

router.post('/proyecto/:proyectoId', verificarToken, validate([
  body('contenido').trim().notEmpty().withMessage('El contenido es requerido'),
]), async (req: AuthRequest, res: Response) => {
  try {
    const proyectoId = (req.params as any).proyectoId as string;
    const { contenido } = req.body;

    const mensaje = await prisma.mensajeChat.create({
      data: { contenido, proyectoId, autorId: req.usuario!.id },
      include: { autor: { select: { id: true, nombre: true, avatar: true } } },
    });

    const payload = {
      id: mensaje.id,
      contenido: mensaje.contenido,
      proyectoId: mensaje.proyectoId,
      autorId: mensaje.autor.id,
      autorNombre: mensaje.autor.nombre,
      autorAvatar: mensaje.autor.avatar,
      createdAt: mensaje.createdAt,
      editado: false,
    };

    try { getIO().to(`proyecto:${proyectoId}`).emit('chat:nuevoMensaje', payload); } catch {}

    res.status(201).json({ success: true, data: mensaje, message: 'Mensaje enviado' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Error al enviar mensaje' });
  }
});

router.put('/:id', verificarToken, validate([
  body('contenido').trim().notEmpty().withMessage('El contenido es requerido'),
]), async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const msg = await prisma.mensajeChat.findUnique({ where: { id } });
    if (!msg) { res.status(404).json({ success: false, message: 'Mensaje no encontrado' }); return; }
    if (msg.autorId !== req.usuario!.id && req.usuario!.rol !== 'ADMIN') {
      res.status(403).json({ success: false, message: 'No puedes editar este mensaje' }); return;
    }
    const mensaje = await prisma.mensajeChat.update({
      where: { id },
      data: { contenido: req.body.contenido, editado: true },
      include: { autor: { select: { id: true, nombre: true, avatar: true } } },
    });
    res.json({ success: true, data: mensaje, message: 'Mensaje editado' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Error al editar mensaje' });
  }
});

router.delete('/:id', verificarToken, async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const msg = await prisma.mensajeChat.findUnique({ where: { id } });
    if (!msg) { res.status(404).json({ success: false, message: 'Mensaje no encontrado' }); return; }
    if (msg.autorId !== req.usuario!.id && req.usuario!.rol !== 'ADMIN') {
      res.status(403).json({ success: false, message: 'No puedes eliminar este mensaje' }); return;
    }
    await prisma.mensajeChat.delete({ where: { id } });
    res.json({ success: true, message: 'Mensaje eliminado' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Error al eliminar mensaje' });
  }
});

export default router;
