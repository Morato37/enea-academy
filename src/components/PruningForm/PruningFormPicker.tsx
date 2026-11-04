import { useEffect, useId, useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import {
  PruningLanguage,
  getGenusGroup,
  getPruningOption,
  getPruningOptions,
} from '../../lib/pruningForms';

const TEXT = {
  de: { choose: 'Schnittform wählen', open: 'noch offen', title: 'Schnittform', remove: 'Auswahl entfernen', close: 'Schliessen', standard: 'Standard-Skizzen (keine eigenen Zeichnungen für diese Gattung)', sheet: 'Skizzen für' },
  en: { choose: 'Choose pruning form', open: 'not set', title: 'Pruning form', remove: 'Remove', close: 'Close', standard: 'Standard sketches (no own drawings for this genus)', sheet: 'Sketches for' },
  it: { choose: 'Scegli la forma', open: 'da definire', title: 'Forma di potatura', remove: 'Rimuovi', close: 'Chiudi', standard: 'Schizzi standard (nessun disegno per questo genere)', sheet: 'Schizzi per' },
} as const;

export interface PruningFormPickerProps {
  /** Botanical name of the plant, e.g. "Carpinus betulus". Decides which sketches are shown. */
  botanicalName: string;
  /** Stored form code (e.g. 'hochstamm') or null. */
  value: string | null | undefined;
  /** Called with the new code, or null when the choice is removed. */
  onChange: (code: string | null) => void;
  language?: PruningLanguage;
  disabled?: boolean;
  className?: string;
  onOpenChange?: (open: boolean) => void;
}

/**
 * Button showing the chosen pruning form (sketch + name). Clicking it opens a panel
 * with all sketches for the plant's genus.
 */
export function PruningFormPicker({
  botanicalName,
  value,
  onChange,
  language = 'en',
  disabled = false,
  className = '',
  onOpenChange,
}: PruningFormPickerProps) {
  const t = TEXT[language];
  const [open, setOpen] = useState(false);
  const [panelStyle, setPanelStyle] = useState<CSSProperties>({});
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelId = useId();

  const selected = getPruningOption(botanicalName, value);
  const options = getPruningOptions(botanicalName);
  const group = getGenusGroup(botanicalName);

  useEffect(() => {
    onOpenChange?.(open);
  }, [onOpenChange, open]);

  useLayoutEffect(() => {
    if (!open) return;

    const positionPanel = () => {
      const button = buttonRef.current;
      if (!button) return;
      const rect = button.getBoundingClientRect();
      const viewportPadding = 16;
      const panelWidth = Math.min(672, window.innerWidth - viewportPadding * 2);
      const left = Math.min(
        Math.max(viewportPadding, rect.left),
        window.innerWidth - panelWidth - viewportPadding,
      );
      const maxHeight = Math.max(240, window.innerHeight - rect.bottom - viewportPadding);
      setPanelStyle({
        left,
        top: Math.min(rect.bottom + 8, window.innerHeight - viewportPadding - 240),
        width: panelWidth,
        maxHeight,
      });
    };

    positionPanel();
    window.addEventListener('resize', positionPanel);
    window.addEventListener('scroll', positionPanel, true);
    return () => {
      window.removeEventListener('resize', positionPanel);
      window.removeEventListener('scroll', positionPanel, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    const onClick = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onClick);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onClick);
    };
  }, [open]);

  const choose = (code: string | null) => {
    onChange(code);
    setOpen(false);
    buttonRef.current?.focus();
  };

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        ref={buttonRef}
        type="button"
        disabled={disabled}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen(o => !o)}
        className={`flex w-full items-center rounded-lg border text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 disabled:cursor-not-allowed disabled:opacity-60 ${
          selected
            ? 'gap-3 px-2.5 py-2 border-transparent bg-emerald-50 hover:border-emerald-600'
            : 'h-9 gap-2 px-2 text-xs border-dashed border-gray-300 bg-gray-50 hover:border-emerald-600 [&>span:first-child]:h-7 [&>span:first-child]:w-7 [&>span:first-child]:text-base [&>span:last-child]:flex [&>span:last-child]:items-center [&>span:last-child]:gap-2 [&>span:last-child>span:first-child]:hidden [&>span:last-child>span:last-child]:hidden [&>span:last-child>span:nth-child(2)]:truncate'
        }`}
      >
        {selected?.sketchUrl ? (
          <img src={selected.sketchUrl} alt="" className="h-14 w-12 flex-none object-contain" />
        ) : (
          <span className="grid h-10 w-10 flex-none place-items-center rounded-md border border-dashed border-gray-400 text-lg text-gray-400" aria-hidden="true">
            +
          </span>
        )}
        <span className="min-w-0">
          <span className="block text-xs uppercase tracking-wide text-gray-500">{t.title}</span>
          <span className="block truncate font-semibold text-gray-900">
            {selected ? selected.form.label[language] : t.choose}
          </span>
          <span className="block truncate text-xs text-gray-500">
            {selected ? selected.form.hint[language] : t.open}
          </span>
        </span>
      </button>

      {open && (
        <div
          id={panelId}
          role="dialog"
          aria-label={t.title}
          style={panelStyle}
          className="fixed z-[9999] overflow-y-auto rounded-xl border border-gray-200 bg-white p-4 shadow-xl"
        >
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-gray-600">
              {group ? (
                <>
                  {t.sheet} <i>{group.name}</i>
                </>
              ) : (
                t.standard
              )}
            </p>
            <div className="flex gap-2">
              {selected && (
                <button
                  type="button"
                  onClick={() => choose(null)}
                  className="rounded-md border border-gray-300 px-3 py-1.5 text-sm hover:border-emerald-600"
                >
                  {t.remove}
                </button>
              )}
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-md border border-gray-300 px-3 py-1.5 text-sm hover:border-emerald-600"
              >
                {t.close}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-4">
            {options.map(opt => {
              const active = opt.form.code === selected?.form.code;
              return (
                <button
                  key={opt.form.code}
                  type="button"
                  aria-pressed={active}
                  onClick={() => choose(opt.form.code)}
                  className={`flex flex-col items-center gap-1.5 rounded-lg border-2 p-2.5 text-center transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 ${
                    active ? 'border-emerald-600 bg-emerald-50' : 'border-gray-200 bg-gray-50 hover:border-emerald-600'
                  }`}
                >
                  <img
                    src={opt.sketchUrl}
                    alt={opt.form.label[language]}
                    className="h-28 w-full object-contain"
                    loading="lazy"
                  />
                  <span className="text-sm font-semibold leading-tight text-gray-900">{opt.form.label[language]}</span>
                  <span className="text-xs text-gray-500">{opt.form.hint[language]}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default PruningFormPicker;
