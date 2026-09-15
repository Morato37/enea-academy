import React from 'react';
import { TFn } from '../../lib/treeBenefits/i18n';
import { Lang, SiteParams, TreeResult, TreeInput } from '../../lib/treeBenefits/types';
import { columns, colLabel, rowValues, totalValues } from '../../lib/treeBenefits/columns';
import { WARN_FLAGS } from '../../lib/treeBenefits/calc';

interface Props {
  T: TFn;
  lang: Lang;
  rows: TreeResult[];
  skipped: TreeInput[];
  params: SiteParams;
  hasClass: boolean;
}

/** Per-tree results with grouped, sticky header and total row. */
export const ResultsTable: React.FC<Props> = ({ T, lang, rows, skipped, params, hasClass }) => {
  const C = columns(T, lang, params, hasClass);
  const flagIdx = C.findIndex(c => c.kind === 'flags');
  const typeIdx = C.findIndex(c => c.kind === 'type');

  // group header spans
  const groups: { label: string; span: number }[] = [];
  for (let i = 0; i < C.length; i++) {
    if (C[i].g || C[i].gRaw) {
      let span = 1;
      while (i + span < C.length && !C[i + span].g && !C[i + span].gRaw) span++;
      groups.push({ label: C[i].gRaw || T(C[i].g as string), span });
    }
  }

  return (
    <>
      <div className="max-h-[70vh] overflow-auto rounded-lg border border-gray-300 bg-white">
        <table className="w-full border-separate border-spacing-0 whitespace-nowrap font-mono text-xs tabular-nums">
          <thead>
            <tr>
              {groups.map((g, i) => (
                <th key={i} colSpan={g.span} className="sticky top-0 z-[2] bg-gray-50 px-3 pb-0.5 pt-2 text-left font-sans text-[10.5px] font-semibold uppercase tracking-wider text-gray-500">{g.label}</th>
              ))}
            </tr>
            <tr>
              {C.map((c, i) => (
                <th key={i} className={`sticky top-[22px] z-[2] border-b border-gray-300 bg-gray-50 px-3 py-1.5 font-sans text-[11px] font-semibold text-gray-500 ${c.t ? 'text-left' : 'text-right'} ${i === 0 ? 'left-0 z-[3]' : ''}`}>
                  {colLabel(c, T)}
                  {c.u && <small className="block font-mono text-[10.5px] font-normal text-gray-400">{c.u}</small>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, ri) => {
              const v = rowValues(r, T, lang, params, hasClass);
              return (
                <tr key={ri} className="group hover:bg-gray-50">
                  {v.map((x, i) => {
                    if (i === flagIdx) {
                      return (
                        <td key={i} className="min-w-[200px] max-w-[300px] whitespace-normal border-b border-gray-100 px-3 py-1.5 text-left font-sans text-[11px] leading-snug">
                          {r.flags.map(k => (
                            <span key={k} className={`mr-1 inline-block rounded-full px-1.5 ${WARN_FLAGS.has(k) ? 'bg-amber-50 font-medium text-amber-800' : 'border border-gray-200 bg-gray-50 text-gray-500'}`}>{T(k)}</span>
                          ))}
                        </td>
                      );
                    }
                    if (i === typeIdx) return <td key={i} className="border-b border-gray-100 px-3 py-1.5 text-left font-sans text-[11px] text-gray-500">{x}</td>;
                    if (i === 0) return <td key={i} className="sticky left-0 z-[1] border-b border-r border-gray-100 bg-white px-3 py-1.5 text-left font-sans font-medium italic group-hover:bg-gray-50">{x}</td>;
                    return <td key={i} className={`border-b border-gray-100 px-3 py-1.5 ${C[i].t ? 'text-left font-sans' : 'text-right'}`}>{x}</td>;
                  })}
                </tr>
              );
            })}
            {rows.length > 1 && (
              <tr className="bg-gray-50 font-medium">
                {totalValues(rows, T, lang, params, hasClass).map((x, i) => (
                  <td key={i} className={`border-t-2 border-gray-800 px-3 py-1.5 ${i === 0 ? 'sticky left-0 z-[1] bg-gray-50 text-left font-sans' : C[i].t ? 'text-left' : 'text-right'}`}>{x}</td>
                ))}
              </tr>
            )}
            {rows.length === 0 && (
              <tr><td colSpan={C.length} className="px-3 py-4 text-left font-sans text-gray-500">{T('none')}</td></tr>
            )}
          </tbody>
        </table>
      </div>
      <ul className="mt-2.5 list-disc space-y-0.5 pl-5 text-xs text-gray-500">
        {skipped.length > 0 && <li>{T('nSkip', skipped.map(t => t.id || t.species).join(', '))}</li>}
        <li>{T('nUnits')}</li>
      </ul>
    </>
  );
};
