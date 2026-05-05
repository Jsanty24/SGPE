import { PrismaClient } from '@prisma/client';

export const crearNotificacion = async (
  prisma: PrismaClient,
  usuarioId: string,
  mensaje: string,
  opciones?: { tipo?: string; referenciaId?: string; referenciaType?: string }
): Promise<void> => {
  try {
    if (opciones?.tipo && opciones?.referenciaId) {
      const existente = await prisma.notificacion.findFirst({
        where: {
          usuarioId,
          tipo: opciones.tipo,
          referenciaId: opciones.referenciaId,
        }
      });
      if (existente) return;
    }

    await prisma.notificacion.create({
      data: {
        usuarioId,
        mensaje,
        tipo: opciones?.tipo || 'SISTEMA',
        referenciaId: opciones?.referenciaId || null,
        referenciaType: opciones?.referenciaType || null,
      }
    });
  } catch (error) {
    console.error('Error al crear notificacion:', error);
  }
};
