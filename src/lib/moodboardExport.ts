import jsPDF from 'jspdf';
import { UserSelection, supabase } from './supabase';

const loadPlantImages = async (plantId: number): Promise<string[]> => {
  try {
    const { data, error } = await supabase
      .from('plant_images')
      .select('image_url, is_primary, display_order')
      .eq('plant_id', plantId)
      .order('is_primary', { ascending: false })
      .order('display_order', { ascending: true })
      .limit(2);
    if (error) throw error;
    if (data && data.length > 0) return data.map(img => img.image_url);
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
  labels: { trees: string; shrubs: string; grasses: string; perennials: string }
) => {
  if (plant.category_tree) return labels.trees;
  if (plant.category_shrub) return labels.shrubs;
  if (plant.category_grass) return labels.grasses;
  return labels.perennials;
};

interface FlatItem {
  plant: NonNullable<UserSelection['plant']>;
  categoryLabel: string;
}

const buildFlatList = (selections: UserSelection[], language: 'de' | 'en'): FlatItem[] => {
  const labels = language === 'de'
    ? { trees: 'Bäume', shrubs: 'Sträucher', grasses: 'Gräser', perennials: 'Stauden' }
    : { trees: 'Trees', shrubs: 'Shrubs', grasses: 'Grasses', perennials: 'Perennials' };

  const groups: { [cat: string]: NonNullable<UserSelection['plant']>[] } = {
    [labels.trees]: [], [labels.shrubs]: [], [labels.grasses]: [], [labels.perennials]: [],
  };
  selections.forEach(sel => {
    if (!sel.plant) return;
    groups[assignCategory(sel.plant, labels)].push(sel.plant);
  });

  const flat: FlatItem[] = [];
  for (const cat of [labels.trees, labels.shrubs, labels.grasses, labels.perennials]) {
    groups[cat].forEach((plant, idx) => flat.push({ plant, categoryLabel: idx === 0 ? cat : '' }));
  }
  return flat;
};

// Icon definitions — path relative to public root, plant field, label
const ICON_DEFS: { file: string; labelDe: string; labelEn: string; check: (p: NonNullable<UserSelection['plant']>) => boolean }[] = [
  { file: '/icons/schmetterlingsweide.jpeg', labelDe: 'Schmetterlingsweide', labelEn: 'Butterfly habitat',  check: p => !!p.characteristic_butterflies },
  { file: '/icons/bienenweide.jpeg',        labelDe: 'Bienenweide',         labelEn: 'Bee habitat',         check: p => !!(p.characteristic_bees || p.characteristic_honeybees || p.characteristic_bumblebees) },
  { file: '/icons/vogelnahrgeholz.jpeg',    labelDe: 'Vogelnährgehölz',     labelEn: 'Bird habitat',        check: p => !!p.characteristic_birds },
  { file: '/icons/einheimisch.jpeg',        labelDe: 'Einheimisch',         labelEn: 'Native',              check: p => !!p.characteristic_native },
  { file: '/icons/klimaprofiteur.jpeg',     labelDe: 'Klimaprofiteur',      labelEn: 'Climate benefit',     check: p => !!p.tree_of_the_future },
  { file: '/icons/immergrun.jpeg',          labelDe: 'Immergrün',           labelEn: 'Evergreen',           check: p => !!p.characteristic_evergreen },
  { file: '/icons/saisonal.jpeg',           labelDe: 'Saisonale Aspekte',   labelEn: 'Seasonal',            check: p => !!p.usage_seasonal },
  { file: '/icons/essbar.jpeg',             labelDe: 'Essbar',              labelEn: 'Edible',              check: p => !!p.category_culinary_plant },
  { file: '/icons/heilplfanze.jpeg',        labelDe: 'Heilpflanze',         labelEn: 'Medicinal',           check: p => !!p.category_medicinal_herbs },
  { file: '/icons/sonnig.png',              labelDe: 'Sonnig',              labelEn: 'Sunny',               check: p => !!p.exposure_sun },
  { file: '/icons/halbschattig.png',        labelDe: 'Halbschattig',        labelEn: 'Half shade',          check: p => !!p.exposure_halfshade },
  { file: '/icons/schattig.png',            labelDe: 'Schattig',            labelEn: 'Shade',               check: p => !!p.exposure_shade },
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
  language: 'de' | 'en' = 'de'
): Promise<void> => {
  const flat = buildFlatList(selections, language);
  if (flat.length === 0) return;

  await preloadAllIcons();

  const margin = 12;
  const colGap = 2.5;
  const imgGap = 2;
  const nameH = 9;   // unified text block height (common + botanic, same size)
  const catLabelH = 7;
  const titleH = 16;

  const imgW = 60;
  const imgH = imgW * 0.75;
  const cellH = nameH + imgH * 2 + imgGap;

  const computeLayout = (cols: number) => {
    const w = margin * 2 + cols * imgW + (cols - 1) * colGap;
    const rowLabels: boolean[] = [];
    for (let i = 0; i < flat.length; i += cols) {
      rowLabels.push(flat.slice(i, i + cols).some(it => it.categoryLabel !== ''));
    }
    let totalH = 0;
    for (const hasLabel of rowLabels) {
      totalH += (hasLabel ? catLabelH : 0) + cellH + 4;
    }
    const h = margin * 2 + titleH + totalH + 4;
    return { w, h, rowLabels };
  };

  let cols = 6;
  let layout = computeLayout(cols);
  while (layout.w < layout.h && cols < flat.length) {
    cols++;
    layout = computeLayout(cols);
  }

  const pageW = layout.w;
  const pageH = layout.h;
  const { rowLabels } = layout;

  const doc = new jsPDF({
    orientation: 'l',
    unit: 'mm',
    format: [Math.min(pageW, pageH), Math.max(pageW, pageH)],
  });

  const titleText = projectName ? `${projectName} — Plant Board` : 'Plant Board';
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(40, 40, 40);
  doc.text(titleText, margin, margin + 7);

  let rowStartY = margin + titleH;

  for (let i = 0; i < flat.length; i++) {
    const rowIdx = Math.floor(i / cols);
    const colIndex = i % cols;

    if (colIndex === 0 && i > 0) {
      rowStartY += (rowLabels[rowIdx - 1] ? catLabelH : 0) + cellH + 4;
    }

    const rowHasLabel = rowLabels[rowIdx];
    const x = margin + colIndex * (imgW + colGap);

    if (flat[i].categoryLabel !== '') {
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(70, 70, 70);
      doc.text(flat[i].categoryLabel, x, rowStartY + catLabelH - 1.5);
    }

    const textTop = rowStartY + (rowHasLabel ? catLabelH : 0);
    const plant = flat[i].plant;
    const commonName = language === 'de'
      ? (plant.common_name_de || plant.common_name_en || '')
      : (plant.common_name_en || plant.common_name_de || '');
    const botanicName = plant.botanical_name || '';

    // Common name — normal weight, same size as botanic
    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(50, 50, 50);
    const commonLine = doc.splitTextToSize(commonName, imgW)[0] as string || '';
    doc.text(commonLine, x, textTop + 3.2);

    // Botanic name — normal weight (not italic), same size
    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(90, 90, 90);
    const botanicLine = doc.splitTextToSize(botanicName, imgW)[0] as string || '';
    doc.text(botanicLine, x, textTop + 3.2 + 3.2);

    const imageTop = textTop + nameH;

    let plantImages = await loadPlantImages(plant.id);
    if (plantImages.length === 0 && plant.image_url) plantImages = [plant.image_url];

    let imgY = imageTop;
    for (let imgIdx = 0; imgIdx < 2; imgIdx++) {
      if (plantImages[imgIdx]) {
        try {
          const raw = await loadImageAsDataURL(plantImages[imgIdx]);
          const cropped = await cropImageDataURL(raw, Math.round(imgW * 25), Math.round(imgH * 25));
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
