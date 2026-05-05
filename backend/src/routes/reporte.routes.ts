import { Router, Response } from 'express';
import PDFDocument from 'pdfkit';
import { verificarToken, verificarRol, AuthRequest } from '../middlewares/auth';
import { prisma } from '../lib/prisma';

const router = Router();

router.get('/proyecto/:proyectoId', verificarToken, verificarRol('ADMIN', 'GERENTE'), async (req: AuthRequest, res: Response) => {
  try {
    const proyectoId = (req.params as any).proyectoId as string;
    const proyecto = await prisma.proyecto.findUnique({
      where: { id: proyectoId },
      include: {
        gerente: true,
        tareas: { include: { asignadoA: true, historial: { include: { cambiadoPor: true }, orderBy: { createdAt: 'asc' } } } },
        miembros: { include: { usuario: true } },
        hitos: true
      }
    });
    if (!proyecto) { res.status(404).json({ success: false, message: 'Proyecto no encontrado' }); return; }

    const totalTareas = proyecto.tareas.length;
    const terminadas = proyecto.tareas.filter((t: any) => t.estado === 'TERMINADA').length;
    const vencidas = proyecto.tareas.filter((t: any) => new Date(t.fechaLimite) < new Date() && t.estado !== 'TERMINADA').length;
    const porcentaje = totalTareas > 0 ? Math.round((terminadas / totalTareas) * 100) : 0;

    const doc = new PDFDocument({ margin: 50 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="reporte-${proyecto.nombre.replace(/\s+/g, '-')}.pdf"`);
    doc.pipe(res);

    // Header Background
    doc.rect(0, 0, doc.page.width, 120).fill('#0a0a14');
    doc.fillColor('#ffffff').fontSize(28).font('Helvetica-Bold').text('Reporte SGPE', 50, 40);
    doc.fillColor('#8b5cf6').fontSize(16).text(proyecto.nombre, 50, 75);
    
    doc.moveDown(4);

    doc.fillColor('#1a1a2e').fontSize(16).font('Helvetica-Bold').text('Información General');
    doc.moveTo(50, doc.y).lineTo(doc.page.width - 50, doc.y).strokeColor('#818cf8').stroke();
    doc.moveDown(0.5);
    
    doc.fontSize(11).font('Helvetica').fillColor('#475569');
    doc.text(`Descripción: ${proyecto.descripcion}`);
    doc.text(`Gerente: ${proyecto.gerente.nombre}`);
    doc.text(`Plazo: ${new Date(proyecto.fechaInicio).toLocaleDateString()} - ${new Date(proyecto.fechaFin).toLocaleDateString()}`);
    doc.text(`Estado: ${proyecto.estado}`);
    doc.moveDown(2);

    doc.fillColor('#1a1a2e').fontSize(16).font('Helvetica-Bold').text('Resumen de Tareas');
    doc.moveTo(50, doc.y).lineTo(doc.page.width - 50, doc.y).strokeColor('#818cf8').stroke();
    doc.moveDown(0.5);
    doc.fontSize(11).font('Helvetica').fillColor('#475569');
    doc.text(`Total: ${totalTareas} | Completadas: ${terminadas} | Vencidas: ${vencidas} | Progreso: ${porcentaje}%`);
    doc.moveDown(2);

    if (vencidas > 0) {
      doc.fillColor('#ef4444').fontSize(14).font('Helvetica-Bold').text('⚠️ Tareas Vencidas');
      doc.moveDown(0.5);
      doc.fontSize(10).font('Helvetica').fillColor('#475569');
      proyecto.tareas.filter((t: any) => new Date(t.fechaLimite) < new Date() && t.estado !== 'TERMINADA').forEach((t: any) => {
        doc.text(`• ${t.nombre} (Venció: ${new Date(t.fechaLimite).toLocaleDateString()}) - Asignado a: ${t.asignadoA?.nombre || 'Sin asignar'}`);
      });
      doc.moveDown(2);
    }

    doc.fillColor('#1a1a2e').fontSize(16).font('Helvetica-Bold').text('Rendimiento por Miembro');
    doc.moveTo(50, doc.y).lineTo(doc.page.width - 50, doc.y).strokeColor('#818cf8').stroke();
    doc.moveDown(0.5);
    doc.fontSize(11).font('Helvetica').fillColor('#475569');
    proyecto.miembros.forEach((m: any) => {
      const asignadas = proyecto.tareas.filter((t: any) => t.asignadoAId === m.usuarioId).length;
      const comp = proyecto.tareas.filter((t: any) => t.asignadoAId === m.usuarioId && t.estado === 'TERMINADA').length;
      const eficiencia = asignadas > 0 ? Math.round((comp / asignadas) * 100) : 0;
      doc.text(`• ${m.usuario.nombre}: ${comp}/${asignadas} tareas completadas — Eficiencia: ${eficiencia}%`);
    });

    doc.moveDown(2);
    doc.fillColor('#94a3b8').fontSize(9).font('Helvetica').text(`Generado el ${new Date().toLocaleString()} por SGPE`, { align: 'center' });
    doc.end();
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Error al generar reporte' });
  }
});

router.get('/datos/:proyectoId', verificarToken, verificarRol('ADMIN', 'GERENTE'), async (req: AuthRequest, res: Response) => {
  try {
    const proyectoId = (req.params as any).proyectoId as string;
    const proyecto = await prisma.proyecto.findUnique({
      where: { id: proyectoId },
      include: { tareas: true, miembros: { include: { usuario: { select: { id: true, nombre: true } } } } }
    });
    if (!proyecto) { res.status(404).json({ success: false, message: 'Proyecto no encontrado' }); return; }

    const tareasPorEstado = {
      PENDIENTE: proyecto.tareas.filter((t: any) => t.estado === 'PENDIENTE').length,
      EN_PROGRESO: proyecto.tareas.filter((t: any) => t.estado === 'EN_PROGRESO').length,
      EN_REVISION: proyecto.tareas.filter((t: any) => t.estado === 'EN_REVISION').length,
      TERMINADA: proyecto.tareas.filter((t: any) => t.estado === 'TERMINADA').length
    };

    const rendimiento = proyecto.miembros.map((m: any) => {
      const tareas = proyecto.tareas.filter((t: any) => t.asignadoAId === m.usuarioId);
      return {
        nombre: m.usuario.nombre,
        total: tareas.length,
        completadas: tareas.filter((t: any) => t.estado === 'TERMINADA').length,
        enProgreso: tareas.filter((t: any) => t.estado === 'EN_PROGRESO').length,
        pendientes: tareas.filter((t: any) => t.estado === 'PENDIENTE').length
      };
    });

    res.json({ success: true, data: { tareasPorEstado, rendimiento, totalTareas: proyecto.tareas.length }, message: 'Datos del reporte obtenidos' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Error al obtener datos del reporte' });
  }
});

export default router;
