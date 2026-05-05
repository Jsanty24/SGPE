import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

const execAsync = promisify(exec);
const BACKUP_DIR = path.join(__dirname, '..', 'backups');

if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

async function main() {
  try {
    const now = new Date();
    const ts = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}-${String(now.getMinutes()).padStart(2, '0')}`;
    const filename = `sgpe_backup_${ts}.sql.gz`;
    const filepath = path.join(BACKUP_DIR, filename);

    const { stdout } = await execAsync(`mysqldump -u root -proot sgpe`);
    const compressed = zlib.gzipSync(stdout);
    fs.writeFileSync(filepath, compressed);
    const sizeMB = (compressed.length / 1024 / 1024).toFixed(1);

    // Keep only last 7 backups
    const files = fs.readdirSync(BACKUP_DIR).filter(f => f.endsWith('.sql.gz')).sort().reverse();
    for (const f of files.slice(7)) {
      fs.unlinkSync(path.join(BACKUP_DIR, f));
    }

    console.log(`\u2705 Backup completado: ${filename} (${sizeMB} MB)`);
  } catch (error: any) {
    console.error('\u274C Error al crear backup:', error.message);
  }
}

main();
