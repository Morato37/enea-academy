import { getPruningOption, pruningFormLabel, PruningLanguage } from './pruningForms';

export interface PdfSketch {
  /** PNG data URL on white background, ready for jsPDF `doc.addImage(dataUrl, 'PNG', x, y, w, h)`. */
  dataUrl: string;
  /** Pixel size of the image; use it to keep the aspect ratio in the PDF. */
  width: number;
  height: number;
}

const cache = new Map<string, Promise<PdfSketch | null>>();

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Skizze konnte nicht geladen werden: ${src}`));
    img.src = src;
  });
}

/**
 * Loads the sketch for a plant's pruning form as PNG data URL on white background.
 * Returns null when no form is chosen or the sketch cannot be loaded (the PDF should then
 * show only the form name).
 */
export function getPruningSketchForPdf(
  botanicalName: string,
  code: string | null | undefined,
  maxPx = 240,
): Promise<PdfSketch | null> {
  const opt = getPruningOption(botanicalName, code);
  if (!opt?.sketchUrl) return Promise.resolve(null);
  const key = `${opt.sketchUrl}|${maxPx}`;
  const hit = cache.get(key);
  if (hit) return hit;

  const job = loadImage(opt.sketchUrl)
    .then(img => {
      const scale = Math.min(1, maxPx / Math.max(img.naturalWidth, img.naturalHeight));
      const w = Math.max(1, Math.round(img.naturalWidth * scale));
      const h = Math.max(1, Math.round(img.naturalHeight * scale));
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, w, h);
      ctx.drawImage(img, 0, 0, w, h);
      return { dataUrl: canvas.toDataURL('image/png'), width: w, height: h };
    })
    .catch(err => {
      console.warn(err);
      cache.delete(key);
      return null;
    });
  cache.set(key, job);
  return job;
}

/** Fits a sketch into a box (mm) keeping its aspect ratio; returns size and offsets to center it. */
export function fitSketch(sketch: PdfSketch, boxW: number, boxH: number) {
  const ratio = Math.min(boxW / sketch.width, boxH / sketch.height);
  const w = sketch.width * ratio;
  const h = sketch.height * ratio;
  return { w, h, dx: (boxW - w) / 2, dy: (boxH - h) / 2 };
}

/** Text for exports (Excel/CSV/PDF tables): form name or empty string. */
export function pruningFormExportText(code: string | null | undefined, language: PruningLanguage = 'de'): string {
  return pruningFormLabel(code, language);
}
