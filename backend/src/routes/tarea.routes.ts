import { Router, Response } from 'express';
import multer from 'multer';
import path from 'path';
import crypto from 'crypto';
import { body } from 'express-validator';
import { verificarToken, verificarRol, noCliente, AuthRequest } from '../middlewares/auth';
import { validate } from '../middlewares/validators';
import { crearNotificacion } from '../services/notificacion.service';
import { prisma } from '../lib/prisma';
import { getIO } from '../lib/socket';

const router = Router();
const UPLOADS_DIR = path.join(__dirname, '..', '..', 'uploads');
const evidenciaUpload = multer({
  storage: multer.diskStorage({
    destination: UPLOADS_DIR,
    filename: (_req, file, cb) => cb(null, `${crypto.randomUUID()}-${file.originalname}`)
  }),
  limits: { fileSize: 10 * 1024 * 1024 }
});

router.post('/proyecto/:proyectoId', verificarToken, noCliente, verificarRol('ADMIN', 'GERENTE'), validate([
  body('nombre').trim().notEmpty().withMessage('El nombre es requerido'),
  body('descripcion').trim().notEmpty().withMessage('La descripcion es requerida'),
  body('fechaLimite').isISO8601().withMessage('Fecha limite invalida'),
  body('prioridad').optional().isIn(['ALTA', 'MEDIA', 'BAJA'])
]), async (req: AuthRequest, res: Response) => {
  try {
    const proyectoId = (req.params as any).proyectoId as string;
    const { nombre, descripcion, prioridad, fechaLimite, asignadoAId } = req.body;
    const proyecto = await prisma.proyecto.findUnique({ where: { id: proyectoId } });
    if (!proyecto) { res.status(404).json({ success: false, message: 'Proyecto no encontrado' }); return; }
    if (proyecto.estado !== 'ACTIVO') { res.status(400).json({ success: false, message: 'No se pueden crear tareas en proyectos no activos' }); return; }
    const fechaLim = new Date(fechaLimite);
    if (fechaLim < new Date()) { res.status(400).json({ success: false, message: 'La fecha limite no puede ser anterior a hoy' }); return; }
    if (fechaLim > proyecto.fechaFin) { res.status(400).json({ success: false, message: 'La fecha limite no puede ser posterior a la fecha fin del proyecto' }); return; }
    const tarea = await prisma.tarea.create({
      data: { nombre, descripcion, prioridad: prioridad || 'MEDIA', fechaLimite: fechaLim, proyectoId, asignadoAId: asignadoAId || undefined },
      include: { asignadoA: { select: { id: true, nombre: true } } }
    });
    if (asignadoAId) await crearNotificacion(prisma, asignadoAId, `Se te ha asignado la tarea "${nombre}" (${prioridad || 'MEDIA'}) con fecha limite ${fechaLim.toLocaleDateString()}`);
    res.status(201).json({ success: true, data: tarea, message: 'Tarea creada' });
  } catch (error: any) { res.status(500).json({ success: false, message: 'Error al crear tarea' }); }
});

router.get('/mis-tareas', verificarToken, async (req: AuthRequest, res: Response) => {
  try {
    const tareas = await prisma.tarea.findMany({
      where: { asignadoAId: req.usuario!.id },
      include: { proyecto: { select: { id: true, nombre: true, estado: true } }, _count: { select: { comentarios: true } } },
      orderBy: [{ estado: 'asc' }, { prioridad: 'asc' }]
    });
    res.json({ success: true, data: tareas, message: 'Tareas obtenidas' });
  } catch (error: any) { res.status(500).json({ success: false, message: 'Error al obtener tareas' }); }
});

router.get('/proyecto/:proyectoId', verificarToken, async (req: AuthRequest, res: Response) => {
  try {
    const proyectoId = (req.params as any).proyectoId as string;
    const tareas = await prisma.tarea.findMany({
      where: { proyectoId },
      include: { asignadoA: { select: { id: true, nombre: true } }, _count: { select: { comentarios: true, archivos: true } } },
      orderBy: [{ prioridad: 'asc' }, { createdAt: 'desc' }]
    });
    res.json({ success: true, data: tareas, message: 'Tareas obtenidas' });
  } catch (error: any) { res.status(500).json({ success: false, message: 'Error al obtener tareas' }); }
});

router.get('/:id', verificarToken, async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const tarea = await prisma.tarea.findUnique({
      where: { id },
      include: {
        proyecto: { select: { id: true, nombre: true, estado: true, gerenteId: true } },
        asignadoA: { select: { id: true, nombre: true, correo: true } },
        comentarios: { include: { autor: { select: { id: true, nombre: true } } }, orderBy: { createdAt: 'desc' } },
        archivos: { include: { subidoPor: { select: { id: true, nombre: true } } } },
        historial: { include: { cambiadoPor: { select: { id: true, nombre: true } } }, orderBy: { createdAt: 'desc' } },
        subtareas: { orderBy: { createdAt: 'asc' } }
      }
    });
    if (!tarea) { res.status(404).json({ success: false, message: 'Tarea no encontrada' }); return; }
    res.json({ success: true, data: tarea, message: 'Tarea obtenida' });
  } catch (error: any) { res.status(500).json({ success: false, message: 'Error al obtener tarea' }); }
});

router.put('/:id', verificarToken, noCliente, verificarRol('ADMIN', 'GERENTE'), async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const { nombre, descripcion, prioridad, fechaLimite, asignadoAId } = req.body;
    const tareaActual = await prisma.tarea.findUnique({ where: { id }, include: { proyecto: true } });
    if (!tareaActual) { res.status(404).json({ success: false, message: 'Tarea no encontrada' }); return; }
    if (tareaActual.proyecto.estado !== 'ACTIVO') { res.status(400).json({ success: false, message: 'No se pueden editar tareas en proyectos no activos' }); return; }
    const data: any = {};
    if (nombre) data.nombre = nombre;
    if (descripcion) data.descripcion = descripcion;
    if (prioridad) data.prioridad = prioridad;
    if (fechaLimite) data.fechaLimite = new Date(fechaLimite);
    if (asignadoAId !== undefined) data.asignadoAId = asignadoAId || null;
    if (req.body.horasEstimadas !== undefined) data.horasEstimadas = req.body.horasEstimadas;
    if (req.body.horasReales !== undefined) data.horasReales = req.body.horasReales;
    
    const tarea = await prisma.tarea.update({ where: { id }, data, include: { asignadoA: { select: { id: true, nombre: true } } } });
    if (asignadoAId && asignadoAId !== tareaActual.asignadoAId) {
      await crearNotificacion(prisma, asignadoAId, `Se te ha asignado la tarea "${tarea.nombre}" (${tarea.prioridad})`);
    }
    res.json({ success: true, data: tarea, message: 'Tarea actualizada' });
  } catch (error: any) { res.status(500).json({ success: false, message: 'Error al actualizar tarea' }); }
});

router.patch('/:id/estado', verificarToken, noCliente, async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const { estado, lat, lng } = req.body;
    if (!['PENDIENTE', 'EN_PROGRESO', 'EN_REVISION', 'TERMINADA'].includes(estado)) { res.status(400).json({ success: false, message: 'Estado invalido' }); return; }
    const tarea = await prisma.tarea.findUnique({ where: { id }, include: { proyecto: { include: { miembros: true } } } });
    if (!tarea) { res.status(404).json({ success: false, message: 'Tarea no encontrada' }); return; }
    if (tarea.proyecto.estado !== 'ACTIVO') { res.status(400).json({ success: false, message: 'No se puede cambiar estado en proyectos no activos' }); return; }
    const esMiembro = req.usuario!.rol === 'ADMIN' || tarea.proyecto.gerenteId === req.usuario!.id || tarea.proyecto.miembros.some(m => m.usuarioId === req.usuario!.id);
    if (!esMiembro) { res.status(403).json({ success: false, message: 'No perteneces a este proyecto' }); return; }
    const coordStr = typeof lat === 'number' && typeof lng === 'number' ? `${lat},${lng}` : null;
    await prisma.historialEstado.create({ data: { tareaId: id, estadoAnterior: tarea.estado, estadoNuevo: estado, coordenadas: coordStr, cambiadoPorId: req.usuario!.id } });
    
    if (coordStr) {
      await prisma.usuario.update({
        where: { id: req.usuario!.id },
        data: { ubicacionLat: lat, ubicacionLng: lng, ubicacionActualizada: new Date() }
      });
    }

    const actualizada = await prisma.tarea.update({
      where: { id }, data: { estado },
      include: { asignadoA: { select: { id: true, nombre: true } }, proyecto: { select: { gerenteId: true, nombre: true } } }
    });
    if (estado === 'TERMINADA' && tarea.proyecto.gerenteId !== req.usuario!.id) {
      await crearNotificacion(prisma, tarea.proyecto.gerenteId, `La tarea "${tarea.nombre}" ha sido marcada como terminada en "${tarea.proyecto.nombre}"`);
    }

    try {
      getIO().to(`proyecto:${tarea.proyectoId}`).emit('tarea:estadoCambiado', {
        tareaId: id,
        estadoAnterior: tarea.estado,
        estadoNuevo: estado,
        cambiadoPorId: req.usuario!.id,
        cambiadoPorNombre: req.usuario!.nombre,
      });
    } catch {}

    res.json({ success: true, data: actualizada, message: 'Estado actualizado' });
  } catch (error: any) { res.status(500).json({ success: false, message: 'Error al cambiar estado' }); }
});

router.patch('/reorder/bulk', verificarToken, noCliente, async (req: AuthRequest, res: Response) => {
  try {
    const { tareas } = req.body as { tareas: { id: string, estado: string, orden: number }[] };
    if (!Array.isArray(tareas)) {
      res.status(400).json({ success: false, message: 'Datos invalidos' });
      return;
    }
    
    // Perform bulk update in a transaction
    await prisma.$transaction(
      tareas.map(t => 
        prisma.tarea.update({
          where: { id: t.id },
          data: { estado: t.estado, orden: t.orden }
        })
      )
    );

    res.json({ success: true, message: 'Orden guardado' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Error al reordenar tareas' });
  }
});

router.post('/:id/asignar', verificarToken, noCliente, verificarRol('ADMIN', 'GERENTE'), async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const { usuarioId } = req.body;
    const tarea = await prisma.tarea.findUnique({ where: { id } });
    if (!tarea) { res.status(404).json({ success: false, message: 'Tarea no encontrada' }); return; }
    const actualizada = await prisma.tarea.update({ where: { id }, data: { asignadoAId: usuarioId }, include: { asignadoA: { select: { id: true, nombre: true, correo: true } } } });
    await crearNotificacion(prisma, usuarioId, `Se te ha asignado la tarea "${tarea.nombre}" (${tarea.prioridad}) con fecha limite ${new Date(tarea.fechaLimite).toLocaleDateString()}`);
    res.json({ success: true, data: actualizada, message: 'Tarea asignada' });
  } catch (error: any) { res.status(500).json({ success: false, message: 'Error al asignar tarea' }); }
});

router.delete('/:id', verificarToken, noCliente, verificarRol('ADMIN', 'GERENTE'), async (req: AuthRequest, res: Response) => {
  try {
    await prisma.tarea.delete({ where: { id: req.params.id as string } });
    res.json({ success: true, message: 'Tarea eliminada' });
  } catch (error: any) { res.status(500).json({ success: false, message: 'Error al eliminar tarea' }); }
});

router.post('/:id/subtareas', verificarToken, noCliente, validate([
  body('titulo').trim().notEmpty().withMessage('El título es requerido')
]), async (req: AuthRequest, res: Response) => {
  try {
    const { titulo } = req.body;
    const subtarea = await prisma.subtarea.create({ data: { titulo, tareaId: req.params.id as string } });
    res.status(201).json({ success: true, data: subtarea, message: 'Subtarea agregada' });
  } catch (error: any) { res.status(500).json({ success: false, message: 'Error al agregar subtarea' }); }
});

router.put('/subtareas/:subId', verificarToken, noCliente, validate([
  body('completada').isBoolean().withMessage('Estado inválido')
]), async (req: AuthRequest, res: Response) => {
  try {
    const { completada } = req.body;
    const subtarea = await prisma.subtarea.update({ where: { id: req.params.subId as string }, data: { completada } });
    res.json({ success: true, data: subtarea, message: 'Subtarea actualizada' });
  } catch (error: any) { res.status(500).json({ success: false, message: 'Error al actualizar subtarea' }); }
});

router.delete('/subtareas/:subId', verificarToken, noCliente, async (req: AuthRequest, res: Response) => {
  try {
    await prisma.subtarea.delete({ where: { id: req.params.subId as string } });
    res.json({ success: true, message: 'Subtarea eliminada' });
  } catch (error: any) { res.status(500).json({ success: false, message: 'Error al eliminar subtarea' }); }
});

router.patch('/:id/tiempo', verificarToken, async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const { horasReales } = req.body;
    if (typeof horasReales !== 'number' || horasReales < 0) {
      res.status(400).json({ success: false, message: 'horasReales debe ser un numero positivo' });
      return;
    }
    const tarea = await prisma.tarea.findUnique({ where: { id } });
    if (!tarea) { res.status(404).json({ success: false, message: 'Tarea no encontrada' }); return; }
    const actual = tarea.horasReales ?? 0;
    const tareaUpdated = await prisma.tarea.update({
      where: { id },
      data: { horasReales: actual + horasReales },
      select: { id: true, nombre: true, horasReales: true, horasEstimadas: true }
    });
    res.json({ success: true, data: tareaUpdated, message: 'Tiempo registrado' });
  } catch (error: any) { res.status(500).json({ success: false, message: 'Error al registrar tiempo' }); }
});

router.post('/:id/evidencia', verificarToken, noCliente, (req, res, next) => {
  evidenciaUpload.single('archivo')(req, res, (err: any) => {
    if (err) {
      const msg = err.code === 'LIMIT_FILE_SIZE' ? 'Archivo excede 10MB' : err.message || 'Error al subir';
      res.status(400).json({ success: false, message: msg });
      return;
    }
    next();
  });
}, async (req: AuthRequest, res: Response) => {
  try {
    const file = req.file;
    if (!file) { res.status(400).json({ success: false, message: 'No se proporcionó archivo' }); return; }
    const tarea = await prisma.tarea.update({
      where: { id: req.params.id as string },
      data: { evidencia: file.filename }
    });
    res.json({ success: true, data: tarea, message: 'Evidencia subida' });
  } catch (error: any) {
    console.error('Error al subir evidencia:', error);
    res.status(500).json({ success: false, message: 'Error al subir evidencia' });
  }
});

export default router;
