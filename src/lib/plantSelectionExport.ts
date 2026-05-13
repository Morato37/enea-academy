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
      if (imgRatio > targetRatio) {
        sW = img.height * targetRatio;
        sx = (img.width - sW) / 2;
      } else {
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
  trees: 'Bäume', shrubs: 'Sträucher', grasses: 'Gräser', bamboo: 'Bambus',
  climbing: 'Kletterpflanzen', bulbs: 'Frühblüher', perennials: 'Stauden', other: 'Sonstige',
};
const CATEGORIES_EN = {
  trees: 'Trees', shrubs: 'Shrubs', grasses: 'Grasses', bamboo: 'Bamboo',
  climbing: 'Climbing Plants', bulbs: 'Spring Bulbs', perennials: 'Perennials', other: 'Other',
};

interface PlantItem {
  selection: UserSelection;
  categoryLabel: string; // set only on first plant of each category
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
    else if (p.usage_climbing) cat = labels.climbing;
    else if (p.category_bulb) cat = labels.bulbs;
    else if (p.category_perennial) cat = labels.perennials;
    if (!groups[cat]) groups[cat] = [];
    groups[cat].push(sel);
  });

  const order = [
    labels.trees, labels.shrubs, labels.grasses, labels.bamboo,
    labels.climbing, labels.bulbs, labels.perennials, labels.other,
  ];

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
  const bottomMargin = 18;
  const cols = 6;
  const colGap = 3;
  const availW = pageWidth - 2 * margin;
  const cellW = (availW - (cols - 1) * colGap) / cols;
  const cellH = cellW * 1.35; // portrait rectangle
  const nameH = 9;            // height reserved below image for names
  const catLabelH = 6;        // height of category label above image

  let pageNumber = 1;
  let currentY = margin;

  // ---- header ----

  const drawHeader = async () => {
    // Load enea landscape design logo (top-right)
    let logoRendered = false;
    try {
      const logoDataUrl = await loadImageAsDataURL('/Enea_landscape_design_grey.pdf.jpg');
      const img = new Image();
      img.src = logoDataUrl;
      await new Promise(r => { img.onload = r; img.onerror = r; });
      const logoW = 55;
      const logoH = (img.height / img.width) * logoW;
      doc.addImage(logoDataUrl, 'JPEG', pageWidth - margin - logoW, margin, logoW, logoH);
      logoRendered = true;

      // Subtitle lines right-aligned beneath logo
      const subtitleY = margin + logoH + 1;
      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(120, 120, 120);
      const conceptLabel = language === 'de' ? 'Konzept | Bereich' : 'Concept | Area';
      const titleLabel = language === 'de' ? 'Pflanzenauswahl' : 'Plant Selection';
      const line1 = projectName ? `${projectName} | ${conceptLabel}` : conceptLabel;
      doc.text(line1, pageWidth - margin, subtitleY + 3.5, { align: 'right' });
      doc.text(titleLabel, pageWidth - margin, subtitleY + 7.5, { align: 'right' });

      currentY = margin + logoH + 13;
    } catch {
      // fallback text logo
    }

    if (!logoRendered) {
      // Text fallback resembling reference
      const logoX = pageWidth - margin;
      const logoY = margin + 4;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(18);
      doc.setTextColor(60, 60, 60);
      doc.text('enea', logoX - 28, logoY, { align: 'right' });
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text('landart', logoX, logoY, { align: 'right' });

      doc.setFontSize(7.5);
      const conceptLabel = language === 'de' ? 'Konzept | Bereich' : 'Concept | Area';
      const titleLabel = language === 'de' ? 'Pflanzenauswahl' : 'Plant Selection';
      const line1 = projectName ? `${projectName} | ${conceptLabel}` : conceptLabel;
      doc.text(line1, logoX, logoY + 5, { align: 'right' });
      doc.text(titleLabel, logoX, logoY + 9.5, { align: 'right' });

      currentY = margin + 22;
    }
  };

  // ---- legend ----

  const drawLegendIcon = (type: string, cx: number, cy: number) => {
    const r = 1.4;
    doc.setDrawColor(90, 90, 90);
    doc.setFillColor(90, 90, 90);
    doc.setLineWidth(0.4);
    switch (type) {
      case 'circle-empty':
        doc.circle(cx, cy, r, 'S');
        break;
      case 'circle-half':
        doc.circle(cx, cy, r, 'S');
        doc.rect(cx - r, cy - r, r, r * 2, 'F');
        break;
      case 'circle-full':
        doc.circle(cx, cy, r, 'F');
        break;
      case 'star':
        doc.setLineWidth(0.5);
        doc.line(cx - r, cy, cx + r, cy);
        doc.line(cx, cy - r, cx, cy + r);
        doc.line(cx - r * 0.7, cy - r * 0.7, cx + r * 0.7, cy + r * 0.7);
        doc.line(cx - r * 0.7, cy + r * 0.7, cx + r * 0.7, cy - r * 0.7);
        break;
      case 'diamond': {
        const pts = [
          [cx, cy - r * 1.2], [cx + r * 0.8, cy], [cx, cy + r * 1.2], [cx - r * 0.8, cy],
        ] as [number, number][];
        doc.lines(
          [[pts[1][0] - pts[0][0], pts[1][1] - pts[0][1]],
           [pts[2][0] - pts[1][0], pts[2][1] - pts[1][1]],
           [pts[3][0] - pts[2][0], pts[3][1] - pts[2][1]],
           [pts[0][0] - pts[3][0], pts[0][1] - pts[3][1]]],
          pts[0][0], pts[0][1], [1, 1], 'F', true
        );
        break;
      }
      case 'snowflake':
        doc.setLineWidth(0.4);
        for (let a = 0; a < 3; a++) {
          const angle = (a * Math.PI) / 3;
          doc.line(
            cx + Math.cos(angle) * r * 1.2, cy + Math.sin(angle) * r * 1.2,
            cx - Math.cos(angle) * r * 1.2, cy - Math.sin(angle) * r * 1.2
          );
        }
        break;
      case 'herb':
        doc.setLineWidth(0.4);
        doc.line(cx, cy + r, cx, cy);
        doc.line(cx, cy, cx - r * 0.8, cy - r * 0.8);
        doc.line(cx, cy, cx + r * 0.8, cy - r * 0.8);
        break;
      default:
        doc.circle(cx, cy, r, 'S');
    }
    doc.setLineWidth(0.1);
    doc.setFillColor(0, 0, 0);
    doc.setDrawColor(0, 0, 0);
  };

  const drawLegend = (startY: number): number => {
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

    const itemsPerCol = 4;
    const colW = 80;
    const itemH = 4.0;
    const iconOffset = 1.5;

    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);

    for (let i = 0; i < items.length; i++) {
      const col = Math.floor(i / itemsPerCol);
      const row = i % itemsPerCol;
      const x = margin + col * colW;
      const y = startY + row * itemH + 3;
      drawLegendIcon(items[i].icon, x + iconOffset, y - 1);
      doc.text(items[i].label, x + iconOffset * 2 + 2.5, y);
    }

    return startY + itemsPerCol * itemH + 2; // return Y after legend
  };

  // ---- footer ----

  const drawFooter = async (page: number) => {
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(120, 120, 120);
    doc.text(String(page), margin, pageHeight - 5);

    try {
      const logoDataUrl = await loadImageAsDataURL('/enea-logo-copyright.png');
      const img = new Image();
      img.src = logoDataUrl;
      await new Promise(r => { img.onload = r; img.onerror = r; });
      const logoH = 9;
      const logoW = (img.width / img.height) * logoH;
      doc.addImage(logoDataUrl, 'PNG', pageWidth - margin - logoW, pageHeight - margin - logoH + 4, logoW, logoH);
    } catch {
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.text(`© ${new Date().getFullYear()} enea`, pageWidth - margin, pageHeight - 5, { align: 'right' });
    }
  };

  const startNewPage = async () => {
    await drawFooter(pageNumber);
    doc.addPage();
    pageNumber++;
    currentY = margin;
    await drawHeader();
  };

  // ---- render ----

  await drawHeader();
  currentY = drawLegend(currentY);

  // Build flat list: each item knows if it starts a new category
  const flatList = buildFlatList(selections, language);

  // We track column position across all categories (seamless flow)
  let colIndex = 0;
  // Track the Y of the current row (all 6 columns in a row share the same rowY)
  let rowY = currentY;
  // We need to draw category labels above the first plant of each category.
  // Since plants flow seamlessly, the label sits above the image in its column.
  // If a category starts mid-row, its label appears above that column only.

  for (let i = 0; i < flatList.length; i++) {
    const item = flatList[i];
    const plant = item.selection.plant;
    if (!plant) continue;

    const isCategoryStart = item.categoryLabel !== '';

    // Space needed for this cell: catLabel (if first of category) + cellH + nameH
    const extraTop = isCategoryStart ? catLabelH : 0;
    const totalCellH = extraTop + cellH + nameH;

    // If starting a new row (colIndex === 0), check if it fits on page
    if (colIndex === 0) {
      if (rowY + totalCellH > pageHeight - bottomMargin) {
        await startNewPage();
        rowY = currentY;
      }
    }

    const x = margin + colIndex * (cellW + colGap);

    // Draw category label above this cell if it's the first of its category
    if (isCategoryStart) {
      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 100, 100);
      doc.text(item.categoryLabel, x, rowY + catLabelH - 1.5);
    }

    // Image top: rowY + catLabelH if category start, else rowY
    // But rows must be aligned — we always use a fixed rowY for the image top.
    // When a category label is present, it sits in the catLabelH space above.
    // We need the image baseline to be consistent across all cols in the row.
    // Solution: track rowImageY = rowY + maxExtraTop for this row.
    // Since we don't know future items, we use a simple rule:
    // rowImageY is set when colIndex === 0 (start of row).

    // Draw image placeholder
    const imageY = rowY + catLabelH; // always reserve catLabelH at top of row
    doc.setFillColor(228, 228, 228);
    doc.rect(x, imageY, cellW, cellH, 'F');

    // Load image
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

    // Names below image
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

  // Flush last partial row
  if (colIndex > 0) {
    // rowY already set — nothing needed, footer will be placed below
  }

  await drawFooter(pageNumber);

  const label = language === 'de' ? 'Pflanzenauswahl' : 'PlantSelection';
  doc.save(`${label}_A3_${new Date().toISOString().split('T')[0]}.pdf`);
};
