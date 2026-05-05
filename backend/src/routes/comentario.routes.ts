import { Router, Response } from 'express';
import { body } from 'express-validator';
import { verificarToken, noCliente, AuthRequest } from '../middlewares/auth';
import { validate } from '../middlewares/validators';
import { prisma } from '../lib/prisma';

const router = Router();

router.post('/tarea/:tareaId', verificarToken, noCliente, validate([
  body('contenido').trim().notEmpty().withMessage('El contenido es requerido')
]), async (req: AuthRequest, res: Response) => {
  try {
    const tareaId = (req.params as any).tareaId as string;
    const { contenido } = req.body;
    const comentario = await prisma.comentario.create({
      data: { contenido, tareaId, autorId: req.usuario!.id },
      include: { autor: { select: { id: true, nombre: true } } }
    });
    res.status(201).json({ success: true, data: comentario, message: 'Comentario agregado' });
  } catch (error: any) { res.status(500).json({ success: false, message: 'Error al agregar comentario' }); }
});

router.get('/tarea/:tareaId', verificarToken, async (req: AuthRequest, res: Response) => {
  try {
    const tareaId = (req.params as any).tareaId as string;
    const comentarios = await prisma.comentario.findMany({
      where: { tareaId },
      include: { autor: { select: { id: true, nombre: true } } },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, data: comentarios, message: 'Comentarios obtenidos' });
  } catch (error: any) { res.status(500).json({ success: false, message: 'Error al obtener comentarios' }); }
});

router.put('/:id', verificarToken, noCliente, validate([
  body('contenido').trim().notEmpty().withMessage('El contenido es requerido')
]), async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const userId = req.usuario!.id;
    const comentario = await prisma.comentario.findUnique({ where: { id } });
    if (!comentario) { res.status(404).json({ success: false, message: 'Comentario no encontrado' }); return; }
    if (comentario.autorId !== userId && req.usuario!.rol !== 'ADMIN') {
      res.status(403).json({ success: false, message: 'No puedes editar este comentario' });
      return;
    }
    const actualizado = await prisma.comentario.update({
      where: { id }, data: { contenido: req.body.contenido },
      include: { autor: { select: { id: true, nombre: true } } }
    });
    res.json({ success: true, data: actualizado, message: 'Comentario actualizado' });
  } catch (error: any) { res.status(500).json({ success: false, message: 'Error al actualizar comentario' }); }
});

router.delete('/:id', verificarToken, noCliente, async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const userId = req.usuario!.id;
    const comentario = await prisma.comentario.findUnique({ where: { id } });
    if (!comentario) { res.status(404).json({ success: false, message: 'Comentario no encontrado' }); return; }
    if (comentario.autorId !== userId && req.usuario!.rol !== 'ADMIN') {
      res.status(403).json({ success: false, message: 'No puedes eliminar este comentario' });
      return;
    }
    await prisma.comentario.delete({ where: { id } });
    res.json({ success: true, message: 'Comentario eliminado' });
  } catch (error: any) { res.status(500).json({ success: false, message: 'Error al eliminar comentario' }); }
});

export default router;
