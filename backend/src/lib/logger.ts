const isProduction = process.env.NODE_ENV === 'production';

export const logger = {
  info: (message: string, meta?: any) => {
    if (!isProduction) console.log(`[INFO] ${message}`, meta || '');
  },
  warn: (message: string, meta?: any) => {
    console.warn(`[WARN] ${message}`, meta || '');
  },
  error: (message: string, meta?: any) => {
    console.error(`[ERROR] ${message}`, meta || '');
  },
  debug: (message: string, meta?: any) => {
    if (!isProduction) console.log(`[DEBUG] ${message}`, meta || '');
  },
};
