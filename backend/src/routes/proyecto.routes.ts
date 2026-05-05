import { Router, Response } from 'express';
import { body } from 'express-validator';
import { verificarToken, verificarRol, noCliente, AuthRequest } from '../middlewares/auth';
import { validate } from '../middlewares/validators';
import { crearNotificacion } from '../services/notificacion.service';
import { prisma } from '../lib/prisma';

const router = Router();

router.post('/', verificarToken, noCliente, verificarRol('ADMIN', 'GERENTE'), validate([
  body('nombre').trim().notEmpty().withMessage('El nombre es requerido'),
  body('descripcion').trim().notEmpty().withMessage('La descripcion es requerida'),
  body('fechaInicio').isISO8601().withMessage('Fecha de inicio invalida'),
  body('fechaFin').isISO8601().withMessage('Fecha de fin invalida')
]), async (req: AuthRequest, res: Response) => {
  try {
    const { nombre, descripcion, cliente, fechaInicio, fechaFin, miembros } = req.body;
    const proyecto = await prisma.proyecto.create({
      data: {
        nombre, descripcion, cliente,
        fechaInicio: new Date(fechaInicio),
        fechaFin: new Date(fechaFin),
        gerenteId: req.usuario!.id,
        miembros: miembros?.length ? { create: miembros.map((usuarioId: string) => ({ usuarioId })) } : undefined
      },
      include: { gerente: { select: { id: true, nombre: true } }, miembros: { include: { usuario: { select: { id: true, nombre: true, correo: true } } } } }
    });
    res.status(201).json({ success: true, data: proyecto, message: 'Proyecto creado exitosamente' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Error al crear proyecto' });
  }
});

router.get('/', verificarToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.usuario!.id;
    const userRol = req.usuario!.rol;
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 20));
    const skip = (page - 1) * limit;
    const where = userRol === 'ADMIN' ? {} : { OR: [{ gerenteId: userId }, { miembros: { some: { usuarioId: userId } } }] };
    const [proyectos, total] = await Promise.all([
      prisma.proyecto.findMany({
        where,
        include: {
          gerente: { select: { id: true, nombre: true } },
          miembros: { include: { usuario: { select: { id: true, nombre: true, correo: true } } } },
          tareas: true,
          _count: { select: { tareas: true } }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.proyecto.count({ where })
    ]);
    res.json({ success: true, data: proyectos, total, page, limit, totalPages: Math.ceil(total / limit), message: 'Proyectos obtenidos' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Error al obtener proyectos' });
  }
});

router.get('/:id', verificarToken, async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const userId = req.usuario!.id;
    const userRol = req.usuario!.rol;

    const proyecto = await prisma.proyecto.findUnique({
      where: { id },
      include: {
        gerente: { select: { id: true, nombre: true, correo: true, estado: true } },
        miembros: { include: { usuario: { select: { id: true, nombre: true, correo: true, rol: true, estado: true } } } },
        tareas: { include: { asignadoA: { select: { id: true, nombre: true, estado: true } }, _count: { select: { comentarios: true, archivos: true } } }, orderBy: { createdAt: 'desc' } },
        hitos: { orderBy: { fecha: 'asc' } },
        _count: { select: { tareas: true, miembros: true, hitos: true } }
      }
    });

    if (!proyecto) { res.status(404).json({ success: false, message: 'Proyecto no encontrado' }); return; }

    const esMiembro = proyecto.miembros.some((m: any) => m.usuarioId === userId);
    if (userRol !== 'ADMIN' && proyecto.gerenteId !== userId && !esMiembro) {
      res.status(403).json({ success: false, message: 'No tienes acceso a este proyecto' }); return;
    }
    res.json({ success: true, data: proyecto, message: 'Proyecto obtenido' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Error al obtener proyecto' });
  }
});

router.put('/:id', verificarToken, noCliente, verificarRol('ADMIN', 'GERENTE'), async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const { nombre, descripcion, cliente, fechaInicio, fechaFin, estado } = req.body;
    const proyecto = await prisma.proyecto.findUnique({ where: { id } });
    if (!proyecto) { res.status(404).json({ success: false, message: 'Proyecto no encontrado' }); return; }
    if (proyecto.estado === 'CERRADO' && req.usuario!.rol !== 'ADMIN') {
      res.status(403).json({ success: false, message: 'Solo ADMIN puede reabrir proyectos cerrados' }); return;
    }
    const data: any = {};
    if (nombre) data.nombre = nombre;
    if (descripcion) data.descripcion = descripcion;
    if (cliente !== undefined) data.cliente = cliente;
    if (fechaInicio) data.fechaInicio = new Date(fechaInicio);
    if (fechaFin) data.fechaFin = new Date(fechaFin);
    if (estado) data.estado = estado;

    const actualizado = await prisma.proyecto.update({
      where: { id }, data,
      include: { gerente: { select: { id: true, nombre: true } }, miembros: { include: { usuario: { select: { id: true, nombre: true } } } } }
    });

    if (estado && estado !== proyecto.estado) {
      const miembros = await prisma.proyectoUsuario.findMany({ where: { proyectoId: id } });
      for (const m of miembros) {
        await crearNotificacion(prisma, m.usuarioId, `El proyecto "${proyecto.nombre}" ha cambiado a estado: ${estado}`);
      }
    }
    res.json({ success: true, data: actualizado, message: 'Proyecto actualizado' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Error al actualizar proyecto' });
  }
});

router.delete('/:id', verificarToken, verificarRol('ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    await prisma.proyecto.delete({ where: { id: req.params.id as string } });
    res.json({ success: true, message: 'Proyecto eliminado' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Error al eliminar proyecto' });
  }
});

router.post('/:id/miembros', verificarToken, noCliente, verificarRol('ADMIN', 'GERENTE'), validate([
  body('usuarioId').trim().notEmpty().withMessage('El usuarioId es requerido')
]), async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const { usuarioId } = req.body;
    const existente = await prisma.proyectoUsuario.findUnique({ where: { proyectoId_usuarioId: { proyectoId: id, usuarioId } } });
    if (existente) { res.status(400).json({ success: false, message: 'El usuario ya es miembro' }); return; }
    const miembro = await prisma.proyectoUsuario.create({
      data: { proyectoId: id, usuarioId },
      include: { usuario: { select: { id: true, nombre: true, correo: true, rol: true } } }
    });
    const proyecto = await prisma.proyecto.findUnique({ where: { id } });
    await crearNotificacion(prisma, usuarioId, `Has sido agregado al proyecto "${proyecto?.nombre}"`);
    res.status(201).json({ success: true, data: miembro, message: 'Miembro agregado' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Error al agregar miembro' });
  }
});

router.delete('/:id/miembros/:usuarioId', verificarToken, noCliente, verificarRol('ADMIN', 'GERENTE'), async (req: AuthRequest, res: Response) => {
  try {
    const { id, usuarioId } = req.params as any;
    await prisma.tarea.updateMany({ where: { proyectoId: id, asignadoAId: usuarioId }, data: { asignadoAId: null } });
    await prisma.proyectoUsuario.delete({ where: { proyectoId_usuarioId: { proyectoId: id, usuarioId } } });
    const proyecto = await prisma.proyecto.findUnique({ where: { id } });
    if (proyecto) await crearNotificacion(prisma, proyecto.gerenteId, `Un miembro fue removido del proyecto "${proyecto.nombre}". Sus tareas quedaron sin asignar.`);
    res.json({ success: true, message: 'Miembro removido' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Error al remover miembro' });
  }
});

router.post('/:id/hitos', verificarToken, noCliente, verificarRol('ADMIN', 'GERENTE'), validate([
  body('titulo').trim().notEmpty().withMessage('El titulo es requerido'),
  body('fecha').isISO8601().withMessage('Fecha invalida')
]), async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const { titulo, descripcion, fecha } = req.body;
    const hito = await prisma.hito.create({ data: { titulo, descripcion, fecha: new Date(fecha), proyectoId: id } });
    res.status(201).json({ success: true, data: hito, message: 'Hito creado' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Error al crear hito' });
  }
});

router.put('/:id/hitos/:hitoId', verificarToken, noCliente, verificarRol('ADMIN', 'GERENTE'), validate([
  body('titulo').optional().trim().notEmpty().withMessage('El título no puede estar vacío')
]), async (req: AuthRequest, res: Response) => {
  try {
    const hitoId = (req.params as any).hitoId as string;
    const { titulo, descripcion, fecha, completado } = req.body;
    const data: any = {};
    if (titulo) data.titulo = titulo;
    if (descripcion !== undefined) data.descripcion = descripcion;
    if (fecha) data.fecha = new Date(fecha);
    if (completado !== undefined) data.completado = completado;
    const hito = await prisma.hito.update({ where: { id: hitoId }, data });
    res.json({ success: true, data: hito, message: 'Hito actualizado' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Error al actualizar hito' });
  }
});

router.delete('/:id/hitos/:hitoId', verificarToken, noCliente, verificarRol('ADMIN', 'GERENTE'), async (req: AuthRequest, res: Response) => {
  try {
    await prisma.hito.delete({ where: { id: (req.params as any).hitoId as string } });
    res.json({ success: true, message: 'Hito eliminado' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Error al eliminar hito' });
  }
});

export default router;
