import { Router, Response } from 'express';
import { verificarToken, AuthRequest } from '../middlewares/auth';
import { prisma } from '../lib/prisma';

const router = Router();

router.get('/', verificarToken, async (req: AuthRequest, res: Response) => {
  try {
    const mes = req.query.mes as string;
    if (!mes || !/^\d{4}-\d{2}$/.test(mes)) {
      res.status(400).json({ success: false, message: 'Parametro "mes" requerido (YYYY-MM)' });
      return;
    }

    const [year, month] = mes.split('-').map(Number);
    const inicio = new Date(year, month - 1, 1);
    const fin = new Date(year, month, 0, 23, 59, 59);

    const userId = req.usuario!.id;
    const userRol = req.usuario!.rol;

    const proyectosWhere = userRol === 'ADMIN'
      ? {}
      : { OR: [{ gerenteId: userId }, { miembros: { some: { usuarioId: userId } } }] };

    const [tareas, hitos] = await Promise.all([
      prisma.tarea.findMany({
        where: {
          proyecto: proyectosWhere,
          fechaLimite: { gte: inicio, lte: fin },
        },
        select: {
          id: true, nombre: true, estado: true, fechaLimite: true, prioridad: true,
          proyecto: { select: { id: true, nombre: true } },
        },
        orderBy: { fechaLimite: 'asc' },
      }),
      prisma.hito.findMany({
        where: {
          proyecto: proyectosWhere,
          fecha: { gte: inicio, lte: fin },
        },
        select: {
          id: true, titulo: true, fecha: true, completado: true,
          proyecto: { select: { id: true, nombre: true } },
        },
        orderBy: { fecha: 'asc' },
      }),
    ]);

    res.json({ success: true, data: { tareas, hitos }, message: 'Calendario obtenido' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Error al obtener calendario' });
  }
});

export default router;
