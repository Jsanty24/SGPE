import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  datasources: { db: { url: process.env.DATABASE_URL } },
  log: process.env.NODE_ENV === 'development'
    ? ['query', 'warn', 'error']
    : ['warn', 'error'],
  errorFormat: 'pretty',
});

prisma.$use(async (params, next) => {
  const before = Date.now();
  const result = await next(params);
  const duration = Date.now() - before;
  if (duration > 1000) {
    console.warn(`\u26A0\uFE0F  Query lenta: ${params.model}.${params.action} \u2014 ${duration}ms`);
  }
  return result;
});

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
