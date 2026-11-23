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
const ICON_PX = 128;

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
        // Icons are printed 4-5 mm wide: 128 px is plenty and keeps the PDF small
        // (the source files are up to 850 px and were embedded uncompressed).
        const size = ICON_PX;
        const scale = size / Math.max(img.width, img.height);
        const w = img.width * scale, h = img.height * scale;
        const canvas = document.createElement('canvas');
        canvas.width = size; canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (!ctx) { URL.revokeObjectURL(objectUrl); resolve(null); return; }
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, size, size);
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, (size - w) / 2, (size - h) / 2, w, h);
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

// ── Layout (enea "Drawing Standards", A3 landscape, all values in mm) ──────────
// Measured from the booklet template: 6 columns of 63.7 mm with 2.6 mm gaps, portrait pictures
// 63.7 × 96 mm, two rows per page, group label above the first picture of each group,
// header "enea landscape design" + "Project | Planting concept | Area" top right,
// page number bottom left, "© year enea" bottom right.

const MARGIN_L = 12.2;
const COLS = 6;
const CELL_W = 63.7;
const COL_GAP = 2.6;
const IMG_H = 96;
const ROW_TOPS = [42, 162.9];          // top edge of the pictures in row 1 and row 2
const LABEL_ABOVE_IMG = 2.1;           // baseline of the group label above the picture
const NAME_BELOW_IMG = 6;              // baseline of the common name below the picture
const LINE_H = 4.6;                    // line distance common / botanical name
const RIGHT = MARGIN_L + COLS * CELL_W + (COLS - 1) * COL_GAP; // 407.4

const TEXT_SIZE = 12;                  // pt, names and group labels
const HEADER_SIZE = 11;                // pt, "Project | Planting concept | Area" and page number
const TEXT_GREY: [number, number, number] = [70, 70, 70];

const LOGO_URL = '/enea-logo%20copy.png';   // "enea landscape design"
const MARK_URL = '/enea-mark.png';          // "enea"
const LOGO_W = 94.6;
const LOGO_TOP = 8.4;
const SUBTITLE_BASELINE = 23.4;
const FOOTER_BASELINE = 282.3;
const MARK_H = 3.4;

// Legend in the free space top left, icons in the plant cells
const LEGEND_TOP = 9;
const LEGEND_ICON = 4.2;
const LEGEND_ROW_H = 5.6;
const LEGEND_COL_W = 50;
const ICON_SIZE = 4;
const ICON_GAP = 1.2;

/**
 * Plant groups in the order of the booklet. A plant belongs to the first group in CLASSIFY_ORDER
 * that matches (a rambler rose is a climbing plant even if it is also flagged as shrub).
 */
const GROUPS: { key: string; de: string; en: string; test: (p: NonNullable<UserSelection['plant']>) => boolean }[] = [
  { key: 'tree', de: 'Bäume', en: 'Trees', test: p => !!p.category_tree },
  { key: 'palm', de: 'Palmen', en: 'Palms', test: p => !!p.category_palm },
  { key: 'shrub', de: 'Sträucher', en: 'Shrubs', test: p => !!p.category_shrub },
  { key: 'climbing', de: 'Kletterpflanzen', en: 'Climbing plants', test: p => !!p.category_climbing_plant },
  { key: 'grass', de: 'Gräser', en: 'Grasses', test: p => !!p.category_grass },
  { key: 'fern', de: 'Farne', en: 'Ferns', test: p => !!p.category_fern },
  { key: 'bulb', de: 'Zwiebelpflanzen', en: 'Bulbs', test: p => !!p.category_bulb },
  { key: 'groundcover', de: 'Bodendecker', en: 'Ground cover', test: p => !!(p.category_ground_cover || p.usage_ground_cover) },
  { key: 'perennial', de: 'Stauden', en: 'Perennials', test: () => true },
];

const CLASSIFY_ORDER = ['tree', 'palm', 'climbing', 'shrub', 'grass', 'fern', 'bulb', 'groundcover', 'perennial'];

const groupOf = (plant: NonNullable<UserSelection['plant']>) => {
  const key = CLASSIFY_ORDER.find(k => GROUPS.find(g => g.key === k)!.test(plant))!;
  return GROUPS.findIndex(g => g.key === key);
};

/**
 * Botanical name in at most two lines. Like the booklet ("Rhododendron catawbiense /
 * 'Grandiflorum'"), a long name breaks before the cultivar, not inside it.
 */
function botanicalLines(doc: jsPDF, name: string, width: number): string[] {
  if (doc.getTextWidth(name) <= width) return [name];
  const quote = name.search(/\s['‘’"“]/);
  if (quote > 0) {
    const species = name.slice(0, quote).trim();
    const cultivar = name.slice(quote).trim();
    if (doc.getTextWidth(species) <= width && doc.getTextWidth(cultivar) <= width) return [species, cultivar];
  }
  return (doc.splitTextToSize(name, width) as string[]).slice(0, 2);
}

/** Loads a PNG and scales it to at most maxWidth px (the logo file is 2238 px wide). */
async function loadPng(url: string, maxWidth = 1400): Promise<{ data: string; ratio: number } | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const blob = await res.blob();
    return await new Promise(resolve => {
      const img = new Image();
      const objectUrl = URL.createObjectURL(blob);
      img.onload = () => {
        const scale = Math.min(1, maxWidth / img.naturalWidth);
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.naturalWidth * scale);
        canvas.height = Math.round(img.naturalHeight * scale);
        const ctx = canvas.getContext('2d');
        if (ctx) { ctx.imageSmoothingQuality = 'high'; ctx.drawImage(img, 0, 0, canvas.width, canvas.height); }
        URL.revokeObjectURL(objectUrl);
        resolve({ data: canvas.toDataURL('image/png'), ratio: img.naturalWidth / img.naturalHeight });
      };
      img.onerror = () => { URL.revokeObjectURL(objectUrl); resolve(null); };
      img.src = objectUrl;
    });
  } catch {
    return null;
  }
}

// ── Main export ──────────────────────────────────────────────────────────────

type Plant = NonNullable<UserSelection['plant']>;
interface Cell { plant: Plant; groupLabel?: string }
/** Plants that share pages and a header (the area is null for a whole-project export). */
interface Section { area: string | null; cells: Cell[] }

export const generatePlantSelectionPDF = async (
  selections: UserSelection[],
  projectName?: string,
  language: 'de' | 'en' = 'de'
): Promise<void> => {
  // One zone (export from a zone's button): the zone name goes into the header, as in the booklet.
  // Several zones (whole project): all plants together, each once, so the pages are filled;
  // the header then shows only "Project | Planting concept".
  const zoneIds = new Set(selections.filter(s => s.plant).map(s => s.zone_id || null));
  const singleZone = zoneIds.size === 1 ? selections.find(s => s.plant)?.zone_id : null;
  const area = singleZone ? selections.find(s => s.zone_id === singleZone)?.zone?.name || null : null;

  const plants: Plant[] = [];
  selections.forEach(selection => {
    if (selection.plant && !plants.some(p => p.id === selection.plant!.id)) plants.push(selection.plant);
  });
  if (!plants.length) return;

  // Plants by group (booklet order), then botanical name; label on each group's first plant.
  const sorted = plants.sort((a, b) =>
    groupOf(a) - groupOf(b) || (a.botanical_name || '').localeCompare(b.botanical_name || '', undefined, { numeric: true }));
  const sections: Section[] = [{
    area,
    cells: sorted.map((plant, i) => {
      const g = groupOf(plant);
      const first = i === 0 || groupOf(sorted[i - 1]) !== g;
      return { plant, groupLabel: first ? (language === 'de' ? GROUPS[g].de : GROUPS[g].en) : undefined };
    }),
  }];

  const [, logo, mark] = await Promise.all([preloadAllIcons(), loadPng(LOGO_URL), loadPng(MARK_URL)]);

  const doc = new jsPDF({ orientation: 'l', unit: 'mm', format: 'a3' });
  await withBrandFonts(doc);
  const concept = language === 'de' ? 'Bepflanzungskonzept' : 'Planting concept';
  let pageNo = 0;

  const drawLegend = () => {
    ICON_DEFS.forEach(def => {
      const lx = MARGIN_L + def.legendCol * LEGEND_COL_W;
      const ly = LEGEND_TOP + def.legendRow * LEGEND_ROW_H;
      if (def.drawFn) {
        def.drawFn(doc, lx, ly, LEGEND_ICON);
      } else {
        const iconData = iconCache.get(def.file);
        if (iconData) doc.addImage(iconData, 'PNG', lx, ly, LEGEND_ICON, LEGEND_ICON);
      }
      doc.setFont('helvetica', 'light');
      doc.setFontSize(8);
      doc.setTextColor(...TEXT_GREY);
      doc.text(language === 'de' ? def.labelDe : def.labelEn, lx + LEGEND_ICON + 1.6, ly + LEGEND_ICON * 0.75);
    });
  };

  const startPage = (area: string | null) => {
    if (pageNo > 0) doc.addPage('a3', 'l');
    pageNo++;
    drawLegend();

    // header top right: logo + "Project | Planting concept | Area"
    if (logo) {
      const h = LOGO_W / logo.ratio;
      doc.addImage(logo.data, 'PNG', RIGHT - LOGO_W, LOGO_TOP, LOGO_W, h);
    }
    doc.setFont('helvetica', 'light');
    doc.setFontSize(HEADER_SIZE);
    doc.setTextColor(...TEXT_GREY);
    const subtitle = [projectName?.trim(), concept, area?.trim()].filter(Boolean).join('  |  ');
    doc.text(subtitle, RIGHT, SUBTITLE_BASELINE, { align: 'right' });

    // footer: page number left, "© year enea" right
    doc.text(String(pageNo), MARGIN_L, FOOTER_BASELINE);
    const markW = mark ? MARK_H * mark.ratio : 0;
    if (mark) doc.addImage(mark.data, 'PNG', RIGHT - markW, FOOTER_BASELINE - MARK_H + 0.35, markW, MARK_H);
    doc.setFontSize(8);
    doc.text(`© ${new Date().getFullYear()}`, RIGHT - markW - (mark ? 1.6 : 0), FOOTER_BASELINE, { align: 'right' });
  };

  const drawCell = async (cell: Cell, x: number, imgTop: number) => {
    const { plant } = cell;
    if (cell.groupLabel) {
      doc.setFont('helvetica', 'light');
      doc.setFontSize(TEXT_SIZE);
      doc.setTextColor(...TEXT_GREY);
      doc.text(cell.groupLabel, x, imgTop - LABEL_ABOVE_IMG);
    }

    doc.setFillColor(240, 240, 240);
    doc.rect(x, imgTop, CELL_W, IMG_H, 'F');
    try {
      let imageUrl = await loadPlantImage(plant.id);
      if (!imageUrl && plant.image_url) imageUrl = plant.image_url;
      if (imageUrl) {
        const raw = await loadImageAsDataURL(imageUrl);
        const cropped = await cropToRatioDataURL(raw, 600, Math.round(600 * IMG_H / CELL_W));
        doc.addImage(cropped, 'JPEG', x, imgTop, CELL_W, IMG_H);
      }
    } catch { /* keep the grey placeholder */ }

    // common name (Light), botanical name (Light italic, up to two lines, e.g. long cultivar names)
    const commonName = language === 'de'
      ? (plant.common_name_de || plant.common_name_en || '')
      : (plant.common_name_en || plant.common_name_de || '');
    let y = imgTop + IMG_H + NAME_BELOW_IMG;
    doc.setFontSize(TEXT_SIZE);
    doc.setTextColor(...TEXT_GREY);
    if (commonName) {
      doc.setFont('helvetica', 'light');
      doc.text((doc.splitTextToSize(commonName, CELL_W) as string[])[0], x, y);
      y += LINE_H;
    }
    doc.setFont('helvetica', 'lightitalic');
    const botanical = botanicalLines(doc, plant.botanical_name || '', CELL_W);
    botanical.forEach((line, i) => doc.text(line, x, y + i * LINE_H));
    y += (botanical.length - 1) * LINE_H;

    // characteristic icons under the names
    const iconY = y + 2.2;
    ICON_DEFS.filter(def => def.check(plant)).forEach((def, i) => {
      const iconX = x + i * (ICON_SIZE + ICON_GAP);
      if (iconX + ICON_SIZE > x + CELL_W) return;
      if (def.drawFn) {
        def.drawFn(doc, iconX, iconY, ICON_SIZE);
      } else {
        const iconData = iconCache.get(def.file);
        if (iconData) doc.addImage(iconData, 'PNG', iconX, iconY, ICON_SIZE, ICON_SIZE);
      }
    });
  };

  // Rows of 6, two rows per page. A row that is not full (the last one) is centred, as in the booklet.
  for (const section of sections) {
    for (let start = 0; start < section.cells.length; start += COLS) {
      const rowIndex = (start / COLS) % ROW_TOPS.length;
      if (rowIndex === 0) startPage(section.area);
      const row = section.cells.slice(start, start + COLS);
      const shift = ((COLS - row.length) * (CELL_W + COL_GAP)) / 2;
      for (let c = 0; c < row.length; c++) {
        await drawCell(row[c], MARGIN_L + shift + c * (CELL_W + COL_GAP), ROW_TOPS[rowIndex]);
      }
    }
  }

  // ASCII file name (umlauts written out): some browsers drop non-ASCII download names.
  const safe = (projectName || '')
    .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/Ä/g, 'Ae').replace(/Ö/g, 'Oe').replace(/Ü/g, 'Ue').replace(/ß/g, 'ss')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Za-z0-9_-]+/g, '_').replace(/^_+|_+$/g, '');
  doc.save(`PlantSelection_${safe ? `${safe}_` : ''}${new Date().toISOString().split('T')[0]}.pdf`);
};
