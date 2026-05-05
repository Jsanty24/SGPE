import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';

const isProduction = process.env.NODE_ENV === 'production';

export const errorHandler = (err: Error, _req: Request, res: Response, _next: NextFunction): void => {
  console.error('Error no controlado:', err.message);
  if (!isProduction) {
    console.error(err.stack);
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      res.status(409).json({ success: false, message: 'Ya existe un registro con ese valor' });
      return;
    }
    if (err.code === 'P2025') {
      res.status(404).json({ success: false, message: 'Registro no encontrado' });
      return;
    }
    if (err.code === 'P2003') {
      res.status(400).json({ success: false, message: 'Referencia invalida' });
      return;
    }
  }

  if (err.name === 'ZodError') {
    const zodErr = err as any;
    res.status(400).json({
      success: false,
      message: 'Datos invalidos',
      errors: zodErr.errors?.map((e: any) => ({ field: e.path.join('.'), message: e.message })) || []
    });
    return;
  }

  if (err.name === 'JsonWebTokenError') {
    res.status(401).json({ success: false, message: 'Token invalido' });
    return;
  }

  if (err.name === 'TokenExpiredError') {
    res.status(401).json({ success: false, message: 'Sesion expirada, inicia sesion nuevamente' });
    return;
  }

  if (err.name === 'MulterError') {
    const multerErr = err as any;
    res.status(400).json({ success: false, message: multerErr.message || 'Error al subir archivo' });
    return;
  }

  res.status(500).json({
    success: false,
    message: 'Error interno del servidor. Por favor intenta mas tarde.'
  });
};
