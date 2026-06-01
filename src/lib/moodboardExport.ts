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
  } catch (err) {
    console.error('Error loading plant images:', err);
    return [];
  }
};

const loadImageAsDataURL = async (url: string): Promise<string> => {
  try {
    const isSupabaseStorage = url.includes('/storage/v1/object/public/');
    const headers: HeadersInit = {};
    if (isSupabaseStorage) headers['apikey'] = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

    const response = await fetch(url, { mode: 'cors', credentials: 'omit', headers });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
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
        if (!ctx) { URL.revokeObjectURL(objectUrl); reject(new Error('Could not get canvas context')); return; }
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        URL.revokeObjectURL(objectUrl);
        resolve(canvas.toDataURL('image/jpeg', 0.85));
      };
      img.onerror = () => { URL.revokeObjectURL(objectUrl); reject(new Error('Failed to load image')); };
      img.src = objectUrl;
    });
  } catch (error) {
    console.error('Failed to fetch image:', url, error);
    throw error;
  }
};

const groupByCategory = (selections: UserSelection[], language: 'de' | 'en') => {
  const labels = language === 'de'
    ? { trees: 'Bäume', shrubs: 'Sträucher', grasses: 'Gräser', perennials: 'Stauden', other: 'Sonstige' }
    : { trees: 'Trees', shrubs: 'Shrubs', grasses: 'Grasses', perennials: 'Perennials', other: 'Other' };

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
  return order
    .filter(cat => groups[cat] && groups[cat].length > 0)
    .map(cat => ({ category: cat, items: groups[cat] }));
};

export const generateMoodboardPDF = async (
  selections: UserSelection[],
  projectName?: string,
  language: 'de' | 'en' = 'de'
): Promise<void> => {
  const groups = groupByCategory(selections, language);

  // Count total plants to determine layout
  const totalPlants = groups.reduce((sum, g) => sum + g.items.length, 0);

  // A3 landscape
  const doc = new jsPDF('landscape', 'mm', 'a3');
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  const margin = 12.5;
  const availableWidth = pageWidth - 2 * margin;

  // Title at top-left
  const titleLabel = language === 'de' ? 'Plant board' : 'Plant board';
  const projectLabel = projectName ? `${projectName} — ` : '';
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(40, 40, 40);
  doc.text(`${projectLabel}${titleLabel}`, margin, margin + 6);

  let currentY = margin + 14;

  // Determine plantsPerRow dynamically so everything fits on one page
  // Each plant needs imageHeight*2 + textSpacing + imageSpacing (portrait layout)
  // We calculate the best plantsPerRow to fit all categories on one page

  const imageSpacing = 2;
  const columnSpacing = 2;
  const textAreaHeight = 10;
  const imageHeight = 22;
  const categoryTitleHeight = 7;
  const groupGap = 5;

  // Calculate rows needed for a given plantsPerRow
  const calcTotalHeight = (ppr: number) => {
    let h = 0;
    const cellH = textAreaHeight + imageHeight * 2 + imageSpacing;
    for (let gi = 0; gi < groups.length; gi++) {
      if (gi > 0) h += groupGap;
      h += categoryTitleHeight;
      const rows = Math.ceil(groups[gi].items.length / ppr);
      h += rows * (cellH + 4);
    }
    return h;
  };

  // Try plantsPerRow from 6 up to 18, find minimum that fits on one page
  const availableHeight = pageHeight - currentY - margin;
  let plantsPerRow = 6;
  for (let ppr = 6; ppr <= 22; ppr++) {
    if (calcTotalHeight(ppr) <= availableHeight) {
      plantsPerRow = ppr;
      break;
    }
    plantsPerRow = ppr; // worst case: use maximum tried
  }

  const totalSpacingWidth = (plantsPerRow - 1) * columnSpacing;
  const imageWidth = (availableWidth - totalSpacingWidth) / plantsPerRow;
  const cellTotalH = textAreaHeight + imageHeight * 2 + imageSpacing;

  for (let groupIndex = 0; groupIndex < groups.length; groupIndex++) {
    const group = groups[groupIndex];

    if (groupIndex > 0) currentY += groupGap;

    // Category title
    doc.setFontSize(9);
    doc.setTextColor(80, 80, 80);
    doc.setFont('helvetica', 'bold');
    doc.text(group.category, margin, currentY + 4);
    currentY += categoryTitleHeight;

    let col = 0;
    let rowStartY = currentY;

    for (let i = 0; i < group.items.length; i++) {
      const selection = group.items[i];
      const plant = selection.plant;
      if (!plant) continue;

      if (col >= plantsPerRow) {
        col = 0;
        rowStartY += cellTotalH + 4;
      }

      const x = margin + col * (imageWidth + columnSpacing);

      const commonName = language === 'de'
        ? (plant.common_name_de || plant.common_name_en || '')
        : (plant.common_name_en || plant.common_name_de || '');
      const nameBotanic = plant.botanical_name || '';

      doc.setFontSize(7);
      doc.setTextColor(60, 60, 60);
      doc.setFont('helvetica', 'normal');
      const commonLines = doc.splitTextToSize(commonName, imageWidth).slice(0, 2);
      doc.text(commonLines, x, rowStartY + 3);

      doc.setFontSize(6);
      doc.setTextColor(100, 100, 100);
      doc.setFont('helvetica', 'italic');
      const botanicLines = doc.splitTextToSize(nameBotanic, imageWidth).slice(0, 2);
      const botanicY = rowStartY + 3 + commonLines.length * 2.5 + 1;
      doc.text(botanicLines, x, botanicY);

      let plantImages = await loadPlantImages(plant.id);
      if (plantImages.length === 0 && plant.image_url) plantImages = [plant.image_url];

      let imgY = rowStartY + textAreaHeight;
      for (let imgIdx = 0; imgIdx < 2; imgIdx++) {
        if (plantImages[imgIdx]) {
          try {
            const imageData = await loadImageAsDataURL(plantImages[imgIdx]);
            const img = new Image();
            await new Promise<void>((resolve, reject) => {
              img.onload = () => resolve();
              img.onerror = () => reject(new Error('Failed to load image'));
              img.src = imageData;
            });

            const canvas = document.createElement('canvas');
            canvas.width = 800;
            canvas.height = Math.round((imageHeight / imageWidth) * 800);
            const ctx = canvas.getContext('2d');
            if (ctx) {
              const imgAR = img.width / img.height;
              const canvasAR = canvas.width / canvas.height;
              let sx = 0, sy = 0, sW = img.width, sH = img.height;
              if (imgAR > canvasAR) { sW = img.height * canvasAR; sx = (img.width - sW) / 2; }
              else { sH = img.width / canvasAR; sy = (img.height - sH) / 2; }
              ctx.drawImage(img, sx, sy, sW, sH, 0, 0, canvas.width, canvas.height);
              doc.addImage(canvas.toDataURL('image/jpeg', 0.85), 'JPEG', x, imgY, imageWidth, imageHeight);
            }
          } catch {
            doc.setFillColor(240, 240, 240);
            doc.rect(x, imgY, imageWidth, imageHeight, 'F');
          }
        } else {
          doc.setFillColor(240, 240, 240);
          doc.rect(x, imgY, imageWidth, imageHeight, 'F');
        }
        imgY += imageHeight + imageSpacing;
      }

      col++;
    }

    currentY = rowStartY + cellTotalH + 4;
  }

  const fileName = `PlantBoard_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
};
