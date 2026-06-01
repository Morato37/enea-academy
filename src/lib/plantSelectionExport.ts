import jsPDF from 'jspdf';
import { UserSelection, supabase } from './supabase';

const loadPlantImage = async (plantId: number): Promise<string | null> => {
  try {
    const { data, error } = await supabase
      .from('plant_images')
      .select('image_url, is_primary, display_order')
      .eq('plant_id', plantId)
      .order('is_primary', { ascending: false })
      .order('display_order', { ascending: true })
      .limit(1);
    if (error || !data || data.length === 0) return null;
    return data[0].image_url;
  } catch {
    return null;
  }
};

const loadImageAsDataURL = async (url: string): Promise<string> => {
  const isSupabaseStorage = url.includes('/storage/v1/object/public/');
  const headers: HeadersInit = {};
  if (isSupabaseStorage) headers['apikey'] = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
  const response = await fetch(url, { mode: 'cors', credentials: 'omit', headers });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    const objectUrl = URL.createObjectURL(blob);
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width; canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) { URL.revokeObjectURL(objectUrl); reject(new Error('No canvas context')); return; }
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(objectUrl);
      resolve(canvas.toDataURL('image/jpeg', 0.85));
    };
    img.onerror = () => { URL.revokeObjectURL(objectUrl); reject(new Error('Image load failed')); };
    img.src = objectUrl;
  });
};

const cropToRatioDataURL = (dataUrl: string, targetW: number, targetH: number): Promise<string> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const targetRatio = targetW / targetH;
      const imgRatio = img.width / img.height;
      let sx = 0, sy = 0, sW = img.width, sH = img.height;
      if (imgRatio > targetRatio) { sW = img.height * targetRatio; sx = (img.width - sW) / 2; }
      else { sH = img.width / targetRatio; sy = (img.height - sH) / 2; }
      const canvas = document.createElement('canvas');
      canvas.width = targetW; canvas.height = targetH;
      const ctx = canvas.getContext('2d');
      if (!ctx) { reject(new Error('No canvas context')); return; }
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, targetW, targetH);
      ctx.drawImage(img, sx, sy, sW, sH, 0, 0, targetW, targetH);
      resolve(canvas.toDataURL('image/jpeg', 0.85));
    };
    img.onerror = reject;
    img.src = dataUrl;
  });

// ── Icons ────────────────────────────────────────────────────────────────────

interface IconDef {
  file: string;
  labelDe: string;
  labelEn: string;
  check: (p: NonNullable<UserSelection['plant']>) => boolean;
}

const ICON_DEFS: IconDef[] = [
  { file: '/icons/schmetterlingsweide.jpeg', labelDe: 'Schmetterlingsweide', labelEn: 'Butterfly habitat',  check: p => !!p.characteristic_butterflies },
  { file: '/icons/bienenweide.jpeg',         labelDe: 'Bienenweide',         labelEn: 'Bee habitat',         check: p => !!(p.characteristic_bees || p.characteristic_honeybees || p.characteristic_bumblebees) },
  { file: '/icons/vogelnahrgeholz.jpeg',     labelDe: 'Vogelnährgehölz',     labelEn: 'Bird habitat',        check: p => !!p.characteristic_birds },
  { file: '/icons/einheimisch.jpeg',         labelDe: 'Einheimisch',         labelEn: 'Native',              check: p => !!p.characteristic_native },
  { file: '/icons/klimaprofiteur.jpeg',      labelDe: 'Klimaprofiteur',      labelEn: 'Climate benefit',     check: p => !!p.tree_of_the_future },
  { file: '/icons/immergrun.jpeg',           labelDe: 'Immergrün',           labelEn: 'Evergreen',           check: p => !!p.characteristic_evergreen },
  { file: '/icons/saisonal.jpeg',            labelDe: 'Saisonale Aspekte',   labelEn: 'Seasonal',            check: p => !!p.usage_seasonal },
  { file: '/icons/essbar.jpeg',              labelDe: 'Essbar',              labelEn: 'Edible',              check: p => !!p.category_culinary_plant },
  { file: '/icons/heilplfanze.jpeg',         labelDe: 'Heilpflanze',         labelEn: 'Medicinal',           check: p => !!p.category_medicinal_herbs },
  { file: '/icons/sonnig.png',               labelDe: 'Sonnig',              labelEn: 'Sunny',               check: p => !!p.exposure_sun },
  { file: '/icons/halbschattig.png',         labelDe: 'Halbschattig',        labelEn: 'Half shade',          check: p => !!p.exposure_halfshade },
  { file: '/icons/schattig.png',             labelDe: 'Schattig',            labelEn: 'Shade',               check: p => !!p.exposure_shade },
];

const iconCache = new Map<string, string>();

const loadIcon = async (file: string): Promise<string | null> => {
  if (iconCache.has(file)) return iconCache.get(file)!;
  try {
    const response = await fetch(file, { mode: 'cors' });
    if (!response.ok) return null;
    const blob = await response.blob();
    return new Promise((resolve) => {
      const img = new Image();
      const objectUrl = URL.createObjectURL(blob);
      img.onload = () => {
        const size = Math.max(img.width, img.height);
        const canvas = document.createElement('canvas');
        canvas.width = size; canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (!ctx) { URL.revokeObjectURL(objectUrl); resolve(null); return; }
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, size, size);
        ctx.drawImage(img, (size - img.width) / 2, (size - img.height) / 2);
        URL.revokeObjectURL(objectUrl);
        const dataUrl = canvas.toDataURL('image/png');
        iconCache.set(file, dataUrl);
        resolve(dataUrl);
      };
      img.onerror = () => { URL.revokeObjectURL(objectUrl); resolve(null); };
      img.src = objectUrl;
    });
  } catch {
    return null;
  }
};

const preloadAllIcons = () => Promise.all(ICON_DEFS.map(d => loadIcon(d.file)));

// ── Category helpers ─────────────────────────────────────────────────────────

type CategoryLabels = {
  trees: string; shrubs: string; grasses: string; perennials: string;
  bulbs: string; ferns: string; climbing: string;
};

const CATEGORY_ORDER: (keyof CategoryLabels)[] = [
  'trees', 'shrubs', 'grasses', 'perennials', 'bulbs', 'ferns', 'climbing',
];

const assignCategory = (
  plant: NonNullable<UserSelection['plant']>,
  labels: CategoryLabels
): string => {
  if (plant.category_tree) return labels.trees;
  if (plant.category_shrub) return labels.shrubs;
  if (plant.category_grass) return labels.grasses;
  if (plant.category_bulb) return labels.bulbs;
  if (plant.category_fern) return labels.ferns;
  if (plant.category_climbing_plant) return labels.climbing;
  return labels.perennials;
};

// ── Main export ──────────────────────────────────────────────────────────────

export const generatePlantSelectionPDF = async (
  selections: UserSelection[],
  projectName?: string,
  language: 'de' | 'en' = 'de'
): Promise<void> => {
  const labels: CategoryLabels = language === 'de'
    ? { trees: 'Bäume', shrubs: 'Sträucher', grasses: 'Gräser', perennials: 'Stauden', bulbs: 'Zwiebeln', ferns: 'Farne', climbing: 'Kletterpflanzen' }
    : { trees: 'Trees', shrubs: 'Shrubs', grasses: 'Grasses', perennials: 'Perennials', bulbs: 'Bulbs', ferns: 'Ferns', climbing: 'Climbing Plants' };

  // Build ordered list with category info attached
  const groups: { [cat: string]: NonNullable<UserSelection['plant']>[] } = {};
  for (const key of CATEGORY_ORDER) groups[labels[key]] = [];
  selections.forEach(sel => {
    if (!sel.plant) return;
    groups[assignCategory(sel.plant, labels)].push(sel.plant);
  });

  // Flat list of items — either a plant or a section header
  type Item = { kind: 'plant'; plant: NonNullable<UserSelection['plant']> } | { kind: 'header'; label: string };
  const items: Item[] = [];
  for (const key of CATEGORY_ORDER) {
    const cat = labels[key];
    if (groups[cat].length === 0) continue;
    items.push({ kind: 'header', label: cat });
    for (const p of groups[cat]) items.push({ kind: 'plant', plant: p });
  }

  if (items.length === 0) return;

  await preloadAllIcons();

  // ── Layout constants (A3 landscape) ──────────────────────────────────────
  const PAGE_W = 420;   // mm
  const PAGE_H = 297;   // mm
  const margin = 14;
  const colGap = 4;
  const rowGap = 2;
  const cols = 6;

  // Legend strip height at top of first page
  const LEGEND_ICON_SIZE = 5.5; // mm
  const LEGEND_ITEM_W = 34;     // fixed width per item — tight, content-driven
  const LEGEND_COLS = Math.floor((PAGE_W - margin * 2) / LEGEND_ITEM_W);
  const LEGEND_ROWS = Math.ceil(ICON_DEFS.length / LEGEND_COLS);
  const LEGEND_ROW_H = LEGEND_ICON_SIZE + 4;
  const LEGEND_H = LEGEND_ROWS * LEGEND_ROW_H + 4;
  const SEPARATOR_H = 3;

  // Cell layout
  const cellW = (PAGE_W - margin * 2 - colGap * (cols - 1)) / cols; // ~58mm
  const imgH = cellW * 1.35;   // portrait ratio
  const ICON_SIZE = 4;          // mm — icons under latin name
  const ICON_GAP = 1.2;
  const ICON_ROW_H = ICON_SIZE + 1.5;
  const NAME_H = 9;             // common + botanic names (tighter)
  const CELL_H = imgH + NAME_H + ICON_ROW_H + rowGap;

  // Category label row height (single text line, no background)
  const CAT_LABEL_H = 6;

  const doc = new jsPDF({ orientation: 'l', unit: 'mm', format: 'a3' });

  // ── Draw legend ───────────────────────────────────────────────────────────
  const drawLegend = (startY: number) => {
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(80, 80, 80);

    ICON_DEFS.forEach((def, idx) => {
      const li = idx % LEGEND_COLS;
      const lRow = Math.floor(idx / LEGEND_COLS);
      const lx = margin + li * LEGEND_ITEM_W;
      const ly = startY + lRow * LEGEND_ROW_H;

      const iconData = iconCache.get(def.file);
      if (iconData) {
        doc.addImage(iconData, 'PNG', lx, ly, LEGEND_ICON_SIZE, LEGEND_ICON_SIZE);
      }

      const label = language === 'de' ? def.labelDe : def.labelEn;
      doc.setFontSize(6.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(70, 70, 70);
      doc.text(label, lx + LEGEND_ICON_SIZE + 1.5, ly + LEGEND_ICON_SIZE * 0.65);
    });
  };

  // Thin separator line
  const drawSeparator = (y: number) => {
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.3);
    doc.line(margin, y, PAGE_W - margin, y);
  };

  // ── First page setup ──────────────────────────────────────────────────────
  let page = 1;
  drawLegend(margin);
  drawSeparator(margin + LEGEND_H);

  let col = 0;
  let rowY = margin + LEGEND_H + SEPARATOR_H;

  const nextPage = () => {
    doc.addPage('a3', 'l');
    page++;
    col = 0;
    rowY = margin + 4;
  };

  const advanceCell = () => {
    col++;
    if (col >= cols) {
      col = 0;
      rowY += CELL_H;
      if (rowY + CELL_H > PAGE_H - margin) nextPage();
    }
  };

  // ── Draw each item ────────────────────────────────────────────────────────
  for (const item of items) {
    if (item.kind === 'header') {
      // If there's not enough space for the label + at least one cell, go to next page
      if (rowY + CAT_LABEL_H + CELL_H > PAGE_H - margin) nextPage();

      // If mid-row, finish the current row first, then add label
      if (col > 0) {
        col = 0;
        rowY += CELL_H;
        if (rowY + CAT_LABEL_H + CELL_H > PAGE_H - margin) nextPage();
      }

      // Plain text category label, no background
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(80, 80, 80);
      doc.text(item.label, margin, rowY + 4.2);
      rowY += CAT_LABEL_H;
      continue;
    }

    const plant = item.plant;

    // Check if a new page is needed before drawing
    if (rowY + CELL_H > PAGE_H - margin) nextPage();

    const x = margin + col * (cellW + colGap);
    const y = rowY;

    // Image placeholder
    doc.setFillColor(225, 225, 225);
    doc.rect(x, y, cellW, imgH, 'F');

    // Image
    try {
      let imageUrl = await loadPlantImage(plant.id);
      if (!imageUrl && plant.image_url) imageUrl = plant.image_url;
      if (imageUrl) {
        const raw = await loadImageAsDataURL(imageUrl);
        const cropped = await cropToRatioDataURL(raw, 400, Math.round(400 * 1.35));
        doc.addImage(cropped, 'JPEG', x, y, cellW, imgH);
      }
    } catch { /* keep placeholder */ }

    // Common name
    const nameY = y + imgH + 2.5;
    const commonName = language === 'de'
      ? (plant.common_name_de || plant.common_name_en || '')
      : (plant.common_name_en || plant.common_name_de || '');

    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(50, 50, 50);
    doc.text(doc.splitTextToSize(commonName, cellW)[0] || '', x, nameY);

    // Latin name
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(110, 110, 110);
    doc.text(doc.splitTextToSize(plant.botanical_name || '', cellW)[0] || '', x, nameY + 3.2);

    // Icons row
    const applicableIcons = ICON_DEFS.filter(def => def.check(plant));
    const iconRowY = nameY + 3.2 + 2.2;
    applicableIcons.forEach((def, ii) => {
      const iconX = x + ii * (ICON_SIZE + ICON_GAP);
      if (iconX + ICON_SIZE > x + cellW) return;
      const iconData = iconCache.get(def.file);
      if (iconData) doc.addImage(iconData, 'PNG', iconX, iconRowY, ICON_SIZE, ICON_SIZE);
    });

    advanceCell();
  }

  doc.save(`PlantSelection_${new Date().toISOString().split('T')[0]}.pdf`);
};
