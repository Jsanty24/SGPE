import { Router, Response } from 'express';
import { verificarToken, verificarRol, AuthRequest } from '../middlewares/auth';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

const execAsync = promisify(exec);
const router = Router();
const BACKUP_DIR = path.join(__dirname, '..', '..', 'backups');

if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR, { recursive: true });

function getDbCredentials() {
  const url = process.env.DATABASE_URL || '';
  const match = url.match(/mysql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);
  if (match) {
    return { user: match[1], pass: match[2], host: match[3], port: match[4], db: match[5] };
  }
  return null;
}

async function runBackup(): Promise<{ filename: string; size: number }> {
  const now = new Date();
  const ts = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}-${String(now.getMinutes()).padStart(2, '0')}`;
  const filename = `sgpe_backup_${ts}.sql.gz`;
  const filepath = path.join(BACKUP_DIR, filename);

  const creds = getDbCredentials();
  if (!creds) throw new Error('DATABASE_URL no configurado o formato invalido');

  const cmd = `mysqldump -u ${creds.user} -p${creds.pass} -h ${creds.host} -P ${creds.port} ${creds.db}`;
  const { stdout } = await execAsync(cmd);
  const compressed = zlib.gzipSync(stdout);
  fs.writeFileSync(filepath, compressed);

  const files = fs.readdirSync(BACKUP_DIR).filter(f => f.startsWith('sgpe_backup_')).sort().reverse();
  for (const f of files.slice(7)) {
    fs.unlinkSync(path.join(BACKUP_DIR, f));
  }

  return { filename, size: compressed.length };
}

router.post('/admin/backup', verificarToken, verificarRol('ADMIN'), async (_req: AuthRequest, res: Response) => {
  try {
    const result = await runBackup();
    res.json({ success: true, data: result, message: 'Backup completado' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: `Error en backup: ${error.message}` });
  }
});

export { runBackup };
export default router;
