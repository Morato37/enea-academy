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
    img.onerror = () => { URL.revokeObjectURL(objectUrl); reject(new Error('Image load failed')); };
    img.src = objectUrl;
  });
};

const cropToRatioDataURL = async (dataUrl: string, targetW: number, targetH: number): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const targetRatio = targetW / targetH;
      const imgRatio = img.width / img.height;
      let sx = 0, sy = 0, sW = img.width, sH = img.height;
      if (imgRatio > targetRatio) { sW = img.height * targetRatio; sx = (img.width - sW) / 2; }
      else { sH = img.width / targetRatio; sy = (img.height - sH) / 2; }
      const canvas = document.createElement('canvas');
      canvas.width = targetW;
      canvas.height = targetH;
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

const CATEGORIES_DE = { trees: 'Bäume', shrubs: 'Sträucher', grasses: 'Gräser', perennials: 'Stauden', other: 'Sonstige' };
const CATEGORIES_EN = { trees: 'Trees', shrubs: 'Shrubs', grasses: 'Grasses', perennials: 'Perennials', other: 'Other' };

interface PlantItem {
  selection: UserSelection;
  categoryLabel: string;
}

const buildFlatList = (selections: UserSelection[], language: 'de' | 'en'): PlantItem[] => {
  const labels = language === 'de' ? CATEGORIES_DE : CATEGORIES_EN;
  const groups: { [key: string]: UserSelection[] } = {};

  selections.forEach(sel => {
    if (!sel.plant) return;
    const p = sel.plant;
    let cat = labels.other;
    if (p.category_tree) cat = labels.trees;
    else if (p.category_shrub) cat = labels.shrubs;
    else if (p.category_grass) cat = labels.grasses;
    else if (p.category_perennial) cat = labels.perennials;
    if (!groups[cat]) groups[cat] = [];
    groups[cat].push(sel);
  });

  const order = [labels.trees, labels.shrubs, labels.grasses, labels.perennials, labels.other];

  const flat: PlantItem[] = [];
  for (const cat of order) {
    if (!groups[cat] || groups[cat].length === 0) continue;
    groups[cat].forEach((sel, idx) => {
      flat.push({ selection: sel, categoryLabel: idx === 0 ? cat : '' });
    });
  }
  return flat;
};

export const generatePlantSelectionPDF = async (
  selections: UserSelection[],
  projectName?: string,
  language: 'de' | 'en' = 'de'
): Promise<void> => {
  const doc = new jsPDF('landscape', 'mm', 'a3');
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  const margin = 12;
  const bottomMargin = 14;
  const colGap = 3;
  const nameH = 9;
  const catLabelH = 6;

  // Title
  const titleLabel = 'Plant board';
  const projectLabel = projectName ? `${projectName} — ` : '';
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(40, 40, 40);
  doc.text(`${projectLabel}${titleLabel}`, margin, margin + 6);

  let currentY = margin + 14;

  // Determine cols dynamically so everything fits on one page
  const availableHeight = pageHeight - currentY - bottomMargin;
  const availW = pageWidth - 2 * margin;

  const flatList = buildFlatList(selections, language);

  // For a given number of columns, calculate total height needed
  const calcHeight = (cols: number) => {
    const cellW = (availW - (cols - 1) * colGap) / cols;
    const cellH = cellW * 1.35;
    let h = 0;
    let col = 0;
    let rowH = catLabelH + cellH + nameH + 2;
    for (let i = 0; i < flatList.length; i++) {
      if (col === 0) h += rowH;
      col++;
      if (col >= cols) col = 0;
    }
    return h;
  };

  let cols = 6;
  for (let c = 6; c <= 20; c++) {
    if (calcHeight(c) <= availableHeight) { cols = c; break; }
    cols = c;
  }

  const cellW = (availW - (cols - 1) * colGap) / cols;
  const cellH = cellW * 1.35;

  let colIndex = 0;
  let rowY = currentY;

  for (let i = 0; i < flatList.length; i++) {
    const item = flatList[i];
    const plant = item.selection.plant;
    if (!plant) continue;

    const isCategoryStart = item.categoryLabel !== '';
    const totalCellH = catLabelH + cellH + nameH + 2;

    if (colIndex === 0 && rowY + totalCellH > pageHeight - bottomMargin) {
      // Overflow: just continue (one-page constraint — content may clip on very large selections)
    }

    const x = margin + colIndex * (cellW + colGap);

    if (isCategoryStart) {
      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(80, 80, 80);
      doc.text(item.categoryLabel, x, rowY + catLabelH - 1.5);
    }

    const imageY = rowY + catLabelH;

    doc.setFillColor(228, 228, 228);
    doc.rect(x, imageY, cellW, cellH, 'F');

    try {
      let imageUrls = await loadPlantImages(plant.id);
      if (imageUrls.length === 0 && plant.image_url) imageUrls = [plant.image_url];
      if (imageUrls[0]) {
        const raw = await loadImageAsDataURL(imageUrls[0]);
        const cropped = await cropToRatioDataURL(raw, 400, Math.round(400 * 1.35));
        doc.addImage(cropped, 'JPEG', x, imageY, cellW, cellH);
      }
    } catch {
      // keep placeholder
    }

    const nameY = imageY + cellH + 3;
    const commonName = language === 'de'
      ? (plant.common_name_de || plant.common_name_en || '')
      : (plant.common_name_en || plant.common_name_de || '');
    const botanicName = plant.botanical_name || '';

    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(60, 60, 60);
    doc.text(doc.splitTextToSize(commonName, cellW)[0] || '', x, nameY);

    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(100, 100, 100);
    doc.text(doc.splitTextToSize(botanicName, cellW)[0] || '', x, nameY + 3.5);

    colIndex++;
    if (colIndex >= cols) {
      colIndex = 0;
      rowY += catLabelH + cellH + nameH + 2;
    }
  }

  const label = language === 'de' ? 'PlantBoard' : 'PlantBoard';
  doc.save(`${label}_${new Date().toISOString().split('T')[0]}.pdf`);
};
