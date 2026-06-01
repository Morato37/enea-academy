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

  // Layout constants (mm)
  const margin = 12;
  const colGap = 2.5;
  const imgGap = 2;
  const textH = 11;
  const catLabelH = 7;
  const titleH = 16;

  // Page width fixed at A3 landscape width (420mm)
  // Columns: choose the number that gives ~55-65mm wide images (clearly visible)
  // This means we use the number of columns that best fills the width with good image sizes.
  const pageW = 420;
  const availW = pageW - margin * 2;

  // Target image width ~60mm → cols = floor(availW / (targetImgW + colGap))
  const targetImgW = 60;
  const cols = Math.max(4, Math.round(availW / (targetImgW + colGap)));
  const imgW = (availW - (cols - 1) * colGap) / cols;
  const imgH = imgW * 0.75; // landscape crop ratio
  const cellH = textH + imgH * 2 + imgGap;

  // Per-row label flags
  const rowLabels: boolean[] = [];
  for (let i = 0; i < flat.length; i += cols) {
    rowLabels.push(flat.slice(i, i + cols).some(it => it.categoryLabel !== ''));
  }

  // Compute total content height so page grows to fit
  let totalContentH = 0;
  for (let ri = 0; ri < rowLabels.length; ri++) {
    totalContentH += (rowLabels[ri] ? catLabelH : 0) + cellH + 4;
  }

  const pageH = margin * 2 + titleH + totalContentH + 4;

  // jsPDF: for custom sizes always pass [width, height] with 'p' (portrait) orientation
  // so the format array maps directly to actual dimensions without axis swap.
  const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: [pageW, pageH] });

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

    // Category label
    if (flat[i].categoryLabel !== '') {
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(70, 70, 70);
      doc.text(flat[i].categoryLabel, x, rowStartY + catLabelH - 1.5);
    }

    // Plant names
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

    // Draw 2 stacked images
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
