import React from 'react';
import { RotateCcw } from 'lucide-react';
import { TFn } from '../../lib/treeBenefits/i18n';
import { SizeClassKey, SizeClassStandard } from '../../lib/treeBenefits/types';
import { DEFAULT_SIZE_CLASSES, SIZE_CLASS_KEYS } from '../../lib/treeBenefits/sizeClasses';

interface Props {
  T: TFn;
  classes: Record<SizeClassKey, SizeClassStandard>;
  onChange: (classes: Record<SizeClassKey, SizeClassStandard>) => void;
}

const numCls = 'w-full rounded border border-gray-300 bg-gray-50 px-2 py-1 text-right font-mono text-sm focus:border-[#3C8150] focus:outline-none';

/** Editable table with the standard dimensions of the three tree size classes. */
export const SizeClassEditor: React.FC<Props> = ({ T, classes, onChange }) => {
  const update = (k: SizeClassKey, field: keyof SizeClassStandard, value: string) => {
    const next = { ...classes, [k]: { ...classes[k] } };
    if (field === 'label') next[k].label = value;
    else { const v = parseFloat(value); next[k][field] = Number.isFinite(v) ? v : 0; }
    onChange(next);
  };

  return (
    <details className="group rounded-lg border border-gray-200 bg-gray-50">
      <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-2.5 text-sm font-medium text-gray-700 hover:text-[#2F7041]">
        <span>{T('scTitle')}</span>
        <span className="font-mono text-gray-400 group-open:hidden">+</span>
        <span className="hidden font-mono text-gray-400 group-open:inline">–</span>
      </summary>
      <div className="px-4 pb-4">
        <p className="mb-3 text-xs text-gray-500">{T('scSub')}</p>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wider text-gray-500">
                <th className="pb-1 pr-2">{T('sizeClass')}</th>
                <th className="pb-1 pr-2">{T('scLabel')}</th>
                <th className="pb-1 pr-2 text-right">{T('scDbh')}</th>
                <th className="pb-1 pr-2 text-right">{T('scHeight')}</th>
                <th className="pb-1 pr-2 text-right">{T('scCrown')}</th>
                <th className="pb-1 text-right">{T('scBase')}</th>
              </tr>
            </thead>
            <tbody>
              {SIZE_CLASS_KEYS.map(k => {
                const c = classes[k];
                return (
                  <tr key={k}>
                    <td className="py-1 pr-2 font-medium text-gray-800">{T(k)}</td>
                    <td className="py-1 pr-2"><input type="text" value={c.label} onChange={e => update(k, 'label', e.target.value)} className="w-28 rounded border border-gray-300 bg-white px-2 py-1 text-sm focus:border-[#3C8150] focus:outline-none" /></td>
                    <td className="py-1 pr-2"><input type="number" step={0.5} min={0.5} value={c.dbh} onChange={e => update(k, 'dbh', e.target.value)} className={numCls} /></td>
                    <td className="py-1 pr-2"><input type="number" step={0.5} min={0.5} value={c.height} onChange={e => update(k, 'height', e.target.value)} className={numCls} /></td>
                    <td className="py-1 pr-2"><input type="number" step={0.5} min={0.5} value={c.crownWidth} onChange={e => update(k, 'crownWidth', e.target.value)} className={numCls} /></td>
                    <td className="py-1"><input type="number" step={0.1} min={0} value={c.crownBase} onChange={e => update(k, 'crownBase', e.target.value)} className={numCls} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <button
          type="button"
          onClick={() => onChange({ ...DEFAULT_SIZE_CLASSES })}
          className="mt-3 flex items-center gap-1 text-xs text-gray-500 hover:text-[#2F7041]"
        >
          <RotateCcw className="h-3 w-3" /> {T('scReset')}
        </button>
      </div>
    </details>
  );
};
