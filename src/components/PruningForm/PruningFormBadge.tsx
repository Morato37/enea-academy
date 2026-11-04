import { PruningLanguage, getPruningOption } from '../../lib/pruningForms';

export interface PruningFormBadgeProps {
  botanicalName: string;
  value: string | null | undefined;
  language?: PruningLanguage;
  /** 'sm' for table rows, 'md' for cards. */
  size?: 'sm' | 'md';
  /** Text shown when no form is chosen. Pass null to render nothing instead. */
  emptyText?: string | null;
  className?: string;
}

const EMPTY = { de: 'Schnittform fehlt', en: 'Pruning form missing', it: 'Forma mancante' } as const;

/** Read-only display of a chosen pruning form: small sketch plus name. */
export function PruningFormBadge({
  botanicalName,
  value,
  language = 'en',
  size = 'sm',
  emptyText,
  className = '',
}: PruningFormBadgeProps) {
  const opt = getPruningOption(botanicalName, value);
  const img = size === 'sm' ? 'h-9 w-8' : 'h-14 w-12';

  if (!opt) {
    const text = emptyText === undefined ? EMPTY[language] : emptyText;
    if (text === null) return null;
    return (
      <span className={`inline-flex items-center rounded bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 ${className}`}>
        {text}
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      {opt.sketchUrl && <img src={opt.sketchUrl} alt="" className={`${img} flex-none object-contain`} />}
      <span className={size === 'sm' ? 'text-sm' : 'text-base font-medium'}>{opt.form.label[language]}</span>
    </span>
  );
}

export default PruningFormBadge;
