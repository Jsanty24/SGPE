import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { body } from 'express-validator';
import { validate } from '../middlewares/validators';
import { loginLimiter } from '../middlewares/rateLimit';
import { enviarCorreo, sendWelcomeEmail, sendPasswordResetEmail, sendVerificationEmail } from '../services/email.service';
import { prisma } from '../lib/prisma';

const router = Router();

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET no esta definido en las variables de entorno');
}
const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY_DAYS = 7;
const BCRYPT_ROUNDS = 12;

const generarTokens = async (usuario: { id: string; correo: string; rol: string }) => {
  const accessToken = jwt.sign(
    { id: usuario.id, correo: usuario.correo, rol: usuario.rol },
    JWT_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRY }
  );

  const refreshToken = crypto.randomBytes(40).toString('hex');
  const refreshHash = await bcrypt.hash(refreshToken, BCRYPT_ROUNDS);
  const refreshExpira = new Date(Date.now() + REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000);

  await prisma.usuario.update({
    where: { id: usuario.id },
    data: { refreshToken: refreshHash, refreshTokenExpira: refreshExpira }
  });

  return { accessToken, refreshToken };
};

const selectUsuario = {
  id: true, codigo: true, nombre: true, correo: true, rol: true, estado: true, avatar: true,
  noMolestarActivo: true, noMolestarInicio: true, noMolestarFin: true, createdAt: true
};

router.post('/register', validate([
  body('nombre').trim().notEmpty().withMessage('El nombre es requerido'),
  body('correo').isEmail().withMessage('Correo inválido').normalizeEmail(),
  body('contrasena').isLength({ min: 8 }).withMessage('La contraseña debe tener al menos 8 caracteres'),
  body('rol').optional().isIn(['GERENTE', 'MIEMBRO', 'CLIENTE', 'VIEWER']).withMessage('Rol no permitido')
]), async (req: Request, res: Response) => {
  try {
    const { nombre, correo, contrasena, rol } = req.body;

    if (rol === 'ADMIN') {
      res.status(403).json({ success: false, message: 'No se puede registrar con rol ADMIN' });
      return;
    }

    const existente = await prisma.usuario.findUnique({ where: { correo } });
    if (existente) {
      res.status(400).json({ success: false, message: 'El correo ya está registrado' });
      return;
    }

    const hashedPassword = await bcrypt.hash(contrasena, BCRYPT_ROUNDS);
    const totalUsuarios = await prisma.usuario.count();
    const usuario = await prisma.usuario.create({
      data: { nombre, correo, contrasena: hashedPassword, rol: rol || 'VIEWER', codigo: totalUsuarios + 1 },
      select: selectUsuario
    });

    const { accessToken, refreshToken } = await generarTokens(usuario);

    try {
      await sendWelcomeEmail({ nombre, correo, rol: rol || 'VIEWER' });
    } catch (err) {
      console.error('Email de bienvenida fallido:', (err as Error).message);
    }

    res.status(201).json({
      success: true,
      data: { usuario, token: accessToken, refreshToken },
      message: 'Usuario registrado exitosamente'
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Error al registrar usuario' });
  }
});

router.post('/login', loginLimiter, validate([
  body('correo').isEmail().withMessage('Correo inválido').normalizeEmail(),
  body('contrasena').notEmpty().withMessage('La contraseña es requerida')
]), async (req: Request, res: Response) => {
  try {
    const { correo, contrasena } = req.body;

    const usuario = await prisma.usuario.findUnique({ where: { correo } });
    if (!usuario || !usuario.activo) {
      res.status(401).json({ success: false, message: 'Credenciales invalidas' });
      return;
    }

    if (usuario.bloqueadoHasta && usuario.bloqueadoHasta > new Date()) {
      const mins = Math.ceil((usuario.bloqueadoHasta.getTime() - Date.now()) / 60000);
      res.status(423).json({ success: false, message: `Cuenta bloqueada. Intenta en ${mins} minutos` });
      return;
    }

    const passwordValid = await bcrypt.compare(contrasena, usuario.contrasena);
    if (!passwordValid) {
      const fallidos = (usuario.intentosFallidos || 0) + 1;
      if (fallidos >= 5) {
        await prisma.usuario.update({
          where: { id: usuario.id },
          data: { intentosFallidos: fallidos, bloqueadoHasta: new Date(Date.now() + 30 * 60 * 1000) },
        });
        res.status(423).json({ success: false, message: 'Cuenta bloqueada por 30 minutos. Demasiados intentos fallidos.' });
        return;
      }
      await prisma.usuario.update({ where: { id: usuario.id }, data: { intentosFallidos: fallidos } });
      res.status(401).json({ success: false, message: 'Credenciales invalidas' });
      return;
    }

    await prisma.usuario.update({
      where: { id: usuario.id },
      data: { intentosFallidos: 0, bloqueadoHasta: null, estado: 'ACTIVO', ultimaConexion: new Date() },
    });

    const { accessToken, refreshToken } = await generarTokens(usuario);

    res.json({
      success: true,
      data: {
        usuario: {
          id: usuario.id, codigo: usuario.codigo, nombre: usuario.nombre, correo: usuario.correo,
          rol: usuario.rol, estado: 'ACTIVO', avatar: usuario.avatar,
          noMolestarActivo: usuario.noMolestarActivo, noMolestarInicio: usuario.noMolestarInicio, noMolestarFin: usuario.noMolestarFin,
        },
        token: accessToken,
        refreshToken
      },
      message: 'Inicio de sesión exitoso'
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Error al iniciar sesión' });
  }
});

router.post('/refresh', async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      res.status(400).json({ success: false, message: 'Refresh token requerido' });
      return;
    }

    let decoded: any;
    try {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        decoded = jwt.decode(authHeader.split(' ')[1]);
      }
    } catch {}

    if (!decoded?.id) {
      res.status(401).json({ success: false, message: 'Token inválido' });
      return;
    }

    const usuario = await prisma.usuario.findUnique({ where: { id: decoded.id } });
    if (!usuario || !usuario.activo || !usuario.refreshToken || !usuario.refreshTokenExpira || usuario.refreshTokenExpira < new Date()) {
      res.status(401).json({ success: false, message: 'Sesión expirada' });
      return;
    }

    const valido = await bcrypt.compare(refreshToken, usuario.refreshToken);
    if (!valido) {
      res.status(401).json({ success: false, message: 'Refresh token inválido' });
      return;
    }

    const { accessToken, refreshToken: newRefreshToken } = await generarTokens(usuario);

    res.json({
      success: true,
      data: { token: accessToken, refreshToken: newRefreshToken },
      message: 'Token renovado'
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Error al renovar token' });
  }
});

router.post('/logout', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const decoded = jwt.decode(authHeader.split(' ')[1]) as any;
      if (decoded?.id) {
        await prisma.usuario.update({
          where: { id: decoded.id },
          data: { refreshToken: null, refreshTokenExpira: null }
        });
      }
    }
    res.json({ success: true, message: 'Sesión cerrada' });
  } catch (error: any) {
    res.json({ success: true, message: 'Sesión cerrada' });
  }
});

router.post('/forgot-password', validate([
  body('correo').isEmail().withMessage('Correo inválido').normalizeEmail()
]), async (req: Request, res: Response) => {
  try {
    const { correo } = req.body;
    const usuario = await prisma.usuario.findUnique({ where: { correo } });

    if (!usuario) {
      res.json({ success: true, message: 'Si el correo existe, recibirás un enlace de recuperación' });
      return;
    }

    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = await bcrypt.hash(token, BCRYPT_ROUNDS);
    const tokenExpira = new Date(Date.now() + 3600000);

    await prisma.usuario.update({
      where: { id: usuario.id },
      data: { tokenRecupera: tokenHash, tokenExpira }
    });

    await sendPasswordResetEmail({ nombre: usuario.nombre, correo: usuario.correo, token });

    res.json({ success: true, message: 'Si el correo existe, recibirás un enlace de recuperación' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Error al procesar la solicitud' });
  }
});

router.post('/reset-password', validate([
  body('token').notEmpty().withMessage('Token requerido'),
  body('contrasena').isLength({ min: 8 }).withMessage('La contraseña debe tener al menos 8 caracteres')
]), async (req: Request, res: Response) => {
  try {
    const { token, contrasena } = req.body;

    const usuarios = await prisma.usuario.findMany({
      where: { tokenExpira: { gt: new Date() }, tokenRecupera: { not: null } }
    });

    let usuarioEncontrado: any = null;
    for (const u of usuarios) {
      const valido = await bcrypt.compare(token, u.tokenRecupera!);
      if (valido) { usuarioEncontrado = u; break; }
    }

    if (!usuarioEncontrado) {
      res.status(400).json({ success: false, message: 'Token inválido o expirado' });
      return;
    }

    const hashedPassword = await bcrypt.hash(contrasena, BCRYPT_ROUNDS);
    await prisma.usuario.update({
      where: { id: usuarioEncontrado.id },
      data: { contrasena: hashedPassword, tokenRecupera: null, tokenExpira: null }
    });

    res.json({ success: true, message: 'Contraseña actualizada exitosamente' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Error al restablecer la contraseña' });
  }
});

export default router;
