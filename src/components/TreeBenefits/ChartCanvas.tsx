import React, { useEffect, useRef } from 'react';
import { Chart, ChartConfiguration } from 'chart.js';

interface Props {
  config: ChartConfiguration;
  height?: number;
}

/** Thin Chart.js wrapper: creates the chart on mount / config change and destroys it on cleanup. */
export const ChartCanvas: React.FC<Props> = ({ config, height = 220 }) => {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    const chart = new Chart(ref.current, config);
    return () => chart.destroy();
  }, [config]);

  return (
    <div className="relative w-full" style={{ height }}>
      <canvas ref={ref} />
    </div>
  );
};
