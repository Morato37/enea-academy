import type { jsPDF } from 'jspdf';
import extraLightUrl from '../assets/fonts/URWGrotesk-ExtraLight.ttf?url';
import lightUrl from '../assets/fonts/URWGrotesk-Light.ttf?url';
import regularUrl from '../assets/fonts/URWGrotesk-Regular.ttf?url';
import mediumUrl from '../assets/fonts/URWGrotesk-Medium.ttf?url';

/**
 * enea house font for every generated PDF.
 *
 * Usage:
 *   const doc = new jsPDF(...);
 *   await withBrandFonts(doc);   // async generators
 * or, where the generator must stay synchronous:
 *   await preloadBrandFonts();  // once, before
 *   applyBrandFonts(doc);       // inside the generator
 *
 * After that, every existing doc.setFont('helvetica', …) / setFont('', …) call is redirected to
 * URW Grotesk, so the generators need no other changes:
 *   normal → Regular, bold → Medium, italic → Regular (the font set has no italic),
 *   light → Light, extralight → ExtraLight (also reachable via setFont(PDF_FONT, 'light')).
 * If the font files cannot be loaded, the PDF falls back to Helvetica instead of failing.
 */

export const PDF_FONT = 'URWGrotesk';

const FILES = {
  extralight: { url: extraLightUrl, file: 'URWGrotesk-ExtraLight.ttf' },
  light: { url: lightUrl, file: 'URWGrotesk-Light.ttf' },
  regular: { url: regularUrl, file: 'URWGrotesk-Regular.ttf' },
  medium: { url: mediumUrl, file: 'URWGrotesk-Medium.ttf' },
} as const;
type Cut = keyof typeof FILES;

/** jsPDF style name → font cut. */
const STYLES: Record<string, Cut> = {
  normal: 'regular',
  bold: 'medium',
  italic: 'regular',
  bolditalic: 'medium',
  light: 'light',
  extralight: 'extralight',
};

/** Families used by the existing generators; all of them become URW Grotesk. */
const REPLACED_FAMILIES = new Set(['', 'helvetica', 'arial', 'sans-serif', 'times', 'courier']);

let fontData: Record<Cut, string> | null = null;
let loading: Promise<boolean> | null = null;

function toBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(binary);
}

/** Loads the font files once per page load. Resolves to false if they could not be loaded. */
export function preloadBrandFonts(): Promise<boolean> {
  if (fontData) return Promise.resolve(true);
  loading ??= (async () => {
    try {
      const entries = await Promise.all((Object.keys(FILES) as Cut[]).map(async cut => {
        const res = await fetch(FILES[cut].url);
        if (!res.ok) throw new Error(`${FILES[cut].file}: HTTP ${res.status}`);
        return [cut, toBase64(await res.arrayBuffer())] as const;
      }));
      fontData = Object.fromEntries(entries) as Record<Cut, string>;
      return true;
    } catch (err) {
      console.warn('PDF-Schriften konnten nicht geladen werden, PDF nutzt Helvetica.', err);
      loading = null; // try again next time
      return false;
    }
  })();
  return loading;
}

function styleFor(fontStyle?: string, fontWeight?: string | number): string {
  const weight = typeof fontWeight === 'string' ? parseInt(fontWeight, 10) : fontWeight;
  if (weight && weight <= 200) return 'extralight';
  if (weight && weight <= 300) return 'light';
  const style = (fontStyle || 'normal').toLowerCase().replace(/[\s_-]/g, '');
  if (weight && weight >= 500 && (style === 'normal' || style === 'italic')) return style === 'italic' ? 'bolditalic' : 'bold';
  return style in STYLES ? style : 'normal';
}

/**
 * Registers URW Grotesk in this document and redirects all setFont calls to it.
 * Synchronous; needs preloadBrandFonts() to have finished, otherwise the document keeps Helvetica.
 */
export function applyBrandFonts(doc: jsPDF): boolean {
  if (!fontData) return false;
  for (const [style, cut] of Object.entries(STYLES)) {
    doc.addFileToVFS(FILES[cut].file, fontData[cut]);
    doc.addFont(FILES[cut].file, PDF_FONT, style);
  }
  const originalSetFont = doc.setFont.bind(doc);
  doc.setFont = ((fontName?: string, fontStyle?: string, fontWeight?: string | number) => {
    const family = REPLACED_FAMILIES.has((fontName ?? '').toLowerCase()) ? PDF_FONT : fontName!;
    if (family !== PDF_FONT) return originalSetFont(family, fontStyle, fontWeight);
    return originalSetFont(PDF_FONT, styleFor(fontStyle, fontWeight));
  }) as jsPDF['setFont'];
  doc.setFont(PDF_FONT, 'normal');
  return true;
}

/** Loads (if needed) and applies the house font. */
export async function withBrandFonts(doc: jsPDF): Promise<jsPDF> {
  if (await preloadBrandFonts()) applyBrandFonts(doc);
  return doc;
}
