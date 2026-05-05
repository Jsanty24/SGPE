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
  filename: (_req, file, cb) => cb(null, `${crypto.randomUUID()}-${file.originalname}`)
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

router.post('/proyecto/:proyectoId', verificarToken, noCliente, (req, res, next) => {
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
    const file = req.file;
    if (!file) { res.status(400).json({ success: false, message: 'No se proporcionó archivo. Tipos permitidos: PDF, imágenes, Word, Excel, ZIP, CSV.' }); return; }
    const archivo = await prisma.archivoProyecto.create({
      data: { url: file.filename, nombre: file.originalname, mimetype: file.mimetype,
        proyectoId: (req.params as any).proyectoId, subidoPorId: req.usuario!.id },
      include: { subidoPor: { select: { id: true, nombre: true } } }
    });
    res.status(201).json({ success: true, data: archivo, message: 'Archivo de proyecto subido' });
  } catch (error: any) {
    console.error('Error al subir archivo proyecto:', error);
    res.status(500).json({ success: false, message: 'Error al subir archivo de proyecto' });
  }
});

router.get('/proyecto/:proyectoId', verificarToken, async (req: AuthRequest, res: Response) => {
  try {
    const archivos = await prisma.archivoProyecto.findMany({
      where: { proyectoId: (req.params as any).proyectoId },
      include: { subidoPor: { select: { id: true, nombre: true } } },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, data: archivos });
  } catch (error: any) {
    console.error('Error al obtener archivos proyecto:', error);
    res.status(500).json({ success: false, message: 'Error al obtener archivos' });
  }
});

router.get('/:id/download', verificarToken, async (req: AuthRequest, res: Response) => {
  try {
    const archivo = await prisma.archivoProyecto.findUnique({ where: { id: req.params.id as string } });
    if (!archivo) { res.status(404).json({ success: false, message: 'Archivo no encontrado' }); return; }
    const filePath = path.join(UPLOADS_DIR, archivo.url);
    if (!fs.existsSync(filePath)) { res.status(404).json({ success: false, message: 'Archivo no encontrado en disco' }); return; }
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(archivo.nombre)}`);
    res.setHeader('Content-Type', archivo.mimetype || 'application/octet-stream');
    res.sendFile(filePath);
  } catch (error: any) {
    console.error('Error al descargar proyecto:', error);
    res.status(500).json({ success: false, message: 'Error al descargar' });
  }
});

router.delete('/:id', verificarToken, noCliente, async (req: AuthRequest, res: Response) => {
  try {
    const archivo = await prisma.archivoProyecto.findUnique({ where: { id: req.params.id as string } });
    if (!archivo) { res.status(404).json({ success: false, message: 'Archivo no encontrado' }); return; }
    const filePath = path.join(UPLOADS_DIR, archivo.url);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    await prisma.archivoProyecto.delete({ where: { id: req.params.id as string } });
    res.json({ success: true, message: 'Archivo eliminado' });
  } catch (error: any) {
    console.error('Error al eliminar proyecto:', error);
    res.status(500).json({ success: false, message: 'Error al eliminar' });
  }
});

export default router;
