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

export const generateMoodboardPDF = async (
  selections: UserSelection[],
  projectName?: string,
  language: 'de' | 'en' = 'de'
): Promise<void> => {
  const flat = buildFlatList(selections, language);
  if (flat.length === 0) return;

  // Fixed cell size — images are always this large
  const margin = 12;
  const colGap = 2.5;
  const imgGap = 2;
  const textH = 11;
  const catLabelH = 7;
  const titleH = 16;

  const imgW = 60;           // mm per image
  const imgH = imgW * 0.75;  // landscape crop
  const cellH = textH + imgH * 2 + imgGap;

  // Strategy: use 6 columns per row. Page width = margin*2 + 6*(imgW+colGap)-colGap.
  // Page grows vertically to fit all rows. Page is always landscape (width > height).
  // If with 6 cols the page would be portrait, add more cols until landscape.
  const computeLayout = (cols: number) => {
    const w = margin * 2 + cols * imgW + (cols - 1) * colGap;
    const rowLabels: boolean[] = [];
    for (let i = 0; i < flat.length; i += cols) {
      rowLabels.push(flat.slice(i, i + cols).some(it => it.categoryLabel !== ''));
    }
    let totalH = 0;
    for (let ri = 0; ri < rowLabels.length; ri++) {
      totalH += (rowLabels[ri] ? catLabelH : 0) + cellH + 4;
    }
    const h = margin * 2 + titleH + totalH + 4;
    return { w, h, rowLabels };
  };

  // Start at 6 cols, increase until width >= height (landscape)
  let cols = 6;
  let layout = computeLayout(cols);
  while (layout.w < layout.h && cols < flat.length) {
    cols++;
    layout = computeLayout(cols);
  }

  // pageW = width, pageH = height. For jsPDF landscape, pass [min, max] as format.
  // jsPDF with orientation:'l' sets actual page width = max(format[0], format[1]).
  const pageW = layout.w;
  const pageH = layout.h;
  const { rowLabels } = layout;

  const doc = new jsPDF({
    orientation: 'l',
    unit: 'mm',
    format: [Math.min(pageW, pageH), Math.max(pageW, pageH)],
  });

  // After creation, jsPDF sets getWidth() = longSide. Our pageW is already the long side.
  // All coordinates use pageW/pageH directly — no axis swap needed.

  // Title
  const titleText = projectName ? `${projectName} — Plant board` : 'Plant board';
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
    const imageTop = rowStartY + (rowHasLabel ? catLabelH : 0) + textH;

    if (flat[i].categoryLabel !== '') {
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(70, 70, 70);
      doc.text(flat[i].categoryLabel, x, rowStartY + catLabelH - 1.5);
    }

    const textTop = rowStartY + (rowHasLabel ? catLabelH : 0);
    const commonName = language === 'de'
      ? (flat[i].plant.common_name_de || flat[i].plant.common_name_en || '')
      : (flat[i].plant.common_name_en || flat[i].plant.common_name_de || '');
    const botanicName = flat[i].plant.botanical_name || '';

    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(50, 50, 50);
    const commonLines = doc.splitTextToSize(commonName, imgW).slice(0, 2) as string[];
    doc.text(commonLines, x, textTop + 3.5);

    doc.setFontSize(6);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(110, 110, 110);
    const botanicLines = doc.splitTextToSize(botanicName, imgW).slice(0, 2) as string[];
    doc.text(botanicLines, x, textTop + 3.5 + commonLines.length * 2.6 + 1);

    let plantImages = await loadPlantImages(flat[i].plant.id);
    if (plantImages.length === 0 && flat[i].plant.image_url) plantImages = [flat[i].plant.image_url];

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
