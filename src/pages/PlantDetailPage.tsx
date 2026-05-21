import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { supabase, Plant } from '../lib/supabase';
import { ArrowLeft, Save, Loader, X, Star, Upload, Check, AlertCircle, Clock } from 'lucide-react';
import { ImageUploader } from '../components/Admin/ImageUploader';
import { useAutoSave } from '../lib/useAutoSave';

export const PlantDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const fromTab = searchParams.get('from') || 'plants';
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [plant, setPlant] = useState<Partial<Plant>>({
    botanical_name: '',
    common_name_de: '',
    common_name_en: '',
  });
  const [pendingImages, setPendingImages] = useState<{ file: File; preview: string; isPrimary: boolean }[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const isNewPlant = id === 'new';

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    if (!isNewPlant) {
      loadPlant();
    } else {
      setLoading(false);
    }
  }, [id]);

  const saveExistingPlant = useCallback(async (data: Partial<Plant>) => {
    const cleanedPlant = { ...data };
    const colorFields = [
      'color_jan', 'color_feb', 'color_mar', 'color_apr',
      'color_may', 'color_jun', 'color_jul', 'color_aug',
      'color_sep', 'color_oct', 'color_nov', 'color_dec'
    ];
    colorFields.forEach(field => {
      const key = field as keyof typeof cleanedPlant;
      if (cleanedPlant[key] === '' || cleanedPlant[key] === undefined) {
        cleanedPlant[key] = null as any;
      }
    });
    if (cleanedPlant.layer === undefined || cleanedPlant.layer === '') {
      cleanedPlant.layer = null as any;
    }
    const { error } = await supabase
      .from('plants_flat')
      .update(cleanedPlant)
      .eq('id', id);
    if (error) throw error;
  }, [id]);

  const { status: autoSaveStatus } = useAutoSave(
    plant,
    saveExistingPlant,
    { enabled: !isNewPlant && !loading }
  );

  const loadPlant = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('plants_flat')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setPlant(data);
    } catch (err) {
      console.error('Error loading plant:', err);
      alert('Failed to load plant');
      navigate(`/admin?tab=${fromTab}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!plant.botanical_name) {
      alert('Botanical name is required');
      return;
    }

    if (isNewPlant) {
      setSaving(true);
      try {
        const { id: _id, ...rest } = plant;
        const plantData = Object.fromEntries(
          Object.entries(rest).filter(([_, v]) => {
            if (typeof v === 'boolean') return true;
            return v !== undefined && v !== null && v !== '';
          })
        );
        const { data: newPlant, error } = await supabase
          .from('plants_flat')
          .insert([plantData])
          .select()
          .single();

        if (error) throw error;

        if (pendingImages.length > 0 && newPlant) {
          await uploadPendingImages(newPlant.id);
        }

        alert('Plant created successfully');
        navigate(`/admin?tab=${fromTab}`);
      } catch (err: any) {
        console.error('Error saving plant:', err);
        alert(`Failed to save plant: ${err.message || JSON.stringify(err)}`);
      } finally {
        setSaving(false);
      }
    } else {
      // For existing plants, trigger an immediate save via the auto-save function
      setSaving(true);
      try {
        await saveExistingPlant(plant);
      } catch (err: any) {
        console.error('Error saving plant:', err);
        alert(`Failed to save plant: ${err.message || JSON.stringify(err)}`);
      } finally {
        setSaving(false);
      }
    }
  };

  const uploadPendingImages = async (plantId: number) => {
    try {
      let primaryImageUrl: string | null = null;

      for (let i = 0; i < pendingImages.length; i++) {
        const { file, isPrimary } = pendingImages[i];

        const fileExt = file.name.split('.').pop();
        const fileName = `${plantId}_${Date.now()}_${i}.${fileExt}`;
        const filePath = `plants/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('plant-images')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('plant-images')
          .getPublicUrl(filePath);

        // Save to plant_images table
        const { error: insertError } = await supabase
          .from('plant_images')
          .insert({
            plant_id: plantId,
            image_url: publicUrl,
            display_order: i,
            is_primary: isPrimary
          });

        if (insertError) throw insertError;

        if (isPrimary) {
          primaryImageUrl = publicUrl;
        }
      }

      // Update plants_flat with primary image URL
      if (primaryImageUrl) {
        const { error: updateError } = await supabase
          .from('plants_flat')
          .update({ image_url: primaryImageUrl })
          .eq('id', plantId);

        if (updateError) throw updateError;
      }
    } catch (err) {
      console.error('Error uploading images:', err);
      throw err;
    }
  };

  const handleImagesSelect = (files: FileList) => {
    const newImages = Array.from(files).map((file, index) => ({
      file,
      preview: URL.createObjectURL(file),
      isPrimary: pendingImages.length === 0 && index === 0 // First image is primary by default
    }));
    setPendingImages([...pendingImages, ...newImages]);
  };

  const removePendingImage = (index: number) => {
    const newImages = pendingImages.filter((_, i) => i !== index);
    // If we removed the primary image, make the first image primary
    if (pendingImages[index].isPrimary && newImages.length > 0) {
      newImages[0].isPrimary = true;
    }
    setPendingImages(newImages);
  };

  const setPrimaryImage = (index: number) => {
    const newImages = pendingImages.map((img, i) => ({
      ...img,
      isPrimary: i === index
    }));
    setPendingImages(newImages);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleImagesSelect(files);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader className="w-8 h-8 text-gray-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <button
            onClick={() => navigate(`/admin?tab=${fromTab}`)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Admin
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">
              {isNewPlant ? 'Add New Plant' : 'Edit Plant'}
            </h1>
          </div>

          <div className="space-y-6">
            {/* Basic Information */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">
                    Botanical Name *
                  </label>
                  <input
                    type="text"
                    value={plant.botanical_name || ''}
                    onChange={(e) => setPlant({ ...plant, botanical_name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
                    placeholder="e.g., Acer palmatum"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">
                    Common Name (English)
                  </label>
                  <input
                    type="text"
                    value={plant.common_name_en || ''}
                    onChange={(e) => setPlant({ ...plant, common_name_en: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
                    placeholder="e.g., Japanese Maple"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">
                    Common Name (German)
                  </label>
                  <input
                    type="text"
                    value={plant.common_name_de || ''}
                    onChange={(e) => setPlant({ ...plant, common_name_de: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
                    placeholder="e.g., Japanischer Fächerahorn"
                  />
                </div>
              </div>
            </div>

            {/* Plant Categories */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Plant Category</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { key: 'category_tree', label: 'Tree' },
                  { key: 'category_shrub', label: 'Shrub' },
                  { key: 'category_perennial', label: 'Perennial' },
                  { key: 'category_annual', label: 'Annual' },
                  { key: 'category_succulent', label: 'Succulent' },
                  { key: 'category_grass', label: 'Grass' },
                  { key: 'category_bulb', label: 'Bulb' },
                  { key: 'category_acquatic', label: 'Aquatic Plant' },
                  { key: 'category_medicinal_herbs', label: 'Medicinal Herb' },
                  { key: 'category_fern', label: 'Fern' },
                  { key: 'category_climbing_plant', label: 'Climbing Plant' },
                  { key: 'category_formal_hedge', label: 'Formal Hedge' },
                  { key: 'category_wild_hedge', label: 'Wild Hedge' },
                  { key: 'category_toxic_plant', label: 'Toxic Plant' },
                  { key: 'category_ground_cover', label: 'Ground Cover' },
                  { key: 'category_culinary_plant', label: 'Culinary Plant' },
                ].map(({ key, label }) => (
                  <label key={key} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={plant[key as keyof Plant] as boolean || false}
                      onChange={(e) => setPlant({ ...plant, [key]: e.target.checked })}
                      className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                    />
                    <span className="text-sm text-gray-900">{label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Layer */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Layer</h2>
              <div className="max-w-md">
                <select
                  value={plant.layer || ''}
                  onChange={(e) => setPlant({ ...plant, layer: e.target.value || undefined })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
                >
                  <option value="">No Layer</option>
                  <option value="Structural">Structural</option>
                  <option value="Companion">Companion</option>
                  <option value="Ground Cover">Ground Cover</option>
                  <option value="Free Floaters">Free Floaters</option>
                </select>
                <p className="mt-1 text-sm text-gray-500">
                  Select the planting layer for this plant
                </p>
              </div>
            </div>

            {/* Perennial Size - Shown when perennial or grass is selected */}
            {(plant.category_perennial || plant.category_grass) && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Perennial / Grass Size</h2>
                <div className="max-w-md">
                  <select
                    value={plant.perennial_size || ''}
                    onChange={(e) => setPlant({ ...plant, perennial_size: e.target.value || undefined })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
                  >
                    <option value="">Select Size</option>
                    <option value="short">Short (5-40 cm)</option>
                    <option value="medium">Medium (40-80 cm)</option>
                    <option value="tall">Tall (80-200 cm)</option>
                  </select>
                  <p className="mt-1 text-sm text-gray-500">
                    Select the height category for this perennial plant
                  </p>
                </div>
              </div>
            )}

            {/* Plant Characteristics */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Plant Characteristics</h2>
              <div className="space-y-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={plant.characteristic_evergreen || false}
                    onChange={(e) => setPlant({ ...plant, characteristic_evergreen: e.target.checked })}
                    className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                  />
                  <span className="text-sm text-gray-900">Evergreen</span>
                </label>
                <p className="mt-1 ml-6 text-xs text-gray-500">
                  Plant retains foliage throughout the year
                </p>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={plant.characteristic_deciduous || false}
                    onChange={(e) => setPlant({ ...plant, characteristic_deciduous: e.target.checked })}
                    className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                  />
                  <span className="text-sm text-gray-900">Deciduous</span>
                </label>
                <p className="mt-1 ml-6 text-xs text-gray-500">
                  Plant drops foliage seasonally
                </p>


                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={plant.characteristic_native || false}
                    onChange={(e) => setPlant({ ...plant, characteristic_native: e.target.checked })}
                    className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                  />
                  <span className="text-sm text-gray-900">CH Native</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={plant.characteristic_butterflies || false}
                    onChange={(e) => setPlant({ ...plant, characteristic_butterflies: e.target.checked })}
                    className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                  />
                  <span className="text-sm text-gray-900">Butterflies</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={plant.characteristic_bees || false}
                    onChange={(e) => setPlant({ ...plant, characteristic_bees: e.target.checked })}
                    className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                  />
                  <span className="text-sm text-gray-900">Bees</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={plant.characteristic_honeybees || false}
                    onChange={(e) => setPlant({ ...plant, characteristic_honeybees: e.target.checked })}
                    className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                  />
                  <span className="text-sm text-gray-900">Honeybees</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={plant.characteristic_bumblebees || false}
                    onChange={(e) => setPlant({ ...plant, characteristic_bumblebees: e.target.checked })}
                    className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                  />
                  <span className="text-sm text-gray-900">Bumblebees</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={plant.characteristic_hoverflies || false}
                    onChange={(e) => setPlant({ ...plant, characteristic_hoverflies: e.target.checked })}
                    className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                  />
                  <span className="text-sm text-gray-900">Hoverflies</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={plant.characteristic_beetles || false}
                    onChange={(e) => setPlant({ ...plant, characteristic_beetles: e.target.checked })}
                    className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                  />
                  <span className="text-sm text-gray-900">Beetles</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={plant.characteristic_birds || false}
                    onChange={(e) => setPlant({ ...plant, characteristic_birds: e.target.checked })}
                    className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                  />
                  <span className="text-sm text-gray-900">Birds</span>
                </label>
              </div>
            </div>

            {/* Sun Requirements */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Sun Requirements</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {[
                  { key: 'exposure_sun', label: 'Full Sun' },
                  { key: 'exposure_halfshade', label: 'Part Shade' },
                  { key: 'exposure_shade', label: 'Shade' },
                ].map(({ key, label }) => (
                  <label key={key} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={plant[key as keyof Plant] as boolean || false}
                      onChange={(e) => setPlant({ ...plant, [key]: e.target.checked })}
                      className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                    />
                    <span className="text-sm text-gray-900">{label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Soil Types */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Soil Types</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {[
                  { key: 'soil_sandy', label: 'Sandy' },
                  { key: 'soil_clay', label: 'Clay' },
                  { key: 'soil_loamy', label: 'Loamy' },
                ].map(({ key, label }) => (
                  <label key={key} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={plant[key as keyof Plant] as boolean || false}
                      onChange={(e) => setPlant({ ...plant, [key]: e.target.checked })}
                      className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                    />
                    <span className="text-sm text-gray-900">{label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Climate Zones */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Hardiness Zones</h2>
              <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                {[
                  'zone_5a', 'zone_5b', 'zone_6a', 'zone_6b', 'zone_7a', 'zone_7b',
                  'zone_8a', 'zone_8b', 'zone_9a', 'zone_9b', 'zone_10a', 'zone_10b'
                ].map((key) => (
                  <label key={key} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={plant[key as keyof Plant] as boolean || false}
                      onChange={(e) => setPlant({ ...plant, [key]: e.target.checked })}
                      className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                    />
                    <span className="text-sm text-gray-900">{key.replace('zone_', '')}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Usage */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Usage</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {[
                  { key: 'usage_solitary_garden', label: 'Private Garden' },
                  { key: 'usage_solitary_park', label: 'Private Park' },
                  { key: 'usage_solitary_terrace', label: 'Private Terrace' },
                ].map(({ key, label }) => (
                  <label key={key} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={plant[key as keyof Plant] as boolean || false}
                      onChange={(e) => setPlant({ ...plant, [key]: e.target.checked })}
                      className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                    />
                    <span className="text-sm text-gray-900">{label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Special Attributes */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Special Attributes</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {plant.category_tree && (
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={plant.tree_of_the_future || false}
                      onChange={(e) => setPlant({ ...plant, tree_of_the_future: e.target.checked })}
                      className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                    />
                    <span className="text-sm text-gray-900 flex items-center gap-2">
                      Tree of the Future
                      <img
                        src="/image.png"
                        alt="Badge"
                        className="w-5 h-5"
                        title="This badge will be displayed on the plant card"
                      />
                    </span>
                  </label>
                )}
              </div>
            </div>

            {/* Seasonal Colors */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Seasonal Colors</h2>
              <p className="text-sm text-gray-600 mb-4">
                Set the foliage or flower colors for each month. Leave blank if no specific color for that month.
              </p>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {[
                  { key: 'color_jan', label: 'January' },
                  { key: 'color_feb', label: 'February' },
                  { key: 'color_mar', label: 'March' },
                  { key: 'color_apr', label: 'April' },
                  { key: 'color_may', label: 'May' },
                  { key: 'color_jun', label: 'June' },
                  { key: 'color_jul', label: 'July' },
                  { key: 'color_aug', label: 'August' },
                  { key: 'color_sep', label: 'September' },
                  { key: 'color_oct', label: 'October' },
                  { key: 'color_nov', label: 'November' },
                  { key: 'color_dec', label: 'December' },
                ].map(({ key, label }) => (
                  <div key={key}>
                    <label className="block text-sm font-medium text-gray-900 mb-1">
                      {label}
                    </label>
                    <div className="flex gap-2 items-center">
                      <input
                        type="color"
                        value={plant[key as keyof Plant] as string || '#86912b'}
                        onChange={(e) => setPlant({ ...plant, [key]: e.target.value })}
                        className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                      />
                      <input
                        type="text"
                        value={plant[key as keyof Plant] as string || ''}
                        onChange={(e) => setPlant({ ...plant, [key]: e.target.value })}
                        placeholder="#86912b"
                        className="flex-1 px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Images */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Images</h2>
              {isNewPlant ? (
                <div className="space-y-4">
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`border-2 border-dashed rounded-lg p-6 transition-colors ${
                      isDragging
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-300 bg-white hover:border-green-400'
                    }`}
                  >
                    <div className="flex flex-col items-center justify-center gap-3 text-center">
                      <Upload className={`w-8 h-8 ${isDragging ? 'text-green-500' : 'text-gray-400'}`} />
                      <div>
                        <p className={`text-sm font-medium ${isDragging ? 'text-green-600' : 'text-gray-700'}`}>
                          {isDragging ? 'Drop images here' : 'Drag & drop images here'}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">or</p>
                      </div>
                      <label className="cursor-pointer">
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={(e) => {
                            if (e.target.files && e.target.files.length > 0) {
                              handleImagesSelect(e.target.files);
                            }
                            e.target.value = '';
                          }}
                          className="hidden"
                        />
                        <span className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors">
                          Browse Files
                        </span>
                      </label>
                      <p className="text-xs text-gray-500">
                        Select multiple images. Click on an image to set it as primary.
                      </p>
                    </div>
                  </div>

                  {pendingImages.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-gray-700">
                        Selected Images ({pendingImages.length}) - Click to set primary
                      </p>
                      <div className="grid grid-cols-4 gap-3">
                        {pendingImages.map((img, index) => (
                          <div
                            key={index}
                            className="relative group cursor-pointer"
                            onClick={() => setPrimaryImage(index)}
                            title={img.isPrimary ? 'Primary image' : 'Click to set as primary'}
                          >
                            <img
                              src={img.preview}
                              alt={`Preview ${index + 1}`}
                              className={`w-full aspect-square object-cover rounded transition-all ${
                                img.isPrimary
                                  ? 'border-4 border-green-600 ring-2 ring-green-200'
                                  : 'border-2 border-gray-200 hover:border-green-400'
                              }`}
                            />
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                removePendingImage(index);
                              }}
                              className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-700"
                              title="Remove image"
                            >
                              <X className="w-3 h-3" />
                            </button>
                            {img.isPrimary && (
                              <div className="absolute bottom-1 left-1 px-2 py-0.5 bg-green-600 text-white text-xs rounded font-semibold shadow-lg flex items-center gap-1">
                                <Star className="w-3 h-3 fill-white" />
                                Primary
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                      <p className="text-xs text-green-600">
                        Images will be uploaded when you save the plant
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <ImageUploader
                  itemId={Number(id)}
                  itemName={plant.botanical_name || 'Plant'}
                  currentImageUrl={plant.image_url}
                  type="plant"
                  onUploadComplete={loadPlant}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Fixed save button + auto-save indicator — bottom right */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
        {!isNewPlant && (
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-300 ${
            autoSaveStatus === 'saving' ? 'bg-blue-50 text-blue-600 border border-blue-200' :
            autoSaveStatus === 'saved'  ? 'bg-green-50 text-green-700 border border-green-200' :
            autoSaveStatus === 'pending' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
            autoSaveStatus === 'error'  ? 'bg-red-50 text-red-600 border border-red-200' :
            'bg-gray-50 text-gray-400 border border-gray-200'
          }`}>
            {autoSaveStatus === 'saving'  && <><Loader className="w-3 h-3 animate-spin" /> Saving…</>}
            {autoSaveStatus === 'saved'   && <><Check className="w-3 h-3" /> Saved</>}
            {autoSaveStatus === 'pending' && <><Clock className="w-3 h-3" /> Unsaved changes</>}
            {autoSaveStatus === 'error'   && <><AlertCircle className="w-3 h-3" /> Save failed</>}
            {autoSaveStatus === 'idle'    && <><Check className="w-3 h-3" /> Up to date</>}
          </div>
        )}
        <button
          onClick={handleSave}
          disabled={saving || autoSaveStatus === 'saving'}
          className="flex items-center gap-2 px-5 py-3 bg-green-600 text-white rounded-xl shadow-lg hover:bg-green-700 disabled:bg-gray-400 transition-colors text-sm font-medium"
        >
          {saving || autoSaveStatus === 'saving' ? <Loader className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving || autoSaveStatus === 'saving' ? 'Saving...' : isNewPlant ? 'Create Plant' : 'Save'}
        </button>
      </div>
    </div>
  );
};
