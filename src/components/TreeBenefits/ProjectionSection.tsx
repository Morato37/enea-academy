import React, { useMemo } from 'react';
import { TrendingUp } from 'lucide-react';
import { TFn, fmt } from '../../lib/treeBenefits/i18n';
import { Lang, SiteParams, Totals, TreeResult, ProjTotals } from '../../lib/treeBenefits/types';
import { horizons, O2_PER_PERSON } from '../../lib/treeBenefits/calc';
import { projectionChartConfig, oxygenChartConfig } from '../../lib/treeBenefits/charts';
import { ChartCanvas } from './ChartCanvas';

interface Props {
  T: TFn;
  lang: Lang;
  rows: TreeResult[];
  params: SiteParams;
  totals: Totals;
}

/** Horizon table plus the two projection charts. */
export const ProjectionSection: React.FC<Props> = ({ T, lang, rows, params, totals: s }) => {
  const HZ = horizons(params);
  const f = (v: number, d = 0) => fmt(lang, v, d);
  const projCfg = useMemo(() => projectionChartConfig(rows, params, T, false), [rows, params, T]);
  const o2Cfg = useMemo(() => oxygenChartConfig(rows, params, T, lang, false), [rows, params, T, lang]);

  const row = (label: string, today: string, fn: (q: ProjTotals) => string, bold = false) => (
    <tr className={bold ? 'bg-gray-50 font-semibold text-gray-900' : ''}>
      <th className="whitespace-nowrap px-3 py-1.5 text-left font-sans font-medium text-gray-500">{label}</th>
      <td className="px-3 py-1.5 text-right">{today}</td>
      {HZ.map(y => <td key={y} className="px-3 py-1.5 text-right">{fn(s.proj[y])}</td>)}
    </tr>
  );

  return (
    <div className="mt-6">
      <div className="mb-2 flex items-baseline gap-2">
        <span className="rounded border border-green-300 px-1.5 font-mono text-[11px] leading-[18px] text-green-700"><TrendingUp className="inline h-3 w-3" /></span>
        <h2 className="text-lg font-semibold text-gray-900">{T('projTitle')}</h2>
      </div>
      <p className="mb-3 text-xs text-gray-500">{T('projSub')}</p>
      <div className="overflow-x-auto rounded-lg border border-gray-300 bg-white">
        <table className="w-full font-mono text-[12.5px] tabular-nums">
          <thead>
            <tr className="bg-green-50 font-sans text-[11px] uppercase tracking-wider text-green-700">
              <th className="px-3 py-2" />
              <th className="px-3 py-2 text-right">{T('today')}</th>
              {HZ.map(y => <th key={y} className="px-3 py-2 text-right">{T('yr', y)}</th>)}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {row(T('hzC'), f(s.C), q => f(q.C))}
            {row(T('hzSeq'), f(s.seq, 1), q => f(q.seq, 1))}
            {row(T('hzO2'), f(s.o2, 1), q => f(q.o2, 1))}
            {row(T('hzPers'), f(s.o2 / O2_PER_PERSON, 1), q => f(q.o2 / O2_PER_PERSON, 1))}
            {row(T('hzPol'), f(s.polSum), q => f(q.polSum))}
            {row(T('hzRun'), f(s.runoff, 1), q => f(q.runoff, 1))}
            {row(T('hzVal'), f(s.chf), q => f(q.chf))}
            {row(T('hzCum'), '–', q => f(q.cum), true)}
          </tbody>
        </table>
      </div>
      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-gray-300 bg-white px-4 pb-2 pt-3">
          <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-gray-500">{T('chartCum')} · {T('chartC')}</div>
          <ChartCanvas config={projCfg} />
        </div>
        <div className="rounded-lg border border-gray-300 bg-white px-4 pb-2 pt-3">
          <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-gray-500">{T('chartO2')}</div>
          <ChartCanvas config={o2Cfg} />
        </div>
      </div>
      <p className="mt-2 text-xs text-gray-500">{T('o2Note')}</p>
    </div>
  );
};
