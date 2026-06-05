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
  _projectName?: string,
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
    currentY = margin + headerHeight;
  };

  const addFooter = async (_page: number) => {
    // no branding
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
    const categoryLabels = language === 'de'
      ? { trees: 'Bäume', shrubs: 'Sträucher', grasses: 'Gräser', perennials: 'Stauden', bulbs: 'Zwiebeln', ferns: 'Farne', climbing: 'Kletterpflanzen' }
      : { trees: 'Trees', shrubs: 'Shrubs', grasses: 'Grasses', perennials: 'Perennials', bulbs: 'Bulbs', ferns: 'Ferns', climbing: 'Climbing Plants' };

    const categoryOrder = ['trees', 'shrubs', 'grasses', 'perennials', 'bulbs', 'ferns', 'climbing'] as const;

    const assignCat = (plant: NonNullable<UserSelection['plant']>): string => {
      if (plant.category_tree) return categoryLabels.trees;
      if (plant.category_shrub) return categoryLabels.shrubs;
      if (plant.category_grass) return categoryLabels.grasses;
      if (plant.category_bulb) return categoryLabels.bulbs;
      if (plant.category_fern) return categoryLabels.ferns;
      if (plant.category_climbing_plant) return categoryLabels.climbing;
      return categoryLabels.perennials;
    };

    const groups: { [key: string]: UserSelection[] } = {};
    for (const key of categoryOrder) groups[categoryLabels[key]] = [];

    selections.forEach(sel => {
      if (sel.plant) groups[assignCat(sel.plant)].push(sel);
    });

    return categoryOrder
      .map(key => ({ category: categoryLabels[key], items: groups[categoryLabels[key]] }))
      .filter(g => g.items.length > 0);
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
