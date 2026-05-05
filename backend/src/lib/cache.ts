import NodeCache from 'node-cache';

export const cache = new NodeCache({
  stdTTL: 300,
  checkperiod: 60,
  useClones: false,
});

export async function withCache<T>(
  key: string,
  ttl: number,
  fn: () => Promise<T>,
): Promise<T> {
  const cached = cache.get<T>(key);
  if (cached !== undefined) return cached;
  const result = await fn();
  cache.set(key, result, ttl);
  return result;
}

export function invalidateCache(pattern: string) {
  const keys = cache.keys();
  for (const k of keys) {
    if (k.startsWith(pattern)) cache.del(k);
  }
}
