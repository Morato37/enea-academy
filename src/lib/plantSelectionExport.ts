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
  if (isSupabaseStorage) {
    headers['apikey'] = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
  }

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

// Crop image to target aspect ratio (cover fit), targetW:targetH
const cropToRatioDataURL = async (dataUrl: string, targetW = 400, targetH = 500): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const targetRatio = targetW / targetH;
      const imgRatio = img.width / img.height;
      let sx = 0, sy = 0, sW = img.width, sH = img.height;
      if (imgRatio > targetRatio) {
        // wider than target — crop sides
        sW = img.height * targetRatio;
        sx = (img.width - sW) / 2;
      } else {
        // taller than target — crop top/bottom
        sH = img.width / targetRatio;
        sy = (img.height - sH) / 2;
      }
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

const CATEGORIES_DE = {
  trees: 'Bäume',
  shrubs: 'Sträucher',
  grasses: 'Gräser',
  bamboo: 'Bambus',
  climbing: 'Kletterpflanzen',
  bulbs: 'Frühblüher',
  perennials: 'Stauden',
  other: 'Sonstige',
};

const CATEGORIES_EN = {
  trees: 'Trees',
  shrubs: 'Shrubs',
  grasses: 'Grasses',
  bamboo: 'Bamboo',
  climbing: 'Climbing Plants',
  bulbs: 'Spring Bulbs',
  perennials: 'Perennials',
  other: 'Other',
};

const groupByCategory = (selections: UserSelection[], language: 'de' | 'en') => {
  const labels = language === 'de' ? CATEGORIES_DE : CATEGORIES_EN;
  const groups: { [key: string]: UserSelection[] } = {};

  selections.forEach(sel => {
    if (!sel.plant) return;
    const p = sel.plant;
    let cat = labels.other;
    if (p.category_tree) cat = labels.trees;
    else if (p.category_shrub) cat = labels.shrubs;
    else if (p.category_grass) cat = labels.grasses;
    else if (p.usage_climbing) cat = labels.climbing;
    else if (p.category_bulb) cat = labels.bulbs;
    else if (p.category_perennial) cat = labels.perennials;

    if (!groups[cat]) groups[cat] = [];
    groups[cat].push(sel);
  });

  const order = language === 'de'
    ? [labels.trees, labels.shrubs, labels.grasses, labels.bamboo, labels.climbing, labels.bulbs, labels.perennials, labels.other]
    : [labels.trees, labels.shrubs, labels.grasses, labels.bamboo, labels.climbing, labels.bulbs, labels.perennials, labels.other];

  return order
    .filter(cat => groups[cat] && groups[cat].length > 0)
    .map(cat => ({ category: cat, items: groups[cat] }));
};

export const generatePlantSelectionPDF = async (
  selections: UserSelection[],
  projectName?: string,
  language: 'de' | 'en' = 'de'
): Promise<void> => {
  const doc = new jsPDF('landscape', 'mm', 'a3');
  const pageWidth = doc.internal.pageSize.getWidth();   // 420mm
  const pageHeight = doc.internal.pageSize.getHeight(); // 297mm

  const margin = 12;
  const bottomMargin = 18;
  const headerH = 22;
  const legendH = 16;
  const cols = 6;
  const colGap = 3;
  const availW = pageWidth - 2 * margin;
  const cellW = (availW - (cols - 1) * colGap) / cols;
  const cellH = cellW * 1.35; // portrait rectangle like in the reference
  const labelH = 10; // space below image for names
  const cellTotalH = cellH + labelH;
  const categoryLabelH = 7;

  let currentY = margin;
  let pageNumber = 1;

  // ---- helpers ----

  const drawHeader = async () => {
    // Top-right: enea logo
    try {
      const logoDataUrl = await loadImageAsDataURL('/Enea_landscape_design_grey.pdf.jpg');
      const img = new Image();
      img.src = logoDataUrl;
      await new Promise(r => { img.onload = r; img.onerror = r; });
      const logoW = 70;
      const logoH = (img.height / img.width) * logoW;
      doc.addImage(logoDataUrl, 'JPEG', pageWidth - margin - logoW, margin, logoW, logoH);
    } catch {
      doc.setFontSize(14);
      doc.setTextColor(80, 80, 80);
      doc.setFont('helvetica', 'bold');
      doc.text('enea landart', pageWidth - margin, margin + 6, { align: 'right' });
    }

    // Subtitle under logo
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(120, 120, 120);
    const conceptLabel = language === 'de' ? 'Konzept | Bereich' : 'Concept | Area';
    const titleLabel = language === 'de' ? 'Pflanzenauswahl' : 'Plant Selection';
    const subtitleLine1 = projectName ? `${projectName} | ${conceptLabel}` : conceptLabel;
    doc.text(subtitleLine1, pageWidth - margin, margin + (70 * 0.28) + 5, { align: 'right' });
    doc.text(titleLabel, pageWidth - margin, margin + (70 * 0.28) + 10, { align: 'right' });

    currentY = margin + headerH;
  };

  // Draw a small icon using jsPDF primitives (no Unicode)
  const drawLegendIcon = (type: string, cx: number, cy: number) => {
    const r = 1.5;
    doc.setDrawColor(80, 80, 80);
    doc.setFillColor(80, 80, 80);
    doc.setLineWidth(0.4);
    switch (type) {
      case 'circle-empty':
        doc.circle(cx, cy, r, 'S');
        break;
      case 'circle-half': {
        // full circle outline + filled left half
        doc.circle(cx, cy, r, 'S');
        doc.setFillColor(80, 80, 80);
        // draw filled semicircle via rect clip approximation
        doc.rect(cx - r, cy - r, r, r * 2, 'F');
        break;
      }
      case 'circle-full':
        doc.circle(cx, cy, r, 'F');
        break;
      case 'star': {
        // small 4-point cross/star
        doc.setLineWidth(0.5);
        doc.line(cx - r, cy, cx + r, cy);
        doc.line(cx, cy - r, cx, cy + r);
        doc.line(cx - r * 0.7, cy - r * 0.7, cx + r * 0.7, cy + r * 0.7);
        doc.line(cx - r * 0.7, cy + r * 0.7, cx + r * 0.7, cy - r * 0.7);
        break;
      }
      case 'diamond': {
        // small diamond shape
        doc.setFillColor(80, 80, 80);
        const pts = [
          { x: cx, y: cy - r * 1.2 },
          { x: cx + r * 0.8, y: cy },
          { x: cx, y: cy + r * 1.2 },
          { x: cx - r * 0.8, y: cy },
        ];
        doc.lines(
          [[pts[1].x - pts[0].x, pts[1].y - pts[0].y],
           [pts[2].x - pts[1].x, pts[2].y - pts[1].y],
           [pts[3].x - pts[2].x, pts[3].y - pts[2].y],
           [pts[0].x - pts[3].x, pts[0].y - pts[3].y]],
          pts[0].x, pts[0].y, [1, 1], 'F', true
        );
        break;
      }
      case 'snowflake': {
        // asterisk with 6 lines
        doc.setLineWidth(0.4);
        for (let a = 0; a < 3; a++) {
          const angle = (a * Math.PI) / 3;
          doc.line(
            cx + Math.cos(angle) * r * 1.2, cy + Math.sin(angle) * r * 1.2,
            cx - Math.cos(angle) * r * 1.2, cy - Math.sin(angle) * r * 1.2
          );
        }
        break;
      }
      case 'leaf': {
        // simple small filled circle as leaf proxy
        doc.setFillColor(80, 80, 80);
        doc.circle(cx, cy, r * 0.9, 'F');
        break;
      }
      case 'herb': {
        // small Y shape
        doc.setLineWidth(0.4);
        doc.line(cx, cy + r, cx, cy);
        doc.line(cx, cy, cx - r * 0.8, cy - r * 0.8);
        doc.line(cx, cy, cx + r * 0.8, cy - r * 0.8);
        break;
      }
      default:
        doc.circle(cx, cy, r, 'S');
    }
    doc.setLineWidth(0.1);
    doc.setFillColor(0, 0, 0);
    doc.setDrawColor(0, 0, 0);
  };

  const drawLegend = () => {
    const items_de = [
      { icon: 'star',         label: 'Schmetterlingsweide' },
      { icon: 'star',         label: 'einheimisch' },
      { icon: 'leaf',         label: 'Bienenweide' },
      { icon: 'star',         label: 'Klimaprofiteur' },
      { icon: 'diamond',      label: 'Vogelnährgehölz' },
      { icon: 'snowflake',    label: 'immergrün' },
      { icon: 'leaf',         label: 'saisonale Aspekte' },
      { icon: 'circle-empty', label: 'sonnig' },
      { icon: 'leaf',         label: 'essbar' },
      { icon: 'circle-half',  label: 'halbschattig' },
      { icon: 'herb',         label: 'Heilpflanze' },
      { icon: 'circle-full',  label: 'schattig' },
    ];
    const items_en = [
      { icon: 'star',         label: 'butterflies' },
      { icon: 'star',         label: 'native' },
      { icon: 'leaf',         label: 'bees' },
      { icon: 'star',         label: 'climate beneficiary' },
      { icon: 'diamond',      label: 'bird food plant' },
      { icon: 'snowflake',    label: 'evergreen' },
      { icon: 'leaf',         label: 'seasonal aspects' },
      { icon: 'circle-empty', label: 'sunny' },
      { icon: 'leaf',         label: 'edible' },
      { icon: 'circle-half',  label: 'half shade' },
      { icon: 'herb',         label: 'medicinal herb' },
      { icon: 'circle-full',  label: 'shady' },
    ];
    const items = language === 'de' ? items_de : items_en;

    // 3 columns of 4 items
    const itemsPerCol = 4;
    const colW = 85;
    const itemH = 4.2;
    const iconR = 1.5;

    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);

    for (let i = 0; i < items.length; i++) {
      const col = Math.floor(i / itemsPerCol);
      const row = i % itemsPerCol;
      const x = margin + col * colW;
      const y = currentY + row * itemH + 3;
      drawLegendIcon(items[i].icon, x + iconR, y - iconR * 0.5);
      doc.text(items[i].label, x + iconR * 2 + 2, y);
    }

    currentY += legendH;
  };

  const drawFooter = async (page: number) => {
    // Page number bottom left
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(120, 120, 120);
    doc.text(String(page), margin, pageHeight - 6);

    // enea copyright logo bottom right
    try {
      const logoDataUrl = await loadImageAsDataURL('/enea-logo-copyright.png');
      const img = new Image();
      img.src = logoDataUrl;
      await new Promise(r => { img.onload = r; img.onerror = r; });
      const logoH = 10;
      const logoW = (img.width / img.height) * logoH;
      doc.addImage(logoDataUrl, 'PNG', pageWidth - margin - logoW, pageHeight - margin - logoH + 4, logoW, logoH);
    } catch {
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.text(`© ${new Date().getFullYear()} enea`, pageWidth - margin, pageHeight - 6, { align: 'right' });
    }
  };

  const newPage = async () => {
    await drawFooter(pageNumber);
    doc.addPage();
    pageNumber++;
    currentY = margin;
    await drawHeader();
    // No legend on subsequent pages
  };

  // ---- render ----

  await drawHeader();
  drawLegend();

  const groups = groupByCategory(selections, language);

  for (const group of groups) {
    // Category label
    if (currentY + categoryLabelH + cellTotalH > pageHeight - bottomMargin) {
      await newPage();
    }

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text(group.category, margin, currentY + 5);
    currentY += categoryLabelH;

    // Plants in rows of 6
    let colIndex = 0;

    for (const selection of group.items) {
      const plant = selection.plant;
      if (!plant) continue;

      // New row overflow check
      if (colIndex === 0 && currentY + cellTotalH > pageHeight - bottomMargin) {
        await newPage();
      }

      const x = margin + colIndex * (cellW + colGap);
      const imageY = currentY;

      // Draw image placeholder (light grey)
      doc.setFillColor(230, 230, 230);
      doc.rect(x, imageY, cellW, cellH, 'F');

      // Load & draw plant image
      try {
        let imageUrls = await loadPlantImages(plant.id);
        if (imageUrls.length === 0 && plant.image_url) imageUrls = [plant.image_url];

        if (imageUrls[0]) {
          const raw = await loadImageAsDataURL(imageUrls[0]);
          const cropped = await cropToRatioDataURL(raw, 400, Math.round(400 * 1.35));
          doc.addImage(cropped, 'JPEG', x, imageY, cellW, cellH);
        }
      } catch {
        // Keep grey placeholder
      }

      // Names below image
      const nameY = imageY + cellH + 3.5;
      const commonName = language === 'de'
        ? (plant.common_name_de || plant.common_name_en || '')
        : (plant.common_name_en || plant.common_name_de || '');
      const botanicName = plant.botanical_name || '';

      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(60, 60, 60);
      const commonLines = doc.splitTextToSize(commonName, cellW);
      doc.text(commonLines[0] || '', x, nameY);

      doc.setFontSize(6.5);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(100, 100, 100);
      const botanicLines = doc.splitTextToSize(botanicName, cellW);
      doc.text(botanicLines[0] || '', x, nameY + 3.5);

      colIndex++;

      if (colIndex >= cols) {
        colIndex = 0;
        currentY += cellTotalH + 2;
      }
    }

    // Finish partial row
    if (colIndex > 0) {
      currentY += cellTotalH + 2;
      colIndex = 0;
    }

    // Gap between categories
    currentY += 2;
  }

  await drawFooter(pageNumber);

  const label = language === 'de' ? 'Pflanzenauswahl' : 'PlantSelection';
  doc.save(`${label}_A3_${new Date().toISOString().split('T')[0]}.pdf`);
};
