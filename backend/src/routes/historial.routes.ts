import { Router, Response } from 'express';
import { verificarToken, AuthRequest } from '../middlewares/auth';
import { prisma } from '../lib/prisma';

const router = Router();

router.get('/tarea/:tareaId', verificarToken, async (req: AuthRequest, res: Response) => {
  try {
    const tareaId = (req.params as any).tareaId as string;
    const tarea = await prisma.tarea.findUnique({
      where: { id: tareaId },
      include: { proyecto: { include: { miembros: true } } }
    });
    if (!tarea) { res.status(404).json({ success: false, message: 'Tarea no encontrada' }); return; }

    const userId = req.usuario!.id;
    const userRol = req.usuario!.rol;
    const esMiembro = userRol === 'ADMIN' || tarea.proyecto.gerenteId === userId || tarea.proyecto.miembros.some(m => m.usuarioId === userId);
    if (!esMiembro) { res.status(403).json({ success: false, message: 'No tienes acceso a este proyecto' }); return; }

    const historial = await prisma.historialEstado.findMany({
      where: { tareaId },
      include: { cambiadoPor: { select: { id: true, nombre: true } } },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, data: historial, message: 'Historial obtenido' });
  } catch (error: any) { res.status(500).json({ success: false, message: 'Error al obtener historial' }); }
});

export default router;
