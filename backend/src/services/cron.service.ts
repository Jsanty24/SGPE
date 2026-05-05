import { PrismaClient } from '@prisma/client';
import { crearNotificacion } from './notificacion.service';

export const verificarTareasVencimiento = async (prisma: PrismaClient): Promise<void> => {
  try {
    const ahora = new Date();
    const en24Horas = new Date(ahora.getTime() + 24 * 60 * 60 * 1000);

    // Tareas próximas a vencer (próximas 24h)
    const tareasProximas = await prisma.tarea.findMany({
      where: {
        estado: { not: 'TERMINADA' },
        fechaLimite: { gte: ahora, lte: en24Horas },
        asignadoAId: { not: null }
      },
      include: { asignadoA: true, proyecto: true }
    });

    // Tareas YA vencidas (fechaLimite < ahora y no terminadas)
    const tareasVencidas = await prisma.tarea.findMany({
      where: {
        estado: { not: 'TERMINADA' },
        fechaLimite: { lt: ahora },
        asignadoAId: { not: null }
      },
      include: { asignadoA: true, proyecto: true }
    });

    const usuariosNotificados = new Set<string>();

    for (const tarea of tareasProximas) {
      const usuarioId = tarea.asignadoAId!;
      if (usuariosNotificados.has(usuarioId)) continue;

      await crearNotificacion(prisma, usuarioId,
        `\u26A0\uFE0F La tarea "${tarea.nombre}" vence el ${new Date(tarea.fechaLimite).toLocaleDateString()} en "${tarea.proyecto.nombre}"`,
        { tipo: 'VENCIMIENTO', referenciaId: tarea.id, referenciaType: 'tarea' });
      usuariosNotificados.add(usuarioId);
    }

    for (const tarea of tareasVencidas) {
      const usuarioId = tarea.asignadoAId!;
      if (usuariosNotificados.has(usuarioId)) continue;

      await crearNotificacion(prisma, usuarioId,
        `\uD83D\uDEA8 TAREA VENCIDA: "${tarea.nombre}" vencio el ${new Date(tarea.fechaLimite).toLocaleDateString()} en "${tarea.proyecto.nombre}"`,
        { tipo: 'VENCIMIENTO', referenciaId: tarea.id, referenciaType: 'tarea' });
      usuariosNotificados.add(usuarioId);
    }

    const total = tareasProximas.length + tareasVencidas.length;
    if (total > 0) {
      console.log(`⏰ Verificación: ${tareasProximas.length} próximas, ${tareasVencidas.length} vencidas`);
    }
  } catch (error) {
    console.error('Error en cron job de vencimiento:', error);
  }
};
