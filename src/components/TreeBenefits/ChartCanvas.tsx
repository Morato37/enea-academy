import React, { useEffect, useRef, useState } from 'react';
import { loadChart } from '../../lib/treeBenefits/chartLazy';
import type { ChartConfiguration } from '../../lib/treeBenefits/chartLazy';

interface Props {
  config: ChartConfiguration;
  height?: number;
}

/** Thin Chart.js wrapper: creates the chart on mount / config change and destroys it on cleanup. */
export const ChartCanvas: React.FC<Props> = ({ config, height = 220 }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const [err, setErr] = useState(false);

  useEffect(() => {
    if (!ref.current) return;
    let chart: { destroy: () => void } | null = null;
    let cancelled = false;
    loadChart()
      .then((Chart) => {
        if (cancelled || !ref.current) return;
        chart = new Chart(ref.current, config) as unknown as { destroy: () => void };
        setErr(false);
      })
      .catch(() => setErr(true));
    return () => { cancelled = true; chart?.destroy(); };
  }, [config]);

  if (err) {
    return (
      <div className="flex items-center justify-center text-xs text-gray-400" style={{ height }}>
        Chart unavailable
      </div>
    );
  }

  return (
    <div className="relative w-full" style={{ height }}>
      <canvas ref={ref} />
    </div>
  );
};
