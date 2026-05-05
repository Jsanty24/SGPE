import { motion } from 'framer-motion';

interface LoadingSkeletonProps {
  fullScreen?: boolean;
  rows?: number;
}

function SkeletonBox({ w = '100%', h = '2rem', rounded = 'rounded-xl', delay = 0 }: { w?: string; h?: string; rounded?: string; delay?: number }) {
  return (
    <motion.div
      animate={{ opacity: [0.4, 0.8, 0.4] }}
      transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut', delay }}
      className={`${rounded} flex-shrink-0`}
      style={{ width: w, height: h, background: 'var(--glass-bg, rgba(99,102,241,0.07))', border: '1px solid var(--glass-border, rgba(255,255,255,0.06))' }}
    />
  );
}

export default function LoadingSkeleton({ fullScreen, rows = 3 }: LoadingSkeletonProps) {
  if (fullScreen) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-color)' }}>
        <div className="flex flex-col items-center gap-4">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="w-12 h-12 rounded-full border-4"
            style={{ borderColor: 'var(--glass-border)', borderTopColor: 'var(--color-primary)' }}
          />
          <motion.p
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 1.6, repeat: Infinity }}
            className="text-sm text-dark-muted"
          >
            Cargando...
          </motion.p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <SkeletonBox w="180px" h="2rem" rounded="rounded-lg" />
        <SkeletonBox w="120px" h="2.25rem" rounded="rounded-xl" delay={0.1} />
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonBox key={i} h="6rem" delay={i * 0.07} />
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SkeletonBox h="16rem" delay={0.2} />
        <SkeletonBox h="16rem" delay={0.25} />
      </div>

      {/* List rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <SkeletonBox key={i} h="4rem" delay={0.3 + i * 0.06} />
      ))}
    </div>
  );
}
