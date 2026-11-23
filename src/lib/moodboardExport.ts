import jsPDF from 'jspdf';
import { UserSelection, supabase } from './supabase';

import { withBrandFonts } from './pdfFonts';
const loadPlantImages = async (plantId: number, imageCount: number): Promise<string[]> => {
  try {
    const { data, error } = await supabase
      .from('plant_images')
      .select('image_url, is_primary, display_order')
      .eq('plant_id', plantId)
      .order('is_primary', { ascending: false })
      .order('display_order', { ascending: true })
      .limit(imageCount);
    if (error) throw error;
    if (data && data.length > 0) return [...new Set(data.map(img => img.image_url).filter(Boolean))];
    return [];
  } catch {
    return [];
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
    img.onerror = () => { URL.revokeObjectURL(objectUrl); reject(new Error('Failed to load image')); };
    img.src = objectUrl;
  });
};

const cropImageDataURL = (dataUrl: string, targetW: number, targetH: number): Promise<string> =>
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

const assignCategory = (
  plant: NonNullable<UserSelection['plant']>,
  labels: { trees: string; shrubs: string; grasses: string; perennials: string; bulbs: string; ferns: string; climbing: string }
) => {
  if (plant.category_tree) return labels.trees;
  if (plant.category_shrub) return labels.shrubs;
  if (plant.category_grass) return labels.grasses;
  if (plant.category_bulb) return labels.bulbs;
  if (plant.category_fern) return labels.ferns;
  if (plant.category_climbing_plant) return labels.climbing;
  return labels.perennials;
};

interface FlatItem {
  plant: NonNullable<UserSelection['plant']>;
  categoryLabel: string;
}

const buildFlatList = (selections: UserSelection[], language: 'de' | 'en'): FlatItem[] => {
  const mixLabels = new Map<string, string>();
  const grouped = new Map<string, NonNullable<UserSelection['plant']>[]>();
  selections.forEach(selection => {
    if (!selection.plant) return;
    const mixKey = selection.zone_id || '__unassigned__';
    mixLabels.set(mixKey, selection.zone?.name || (language === 'de' ? 'Ohne Mix' : 'Unassigned'));
    const plants = grouped.get(mixKey) || [];
    if (!plants.some(plant => plant.id === selection.plant!.id)) plants.push(selection.plant);
    grouped.set(mixKey, plants);
  });

  return [...grouped.entries()]
    .sort(([keyA, plantsA], [keyB, plantsB]) => {
      if (keyA === '__unassigned__') return 1;
      if (keyB === '__unassigned__') return -1;
      const orderA = selections.find(selection => selection.zone_id === keyA)?.zone?.display_order ?? Number.MAX_SAFE_INTEGER;
      const orderB = selections.find(selection => selection.zone_id === keyB)?.zone?.display_order ?? Number.MAX_SAFE_INTEGER;
      return orderA - orderB || (mixLabels.get(keyA) || '').localeCompare(mixLabels.get(keyB) || '');
    })
    .flatMap(([mixKey, plants]) => {
      plants.sort((a, b) => (a.botanical_name || '').localeCompare(b.botanical_name || ''));
      return plants.map((plant, index) => ({ plant, categoryLabel: index === 0 ? mixLabels.get(mixKey) || '' : '' }));
    });
};

// Icon definitions — path relative to public root, plant field, label
const ICON_DEFS: { file: string; labelDe: string; labelEn: string; check: (p: NonNullable<UserSelection['plant']>) => boolean }[] = [
  { file: '/icons/BUTTERFLY_ICON.png', labelDe: 'Schmetterlingsweide', labelEn: 'Butterfly habitat',  check: p => !!p.characteristic_butterflies },
  { file: '/icons/BEE_ICON.png',        labelDe: 'Bienenweide',         labelEn: 'Bee habitat',         check: p => !!(p.characteristic_bees || p.characteristic_honeybees || p.characteristic_bumblebees) },
  { file: '/icons/BIRD_ICON.png',       labelDe: 'Vogeln\u00e4hrgeh\u00f6lz',    labelEn: 'Bird habitat',        check: p => !!p.characteristic_birds },
  { file: '/images/native/einheimisch.jpg', labelDe: 'Einheimisch',     labelEn: 'Native',              check: p => !!p.characteristic_native },
  { file: '/icons/EVERGREEN_ICON.png',  labelDe: 'Klimaprofiteur',      labelEn: 'Climate benefit',     check: p => !!p.tree_of_the_future },
  { file: '/icons/snowflake_grau_1.jpg',labelDe: 'Immergr\u00fcn',           labelEn: 'Evergreen',           check: p => !!p.characteristic_evergreen },
  { file: '/icons/FLOWER.png',           labelDe: 'Saisonale Aspekte',   labelEn: 'Seasonal',            check: p => !!p.usage_seasonal },
  { file: '/icons/Apple_grau_1.jpg',     labelDe: 'Essbar',              labelEn: 'Edible',              check: p => !!p.category_culinary_plant },
  { file: '/icons/MEDICINAL.png',        labelDe: 'Heilpflanze',         labelEn: 'Medicinal',           check: p => !!p.category_medicinal_herbs },
  { file: '/icons/sonnig.png',           labelDe: 'Sonnig',              labelEn: 'Sunny',               check: p => !!p.exposure_sun },
  { file: '/icons/halbschattig.png',     labelDe: 'Halbschattig',        labelEn: 'Half shade',          check: p => !!p.exposure_halfshade },
  { file: '/icons/schattig.png',         labelDe: 'Schattig',            labelEn: 'Shade',               check: p => !!p.exposure_shade },
];

// Pre-load all icons as data URLs (cached per session)
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
        const canvas = document.createElement('canvas');
        const size = Math.max(img.width, img.height);
        canvas.width = size; canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (!ctx) { URL.revokeObjectURL(objectUrl); resolve(null); return; }
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, size, size);
        const offsetX = (size - img.width) / 2;
        const offsetY = (size - img.height) / 2;
        ctx.drawImage(img, offsetX, offsetY);
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

const preloadAllIcons = async (): Promise<void> => {
  await Promise.all(ICON_DEFS.map(def => loadIcon(def.file)));
};

export const generateMoodboardPDF = async (
  selections: UserSelection[],
  projectName?: string,
  language: 'de' | 'en' = 'de',
  imageCount: 2 | 3 = 2
): Promise<void> => {
  const flat = buildFlatList(selections, language);
  if (flat.length === 0) return;

  await preloadAllIcons();

  // A0 landscape base: height fixed at 841 mm, width grows with the plant count
  const PAGE_H = 841;
  const BASE_W = 1189;
  const margin = 20; // 2 cm everywhere
  const firstTextOffset = 6.422; // 0.6422 cm under upper margin

  const colGap = 4;
  const imgGap = 3;
  const nameH = 14;
  const catLabelH = 11;

  const imgW = 85;
  const imgH = imgW * 0.75;
  const cellH = nameH + imgH * imageCount + imgGap * (imageCount - 1);
  const rowSpacing = 6;

  // Available vertical space for rows
  const availH = PAGE_H - margin * 2 - firstTextOffset - 12; // 12mm for title area
  const maxRowH = cellH + rowSpacing + catLabelH;
  const maxRows = Math.max(1, Math.floor(availH / maxRowH));

  // Fill the full A0 width row by row before extending the page.
  const baseCols = Math.max(1, Math.floor((BASE_W - margin * 2 + colGap) / (imgW + colGap)));
  const baseCapacity = baseCols * maxRows;
  const cols = flat.length <= baseCapacity
    ? baseCols
    : Math.max(baseCols, Math.ceil(flat.length / maxRows));

  const neededW = margin * 2 + cols * imgW + (cols - 1) * colGap;
  const pageW = Math.max(BASE_W, neededW);

  const rowLabels: boolean[] = [];
  for (let i = 0; i < flat.length; i += cols) {
    rowLabels.push(flat.slice(i, i + cols).some(it => it.categoryLabel !== ''));
  }

  const doc = new jsPDF({
    orientation: 'l',
    unit: 'mm',
    format: [pageW, PAGE_H],
  });
  await withBrandFonts(doc);

  const titleText = projectName ? `${projectName} — Plant Board` : 'Plant Board';
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(40, 40, 40);
  doc.text(titleText, margin, margin + firstTextOffset);

  let rowStartY = margin + firstTextOffset + 12;

  for (let i = 0; i < flat.length; i++) {
    const rowIdx = Math.floor(i / cols);
    const colIndex = i % cols;

    if (colIndex === 0 && i > 0) {
      rowStartY += (rowLabels[rowIdx - 1] ? catLabelH : 0) + cellH + rowSpacing;
    }

    const rowHasLabel = rowLabels[rowIdx];
    const x = margin + colIndex * (imgW + colGap);

    if (flat[i].categoryLabel !== '') {
      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(70, 70, 70);
      doc.text(flat[i].categoryLabel, x, rowStartY + catLabelH - 2);
    }

    const textTop = rowStartY + (rowHasLabel ? catLabelH : 0);
    const plant = flat[i].plant;
    const commonName = language === 'de'
      ? (plant.common_name_de || plant.common_name_en || '')
      : (plant.common_name_en || plant.common_name_de || '');
    const botanicName = plant.botanical_name || '';

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(50, 50, 50);
    const commonLine = doc.splitTextToSize(commonName, imgW)[0] as string || '';
    doc.text(commonLine, x, textTop + 5);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(90, 90, 90);
    const botanicLine = doc.splitTextToSize(botanicName, imgW)[0] as string || '';
    doc.text(botanicLine, x, textTop + 5 + 5);

    const imageTop = textTop + nameH;

    let plantImages = await loadPlantImages(plant.id, imageCount);
    if (plantImages.length === 0 && plant.image_url) plantImages = [plant.image_url];

    let imgY = imageTop;
    for (let imgIdx = 0; imgIdx < imageCount; imgIdx++) {
      if (plantImages[imgIdx]) {
        try {
          const raw = await loadImageAsDataURL(plantImages[imgIdx]);
          const cropped = await cropImageDataURL(raw, Math.round(imgW * 30), Math.round(imgH * 30));
          doc.addImage(cropped, 'JPEG', x, imgY, imgW, imgH);
        } catch {
          doc.setFillColor(225, 225, 225);
          doc.rect(x, imgY, imgW, imgH, 'F');
        }
      } else {
        doc.setFillColor(225, 225, 225);
        doc.rect(x, imgY, imgW, imgH, 'F');
      }
      imgY += imgH + imgGap;
    }
  }

  doc.save(`PlantBoard_${new Date().toISOString().split('T')[0]}.pdf`);
};
