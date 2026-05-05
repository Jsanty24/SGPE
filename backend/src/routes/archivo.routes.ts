import { Router, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { verificarToken, noCliente, AuthRequest } from '../middlewares/auth';
import { prisma } from '../lib/prisma';

const router = Router();
const UPLOADS_DIR = path.join(__dirname, '..', '..', 'uploads');

const ALLOWED_MIMES = [
  'application/pdf',
  'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
  'text/plain', 'text/csv',
  'application/zip', 'application/x-zip-compressed',
  'application/vnd.ms-excel',
  'application/octet-stream',
];

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
  filename: (_req, file, cb) => {
    const uniqueName = `${crypto.randomUUID()}-${file.originalname}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIMES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Tipo de archivo no permitido: ${file.mimetype}`));
    }
  }
});

router.post('/tarea/:tareaId', verificarToken, noCliente, (req, res, next) => {
  upload.single('archivo')(req, res, (err: any) => {
    if (err) {
      const msg = err.code === 'LIMIT_FILE_SIZE' ? 'Archivo excede 10MB' : err.message || 'Error al subir';
      res.status(400).json({ success: false, message: msg });
      return;
    }
    next();
  });
}, async (req: AuthRequest, res: Response) => {
  try {
    const tareaId = (req.params as any).tareaId as string;
    const file = req.file;
    if (!file) { res.status(400).json({ success: false, message: 'No se proporcionó archivo' }); return; }
    const archivo = await prisma.archivo.create({
      data: { url: file.filename, nombre: file.originalname, mimetype: file.mimetype, tareaId, subidoPorId: req.usuario!.id },
      include: { subidoPor: { select: { id: true, nombre: true } } }
    });
    res.status(201).json({ success: true, data: archivo, message: 'Archivo subido' });
  } catch (error: any) {
    console.error('Error al subir archivo:', error);
    res.status(500).json({ success: false, message: 'Error al subir archivo' });
  }
});

router.get('/:id/download', verificarToken, async (req: AuthRequest, res: Response) => {
  try {
    const archivo = await prisma.archivo.findUnique({ where: { id: req.params.id as string } });
    if (!archivo) { res.status(404).json({ success: false, message: 'Archivo no encontrado' }); return; }
    const filePath = path.join(UPLOADS_DIR, archivo.url);
    if (!fs.existsSync(filePath)) { res.status(404).json({ success: false, message: 'Archivo no encontrado en disco' }); return; }
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(archivo.nombre)}`);
    res.setHeader('Content-Type', archivo.mimetype || 'application/octet-stream');
    res.sendFile(filePath);
  } catch (error: any) {
    console.error('Error al descargar:', error);
    res.status(500).json({ success: false, message: 'Error al descargar archivo' });
  }
});

router.delete('/:id', verificarToken, noCliente, async (req: AuthRequest, res: Response) => {
  try {
    const archivo = await prisma.archivo.findUnique({ where: { id: req.params.id as string } });
    if (!archivo) { res.status(404).json({ success: false, message: 'Archivo no encontrado' }); return; }
    if (archivo.subidoPorId !== req.usuario!.id && req.usuario!.rol !== 'ADMIN') {
      res.status(403).json({ success: false, message: 'Solo el propietario o un ADMIN puede eliminar este archivo' });
      return;
    }
    const filePath = path.join(UPLOADS_DIR, archivo.url);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    await prisma.archivo.delete({ where: { id: req.params.id as string } });
    res.json({ success: true, message: 'Archivo eliminado' });
  } catch (error: any) {
    console.error('Error al eliminar:', error);
    res.status(500).json({ success: false, message: 'Error al eliminar archivo' });
  }
});

export default router;
