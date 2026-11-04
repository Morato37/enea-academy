import jsPDF from 'jspdf';
import { UserSelection, ProjectZone } from './supabase';
import {
  getShrubSalesDetails,
  getTreeSalesDetails,
  groupSelectionsByCategory,
  PlantCategoryKey,
  ZoneAreaMap,
} from './plantCategories';
import { pruningFormExportText } from './pruningFormPdf';


interface ZoneCalcData {
  zone: ProjectZone | null;
  zoneName: string;
  groups: {
    categoryKey: PlantCategoryKey;
    categoryLabel: string;
    plantCount: number;
    areaM2: number | undefined;
    plants: {
      botanicalName: string;
      commonName: string;
      quantity: number;
      detailLabel: string;
    }[];
  }[];
  totalAreaM2: number;
}

const PERENNIAL_SIZE_MAP: Record<string, { de: string; en: string }> = {
  short:  { de: 'Klein (5–40 cm)',   en: 'Small (5–40 cm)' },
  medium: { de: 'Mittel (40–80 cm)',  en: 'Medium (40–80 cm)' },
  tall:   { de: 'Gross (80–200 cm)',  en: 'Large (80–200 cm)' },
};

const formatSize = (
  plant: UserSelection['plant'],
  language: 'de' | 'en'
): string => {
  if (!plant?.perennial_size) return '';
  const entry = PERENNIAL_SIZE_MAP[plant.perennial_size];
  return entry ? (language === 'de' ? entry.de : entry.en) : plant.perennial_size;
};

const formatPlantDetails = (selection: UserSelection, language: 'de' | 'en'): string => {
  const details: string[] = [];
  const sizeLabel = formatSize(selection.plant, language);
  if (sizeLabel) details.push(sizeLabel);

  if (selection.plant?.category_tree) {
    if (selection.pruning_form) {
      const pruningForm = pruningFormExportText(selection.pruning_form, 'en');
      if (pruningForm) details.push(`Pruning form: ${pruningForm}`);
    }
    const savedTreeHeight = getTreeSalesDetails(selection.notes).heightCm;
    const treeHeight = selection.tree_height_cm ?? savedTreeHeight;
    if (treeHeight !== undefined) details.push(`Tree height: ${treeHeight} cm`);
  }

  if (selection.plant?.category_shrub) {
    const shrubDetails = getShrubSalesDetails(selection.notes);
    if (shrubDetails.form) {
      const shrubForm = shrubDetails.form === 'wave' ? 'Wave' : 'Hedge';
      details.push(`Shrub form: ${shrubForm}`);
    }
    if (shrubDetails.linearMeters !== undefined) {
      details.push(`Linear metres: ${shrubDetails.linearMeters}`);
    }
  }

  return details.join(' · ');
};

export const generateCalculationPDF = async (
  selections: UserSelection[],
  zones: ProjectZone[],
  areas: ZoneAreaMap,
  projectName?: string,
  language: 'de' | 'en' = 'de',
  planImage?: string | null,
  zoneColorMap?: Map<string, string>
): Promise<void> => {
  const isDe = language === 'de';

  // Build per-zone data
  const zoneData: ZoneCalcData[] = [];

  for (const zone of zones) {
    const zoneSels = selections.filter(s => s.zone_id === zone.id && !s.parent_selection_id && s.plant_id);
    const groups = groupSelectionsByCategory(zoneSels, language);
    const groupData = groups.map(g => {
      const areaM2 = areas[zone.id]?.[g.categoryKey];
      const plants = g.selections.map(sel => ({
        botanicalName: sel.plant?.botanical_name || '',
        commonName: isDe
          ? (sel.plant?.common_name_de || sel.plant?.common_name_en || '')
          : (sel.plant?.common_name_en || sel.plant?.common_name_de || ''),
        quantity: sel.quantity,
        detailLabel: formatPlantDetails(sel, language),
      }));
      return {
        categoryKey: g.categoryKey,
        categoryLabel: g.categoryLabel,
        plantCount: g.plantCount,
        areaM2,
        plants,
      };
    });
    const totalAreaM2 = groupData.reduce((sum, g) => sum + (g.areaM2 || 0), 0);
    zoneData.push({ zone, zoneName: zone.name, groups: groupData, totalAreaM2 });
  }

  // Unassigned selections
  const unassignedSels = selections.filter(s => !s.zone_id && !s.parent_selection_id && s.plant_id);
  if (unassignedSels.length > 0) {
    const groups = groupSelectionsByCategory(unassignedSels, language);
    const groupData = groups.map(g => {
      const areaM2 = areas['unassigned']?.[g.categoryKey];
      const plants = g.selections.map(sel => ({
        botanicalName: sel.plant?.botanical_name || '',
        commonName: isDe
          ? (sel.plant?.common_name_de || sel.plant?.common_name_en || '')
          : (sel.plant?.common_name_en || sel.plant?.common_name_de || ''),
        quantity: sel.quantity,
        detailLabel: formatPlantDetails(sel, language),
      }));
      return {
        categoryKey: g.categoryKey,
        categoryLabel: g.categoryLabel,
        plantCount: g.plantCount,
        areaM2,
        plants,
      };
    });
    const totalAreaM2 = groupData.reduce((sum, g) => sum + (g.areaM2 || 0), 0);
    zoneData.push({
      zone: null,
      zoneName: isDe ? 'Nicht zugeordnet' : 'Unassigned',
      groups: groupData,
      totalAreaM2,
    });
  }

  // ── PDF layout (A4 portrait) ──────────────────────────────────────────
  const PAGE_W = 210;
  const PAGE_H = 297;
  const margin = 15;
  const contentW = PAGE_W - margin * 2;
  let y = margin;

  const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });

  const ensureSpace = (needed: number) => {
    if (y + needed > PAGE_H - margin) {
      doc.addPage('a4', 'p');
      y = margin;
    }
  };

  // ── Title ─────────────────────────────────────────────────────────────
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 30, 30);
  doc.text(
    isDe ? 'Projekt-Kalkulation' : 'Project Calculation',
    margin,
    y
  );
  y += 8;

  if (projectName) {
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text(projectName, margin, y);
    y += 6;
  }

  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.line(margin, y, margin + contentW, y);
  y += 6;

  // ── Per zone ──────────────────────────────────────────────────────────
  for (const zd of zoneData) {
    if (zd.groups.length === 0) continue;

    ensureSpace(18);
    const zoneColor = zd.zone && zoneColorMap
      ? (zoneColorMap.get(zd.zone.id) || '#6B7280')
      : '#6B7280';
    const zoneRgb = zoneColor.match(/^#([0-9a-f]{6})$/i);
    const rgb = zoneRgb
      ? [
          parseInt(zoneRgb[1].slice(0, 2), 16),
          parseInt(zoneRgb[1].slice(2, 4), 16),
          parseInt(zoneRgb[1].slice(4, 6), 16),
        ] as [number, number, number]
      : [107, 114, 128] as [number, number, number];

    doc.setFillColor(...rgb);
    doc.roundedRect(margin, y - 4, contentW, 8, 1.5, 1.5, 'F');
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text(zd.zoneName, margin + 4, y + 1);
    y += 7;

    if (zd.totalAreaM2 > 0) {
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 100, 100);
      doc.text(
        `${isDe ? 'Gesamtfläche' : 'Total area'}: ${zd.totalAreaM2.toFixed(1)} m²`,
        margin + contentW - 40,
        y
      );
    }
    y += 4;

    // Table header
    const colName = margin;
    const colBotanical = margin + 50;
    const colQty = margin + contentW - 10;

    for (const group of zd.groups) {
      ensureSpace(10);

      // Category header
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(40, 40, 40);
      doc.text(group.categoryLabel, margin, y);
      y += 4;

      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(120, 120, 120);
      if (group.areaM2 !== undefined) {
        doc.text(
          `${isDe ? 'Fläche' : 'Area'}: ${group.areaM2.toFixed(1)} m²`,
          margin + contentW - 35,
          y
        );
      }
      y += 3;

      // Plant rows
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(60, 60, 60);

      for (const plant of group.plants) {
        ensureSpace(plant.detailLabel ? 8 : 5);
        doc.text(doc.splitTextToSize(plant.commonName, 48)[0] || '', colName, y);
        doc.setTextColor(110, 110, 110);
        doc.text(doc.splitTextToSize(plant.botanicalName, 60)[0] || '', colBotanical, y);
        if (plant.detailLabel) {
          doc.setFontSize(7);
          doc.setTextColor(130, 130, 130);
          doc.text(doc.splitTextToSize(plant.detailLabel, 100)[0], colBotanical, y + 3.2);
          doc.setFontSize(8);
        }
        if (group.categoryKey !== 'perennial') {
          doc.setTextColor(60, 60, 60);
          doc.text(String(plant.quantity), colQty, y, { align: 'right' });
        }
        y += plant.detailLabel ? 7.5 : 4.5;
      }

      // Category subtotal
      ensureSpace(5);
      doc.setDrawColor(220, 220, 220);
      doc.setLineWidth(0.2);
      doc.line(margin, y - 1, margin + contentW, y - 1);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(80, 80, 80);
      doc.text(
        `${group.plantCount} ${isDe ? 'Pflanzen' : 'plants'}${group.areaM2 !== undefined ? ` · ${group.areaM2.toFixed(1)} m²` : ''}`,
        margin,
        y + 3
      );
      y += 7;
    }

    y += 3;
    doc.setDrawColor(180, 180, 180);
    doc.setLineWidth(0.3);
    doc.line(margin, y, margin + contentW, y);
    y += 6;
  }

  // ── Summary ──────────────────────────────────────────────────────────
  const grandTotalArea = zoneData.reduce((sum, zd) => sum + zd.totalAreaM2, 0);
  const grandTotalPlants = zoneData.reduce(
    (sum, zd) => sum + zd.groups.reduce((s, g) => s + g.plantCount, 0),
    0
  );

  ensureSpace(15);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(20, 20, 20);
  doc.text(isDe ? 'Zusammenfassung' : 'Summary', margin, y);
  y += 6;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(60, 60, 60);
  doc.text(
    `${isDe ? 'Pflanzen gesamt' : 'Total plants'}: ${grandTotalPlants}`,
    margin,
    y
  );
  y += 5;
  doc.text(
    `${isDe ? 'Fläche gesamt' : 'Total area'}: ${grandTotalArea.toFixed(1)} m²`,
    margin,
    y
  );

  if (planImage) {
    doc.addPage('a4', 'p');
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const imgProps = doc.getImageProperties(planImage);
    const imgRatio = imgProps.width / imgProps.height;
    const maxW = pageWidth - 2 * margin;
    const maxH = pageHeight - 2 * margin;
    let imgW = maxW;
    let imgH = imgW / imgRatio;
    if (imgH > maxH) {
      imgH = maxH;
      imgW = imgH * imgRatio;
    }
    const x = (pageWidth - imgW) / 2;
    const y = (pageHeight - imgH) / 2;
    doc.setFontSize(14);
    doc.text(isDe ? 'Projektplan mit Zonen' : 'Project plan with zones', margin, margin + 5);
    doc.addImage(planImage, 'PNG', x, y + 8, imgW, imgH);
  }

  doc.save(`Calculation_${new Date().toISOString().split('T')[0]}.pdf`);
};
