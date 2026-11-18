import { jsPDF } from 'jspdf';
import { PAGE, PAPER, PaperFormat } from './layouts';
import { MoodboardPage, MoodboardSlot } from './types';

export interface MoodboardHeader {
  /** e.g. "Rüschlikon, Glasenberg" */
  project: string;
  /** e.g. "Konzeptpräsentation" */
  concept: string;
  /** e.g. "Privatgarten" or "Saisonalität" */
  area: string;
}

export interface MoodboardPdfOptions {
  header: MoodboardHeader;
  /** Default 'a3' like the enea presentations. */
  format?: PaperFormat;
  /** Number printed bottom left on the first page (default 1). */
  firstPageNumber?: number;
  /** Logo top right and small mark bottom right (transparent PNGs in /public/moodboard). */
  logoUrl?: string;
  markUrl?: string;
  /** Resolution of the pictures. 200 dpi gives sharp prints at a moderate file size. */
  dpi?: number;
  fileName?: string;
  /** Called after each picture so the UI can show progress. */
  onProgress?: (done: number, total: number) => void;
}

const GREY_SLOT: [number, number, number] = [244, 244, 244];
const TEXT_GREY: [number, number, number] = [88, 88, 88];

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Bild konnte nicht geladen werden: ${src}`));
    img.src = src;
  });
}

/** Crops like CSS object-fit: cover to the slot's shape and returns a JPEG data URL. */
async function coverCrop(src: string, wMm: number, hMm: number, dpi: number): Promise<string> {
  const img = await loadImage(src);
  const outW = Math.max(1, Math.round((wMm / 25.4) * dpi));
  const outH = Math.max(1, Math.round((hMm / 25.4) * dpi));
  const slotRatio = wMm / hMm;
  const imgRatio = img.naturalWidth / img.naturalHeight;
  let sw = img.naturalWidth;
  let sh = img.naturalHeight;
  if (imgRatio > slotRatio) sw = sh * slotRatio;
  else sh = sw / slotRatio;
  const sx = (img.naturalWidth - sw) / 2;
  const sy = (img.naturalHeight - sh) / 2;
  const canvas = document.createElement('canvas');
  canvas.width = outW;
  canvas.height = outH;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas nicht verfügbar');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, outW, outH);
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, outW, outH);
  return canvas.toDataURL('image/jpeg', 0.86);
}

async function pngData(url: string | undefined): Promise<{ data: string; ratio: number } | null> {
  if (!url) return null;
  try {
    const img = await loadImage(url);
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    canvas.getContext('2d')?.drawImage(img, 0, 0);
    return { data: canvas.toDataURL('image/png'), ratio: img.naturalWidth / img.naturalHeight };
  } catch {
    return null;
  }
}

type Png = { data: string; ratio: number } | null;

/** Header, column labels and footer, positioned as in the Glasenberg example (values in A4 mm × k). */
function drawFrame(doc: jsPDF, page: MoodboardPage, o: MoodboardPdfOptions, k: number, pageNo: number, logo: Png, mark: Png) {
  const right = (PAGE.w - PAGE.margin) * k;
  doc.setTextColor(...TEXT_GREY);

  // logo top right: 7.3 mm high, top at 8.8 mm
  if (logo) {
    const h = 7.3 * k;
    doc.addImage(logo.data, 'PNG', right - h * logo.ratio, 8.8 * k, h * logo.ratio, h);
  } else {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(16 * k);
    doc.text('enea landscape design', right, 15 * k, { align: 'right' });
  }

  // "Projekt | Konzept | Bereich"
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.2 * k);
  const header = [o.header.project, o.header.concept, o.header.area].map(t => t.trim()).filter(Boolean).join(' | ');
  doc.text(header, right, 18.6 * k, { align: 'right' });

  // column labels above the pictures
  for (const column of page.layout.columns) {
    if (!column.label) continue;
    const first = page.layout.slots
      .filter(s => s.column === column.key)
      .sort((a, b) => a.x - b.x || a.y - b.y)[0];
    if (first) doc.text(column.label, first.x * k, 37.2 * k);
  }

  // footer: page number left, "© year enea" right
  doc.setFontSize(7.2 * k);
  doc.text(String(pageNo), PAGE.margin * k, 200.6 * k);
  const markH = 2.55 * k;
  const markW = mark ? markH * mark.ratio : 0;
  if (mark) doc.addImage(mark.data, 'PNG', right - markW, 200.7 * k - markH, markW, markH);
  doc.setFontSize(5.6 * k);
  doc.text(`© ${new Date().getFullYear()}`, right - markW - 1.5 * k, 200.6 * k, { align: 'right' });
}

/** Builds the PDF (one page per moodboard page) and starts the download. */
export async function exportMoodboardPdf(pages: MoodboardPage[], options: MoodboardPdfOptions): Promise<jsPDF> {
  const format = options.format ?? 'a3';
  const k = PAPER[format].scale;
  const dpi = options.dpi ?? 200;
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format, compress: true });
  const [logo, mark] = await Promise.all([
    pngData(options.logoUrl ?? '/moodboard/enea-logo.png'),
    pngData(options.markUrl ?? '/moodboard/enea-mark.png'),
  ]);
  const total = pages.reduce((n, p) => n + p.slots.filter(s => s.image).length, 0);
  let done = 0;

  for (let pi = 0; pi < pages.length; pi++) {
    const page = pages[pi];
    if (pi > 0) doc.addPage(format, 'landscape');
    drawFrame(doc, page, options, k, (options.firstPageNumber ?? 1) + pi, logo, mark);

    for (const slot of page.layout.slots as MoodboardSlot[]) {
      const x = slot.x * k, y = slot.y * k, w = slot.w * k, h = slot.h * k;
      const a = page.slots.find(s => s.slotId === slot.id);
      doc.setFillColor(...GREY_SLOT);
      doc.rect(x, y, w, h, 'F');
      if (!a?.image) continue;
      try {
        const data = await coverCrop(a.image.url, w, h, dpi);
        doc.addImage(data, 'JPEG', x, y, w, h, undefined, 'FAST');
      } catch (err) {
        console.warn(err);
      }
      done++;
      options.onProgress?.(done, total);
    }
  }

  const safe = (options.header.project || 'Projekt').replace(/[^\p{L}\p{N}_-]+/gu, '_');
  const stamp = new Date().toISOString().slice(2, 10).replace(/-/g, '');
  doc.save(options.fileName ?? `${stamp}_Moodboard_${safe}_${pages[0]?.layout.name ?? ''}.pdf`);
  return doc;
}
