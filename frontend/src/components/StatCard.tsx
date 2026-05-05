import { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import gsap from 'gsap';
import { useDevicePerformance } from '../hooks/useDevicePerformance';

interface StatCardProps {
  title: string;
  value: number;
  icon: string;
  color: string;
  delay?: number;
}

export default function StatCard({ title, value, icon, color, delay = 0 }: StatCardProps) {
  const valueRef = useRef<HTMLSpanElement>(null);
  const { isLowEnd } = useDevicePerformance();

  useEffect(() => {
    if (!valueRef.current || isLowEnd) return;
    gsap.killTweensOf(valueRef.current);
    gsap.fromTo(valueRef.current, { textContent: 0 }, {
      textContent: value,
      duration: 1.5,
      delay,
      ease: 'power2.out',
      snap: { textContent: 1 },
      onUpdate: function () {
        if (valueRef.current) {
          valueRef.current.textContent = Math.round(Number(valueRef.current.textContent)).toString();
        }
      }
    });
    return () => {
      if (valueRef.current) gsap.killTweensOf(valueRef.current);
    };
  }, [value, delay, isLowEnd]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, type: 'spring', damping: 20 }}
      className="glass-card rounded-2xl p-6 hover:border-primary-500/30 transition-all duration-300"
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center text-2xl`}>
          {icon}
        </div>
      </div>
      <span ref={valueRef} className="text-3xl font-bold text-dark-text block mb-1">
        {value}
      </span>
      <p className="text-sm text-dark-muted">{title}</p>
    </motion.div>
  );
}
