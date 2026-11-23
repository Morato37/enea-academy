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
 *   normal → Regular, bold → Medium, light → Light, extralight → ExtraLight
 *   (light/extralight via setFont(PDF_FONT, 'light')).
 * The font set has no italic cuts. Italic styles (italic, bolditalic, lightitalic,
 * extralightitalic) are drawn as an oblique of the upright cut: doc.text() slants the text by
 * OBLIQUE_ANGLE around its baseline. If real italic files are added later, register them in
 * FILES/STYLES and remove the style from OBLIQUE_STYLES.
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
  lightitalic: 'light',
  extralight: 'extralight',
  extralightitalic: 'extralight',
};

/** Styles without their own font file: slanted versions of the upright cut. */
const OBLIQUE_STYLES = new Set(['italic', 'bolditalic', 'lightitalic', 'extralightitalic']);
const OBLIQUE_ANGLE = 11; // degrees
const SLANT = Math.tan((OBLIQUE_ANGLE * Math.PI) / 180);

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
  const style = (fontStyle || 'normal').toLowerCase().replace(/[\s_-]/g, '');
  const italic = style.endsWith('italic') ? 'italic' : '';
  if (weight && weight <= 200) return `extralight${italic}`;
  if (weight && weight <= 300) return `light${italic}`;
  if (weight && weight >= 500 && (style === 'normal' || style === 'italic')) return `bold${italic}`;
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
  patchObliqueText(doc);
  return true;
}

type TextFn = (text: string | string[], x: number, y: number, options?: Record<string, unknown>, transform?: unknown) => jsPDF;
type MatrixCtor = new (a: number, b: number, c: number, d: number, e: number, f: number) => unknown;

/**
 * doc.text() for oblique styles: each line is drawn with a skew matrix. jsPDF applies the matrix
 * after the position, which moves the text right by SLANT × (distance from the page bottom);
 * the x position is corrected by exactly that amount, so x/y and alignment stay as requested.
 */
function patchObliqueText(doc: jsPDF) {
  const originalText = doc.text.bind(doc) as unknown as TextFn;
  const Matrix = (doc as unknown as { Matrix: MatrixCtor }).Matrix;
  const patched: TextFn = (text, x, y, options, transform) => {
    const font = doc.getFont();
    const plain = font.fontName !== PDF_FONT || !OBLIQUE_STYLES.has(font.fontStyle)
      || typeof x !== 'number' || typeof y !== 'number' || transform !== undefined
      || (options !== null && typeof options === 'object' && options.angle !== undefined);
    if (plain) return originalText(text, x, y, options, transform);

    const opts: Record<string, unknown> = options && typeof options === 'object' ? { ...options } : {};
    let lines = (Array.isArray(text) ? text : String(text).split(/\r?\n/)).map(String);
    if (typeof opts.maxWidth === 'number' && opts.maxWidth > 0) {
      lines = lines.flatMap(line => doc.splitTextToSize(line, opts.maxWidth as number) as string[]);
    }
    delete opts.maxWidth;
    const factor = typeof opts.lineHeightFactor === 'number' ? opts.lineHeightFactor : doc.getLineHeightFactor();
    const lineHeight = (doc.getFontSize() * factor) / doc.internal.scaleFactor;
    const pageHeight = doc.internal.pageSize.getHeight();
    lines.forEach((line, i) => {
      const lineY = y + i * lineHeight;
      originalText(line, x - SLANT * (pageHeight - lineY), lineY, { ...opts, angle: new Matrix(1, 0, SLANT, 1, 0, 0) });
    });
    return doc;
  };
  doc.text = patched as unknown as jsPDF['text'];
}

/** Loads (if needed) and applies the house font. */
export async function withBrandFonts(doc: jsPDF): Promise<jsPDF> {
  if (await preloadBrandFonts()) applyBrandFonts(doc);
  return doc;
}
