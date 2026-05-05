import { Router, Response } from 'express';
import { verificarToken, AuthRequest } from '../middlewares/auth';
import { prisma } from '../lib/prisma';

const router = Router();

router.get('/', verificarToken, async (req: AuthRequest, res: Response) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 20));
    const skip = (page - 1) * limit;

    const [historial, total] = await Promise.all([
      prisma.historialEstado.findMany({
        include: {
          tarea: { select: { id: true, nombre: true, proyectoId: true, proyecto: { select: { id: true, nombre: true } } } },
          cambiadoPor: { select: { id: true, nombre: true, avatar: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.historialEstado.count(),
    ]);

    const data = historial.map(h => ({
      id: h.id,
      tipo: 'ESTADO_CAMBIO',
      tareaId: h.tareaId,
      tareaNombre: h.tarea.nombre,
      proyectoId: h.tarea.proyectoId,
      proyectoNombre: h.tarea.proyecto.nombre,
      estadoAnterior: h.estadoAnterior,
      estadoNuevo: h.estadoNuevo,
      usuario: h.cambiadoPor,
      createdAt: h.createdAt,
    }));

    res.json({
      success: true,
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      message: 'Actividad obtenida',
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Error al obtener actividad' });
  }
});

export default router;
