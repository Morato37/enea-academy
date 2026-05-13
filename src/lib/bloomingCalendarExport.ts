import jsPDF from 'jspdf';
import { UserSelection } from './supabase';

const MONTHS_DE = [
  { key: 'jan', label: 'Jan' },
  { key: 'feb', label: 'Feb' },
  { key: 'mar', label: 'Mrz' },
  { key: 'apr', label: 'Apr' },
  { key: 'may', label: 'Mai' },
  { key: 'jun', label: 'Jun' },
  { key: 'jul', label: 'Jul' },
  { key: 'aug', label: 'Aug' },
  { key: 'sep', label: 'Sep' },
  { key: 'oct', label: 'Okt' },
  { key: 'nov', label: 'Nov' },
  { key: 'dec', label: 'Dez' },
];

const MONTHS_EN = [
  { key: 'jan', label: 'Jan' },
  { key: 'feb', label: 'Feb' },
  { key: 'mar', label: 'Mar' },
  { key: 'apr', label: 'Apr' },
  { key: 'may', label: 'May' },
  { key: 'jun', label: 'Jun' },
  { key: 'jul', label: 'Jul' },
  { key: 'aug', label: 'Aug' },
  { key: 'sep', label: 'Sep' },
  { key: 'oct', label: 'Oct' },
  { key: 'nov', label: 'Nov' },
  { key: 'dec', label: 'Dec' },
];

const hexToRgb = (hex: string): { r: number; g: number; b: number } => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : { r: 200, g: 200, b: 200 };
};

export const generateBloomingCalendarPDF = async (
  selections: UserSelection[],
  projectName?: string,
  language: 'de' | 'en' = 'de'
): Promise<void> => {
  const doc = new jsPDF('landscape', 'mm', 'a3');
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  const MONTHS = language === 'de' ? MONTHS_DE : MONTHS_EN;

  const margin = 20;
  const headerHeight = 20;

  let currentY = margin;
  let pageNumber = 1;

  const addHeader = async () => {
    try {
      const logoPath = '/Enea_landscape_design_grey.pdf.jpg';

      // Load logo as data URL to ensure it's embedded properly
      const logoDataUrl = await loadImageAsDataURL(logoPath);

      const img = new Image();
      img.src = logoDataUrl;

      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });

      const logoWidth = 90;
      const logoHeight = (img.height / img.width) * logoWidth;
      doc.addImage(logoDataUrl, 'JPEG', pageWidth - margin - logoWidth, margin, logoWidth, logoHeight);
    } catch (error) {
      console.error('Error loading logo:', error);
      doc.setFontSize(16);
      doc.setTextColor(80, 80, 80);
      doc.text('enea landscape design', pageWidth - margin, margin + 7, { align: 'right' });
    }

    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    const conceptLabel = language === 'de' ? 'Konzept | Blütezeitkalender' : 'Concept | Blooming Calendar';
    const subtitle = projectName ? `${projectName} | ${conceptLabel}` : conceptLabel;
    doc.text(subtitle, pageWidth - margin, margin + 12, { align: 'right' });

    currentY = margin + headerHeight;
  };

  const loadImageAsDataURL = (url: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }
        // Fill with white background first to avoid black transparency
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      };
      img.onerror = reject;
      img.src = url;
    });
  };

  const addFooter = async (page: number) => {
    // Add large enea logo bottom right - no page number
    try {
      const logoPath = '/enea-logo-copyright.png';

      // Load logo as data URL to ensure it's embedded properly
      const logoDataUrl = await loadImageAsDataURL(logoPath);

      // Create image to get dimensions
      const img = new Image();
      img.src = logoDataUrl;

      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });

      // Large logo matching moodboard reference
      const logoHeight = 15;
      const logoWidth = (img.width / img.height) * logoHeight;
      const logoY = pageHeight - margin - logoHeight + 5;
      const logoX = pageWidth - margin - logoWidth;

      doc.addImage(logoDataUrl, 'PNG', logoX, logoY, logoWidth, logoHeight);
    } catch (error) {
      console.error('Error loading footer logo:', error);
      // Fallback to text if logo fails
      doc.setFontSize(9);
      doc.setTextColor(100, 100, 100);
      doc.text(`© ${new Date().getFullYear()} enea`, pageWidth - margin, pageHeight - 10, { align: 'right' });
    }
  };

  const drawTableHeader = () => {
    const colNameGerman = margin;
    const colNameBotanic = margin + 75;
    const monthColStart = margin + 165;
    const monthColWidth = 12;
    const colRemarks = monthColStart + (MONTHS.length * monthColWidth) + 5;
    const headerRowHeight = 6;

    doc.setFillColor(240, 240, 240);
    doc.rect(margin, currentY, pageWidth - 2 * margin, headerRowHeight, 'F');

    doc.setDrawColor(180, 180, 180);
    doc.setLineWidth(0.3);
    doc.line(colNameBotanic, currentY, colNameBotanic, currentY + headerRowHeight);
    doc.line(monthColStart, currentY, monthColStart, currentY + headerRowHeight);
    doc.line(colRemarks, currentY, colRemarks, currentY + headerRowHeight);

    MONTHS.forEach((_, index) => {
      const x = monthColStart + (index * monthColWidth);
      doc.line(x, currentY, x, currentY + headerRowHeight);
    });

    doc.setFontSize(8);
    doc.setTextColor(60, 60, 60);
    doc.setFont('helvetica', 'bold');
    const commonNameLabel = language === 'de' ? 'Deutscher Name' : 'English Name';
    const botanicNameLabel = language === 'de' ? 'Botanischer Name' : 'Botanical Name';
    const remarksLabel = language === 'de' ? 'Bemerkungen' : 'Remarks';

    doc.text(commonNameLabel, colNameGerman + 2, currentY + 4);
    doc.text(botanicNameLabel, colNameBotanic + 2, currentY + 4);

    MONTHS.forEach((month, index) => {
      const x = monthColStart + (index * monthColWidth);
      doc.text(month.label, x + 2, currentY + 4);
    });

    doc.text(remarksLabel, colRemarks + 2, currentY + 4);

    doc.setDrawColor(180, 180, 180);
    doc.setLineWidth(0.5);
    doc.rect(margin, currentY, pageWidth - 2 * margin, headerRowHeight);

    currentY += headerRowHeight;
  };

  const groupByCategory = (selections: UserSelection[]) => {
    const groups: { [key: string]: UserSelection[] } = {};

    const categoryLabels = language === 'de'
      ? { trees: 'Bäume', shrubs: 'Sträucher', grasses: 'Gräser', bulbs: 'Frühblüher', other: 'Sonstige' }
      : { trees: 'Trees', shrubs: 'Shrubs', grasses: 'Grasses', bulbs: 'Spring Bulbs', other: 'Other' };

    selections.forEach(sel => {
      if (sel.plant) {
        let category = categoryLabels.other;

        if (sel.plant.category_tree) {
          category = categoryLabels.trees;
        } else if (sel.plant.category_shrub) {
          category = categoryLabels.shrubs;
        } else if (sel.plant.category_grass) {
          category = categoryLabels.grasses;
        } else if (sel.plant.category_bulb) {
          category = categoryLabels.bulbs;
        }

        if (!groups[category]) {
          groups[category] = [];
        }
        groups[category].push(sel);
      }
    });

    const categoryOrder = language === 'de'
      ? ['Bäume', 'Sträucher', 'Gräser', 'Frühblüher', 'Sonstige']
      : ['Trees', 'Shrubs', 'Grasses', 'Spring Bulbs', 'Other'];
    return categoryOrder
      .filter(cat => groups[cat] && groups[cat].length > 0)
      .map(cat => ({ category: cat, items: groups[cat] }));
  };

  const groups = groupByCategory(selections);

  await addHeader();

  const colNameGerman = margin;
  const colNameBotanic = margin + 75;
  const monthColStart = margin + 165;
  const monthColWidth = 12;
  const colRemarks = monthColStart + (MONTHS.length * monthColWidth) + 5;
  const rowHeight = 7;
  const categoryTitleHeight = 6;

  drawTableHeader();

  for (const group of groups) {
    if (currentY + categoryTitleHeight + rowHeight > pageHeight - 30) {
      await addFooter(pageNumber);
      doc.addPage();
      pageNumber++;
      await addHeader();
      drawTableHeader();
    }

    doc.setFillColor(250, 250, 250);
    doc.rect(margin, currentY, pageWidth - 2 * margin, categoryTitleHeight, 'F');

    doc.setDrawColor(180, 180, 180);
    doc.setLineWidth(0.3);
    doc.rect(margin, currentY, pageWidth - 2 * margin, categoryTitleHeight);

    doc.setFontSize(8);
    doc.setTextColor(60, 60, 60);
    doc.setFont('helvetica', 'bold');
    doc.text(group.category, colNameGerman + 2, currentY + 4);

    currentY += categoryTitleHeight;

    for (const selection of group.items) {
      const plant = selection.plant;
      if (!plant) continue;

      if (currentY + rowHeight > pageHeight - 30) {
        await addFooter(pageNumber);
        doc.addPage();
        pageNumber++;
        await addHeader();
        drawTableHeader();
      }

      const commonName = language === 'de'
        ? (plant.common_name_de || plant.common_name_en || '')
        : (plant.common_name_en || plant.common_name_de || '');
      const nameBotanic = plant.botanical_name || '';

      doc.setFillColor(255, 255, 255);
      doc.rect(margin, currentY, pageWidth - 2 * margin, rowHeight, 'F');

      doc.setDrawColor(220, 220, 220);
      doc.setLineWidth(0.1);
      doc.rect(margin, currentY, colNameBotanic - margin, rowHeight);
      doc.rect(colNameBotanic, currentY, monthColStart - colNameBotanic, rowHeight);
      doc.rect(colRemarks, currentY, pageWidth - margin - colRemarks, rowHeight);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(60, 60, 60);
      doc.text(commonName, colNameGerman + 2, currentY + 4.5, { maxWidth: 70 });

      doc.setFont('helvetica', 'italic');
      doc.text(nameBotanic, colNameBotanic + 2, currentY + 4.5, { maxWidth: 85 });

      MONTHS.forEach((month, index) => {
        const x = monthColStart + (index * monthColWidth);
        const colorKey = `color_${month.key}` as keyof typeof plant;
        const colorHex = plant[colorKey] as string | undefined;

        doc.setDrawColor(220, 220, 220);
        doc.setLineWidth(0.1);
        doc.rect(x, currentY, monthColWidth, rowHeight);

        if (colorHex && colorHex.trim() !== '') {
          const rgb = hexToRgb(colorHex);
          doc.setFillColor(rgb.r, rgb.g, rgb.b);
          doc.rect(x + 0.5, currentY + 0.5, monthColWidth - 1, rowHeight - 1, 'F');
        }
      });

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(80, 80, 80);

      const remarks: string[] = [];
      if (language === 'de') {
        if (plant.characteristic_native) remarks.push('heimisch');
        if (plant.characteristic_butterflies) remarks.push('Schmetterlinge');
        if (plant.characteristic_bees) remarks.push('Bienen');
      } else {
        if (plant.characteristic_native) remarks.push('native');
        if (plant.characteristic_butterflies) remarks.push('butterflies');
        if (plant.characteristic_bees) remarks.push('bees');
      }

      const remarksText = remarks.join(', ');
      if (remarksText) {
        doc.text(remarksText, colRemarks + 2, currentY + 4.5, { maxWidth: 60 });
      }

      currentY += rowHeight;
    }
  }

  await addFooter(pageNumber);

  const fileName = `Bluehkalender_A3_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
};
