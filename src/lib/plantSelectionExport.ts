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
      .limit(1);
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

export const generatePlantSelectionPDF = async (
  selections: UserSelection[],
  projectName?: string,
  language: 'de' | 'en' = 'de'
): Promise<void> => {
  const flat = buildFlatList(selections, language);
  if (flat.length === 0) return;

  // Fixed layout constants (mm)
  const margin = 12;
  const colGap = 3;
  const catLabelH = 7;
  const nameH = 9;
  const titleH = 16;

  // Fixed 6 columns at A3 landscape width → ~63mm per column
  const cols = 6;
  const pageW = 420;
  const cellW = (pageW - margin * 2 - (cols - 1) * colGap) / cols; // ~63mm
  const cellH = cellW * 1.35; // portrait ratio, ~85mm — clearly visible

  // Pre-compute per-row label presence for correct height calculation
  const rowLabels: boolean[] = [];
  for (let i = 0; i < flat.length; i += cols) {
    rowLabels.push(flat.slice(i, i + cols).some(it => it.categoryLabel !== ''));
  }

  // Total content height — page grows to fit all rows
  let totalContentH = 0;
  for (let ri = 0; ri < rowLabels.length; ri++) {
    totalContentH += (rowLabels[ri] ? catLabelH : 0) + cellH + nameH + 2;
  }

  const pageH = margin * 2 + titleH + totalContentH + 4;
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: [pageW, pageH] });

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
      rowStartY += (rowLabels[rowIdx - 1] ? catLabelH : 0) + cellH + nameH + 2;
    }

    const rowHasLabel = rowLabels[rowIdx];
    const x = margin + colIndex * (cellW + colGap);
    const imageTop = rowStartY + (rowHasLabel ? catLabelH : 0);

    // Category label
    if (flat[i].categoryLabel !== '') {
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(70, 70, 70);
      doc.text(flat[i].categoryLabel, x, rowStartY + catLabelH - 1.5);
    }

    // Image placeholder
    doc.setFillColor(228, 228, 228);
    doc.rect(x, imageTop, cellW, cellH, 'F');

    // Load and draw image
    try {
      let imageUrls = await loadPlantImages(flat[i].plant.id);
      if (imageUrls.length === 0 && flat[i].plant.image_url) imageUrls = [flat[i].plant.image_url];
      if (imageUrls[0]) {
        const raw = await loadImageAsDataURL(imageUrls[0]);
        const cropped = await cropToRatioDataURL(raw, 400, Math.round(400 * 1.35));
        doc.addImage(cropped, 'JPEG', x, imageTop, cellW, cellH);
      }
    } catch {
      // keep placeholder
    }

    // Plant names below image
    const nameY = imageTop + cellH + 3;
    const commonName = language === 'de'
      ? (flat[i].plant.common_name_de || flat[i].plant.common_name_en || '')
      : (flat[i].plant.common_name_en || flat[i].plant.common_name_de || '');
    const botanicName = flat[i].plant.botanical_name || '';

    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(60, 60, 60);
    doc.text(doc.splitTextToSize(commonName, cellW)[0] || '', x, nameY);

    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(100, 100, 100);
    doc.text(doc.splitTextToSize(botanicName, cellW)[0] || '', x, nameY + 3.5);
  }

  doc.save(`PlantBoard_${new Date().toISOString().split('T')[0]}.pdf`);
};
