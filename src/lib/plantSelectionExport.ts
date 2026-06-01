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

  // Fixed A3 landscape — multiple pages, one image per plant (portrait ratio)
  const PAGE_W = 420;  // A3 landscape width mm
  const PAGE_H = 297;  // A3 landscape height mm
  const margin = 15;
  const colGap = 5;
  const rowGap = 6;
  const cols = 6;
  const catLabelH = 8;
  const nameH = 10;   // space below image for text
  const titleH = 18;

  const cellW = (PAGE_W - margin * 2 - colGap * (cols - 1)) / cols; // ~58mm
  const cellH = cellW * 1.35; // portrait ratio ~78mm

  const doc = new jsPDF({ orientation: 'l', unit: 'mm', format: 'a3' });

  const titleText = projectName ? `${projectName} — Plant Selection` : 'Plant Selection';
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(40, 40, 40);
  doc.text(titleText, margin, margin + 8);

  let x = margin;
  let y = margin + titleH;
  let col = 0;

  const newPage = () => {
    doc.addPage('a3', 'l');
    x = margin;
    y = margin;
    col = 0;
  };

  const advanceCell = () => {
    col++;
    if (col >= cols) {
      col = 0;
      x = margin;
      const rowH = cellH + nameH + rowGap;
      y += rowH;
      if (y + cellH + nameH > PAGE_H - margin) {
        newPage();
      }
    } else {
      x += cellW + colGap;
    }
  };

  for (let i = 0; i < flat.length; i++) {
    const item = flat[i];

    // Category label — starts a new row if not at column 0
    if (item.categoryLabel !== '') {
      if (col > 0) {
        // fill remaining cells in this row with nothing, move to next row
        col = 0;
        x = margin;
        y += cellH + nameH + rowGap;
        if (y + catLabelH + cellH + nameH > PAGE_H - margin) newPage();
      }
      // Check space for label + at least one cell
      if (y + catLabelH + cellH + nameH > PAGE_H - margin) newPage();

      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(80, 80, 80);
      doc.text(item.categoryLabel.toUpperCase(), margin, y + 5);
      y += catLabelH;
    }

    // Check vertical space
    if (y + cellH + nameH > PAGE_H - margin) newPage();

    // Placeholder
    doc.setFillColor(225, 225, 225);
    doc.rect(x, y, cellW, cellH, 'F');

    // Image
    try {
      let imageUrl = await loadPlantImage(item.plant.id);
      if (!imageUrl && item.plant.image_url) imageUrl = item.plant.image_url;
      if (imageUrl) {
        const raw = await loadImageAsDataURL(imageUrl);
        const cropped = await cropToRatioDataURL(raw, 400, Math.round(400 * 1.35));
        doc.addImage(cropped, 'JPEG', x, y, cellW, cellH);
      }
    } catch {
      // keep placeholder
    }

    // Plant names below image
    const nameY = y + cellH + 3;
    const commonName = language === 'de'
      ? (item.plant.common_name_de || item.plant.common_name_en || '')
      : (item.plant.common_name_en || item.plant.common_name_de || '');

    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(50, 50, 50);
    doc.text(doc.splitTextToSize(commonName, cellW)[0] || '', x, nameY);

    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(110, 110, 110);
    doc.text(doc.splitTextToSize(item.plant.botanical_name || '', cellW)[0] || '', x, nameY + 3.5);

    advanceCell();
  }

  doc.save(`PlantSelection_${new Date().toISOString().split('T')[0]}.pdf`);
};
