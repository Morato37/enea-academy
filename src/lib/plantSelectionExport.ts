import jsPDF from 'jspdf';
import { UserSelection, supabase } from './supabase';

import { withBrandFonts } from './pdfFonts';
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
  legendCol: number; // 0-3, explicit legend grid position
  legendRow: number; // 0-2
  check: (p: NonNullable<UserSelection['plant']>) => boolean;
  drawFn?: (doc: jsPDF, x: number, y: number, size: number) => void;
}

// Legend grid: 4 cols × 3 rows, column-major
// Col 0: Butterfly | Bee | Bird
// Col 1: Klimaprofiteur | Immergrün | (empty — native removed)
// Col 2: Saisonale Aspekte | Essbar | Heilpflanze
// Col 3: Sonnig | Halbschattig | Schattig
const ICON_DEFS: IconDef[] = [
  { file: '/icons/BUTTERFLY_ICON.png',  labelDe: 'Schmetterlingsweide', labelEn: 'Butterfly habitat', legendCol: 0, legendRow: 0, check: p => !!p.characteristic_butterflies },
  { file: '/icons/BEE_ICON.png',        labelDe: 'Bienenweide',         labelEn: 'Bee habitat',       legendCol: 0, legendRow: 1, check: p => !!(p.characteristic_bees || p.characteristic_honeybees || p.characteristic_bumblebees) },
  { file: '/icons/BIRD_ICON.png',       labelDe: 'Vogelnährgehölz',    labelEn: 'Bird habitat',      legendCol: 0, legendRow: 2, check: p => !!p.characteristic_birds },
  { file: '/images/native/einheimisch.jpg', labelDe: 'Einheimisch',     labelEn: 'Native',            legendCol: 1, legendRow: 0, check: p => !!p.characteristic_native },
  { file: '/icons/EVERGREEN_ICON.png', labelDe: 'Klimaprofiteur',      labelEn: 'Climate benefit',   legendCol: 1, legendRow: 1, check: p => !!p.tree_of_the_future },
  { file: '/icons/snowflake_grau_1.jpg',labelDe: 'Immergr\u00fcn',           labelEn: 'Evergreen',         legendCol: 1, legendRow: 2, check: p => !!p.characteristic_evergreen },
  { file: '/icons/FLOWER.png',          labelDe: 'Saisonale Aspekte',   labelEn: 'Seasonal',          legendCol: 2, legendRow: 0, check: p => !!p.usage_seasonal },
  { file: '/icons/Apple_grau_1.jpg',    labelDe: 'Essbar',              labelEn: 'Edible',            legendCol: 2, legendRow: 1, check: p => !!p.category_culinary_plant },
  { file: '/icons/MEDICINAL.png',       labelDe: 'Heilpflanze',         labelEn: 'Medicinal',         legendCol: 2, legendRow: 2, check: p => !!p.category_medicinal_herbs },
  { file: '/icons/sonnig.png',          labelDe: 'Sonnig',              labelEn: 'Sunny',             legendCol: 3, legendRow: 0, check: p => !!p.exposure_sun,
    drawFn: (doc, x, y, size) => { doc.setDrawColor(80, 80, 80); doc.setLineWidth(0.45); doc.circle(x + size / 2, y + size / 2, size / 2 - 0.25, 'S'); } },
  { file: '/icons/halbschattig.png',    labelDe: 'Halbschattig',        labelEn: 'Half shade',        legendCol: 3, legendRow: 1, check: p => !!p.exposure_halfshade },
  { file: '/icons/schattig.png',        labelDe: 'Schattig',            labelEn: 'Shade',             legendCol: 3, legendRow: 2, check: p => !!p.exposure_shade },
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

// ── Main export ──────────────────────────────────────────────────────────────

export const generatePlantSelectionPDF = async (
  selections: UserSelection[],
  _projectName?: string,
  language: 'de' | 'en' = 'de'
): Promise<void> => {
  const mixLabels = new Map<string, string>();
  const grouped = new Map<string, NonNullable<UserSelection['plant']>[]>();
  const exportedPlantIds = new Set<number>();
  selections.forEach(selection => {
    if (!selection.plant || exportedPlantIds.has(selection.plant.id)) return;
    exportedPlantIds.add(selection.plant.id);
    const mixKey = selection.zone_id || '__unassigned__';
    mixLabels.set(mixKey, selection.zone?.name || (language === 'de' ? 'Ohne Mix' : 'Unassigned'));
    const plants = grouped.get(mixKey) || [];
    plants.push(selection.plant);
    grouped.set(mixKey, plants);
  });

  type Item = { kind: 'plant'; plant: NonNullable<UserSelection['plant']>; selection: UserSelection; catLabel?: string };
  const items: Item[] = [...grouped.entries()]
    .sort(([keyA], [keyB]) => {
      if (keyA === '__unassigned__') return 1;
      if (keyB === '__unassigned__') return -1;
      const orderA = selections.find(selection => selection.zone_id === keyA)?.zone?.display_order ?? Number.MAX_SAFE_INTEGER;
      const orderB = selections.find(selection => selection.zone_id === keyB)?.zone?.display_order ?? Number.MAX_SAFE_INTEGER;
      return orderA - orderB || (mixLabels.get(keyA) || '').localeCompare(mixLabels.get(keyB) || '');
    })
    .flatMap(([mixKey, plants]) => {
      plants.sort((a, b) => (a.botanical_name || '').localeCompare(b.botanical_name || ''));
      return plants.map((plant, index) => {
        const selection = selections.find(item => item.plant?.id === plant.id && (item.zone_id || '__unassigned__') === mixKey);
        return { kind: 'plant' as const, plant, selection: selection!, catLabel: index === 0 ? mixLabels.get(mixKey) : undefined };
      });
    });

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
  const LEGEND_ROWS = 3;
  const LEGEND_ITEM_W = 55;
  const legendStartX = margin;
  const LEGEND_ROW_H = LEGEND_ICON_SIZE + 1.5;
  const LEGEND_H = LEGEND_ROWS * LEGEND_ROW_H + 4;

  // Cell layout
  const cellW = (PAGE_W - margin * 2 - colGap * (cols - 1)) / cols; // ~58mm
  const imgH = cellW * 1.35;   // portrait ratio
  const ICON_SIZE = 4;          // mm — icons under latin name
  const ICON_GAP = 1.2;
  const ICON_ROW_H = ICON_SIZE + 1.5;
  const NAME_H = 8;             // common + botanic names
  const CAT_LABEL_H = 5.5;      // extra space above image when a category label is shown
  const CELL_H = imgH + NAME_H + ICON_ROW_H + rowGap;
  const CELL_H_WITH_LABEL = CELL_H + CAT_LABEL_H;

  const doc = new jsPDF({ orientation: 'l', unit: 'mm', format: 'a3' });
  await withBrandFonts(doc);

  // ── Draw legend ───────────────────────────────────────────────────────────
  const drawLegend = (startY: number) => {
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(80, 80, 80);

    ICON_DEFS.forEach((def) => {
      const lx = legendStartX + def.legendCol * LEGEND_ITEM_W;
      const ly = startY + def.legendRow * LEGEND_ROW_H;

      if (def.drawFn) {
        def.drawFn(doc, lx, ly, LEGEND_ICON_SIZE);
      } else {
        const iconData = iconCache.get(def.file);
        if (iconData) {
          const iconFmt = def.file.match(/\.jpe?g$/i) ? 'JPEG' : 'PNG';
          doc.addImage(iconData, iconFmt, lx, ly, LEGEND_ICON_SIZE, LEGEND_ICON_SIZE);
        }
      }

      const label = language === 'de' ? def.labelDe : def.labelEn;
      doc.setFontSize(6.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(70, 70, 70);
      doc.text(label, lx + LEGEND_ICON_SIZE + 1.5, ly + LEGEND_ICON_SIZE * 0.65);
    });
  };

  // ── First page setup ──────────────────────────────────────────────────────
  let page = 1;
  drawLegend(margin);

  let col = 0;
  let rowY = margin + LEGEND_H;

  const nextPage = () => {
    doc.addPage('a3', 'l');
    page++;
    col = 0;
    drawLegend(margin);
    rowY = margin + LEGEND_H;
  };

  // Pre-compute which item indices start a labeled row so every cell in that
  // row can be offset uniformly (avoids misalignment when label is mid-row).
  const rowLabelOffset: boolean[] = new Array(items.length).fill(false);
  {
    let c = 0;
    // First pass: find label positions and mark all items in the same row
    const rowStart: number[] = []; // item index that starts each row
    let rs = 0;
    for (let i = 0; i < items.length; i++) {
      if (c === 0) rs = i;
      if (items[i].catLabel) {
        // mark entire row segment starting at rs up to end of row
        rowStart.push(rs);
      }
      c++;
      if (c >= cols) c = 0;
    }
    // Second pass: mark all items belonging to rows that have a label
    c = 0;
    let currentRowHasLabel = false;
    let rowStartIdx = 0;
    for (let i = 0; i < items.length; i++) {
      if (c === 0) { rowStartIdx = i; currentRowHasLabel = false; }
      if (items[i].catLabel) currentRowHasLabel = true;
      c++;
      if (c >= cols || i === items.length - 1) {
        if (currentRowHasLabel) {
          for (let j = rowStartIdx; j <= i; j++) rowLabelOffset[j] = true;
        }
        c = 0;
      }
    }
  }

  const advanceCell = (rowHadLabel: boolean) => {
    col++;
    if (col >= cols) {
      col = 0;
      rowY += rowHadLabel ? CELL_H_WITH_LABEL : CELL_H;
      if (rowY + CELL_H > PAGE_H - margin) nextPage();
    }
  };

  // ── Draw each item ────────────────────────────────────────────────────────
  for (let idx = 0; idx < items.length; idx++) {
    const item = items[idx];
    const plant = item.plant;
    const rowOffset = rowLabelOffset[idx];
    const cellTotalH = rowOffset ? CELL_H_WITH_LABEL : CELL_H;

    // Check if a new page is needed before drawing
    if (rowY + cellTotalH > PAGE_H - margin) nextPage();

    // Rows fill left to right. A row that is not full (the last one, or the only one in a small
    // export) is centred on the page instead of starting at the left margin.
    const itemsInRow = Math.min(cols, items.length - (idx - col));
    const rowShiftX = ((cols - itemsInRow) * (cellW + colGap)) / 2;
    const x = margin + rowShiftX + col * (cellW + colGap);
    // All cells in a label-row shift down by CAT_LABEL_H; only the labeled cell shows text
    const imgY = rowY + (rowOffset ? CAT_LABEL_H : 0);

    // Category label above image (only for first plant of each category)
    if (item.catLabel) {
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(80, 80, 80);
      doc.text(item.catLabel, x, rowY + 4);
    }

    // Image placeholder
    doc.setFillColor(255, 255, 255);
    doc.rect(x, imgY, cellW, imgH, 'F');

    // Image
    try {
      let imageUrl = await loadPlantImage(plant.id);
      if (!imageUrl && plant.image_url) imageUrl = plant.image_url;
      if (imageUrl) {
        const raw = await loadImageAsDataURL(imageUrl);
        const cropped = await cropToRatioDataURL(raw, 400, Math.round(400 * 1.35));
        doc.addImage(cropped, 'JPEG', x, imgY, cellW, imgH);
      }
    } catch { /* keep placeholder */ }

    // Common name
    const nameY = imgY + imgH + 2.5;
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

    // Icons row (directly under botanical name)
    const applicableIcons = ICON_DEFS.filter(def => def.check(plant));
    const iconRowY = nameY + 3.2 + 2.2;
    applicableIcons.forEach((def, ii) => {
      const iconX = x + ii * (ICON_SIZE + ICON_GAP);
      if (iconX + ICON_SIZE > x + cellW) return;
      if (def.drawFn) {
        def.drawFn(doc, iconX, iconRowY, ICON_SIZE);
      } else {
        const iconData = iconCache.get(def.file);
        if (iconData) doc.addImage(iconData, def.file.match(/\.jpe?g$/i) ? 'JPEG' : 'PNG', iconX, iconRowY, ICON_SIZE, ICON_SIZE);
      }
    });

    advanceCell(rowOffset);
  }

  doc.save(`PlantSelection_${new Date().toISOString().split('T')[0]}.pdf`);
};
