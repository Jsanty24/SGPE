import { useState, useEffect } from 'react';

interface DevicePerformance {
  isLowEnd: boolean;
  isMidRange: boolean;
  isHighEnd: boolean;
  benchmarksChecked: boolean;
}

let cachedResult: DevicePerformance | null = null;

function detectDevice(): DevicePerformance {
  if (cachedResult) return cachedResult;

  const memory = (navigator as any).deviceMemory as number | undefined;
  const cores = navigator.hardwareConcurrency || 2;
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const isLowEnd = cores <= 4 || (memory !== undefined && memory <= 4) || prefersReducedMotion;
  const isHighEnd = cores >= 8 && (memory !== undefined && memory >= 8) && !prefersReducedMotion;
  const isMidRange = !isLowEnd && !isHighEnd;

  cachedResult = { isLowEnd, isMidRange, isHighEnd, benchmarksChecked: true };
  return cachedResult;
}

export function useDevicePerformance(): DevicePerformance {
  const [perf] = useState<DevicePerformance>(() => detectDevice());

  useEffect(() => {
    if (perf.benchmarksChecked) return;
    const start = performance.now();
    let acc = 0;
    for (let i = 0; i < 100000; i++) {
      acc += Math.sqrt(i) * Math.sin(i);
    }
    const duration = performance.now() - start;
    if (duration > 50) {
      cachedResult = { ...cachedResult!, isLowEnd: true, isMidRange: false, isHighEnd: false };
    }
  }, [perf.benchmarksChecked]);

  return perf;
}

export const getDevicePerformance = detectDevice;
