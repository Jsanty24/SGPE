import { Router, Response } from 'express';
import { verificarToken, verificarRol, AuthRequest } from '../middlewares/auth';
import { prisma } from '../lib/prisma';

const router = Router();

router.patch('/:id/no-molestar', verificarToken, async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    if (req.usuario!.id !== id) {
      res.status(403).json({ success: false, message: 'Solo puedes cambiar tu propia configuracion' });
      return;
    }
    const { activo, inicio, fin } = req.body;
    const data: any = {};
    if (activo !== undefined) data.noMolestarActivo = activo;
    if (inicio) data.noMolestarInicio = inicio;
    if (fin) data.noMolestarFin = fin;

    const usuario = await prisma.usuario.update({
      where: { id }, data,
      select: { id: true, nombre: true, noMolestarActivo: true, noMolestarInicio: true, noMolestarFin: true },
    });
    res.json({ success: true, data: usuario, message: 'Configuracion de no molestar actualizada' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Error al actualizar' });
  }
});

router.patch('/:id/bloquear', verificarToken, verificarRol('ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    await prisma.usuario.update({
      where: { id },
      data: { bloqueadoHasta: new Date(Date.now() + 30 * 60 * 1000) },
    });
    res.json({ success: true, message: 'Cuenta bloqueada por 30 minutos' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Error al bloquear' });
  }
});

export default router;
