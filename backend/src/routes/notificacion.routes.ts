import { Router, Response } from 'express';
import { verificarToken, AuthRequest } from '../middlewares/auth';
import { prisma } from '../lib/prisma';

const router = Router();

router.get('/', verificarToken, async (req: AuthRequest, res: Response) => {
  try {
    const notificaciones = await prisma.notificacion.findMany({
      where: { usuarioId: req.usuario!.id },
      orderBy: { createdAt: 'desc' },
      take: 50
    });
    const noLeidas = notificaciones.filter((n: any) => !n.leida).length;
    res.json({ success: true, data: { notificaciones, noLeidas }, message: 'Notificaciones obtenidas' });
  } catch (error: any) { res.status(500).json({ success: false, message: 'Error al obtener notificaciones' }); }
});

router.patch('/:id/leer', verificarToken, async (req: AuthRequest, res: Response) => {
  try {
    await prisma.notificacion.update({ where: { id: req.params.id as string, usuarioId: req.usuario!.id }, data: { leida: true } });
    res.json({ success: true, message: 'Notificacion marcada como leida' });
  } catch (error: any) { res.status(500).json({ success: false, message: 'Error al marcar notificacion' }); }
});

router.patch('/leer-todas', verificarToken, async (req: AuthRequest, res: Response) => {
  try {
    await prisma.notificacion.updateMany({ where: { usuarioId: req.usuario!.id, leida: false }, data: { leida: true } });
    res.json({ success: true, message: 'Todas las notificaciones marcadas como leidas' });
  } catch (error: any) { res.status(500).json({ success: false, message: 'Error al marcar notificaciones' }); }
});

export default router;
