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
      canvas.width = img.width;
      canvas.height = img.height;
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

const cropImageDataURL = (dataUrl: string, targetW: number, targetH: number): Promise<string> => {
  return new Promise((resolve, reject) => {
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
};

// Assign every plant to one of the 4 categories (no "Other")
const assignCategory = (plant: NonNullable<UserSelection['plant']>, labels: { trees: string; shrubs: string; grasses: string; perennials: string }) => {
  if (plant.category_tree) return labels.trees;
  if (plant.category_shrub) return labels.shrubs;
  if (plant.category_grass) return labels.grasses;
  return labels.perennials; // everything else → perennials
};

interface FlatItem {
  plant: NonNullable<UserSelection['plant']>;
  categoryLabel: string; // non-empty only on first plant of each category
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

  const order = [labels.trees, labels.shrubs, labels.grasses, labels.perennials];
  const flat: FlatItem[] = [];
  for (const cat of order) {
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
  const colGap = 2;
  const imgH = 22;   // height of each image slot
  const imgGap = 2;  // gap between the two stacked images
  const textH = 10;  // text area above images
  const cellH = textH + imgH * 2 + imgGap; // total cell height
  const catLabelH = 6; // space for category label
  const titleH = 14;   // title at top

  // Choose plantsPerRow (cols): try to keep page width ≤ A3 landscape (420mm),
  // but always use exactly the number of columns needed to keep everything on ONE page.
  // Page width = margin*2 + cols*imgW + (cols-1)*colGap
  // We target imgW ≈ 30mm as a comfortable size, then adjust.

  // First pass: pick cols so total height fits on a reasonable page height (≤ A3 landscape 297mm)
  const maxPageH = 297;
  const maxContentH = maxPageH - margin * 2 - titleH;

  // Calculate rows needed for a given number of cols
  // Categories don't break rows — items flow seamlessly
  const calcRows = (cols: number) => Math.ceil(flat.length / cols);

  // Each row has catLabelH reserved at top (worst case) — simpler: just use catLabelH once per row
  // More accurate: for each row, check if any item in that row starts a category
  const calcHeightForCols = (cols: number) => {
    let h = 0;
    for (let i = 0; i < flat.length; i += cols) {
      const rowItems = flat.slice(i, i + cols);
      const hasLabel = rowItems.some(it => it.categoryLabel !== '');
      h += (hasLabel ? catLabelH : 0) + cellH + 4;
    }
    return h;
  };

  let cols = 6;
  for (let c = 6; c <= 20; c++) {
    if (calcHeightForCols(c) <= maxContentH) { cols = c; break; }
    cols = c;
  }

  const totalRows = calcRows(cols);
  const contentH = calcHeightForCols(cols);
  const pageH = Math.min(maxPageH, Math.max(150, margin * 2 + titleH + contentH + 4));
  const pageW = 420; // A3 landscape width mm

  const imgW = (pageW - margin * 2 - (cols - 1) * colGap) / cols;

  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: [pageW, pageH] });

  // Title
  const titleText = projectName ? `${projectName} — Plant board` : 'Plant board';
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(40, 40, 40);
  doc.text(titleText, margin, margin + 6);

  let currentY = margin + titleH;
  let colIndex = 0;
  let rowStartY = currentY;
  let rowHasLabel = false;

  // Pre-calculate per-row label presence
  const rowLabels: boolean[] = [];
  for (let i = 0; i < flat.length; i += cols) {
    rowLabels.push(flat.slice(i, i + cols).some(it => it.categoryLabel !== ''));
  }

  // Draw row by row
  for (let i = 0; i < flat.length; i++) {
    const item = flat[i];
    const rowIdx = Math.floor(i / cols);

    if (i % cols === 0) {
      if (i > 0) rowStartY += (rowLabels[rowIdx - 1] ? catLabelH : 0) + cellH + 4;
      rowHasLabel = rowLabels[rowIdx];
    }

    colIndex = i % cols;
    const x = margin + colIndex * (imgW + colGap);
    const imageTop = rowStartY + (rowHasLabel ? catLabelH : 0);

    // Category label
    if (item.categoryLabel !== '') {
      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(80, 80, 80);
      doc.text(item.categoryLabel, x, rowStartY + catLabelH - 1.5);
    }

    // Plant names
    const commonName = language === 'de'
      ? (item.plant.common_name_de || item.plant.common_name_en || '')
      : (item.plant.common_name_en || item.plant.common_name_de || '');
    const botanicName = item.plant.botanical_name || '';

    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(60, 60, 60);
    const commonLines = doc.splitTextToSize(commonName, imgW).slice(0, 2) as string[];
    doc.text(commonLines, x, imageTop + 3);

    doc.setFontSize(5.5);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(110, 110, 110);
    const botanicLines = doc.splitTextToSize(botanicName, imgW).slice(0, 2) as string[];
    doc.text(botanicLines, x, imageTop + 3 + commonLines.length * 2.4 + 1);

    // Images (2 stacked)
    let imgY = imageTop + textH;
    let plantImages = await loadPlantImages(item.plant.id);
    if (plantImages.length === 0 && item.plant.image_url) plantImages = [item.plant.image_url];

    for (let imgIdx = 0; imgIdx < 2; imgIdx++) {
      if (plantImages[imgIdx]) {
        try {
          const raw = await loadImageAsDataURL(plantImages[imgIdx]);
          const cropped = await cropImageDataURL(raw, Math.round(imgW * 30), Math.round(imgH * 30));
          doc.addImage(cropped, 'JPEG', x, imgY, imgW, imgH);
        } catch {
          doc.setFillColor(230, 230, 230);
          doc.rect(x, imgY, imgW, imgH, 'F');
        }
      } else {
        doc.setFillColor(230, 230, 230);
        doc.rect(x, imgY, imgW, imgH, 'F');
      }
      imgY += imgH + imgGap;
    }
  }

  doc.save(`PlantBoard_${new Date().toISOString().split('T')[0]}.pdf`);
};
