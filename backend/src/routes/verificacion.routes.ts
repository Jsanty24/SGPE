import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { prisma } from '../lib/prisma';
import { sendVerificationEmail } from '../services/email.service';

const router = Router();

router.get('/enviar', async (req: Request, res: Response) => {
  try {
    const correo = req.query.correo as string;
    if (!correo) { res.status(400).json({ success: false, message: 'Correo requerido' }); return; }

    const usuario = await prisma.usuario.findUnique({ where: { correo } });
    if (!usuario) { res.json({ success: true, message: 'Si el correo existe, recibiras un enlace' }); return; }
    if (usuario.emailVerificado) { res.json({ success: true, message: 'El correo ya esta verificado' }); return; }

    const token = crypto.randomBytes(32).toString('hex');
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

    await prisma.usuario.update({
      where: { id: usuario.id },
      data: { tokenVerifEmail: token },
    });

    await sendVerificationEmail({ nombre: usuario.nombre, correo: usuario.correo, token });

    res.json({ success: true, message: 'Si el correo existe, recibiras un enlace' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Error al enviar verificacion' });
  }
});

router.get('/confirmar/:token', async (req: Request, res: Response) => {
  try {
    const { token } = req.params;

    const usuarios = await prisma.usuario.findMany({
      where: { tokenVerifEmail: { not: null }, emailVerificado: false },
    });

    let encontrado = null;
    for (const u of usuarios) {
      if (u.tokenVerifEmail === token) { encontrado = u; break; }
    }

    if (!encontrado) {
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      res.redirect(`${frontendUrl}/login?verificado=error`);
      return;
    }

    await prisma.usuario.update({
      where: { id: encontrado.id },
      data: { emailVerificado: true, tokenVerifEmail: null },
    });

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    res.redirect(`${frontendUrl}/login?verificado=ok`);
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Error al verificar correo' });
  }
});

export default router;
