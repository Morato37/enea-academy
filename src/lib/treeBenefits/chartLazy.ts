import type { Chart as ChartType, ChartConfiguration as ChartConfigType, ChartDataset as ChartDatasetType, registerables as RegisterablesType } from 'chart.js';

export type Chart = typeof ChartType;
export type ChartConfiguration = ChartConfigType;
export type ChartDataset = ChartDatasetType;

let chartPromise: Promise<typeof ChartType> | null = null;

export function loadChart(): Promise<typeof ChartType> {
  if (!chartPromise) {
    chartPromise = import('chart.js').then((mod) => {
      const Chart = mod.Chart;
      // Register all components once
      Chart.register(...mod.registerables);
      return Chart;
    });
  }
  return chartPromise;
}
