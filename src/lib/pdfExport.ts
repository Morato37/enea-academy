import jsPDF from 'jspdf';
import { UserSelection } from './supabase';

const MONTHS = [
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

const COLORS = {
  cyan: { r: 8, g: 145, b: 178 },
  cyanLight: { r: 34, g: 211, b: 238 },
  orange: { r: 249, g: 115, b: 22 },
  gray: { r: 107, g: 114, b: 128 },
  darkGray: { r: 55, g: 65, b: 81 },
  lightGray: { r: 243, g: 244, b: 246 }
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

const hexToRgb = (hex: string): { r: number; g: number; b: number } | null => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
};

export const generatePDF = async (selections: UserSelection[], language: 'de' | 'en' = 'de'): Promise<void> => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let yPosition = 20;

  const plantSelections = selections.filter(s => s.plant_id);
  const tileCombinations = selections.filter(s => s.is_tile_combination && s.stone_id && !s.parent_selection_id);
  const regularStoneSelections = selections.filter(s => s.stone_id && !s.is_tile_combination);
  const allStones = [...tileCombinations, ...regularStoneSelections];

  try {
    const logoResponse = await fetch('/enea-logo.png');
    const logoBlob = await logoResponse.blob();
    const logoDataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(logoBlob);
    });
    doc.addImage(logoDataUrl, 'PNG', 15, yPosition, 25, 12);
  } catch (error) {
    console.error('Failed to load logo:', error);
  }

  yPosition += 15;
  doc.setFontSize(24);
  doc.setTextColor(COLORS.cyan.r, COLORS.cyan.g, COLORS.cyan.b);
  doc.setFont(undefined, 'bold');
  doc.text('Enea\'s Academy', pageWidth / 2, yPosition, { align: 'center' });

  yPosition += 8;
  doc.setFontSize(9);
  doc.setFont(undefined, 'normal');
  doc.setTextColor(COLORS.darkGray.r, COLORS.darkGray.g, COLORS.darkGray.b);
  const today = new Date();
  doc.text(`Generated: ${today.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })}`, pageWidth / 2, yPosition, { align: 'center' });

  yPosition += 8;
  doc.setFillColor(COLORS.cyan.r, COLORS.cyan.g, COLORS.cyan.b);
  doc.rect(20, yPosition, pageWidth - 40, 0.8, 'F');
  yPosition += 8;

  doc.setFillColor(COLORS.lightGray.r, COLORS.lightGray.g, COLORS.lightGray.b);
  doc.rect(15, yPosition, pageWidth - 30, 16, 'F');
  doc.setFontSize(9);
  doc.setTextColor(COLORS.darkGray.r, COLORS.darkGray.g, COLORS.darkGray.b);
  doc.setFont(undefined, 'bold');
  const summaryLabel = language === 'de' ? 'Selection Summary' : 'Selection Summary';
  doc.text(summaryLabel, 20, yPosition + 6);
  doc.setFont(undefined, 'normal');
  doc.setFontSize(8);
  const plantsLabel = language === 'de' ? 'Plants' : 'Plants';
  const stonesLabel = language === 'de' ? 'Stones' : 'Stones';
  doc.text(`${plantSelections.length} ${plantsLabel}  •  ${allStones.length} ${stonesLabel}`, 20, yPosition + 11);
  yPosition += 20;

  if (plantSelections.length > 0) {
    doc.setFillColor(COLORS.cyan.r, COLORS.cyan.g, COLORS.cyan.b);
    doc.rect(15, yPosition, pageWidth - 30, 10, 'F');
    doc.setFontSize(14);
    doc.setTextColor(255, 255, 255);
    doc.setFont(undefined, 'bold');
    const plantsTitleLabel = language === 'de' ? 'Plants' : 'Plants';
    doc.text(`${plantsTitleLabel} (${plantSelections.length})`, 20, yPosition + 7);
    doc.setFont(undefined, 'normal');
    yPosition += 18;

    for (const selection of plantSelections) {
      const plant = selection.plant;
      if (!plant) continue;

      if (yPosition > pageHeight - 80) {
        doc.addPage();
        yPosition = 20;
      }

      const startY = yPosition;

      doc.setFontSize(11);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(COLORS.darkGray.r, COLORS.darkGray.g, COLORS.darkGray.b);
      doc.text(plant.botanical_name, 25, yPosition);
      yPosition += 5;

      const commonName = language === 'de'
        ? (plant.common_name_de || plant.common_name_en || '')
        : (plant.common_name_en || plant.common_name_de || '');
      if (commonName) {
        doc.setFontSize(9);
        doc.setFont(undefined, 'normal');
        doc.setTextColor(COLORS.darkGray.r, COLORS.darkGray.g, COLORS.darkGray.b);
        doc.text(commonName, 25, yPosition);
        yPosition += 5;
      } else {
        yPosition += 1;
      }

      let imageAdded = false;
      const imageStartY = yPosition;

      // Load primary image from plant_images table
      let imageUrl = plant.image_url;
      try {
        const { createClient } = await import('@supabase/supabase-js');
        const supabase = createClient(
          import.meta.env.VITE_SUPABASE_URL,
          import.meta.env.VITE_SUPABASE_ANON_KEY
        );

        const { data: imageData } = await supabase
          .from('plant_images')
          .select('image_url')
          .eq('plant_id', plant.id)
          .eq('is_primary', true)
          .single();

        if (imageData?.image_url) {
          imageUrl = imageData.image_url;
        }
      } catch (error) {
        console.log('No primary image found, using fallback');
      }

      if (imageUrl) {
        try {
          const dataUrl = await loadImageAsDataURL(imageUrl);
          const imgWidth = 56;
          const imgHeight = 56;
          doc.addImage(dataUrl, 'JPEG', 25, yPosition, imgWidth, imgHeight);
          imageAdded = true;
        } catch (error) {
          console.error('Failed to load plant image for', plant.botanical_name, ':', error);
        }
      }

      const textStartX = imageAdded ? 85 : 25;
      let textY = yPosition + 3;

      doc.setFont(undefined, 'normal');
      doc.setFontSize(8);
      doc.setTextColor(COLORS.gray.r, COLORS.gray.g, COLORS.gray.b);

      if (plant.common_name_en) {
        doc.text(`English: ${plant.common_name_en}`, textStartX, textY);
        textY += 4;
      }

      if (plant.common_name_de) {
        doc.text(`German: ${plant.common_name_de}`, textStartX, textY);
        textY += 4;
      }

      const plantTypes = [];
      if (plant.category_shrub) plantTypes.push('Shrub');
      if (plant.category_tree) plantTypes.push('Tree');
      if (plant.category_palm) plantTypes.push('Palm');
      if (plant.category_perennial) {
        let perennialText = 'Perennial';
        if (plant.perennial_size) {
          const sizeMap: { [key: string]: string } = {
            'short': '30-40cm',
            'medium': '40-80cm',
            'tall': '80-200cm'
          };
          const sizeLabel = sizeMap[plant.perennial_size] || plant.perennial_size;
          perennialText += ` (${sizeLabel})`;
        }
        plantTypes.push(perennialText);
      }
      if (plant.category_annual) plantTypes.push('Annual');
      if (plant.category_biannual) plantTypes.push('Biannual');
      if (plant.category_grass) plantTypes.push('Grass');
      if (plant.category_succulent) plantTypes.push('Succulent');
      if (plant.category_bulb) plantTypes.push('Bulb');
      if (plant.category_acquatic) plantTypes.push('Aquatic');
      if (plant.category_nonvascular) plantTypes.push('Non-vascular');
      if (plant.category_fern) plantTypes.push('Fern');
      if (plant.category_climbing_plant) plantTypes.push('Climbing Plant');
      if (plantTypes.length > 0) {
        doc.text(`Category: ${plantTypes.join(', ')}`, textStartX, textY);
        textY += 4;
      }

      const zones = [];
      if (plant.zone_5a) zones.push('5a');
      if (plant.zone_5b) zones.push('5b');
      if (plant.zone_6a) zones.push('6a');
      if (plant.zone_6b) zones.push('6b');
      if (plant.zone_7a) zones.push('7a');
      if (plant.zone_7b) zones.push('7b');
      if (plant.zone_8a) zones.push('8a');
      if (plant.zone_8b) zones.push('8b');
      if (plant.zone_9a) zones.push('9a');
      if (plant.zone_9b) zones.push('9b');
      if (plant.zone_10a) zones.push('10a');
      if (plant.zone_10b) zones.push('10b');
      if (zones.length > 0) {
        doc.text(`Zones: ${zones.join(', ')}`, textStartX, textY);
        textY += 4;
      }

      const exposure = [];
      if (plant.exposure_sun) exposure.push('Sun');
      if (plant.exposure_shade) exposure.push('Shade');
      if (plant.exposure_halfshade) exposure.push('Half Shade');
      if (exposure.length > 0) {
        doc.text(`Exposure: ${exposure.join(', ')}`, textStartX, textY);
        textY += 4;
      }

      const usage = [];
      if (plant.usage_solitary_garden) usage.push('Private Garden');
      if (plant.usage_solitary_park) usage.push('Park');
      if (plant.usage_solitary_terrace) usage.push('Private Terrace');
      if (plant.usage_trees_in_groups) usage.push('Trees in Group');
      if (plant.usage_grasses) usage.push('Grasses');
      if (plant.usage_ferns) usage.push('Ferns');
      if (plant.usage_waterplants_pond) usage.push('Water Plants/Pond');
      if (plant.usage_medicinal_herbs) usage.push('Medicinal Herbs');
      if (plant.usage_ground_cover) usage.push('Ground Cover');
      if (plant.usage_seasonal) usage.push('Seasonal');
      if (plant.usage_climbing) usage.push('Climbing');
      if (plant.usage_formal_hedge) usage.push('Formal Hedge');
      if (plant.usage_wild_hedge) usage.push('Wild Hedge');
      if (plant.usage_tropical) usage.push('Tropical');
      if (usage.length > 0) {
        const usageText = `Usage: ${usage.join(', ')}`;
        const maxWidth = pageWidth - textStartX - 10;
        const lines = doc.splitTextToSize(usageText, maxWidth);
        doc.text(lines, textStartX, textY);
        textY += lines.length * 4;
      }

      const characteristics = [];
      if (plant.characteristic_evergreen) characteristics.push('Evergreen');
      if (plant.characteristic_deciduous) characteristics.push('Deciduous');
      if (characteristics.length > 0) {
        doc.text(`Characteristics: ${characteristics.join(', ')}`, textStartX, textY);
        textY += 4;
      }

      const traitsChange = plant.traits_change_with_location === 'true' ? 'Yes' : 'No';
      doc.text(`Traits change with location: ${traitsChange}`, textStartX, textY);
      textY += 4;

      textY += 2;

      const imageBottomY = imageAdded ? (imageStartY + 56) : imageStartY;
      yPosition = Math.max(imageBottomY, textY);

      const hasColorData = MONTHS.some(
        (month) => plant[`color_${month.key}` as keyof typeof plant]
      );

      if (hasColorData) {
        yPosition += 5;
        doc.setFontSize(7);
        doc.setFont(undefined, 'bold');
        doc.setTextColor(COLORS.gray.r, COLORS.gray.g, COLORS.gray.b);
        doc.text('Seasonal Colors:', 25, yPosition);
        doc.setFont(undefined, 'normal');
        yPosition += 4;

        const boxSize = 7;
        const boxSpacing = 1;
        const startX = 25;

        MONTHS.forEach((month, index) => {
          const color = plant[`color_${month.key}` as keyof typeof plant] as string | undefined;
          const xPos = startX + index * (boxSize + boxSpacing);

          if (color && color.startsWith('#')) {
            const rgb = hexToRgb(color);
            if (rgb) {
              doc.setFillColor(rgb.r, rgb.g, rgb.b);
              doc.rect(xPos, yPosition, boxSize, boxSize, 'F');
              doc.setDrawColor(200, 200, 200);
              doc.rect(xPos, yPosition, boxSize, boxSize, 'S');
            }
          } else {
            const centerX = xPos + boxSize / 2;
            const centerY = yPosition + boxSize / 2;
            const radius = boxSize / 2;

            doc.setDrawColor(180, 180, 180);
            doc.setLineWidth(0.3);
            doc.circle(centerX, centerY, radius, 'S');

            const offset = radius * 0.7;
            doc.line(
              centerX - offset,
              centerY - offset,
              centerX + offset,
              centerY + offset
            );
          }

          doc.setFontSize(5.5);
          doc.setTextColor(100, 100, 100);
          doc.text(month.label, xPos + boxSize / 2, yPosition + boxSize + 2.5, { align: 'center' });
        });

        yPosition += boxSize + 6;
        doc.setTextColor(0, 0, 0);
      }

      yPosition += 12;
    }
  }

  if (allStones.length > 0) {
    if (yPosition > pageHeight - 50) {
      doc.addPage();
      yPosition = 20;
    } else {
      yPosition += 4;
    }

    doc.setFillColor(COLORS.gray.r, COLORS.gray.g, COLORS.gray.b);
    doc.rect(15, yPosition, pageWidth - 30, 10, 'F');
    doc.setFontSize(14);
    doc.setTextColor(255, 255, 255);
    doc.setFont(undefined, 'bold');
    doc.text(`Stones (${allStones.length})`, 20, yPosition + 7);
    doc.setFont(undefined, 'normal');
    yPosition += 18;

    for (const selection of allStones) {
      const stone = selection.stone;
      if (!stone) continue;

      if (yPosition > pageHeight - 80) {
        doc.addPage();
        yPosition = 20;
      }

      const startY = yPosition;

      doc.setFontSize(11);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(COLORS.darkGray.r, COLORS.darkGray.g, COLORS.darkGray.b);
      doc.text(stone.name, 25, yPosition);
      yPosition += 6;

      let imageAdded = false;

      // Load primary image from stone_images table
      let stoneImageUrl = stone.image_url;
      try {
        const { createClient } = await import('@supabase/supabase-js');
        const supabase = createClient(
          import.meta.env.VITE_SUPABASE_URL,
          import.meta.env.VITE_SUPABASE_ANON_KEY
        );

        const { data: imageData } = await supabase
          .from('stone_images')
          .select('image_url')
          .eq('stone_id', stone.id)
          .eq('is_primary', true)
          .single();

        if (imageData?.image_url) {
          stoneImageUrl = imageData.image_url;
        }
      } catch (error) {
        console.log('No primary stone image found, using fallback');
      }

      if (stoneImageUrl) {
        try {
          const dataUrl = await loadImageAsDataURL(stoneImageUrl);
          const imgWidth = 56;
          const imgHeight = 56;
          doc.addImage(dataUrl, 'JPEG', 25, yPosition, imgWidth, imgHeight);
          imageAdded = true;
        } catch (error) {
          console.error('Failed to load stone image for', stone.name, ':', error);
        }
      }

      const textStartX = imageAdded ? 85 : 25;
      let textY = yPosition + 3;

      doc.setFont(undefined, 'normal');
      doc.setFontSize(8);
      doc.setTextColor(COLORS.gray.r, COLORS.gray.g, COLORS.gray.b);

      if (stone.morphology) {
        doc.text(`Type: ${stone.morphology}`, textStartX, textY);
        textY += 4;
      }

      if (stone.origin) {
        doc.text(`Origin: ${stone.origin}`, textStartX, textY);
        textY += 4;
      }

      if (stone.stone_color) {
        doc.text(`Color: ${stone.stone_color}`, textStartX, textY);
        textY += 4;
      }

      if (stone.producer_seller) {
        doc.text(`Producer: ${stone.producer_seller}`, textStartX, textY);
        textY += 4;
      }

      const regions = [];
      if (stone.mediterranean_zone) regions.push('Mediterranean');
      if (stone.central_europe_zone) regions.push('Central Europe');
      if (stone.alpine_zone) regions.push('Alpine');
      if (regions.length > 0) {
        doc.text(`Regions: ${regions.join(', ')}`, textStartX, textY);
        textY += 4;
      }

      const applications = [];
      if (stone.use_tiles) applications.push('Tiles');
      if (stone.use_block_steps) applications.push('Block Steps');
      if (stone.use_paving) applications.push('Paving');
      if (stone.use_walls) applications.push('Walls');
      if (stone.use_pool) applications.push('Pool');
      if (stone.use_chippings) applications.push('Chippings');
      if (applications.length > 0) {
        doc.text(`Applications: ${applications.join(', ')}`, textStartX, textY);
        textY += 4;
      }

      const finishes = [];
      if (stone.finish_split) finishes.push('Split');
      if (stone.finish_flamed) finishes.push('Flamed');
      if (stone.finish_polished) finishes.push('Polished');
      if (stone.finish_honed) finishes.push('Honed');
      if (stone.finish_brushed) finishes.push('Brushed');
      if (stone.finish_hammered) finishes.push('Hammered');
      if (stone.finish_sawn) finishes.push('Sawn');
      if (stone.finish_blasted) finishes.push('Blasted');
      if (finishes.length > 0) {
        doc.text(`Finish / Surface: ${finishes.join(', ')}`, textStartX, textY);
        textY += 4;
      }

      const features = [];
      if (stone.frost_resistant) features.push('Frost Resistant');
      if (stone.less_frost_resistant) features.push('Less Frost Resistant');
      if (stone.not_frost_resistant) features.push('Not Frost Resistant');
      if (features.length > 0) {
        doc.text(`Features: ${features.join(', ')}`, textStartX, textY);
        textY += 4;
      }

      textY += 2;

      yPosition = Math.max(startY + (imageAdded ? 60 : 0), textY);

      // Load and display finish details with images, grout, and size
      try {
        const { createClient } = await import('@supabase/supabase-js');
        const supabase = createClient(
          import.meta.env.VITE_SUPABASE_URL,
          import.meta.env.VITE_SUPABASE_ANON_KEY
        );

        const { data: stoneFinishes } = await supabase
          .from('stone_finishes')
          .select('*')
          .eq('stone_id', stone.id);

        if (stoneFinishes && stoneFinishes.length > 0) {
          if (yPosition > pageHeight - 60) {
            doc.addPage();
            yPosition = 25;
          }

          yPosition += 6;
          doc.setFontSize(10);
          doc.setFont(undefined, 'bold');
          doc.setTextColor(COLORS.gray.r, COLORS.gray.g, COLORS.gray.b);
          doc.text('Finish / Surface Details:', 30, yPosition);
          doc.setFont(undefined, 'normal');
          yPosition += 6;

          for (const finish of stoneFinishes) {
            if (yPosition > pageHeight - 50) {
              doc.addPage();
              yPosition = 25;
            }

            const finishStartY = yPosition;
            let finishImageAdded = false;

            if (finish.image_url) {
              try {
                const dataUrl = await loadImageAsDataURL(finish.image_url);
                const imgWidth = 38;
                const imgHeight = 38;
                doc.addImage(dataUrl, 'JPEG', 40, yPosition, imgWidth, imgHeight);
                finishImageAdded = true;
              } catch (error) {
                console.error('Failed to load finish image:', error);
              }
            }

            const finishTextX = finishImageAdded ? 82 : 40;
            let finishTextY = yPosition + 3;

            doc.setFontSize(10);
            doc.setFont(undefined, 'bold');
            doc.setTextColor(COLORS.darkGray.r, COLORS.darkGray.g, COLORS.darkGray.b);
            const finishLabel = finish.finish_type.charAt(0).toUpperCase() + finish.finish_type.slice(1);
            doc.text(finishLabel, finishTextX, finishTextY);
            finishTextY += 5;
            doc.setFont(undefined, 'normal');
            doc.setFontSize(8);
            doc.setTextColor(COLORS.gray.r, COLORS.gray.g, COLORS.gray.b);

            if (finish.grout) {
              doc.text(`Grout: ${finish.grout}`, finishTextX, finishTextY);
              finishTextY += 3.5;
            }

            if (finish.size) {
              doc.text(`Size: ${finish.size}`, finishTextX, finishTextY);
              finishTextY += 3.5;
            }

            yPosition = Math.max(finishStartY + (finishImageAdded ? 42 : 0), finishTextY + 3);
          }

          yPosition += 3;
        }
      } catch (error) {
        console.log('Error loading finish details:', error);
      }

      if (selection.is_tile_combination) {
        const cobblestones = selection.child_selections || [];

        console.log('Checking tile combination for selection:', selection.id);
        console.log('Found cobblestones:', cobblestones.length);
        console.log('Cobblestones data:', cobblestones);

        if (cobblestones.length > 0) {
          if (yPosition > pageHeight - 60) {
            doc.addPage();
            yPosition = 25;
          }

          yPosition += 6;
          doc.setFontSize(10);
          doc.setFont(undefined, 'bold');
          doc.setTextColor(COLORS.gray.r, COLORS.gray.g, COLORS.gray.b);
          doc.text('Cobblestones:', 30, yPosition);
          doc.setFont(undefined, 'normal');
          yPosition += 6;

          for (const cobblestone of cobblestones) {
            const cobblestoneStone = cobblestone.stone;
            if (!cobblestoneStone) continue;

            if (yPosition > pageHeight - 50) {
              doc.addPage();
              yPosition = 25;
            }

            const cobblestoneStartY = yPosition;
            let cobblestoneImageAdded = false;

            // Load primary image for cobblestone from stone_images table
            let cobblestoneImageUrl = cobblestoneStone.image_url;
            try {
              const { createClient } = await import('@supabase/supabase-js');
              const supabase = createClient(
                import.meta.env.VITE_SUPABASE_URL,
                import.meta.env.VITE_SUPABASE_ANON_KEY
              );

              const { data: imageData } = await supabase
                .from('stone_images')
                .select('image_url')
                .eq('stone_id', cobblestoneStone.id)
                .eq('is_primary', true)
                .single();

              if (imageData?.image_url) {
                cobblestoneImageUrl = imageData.image_url;
              }
            } catch (error) {
              console.log('No primary cobblestone image found, using fallback');
            }

            if (cobblestoneImageUrl) {
              try {
                const dataUrl = await loadImageAsDataURL(cobblestoneImageUrl);
                const imgWidth = 38;
                const imgHeight = 38;
                doc.addImage(dataUrl, 'JPEG', 40, yPosition, imgWidth, imgHeight);
                cobblestoneImageAdded = true;
              } catch (error) {
                console.error('Failed to load cobblestone image:', error);
              }
            }

            const cobblestoneTextX = cobblestoneImageAdded ? 82 : 40;
            let cobblestoneTextY = yPosition + 3;

            doc.setFontSize(10);
            doc.setFont(undefined, 'bold');
            doc.setTextColor(COLORS.darkGray.r, COLORS.darkGray.g, COLORS.darkGray.b);
            doc.text(cobblestoneStone.name, cobblestoneTextX, cobblestoneTextY);
            cobblestoneTextY += 5;
            doc.setFont(undefined, 'normal');
            doc.setFontSize(8);
            doc.setTextColor(COLORS.gray.r, COLORS.gray.g, COLORS.gray.b);

            if (cobblestoneStone.morphology) {
              doc.text(`Type: ${cobblestoneStone.morphology}`, cobblestoneTextX, cobblestoneTextY);
              cobblestoneTextY += 3.5;
            }

            if (cobblestoneStone.origin) {
              doc.text(`Origin: ${cobblestoneStone.origin}`, cobblestoneTextX, cobblestoneTextY);
              cobblestoneTextY += 3.5;
            }

            if (cobblestoneStone.stone_color) {
              doc.text(`Color: ${cobblestoneStone.stone_color}`, cobblestoneTextX, cobblestoneTextY);
              cobblestoneTextY += 3.5;
            }

            if (cobblestoneStone.producer) {
              doc.text(`Producer: ${cobblestoneStone.producer}`, cobblestoneTextX, cobblestoneTextY);
              cobblestoneTextY += 3.5;
            }

            if (cobblestoneStone.region_of_use) {
              const regions = `Regions: ${cobblestoneStone.region_of_use}`;
              const splitRegions = doc.splitTextToSize(regions, pageWidth - cobblestoneTextX - 20);
              doc.text(splitRegions, cobblestoneTextX, cobblestoneTextY);
              cobblestoneTextY += splitRegions.length * 3.5;
            }

            if (cobblestoneStone.application) {
              const apps = `Applications: ${cobblestoneStone.application}`;
              const splitApps = doc.splitTextToSize(apps, pageWidth - cobblestoneTextX - 20);
              doc.text(splitApps, cobblestoneTextX, cobblestoneTextY);
              cobblestoneTextY += splitApps.length * 3.5;
            }

            if (cobblestoneStone.surface_finish) {
              const finishes = `Finishes: ${cobblestoneStone.surface_finish}`;
              const splitFinishes = doc.splitTextToSize(finishes, pageWidth - cobblestoneTextX - 20);
              doc.text(splitFinishes, cobblestoneTextX, cobblestoneTextY);
              cobblestoneTextY += splitFinishes.length * 3.5;
            }

            if (cobblestoneStone.features) {
              const features = `Features: ${cobblestoneStone.features}`;
              const splitFeatures = doc.splitTextToSize(features, pageWidth - cobblestoneTextX - 20);
              doc.text(splitFeatures, cobblestoneTextX, cobblestoneTextY);
              cobblestoneTextY += splitFeatures.length * 3.5;
            }

            yPosition = Math.max(cobblestoneStartY + (cobblestoneImageAdded ? 42 : 0), cobblestoneTextY + 3);
          }

          yPosition += 3;
        }
      }

      yPosition += 8;
    }
  }

  doc.setFillColor(COLORS.darkGray.r, COLORS.darkGray.g, COLORS.darkGray.b);
  doc.rect(0, pageHeight - 15, pageWidth, 15, 'F');
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.text(
    '© Enea\'s Academy',
    pageWidth / 2,
    pageHeight - 7,
    { align: 'center' }
  );
  doc.setFontSize(7);
  doc.setTextColor(200, 200, 200);
  doc.text(
    'www.enea.ch',
    pageWidth / 2,
    pageHeight - 3,
    { align: 'center' }
  );

  const fileName = `ENEA-SEED-selection-${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
};
