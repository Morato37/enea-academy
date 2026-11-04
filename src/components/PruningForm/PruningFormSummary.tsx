import { PruningLanguage } from '../../lib/pruningForms';
import { PruningFormBadge } from './PruningFormBadge';

export interface PruningSummaryItem {
  id: string | number;
  botanicalName: string;
  commonName?: string | null;
  quantity?: number | null;
  pruningForm: string | null | undefined;
}

export interface PruningFormSummaryProps {
  items: PruningSummaryItem[];
  language?: PruningLanguage;
  title?: string;
  className?: string;
}

const TEXT = {
  de: { title: 'Schnittformen für das Angebot', missing: (n: number) => `${n} Position${n === 1 ? '' : 'en'} ohne Schnittform`, complete: 'Alle Bäume haben eine Schnittform', empty: 'Keine Bäume in dieser Selektion' },
  en: { title: 'Pruning forms for the quote', missing: (n: number) => `${n} item${n === 1 ? '' : 's'} without pruning form`, complete: 'All trees have a pruning form', empty: 'No trees in this selection' },
  it: { title: "Forme di potatura per l'offerta", missing: (n: number) => `${n} posizion${n === 1 ? 'e' : 'i'} senza forma`, complete: 'Tutti gli alberi hanno una forma', empty: 'Nessun albero in questa selezione' },
} as const;

/** Sales overview: every tree position with quantity, sketch and pruning form; flags missing ones. */
export function PruningFormSummary({ items, language = 'de', title, className = '' }: PruningFormSummaryProps) {
  const t = TEXT[language];
  const missing = items.filter(i => !i.pruningForm).length;

  return (
    <section className={`rounded-xl border border-gray-200 bg-white ${className}`}>
      <header className="flex flex-wrap items-baseline justify-between gap-2 border-b border-gray-200 px-4 py-3">
        <h3 className="font-semibold text-gray-900">{title ?? t.title}</h3>
        {items.length > 0 && (
          <span className={`text-sm ${missing ? 'text-amber-700' : 'text-emerald-700'}`}>
            {missing ? t.missing(missing) : t.complete}
          </span>
        )}
      </header>
      {items.length === 0 ? (
        <p className="px-4 py-3 text-sm text-gray-500">{t.empty}</p>
      ) : (
        <ul className="divide-y divide-gray-100">
          {items.map(item => (
            <li key={item.id} className="flex items-center gap-3 px-4 py-2.5">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm italic text-gray-900">{item.botanicalName}</p>
                {item.commonName && <p className="truncate text-xs text-gray-500">{item.commonName}</p>}
              </div>
              <PruningFormBadge botanicalName={item.botanicalName} value={item.pruningForm} language={language} />
              {item.quantity != null && (
                <span className="w-12 text-right font-mono text-sm tabular-nums text-gray-600">{item.quantity}×</span>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default PruningFormSummary;
