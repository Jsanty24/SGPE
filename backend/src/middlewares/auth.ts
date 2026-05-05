import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';

export interface AuthRequest extends Request {
  usuario?: { id: string; correo: string; rol: string; nombre: string };
}

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET no esta definido en las variables de entorno');
}

export const verificarToken = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ success: false, message: 'Token no proporcionado' });
      return;
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET) as {
      id: string; correo: string; rol: string;
    };

    const usuario = await prisma.usuario.findUnique({
      where: { id: decoded.id, activo: true }
    });

    if (!usuario) {
      res.status(401).json({ success: false, message: 'Usuario no encontrado o inactivo' });
      return;
    }

    req.usuario = { id: usuario.id, correo: usuario.correo, rol: usuario.rol, nombre: usuario.nombre };
    next();
  } catch (error) {
    res.status(401).json({ success: false, message: 'Token invalido o expirado' });
  }
};

export const verificarRol = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.usuario) {
      res.status(401).json({ success: false, message: 'No autenticado' });
      return;
    }
    if (!roles.includes(req.usuario.rol)) {
      res.status(403).json({ success: false, message: 'No tienes permisos para esta accion' });
      return;
    }
    next();
  };
};

export const noCliente = (req: AuthRequest, res: Response, next: NextFunction): void => {
  if (!req.usuario) {
    res.status(401).json({ success: false, message: 'No autenticado' });
    return;
  }
  if (req.usuario.rol === 'CLIENTE') {
    res.status(403).json({ success: false, message: 'Los clientes tienen acceso de solo lectura' });
    return;
  }
  next();
};
