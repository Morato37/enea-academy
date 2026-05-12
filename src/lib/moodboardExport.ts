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

    if (data && data.length > 0) {
      return data.map(img => img.image_url);
    }
    return [];
  } catch (err) {
    console.error('Error loading plant images:', err);
    return [];
  }
};

const loadImageAsDataURL = async (url: string): Promise<string> => {
  try {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const isSupabaseStorage = url.includes('/storage/v1/object/public/');

    const headers: HeadersInit = {};
    if (isSupabaseStorage && supabaseUrl) {
      headers['apikey'] = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
    }

    const response = await fetch(url, {
      mode: 'cors',
      credentials: 'omit',
      headers,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
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

        if (!ctx) {
          URL.revokeObjectURL(objectUrl);
          reject(new Error('Could not get canvas context'));
          return;
        }

        // Fill with white background first to avoid black transparency
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.drawImage(img, 0, 0);
        URL.revokeObjectURL(objectUrl);

        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        resolve(dataUrl);
      };

      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        reject(new Error('Failed to load image'));
      };

      img.src = objectUrl;
    });
  } catch (error) {
    console.error('Failed to fetch image:', url, error);
    throw error;
  }
};

export const generateMoodboardPDF = async (
  selections: UserSelection[],
  projectName?: string,
  language: 'de' | 'en' = 'de'
): Promise<void> => {
  const doc = new jsPDF('landscape', 'mm', 'a3');
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // A3 landscape: 420mm x 297mm
  // Margins from screenshot: Top: 1.25cm, Bottom: 2.5cm, Left/Right: 1.25cm
  const margin = 12.5; // 1.25cm
  const bottomMargin = 25; // 2.5cm
  const headerHeight = 25;

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
      doc.setFontSize(18);
      doc.setTextColor(80, 80, 80);
      doc.setFont('helvetica', 'normal');
      doc.text('enea landscape design', pageWidth - margin, margin + 7, { align: 'right' });
    }

    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    const conceptLabel = language === 'de' ? 'Konzept | Gesamtpflanzenauswahl' : 'Concept | Complete Plant Selection';
    const subtitle = projectName ? `${projectName} | ${conceptLabel}` : conceptLabel;
    doc.text(subtitle, pageWidth - margin, margin + 13, { align: 'right' });

    currentY = margin + headerHeight;
  };

  const addFooter = async (page: number) => {
    // Add enea logo with integrated copyright bottom right - large size as in reference
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

      // Large logo matching reference - the image already includes "© 2026 enea"
      // Make it much larger - about 60mm wide to match reference
      const logoHeight = 15;
      const logoWidth = (img.width / img.height) * logoHeight;
      const logoY = pageHeight - margin - logoHeight + 5;
      const logoX = pageWidth - margin - logoWidth;

      doc.addImage(logoDataUrl, 'JPEG', logoX, logoY, logoWidth, logoHeight);
    } catch (error) {
      console.error('Error loading footer logo:', error);
      // Fallback to text if logo fails
      doc.setFontSize(9);
      doc.setTextColor(100, 100, 100);
      doc.text(`© ${new Date().getFullYear()} enea`, pageWidth - margin, pageHeight - 10, { align: 'right' });
    }
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

  const plantsPerRow = 11;

  // Calculate available width for plants
  const availableWidth = pageWidth - (2 * margin);
  const totalSpacingWidth = (plantsPerRow - 1) * 2; // 2mm spacing between columns
  const imageWidth = (availableWidth - totalSpacingWidth) / plantsPerRow;

  const imageHeight = 22;
  const imageSpacing = 2;
  const columnSpacing = 2;
  const textSpacing = 12;
  const categoryTitleHeight = 6;

  await addHeader();
  currentY = margin + headerHeight;

  let plantsProcessed = 0;

  for (let groupIndex = 0; groupIndex < groups.length; groupIndex++) {
    const group = groups[groupIndex];

    const totalColumnHeight = textSpacing + (imageHeight * 2) + imageSpacing;

    if (groupIndex > 0) {
      if (plantsProcessed % plantsPerRow !== 0) {
        currentY += totalColumnHeight + 8;
        plantsProcessed = 0;
      } else {
        currentY += 4;
      }
    }

    if (currentY + categoryTitleHeight + totalColumnHeight > pageHeight - bottomMargin) {
      await addFooter(pageNumber);
      doc.addPage();
      pageNumber++;
      await addHeader();
      currentY = margin + headerHeight;
      plantsProcessed = 0;
    }

    doc.setFontSize(10);
    doc.setTextColor(60, 60, 60);
    doc.setFont('helvetica', 'bold');
    doc.text(group.category, margin, currentY);
    currentY += categoryTitleHeight;

    for (let i = 0; i < group.items.length; i++) {
      const selection = group.items[i];
      const plant = selection.plant;

      if (!plant) continue;

      const col = plantsProcessed % plantsPerRow;
      const columnX = margin + col * (imageWidth + columnSpacing);

      if (columnX + imageWidth > pageWidth - margin) {
        currentY += totalColumnHeight + 8;
        plantsProcessed = 0;
      }

      const finalCol = plantsProcessed % plantsPerRow;
      const finalColumnX = margin + finalCol * (imageWidth + columnSpacing);

      if (finalCol === 0 && plantsProcessed > 0) {
        currentY += totalColumnHeight + 8;
      }

      if (currentY + totalColumnHeight > pageHeight - bottomMargin) {
        await addFooter(pageNumber);
        doc.addPage();
        pageNumber++;
        await addHeader();
        currentY = margin + headerHeight;
        plantsProcessed = 0;
      }

      const commonName = language === 'de'
        ? (plant.common_name_de || plant.common_name_en || '')
        : (plant.common_name_en || plant.common_name_de || '');
      const nameBotanic = plant.botanical_name || '';

      // Fixed text area height to keep all images aligned
      const fixedTextAreaHeight = 10; // 10mm reserved for names

      doc.setFontSize(7);
      doc.setTextColor(60, 60, 60);
      doc.setFont('helvetica', 'normal');
      const commonNameLines = doc.splitTextToSize(commonName, imageWidth);
      // Limit to 2 lines max
      const displayCommonName = commonNameLines.slice(0, 2);
      doc.text(displayCommonName, finalColumnX, currentY + 3);

      doc.setFontSize(6);
      doc.setTextColor(100, 100, 100);
      doc.setFont('helvetica', 'italic');
      const botanicNameLines = doc.splitTextToSize(nameBotanic, imageWidth);
      // Limit to 2 lines max
      const displayBotanicName = botanicNameLines.slice(0, 2);
      const botanicY = currentY + 3 + (displayCommonName.length * 2.5) + 1;
      doc.text(displayBotanicName, finalColumnX, botanicY);

      let plantImages = await loadPlantImages(plant.id);

      if (plantImages.length === 0 && plant.image_url) {
        plantImages = [plant.image_url];
      }

      // Always use fixed spacing regardless of text length
      let imageY = currentY + fixedTextAreaHeight;
      for (let imgIdx = 0; imgIdx < 2; imgIdx++) {
        if (plantImages[imgIdx]) {
          try {
            const imageData = await loadImageAsDataURL(plantImages[imgIdx]);

            // Load image to get dimensions
            const img = new Image();
            await new Promise<void>((resolve, reject) => {
              img.onload = () => resolve();
              img.onerror = () => reject(new Error('Failed to load image'));
              img.src = imageData;
            });

            // Create a cropped canvas using object-fit: cover logic
            const canvas = document.createElement('canvas');
            canvas.width = 800; // High resolution
            canvas.height = (imageHeight / imageWidth) * 800;
            const ctx = canvas.getContext('2d');

            if (ctx) {
              const imgAspectRatio = img.width / img.height;
              const canvasAspectRatio = canvas.width / canvas.height;

              let sx = 0, sy = 0, sWidth = img.width, sHeight = img.height;

              if (imgAspectRatio > canvasAspectRatio) {
                // Image is wider - crop sides
                sWidth = img.height * canvasAspectRatio;
                sx = (img.width - sWidth) / 2;
              } else {
                // Image is taller - crop top/bottom
                sHeight = img.width / canvasAspectRatio;
                sy = (img.height - sHeight) / 2;
              }

              ctx.drawImage(img, sx, sy, sWidth, sHeight, 0, 0, canvas.width, canvas.height);
              const croppedImageData = canvas.toDataURL('image/jpeg', 0.85);

              // Add the cropped image to PDF
              doc.addImage(croppedImageData, 'JPEG', finalColumnX, imageY, imageWidth, imageHeight);
            }
          } catch (error) {
            console.error('Failed to load image for plant:', plant.common_name_de, error);
            doc.setFillColor(240, 240, 240);
            doc.rect(finalColumnX, imageY, imageWidth, imageHeight, 'F');
            doc.setFontSize(6);
            doc.setTextColor(150, 150, 150);
            const noImageText = language === 'de' ? 'Kein Bild' : 'No Image';
            doc.text(noImageText, finalColumnX + imageWidth / 2, imageY + imageHeight / 2, { align: 'center' });
          }
        } else {
          doc.setFillColor(240, 240, 240);
          doc.rect(finalColumnX, imageY, imageWidth, imageHeight, 'F');
        }
        imageY += imageHeight + imageSpacing;
      }

      plantsProcessed++;
    }
  }

  await addFooter(pageNumber);

  const fileName = `Moodboard_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
};
