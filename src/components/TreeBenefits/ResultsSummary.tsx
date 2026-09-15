import React from 'react';
import { TFn, fmt } from '../../lib/treeBenefits/i18n';
import { Lang, Totals } from '../../lib/treeBenefits/types';
import { O2_PER_PERSON } from '../../lib/treeBenefits/calc';
import { HEX } from '../../lib/treeBenefits/charts';

interface Props {
  T: TFn;
  lang: Lang;
  totals: Totals;
  count: number;
  skipped: number;
}

const Kpi: React.FC<{ label: string; value: React.ReactNode; sub?: React.ReactNode; dot?: string; highlight?: boolean }> = ({ label, value, sub, dot, highlight }) => (
  <div className={`border-b border-r border-gray-200 p-4 ${highlight ? 'bg-green-50' : 'bg-white'}`}>
    <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-semibold uppercase leading-tight tracking-wider text-gray-500 hyphens-auto break-words">
      {dot && <i className="inline-block h-2 w-2 rounded-sm" style={{ background: dot }} />}
      {label}
    </div>
    <div className={`mt-1.5 font-mono text-[22px] font-medium leading-tight tabular-nums ${highlight ? 'text-green-700' : 'text-gray-900'}`}>{value}</div>
    {sub && <div className="mt-1 text-xs text-gray-500">{sub}</div>}
  </div>
);

/** KPI tiles and the value-share bar. */
export const ResultsSummary: React.FC<Props> = ({ T, lang, totals: s, count, skipped }) => {
  const f = (v: number, d = 1) => fmt(lang, v, d);
  const a = lang === 'de' ? 'a' : 'yr';
  const small = (u: string) => <small className="ml-1 text-[13px] font-normal text-gray-500">{u}</small>;
  const pct = (v: number) => (s.chf > 0 ? (v / s.chf) * 100 : 0);

  return (
    <div className="mt-6">
      <div className="grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] overflow-hidden rounded-lg border border-gray-300 bg-white [&>*:last-child]:border-r-0">
        <Kpi label={T('kTrees')} value={count} sub={`${skipped} ${T('kSkip')}`} />
        <Kpi label={T('kC')} dot={HEX.green} value={<>{f(s.C / 1000, 2)}{small('t C')}</>} sub={T('kCs', f(s.C * 3.667 / 1000, 2))} />
        <Kpi label={T('kSeq')} dot={HEX.o2} value={<>{f(s.seq)}{small(`kg C/${a}`)}</>} sub={`≙ ${f(s.seq * 3.667)} kg CO₂/${a}`} />
        <Kpi label={T('kO2')} dot={HEX.o2} value={<>{f(s.o2)}{small(`kg/${a}`)}</>} sub={T('kO2S', f(s.o2 / O2_PER_PERSON, 1))} />
        <Kpi label={T('kPol')} dot={HEX.air} value={<>{f(s.polSum / 1000, 2)}{small(`kg/${a}`)}</>} sub={`O₃ ${f(s.O3, 0)} · NO₂ ${f(s.NO2, 0)} · PM₂.₅ ${f(s.PM)} g`} />
        <Kpi label={T('kRun')} dot={HEX.water} value={<>{f(s.runoff, 1)}{small(`m³/${a}`)}</>} sub={T('kRunS', f(s.ground))} />
        <Kpi label={T('kVal')} highlight value={`CHF ${f(s.chf, 0)}`} sub={T('kValS')} />
      </div>
      <div className="mt-3">
        <div className="flex h-2.5 overflow-hidden rounded-full bg-gray-200">
          <span style={{ width: `${pct(s.vC)}%`, background: HEX.green }} />
          <span style={{ width: `${pct(s.vAir)}%`, background: HEX.air }} />
          <span style={{ width: `${pct(s.vRun)}%`, background: HEX.water }} />
        </div>
        <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-xs text-gray-500">
          <span><i className="mr-1.5 inline-block h-2 w-2 rounded-sm" style={{ background: HEX.green }} />{T('shC')} <b className="font-mono font-medium text-gray-800">CHF {f(s.vC, 0)}</b></span>
          <span><i className="mr-1.5 inline-block h-2 w-2 rounded-sm" style={{ background: HEX.air }} />{T('shAir')} <b className="font-mono font-medium text-gray-800">CHF {f(s.vAir, 0)}</b></span>
          <span><i className="mr-1.5 inline-block h-2 w-2 rounded-sm" style={{ background: HEX.water }} />{T('shRun')} <b className="font-mono font-medium text-gray-800">CHF {f(s.vRun, 0)}</b></span>
        </div>
      </div>
    </div>
  );
};
