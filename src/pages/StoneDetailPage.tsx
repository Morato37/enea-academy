import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { supabase, Stone } from '../lib/supabase';
import { ArrowLeft, Save, Loader } from 'lucide-react';
import { ImageUploader } from '../components/Admin/ImageUploader';
import { StoneCombinationsManager } from '../components/Admin/StoneCombinationsManager';
import { FinishImageManager } from '../components/Admin/FinishImageManager';
import { FinishQRCodeGenerator } from '../components/Admin/FinishQRCodeGenerator';

export const StoneDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const fromTab = searchParams.get('from') || 'stones';
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [stone, setStone] = useState<Partial<Stone>>({
    name: '',
    morphology: '',
    producer_seller: '',
    origin: '',
    stone_color: '',
  });
  const [pendingImageFile, setPendingImageFile] = useState<File | null>(null);

  const isNewStone = id === 'new';

  useEffect(() => {
    if (!isNewStone) {
      loadStone();
    } else {
      setLoading(false);
    }
  }, [id]);

  const loadStone = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('stones')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setStone(data);
    } catch (err) {
      console.error('Error loading stone:', err);
      alert('Failed to load stone');
      navigate(`/admin?tab=${fromTab}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!stone.name) {
      alert('Name is required');
      return;
    }

    setSaving(true);
    try {
      if (isNewStone) {
        // Remove id and any undefined/null fields for new stones
        const { id: _id, ...rest } = stone;
        const stoneData = Object.fromEntries(
          Object.entries(rest).filter(([_, v]) => v !== undefined && v !== null && v !== '')
        );
        const { data: newStone, error } = await supabase
          .from('stones')
          .insert([stoneData])
          .select()
          .single();

        if (error) throw error;

        // If there's a pending image, upload it now
        if (pendingImageFile && newStone) {
          await uploadPendingImage(newStone.id, pendingImageFile);
        }

        alert('Stone created successfully');
        navigate(`/admin?tab=${fromTab}`);
      } else {
        const { error } = await supabase
          .from('stones')
          .update(stone)
          .eq('id', id);

        if (error) throw error;
        alert('Stone updated successfully');
        await loadStone();
      }
    } catch (err: any) {
      console.error('Error saving stone:', err);
      alert(`Failed to save stone: ${err.message || JSON.stringify(err)}`);
    } finally {
      setSaving(false);
    }
  };

  const uploadPendingImage = async (stoneId: number, file: File) => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${stoneId}_${Date.now()}.${fileExt}`;
      const filePath = `stones/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('stone-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('stone-images')
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from('stones')
        .update({ image_url: publicUrl })
        .eq('id', stoneId);

      if (updateError) throw updateError;
    } catch (err) {
      console.error('Error uploading image:', err);
      throw err;
    }
  };

  const handleImageSelect = (file: File) => {
    setPendingImageFile(file);
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
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-900">
              {isNewStone ? 'Add New Stone' : 'Edit Stone'}
            </h1>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>

          <div className="space-y-6">
            {/* Basic Information */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">
                    Name *
                  </label>
                  <input
                    type="text"
                    value={stone.name || ''}
                    onChange={(e) => setStone({ ...stone, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                    placeholder="e.g., Granite"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">
                    Morphology
                  </label>
                  <input
                    type="text"
                    value={stone.morphology || ''}
                    onChange={(e) => setStone({ ...stone, morphology: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                    placeholder="e.g., Metamorphic"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">
                    Origin
                  </label>
                  <input
                    type="text"
                    value={stone.origin || ''}
                    onChange={(e) => setStone({ ...stone, origin: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                    placeholder="e.g., Italy"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">
                    Producer/Seller
                  </label>
                  <input
                    type="text"
                    value={stone.producer_seller || ''}
                    onChange={(e) => setStone({ ...stone, producer_seller: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                    placeholder="e.g., Stone Works Ltd"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">
                    Color
                  </label>
                  <input
                    type="text"
                    value={stone.stone_color || ''}
                    onChange={(e) => setStone({ ...stone, stone_color: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                    placeholder="e.g., Gray, White, Black"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">
                    Category *
                  </label>
                  <select
                    value={stone.stone_category || 'tile'}
                    onChange={(e) => setStone({ ...stone, stone_category: e.target.value as 'tile' | 'cobblestone' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                  >
                    <option value="tile">Tile</option>
                    <option value="cobblestone">Cobblestone</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Hardiness Zones */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Hardiness Zones</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {[
                  { key: 'mediterranean_zone', label: 'Mediterranean' },
                  { key: 'central_europe_zone', label: 'Central Europe' },
                  { key: 'alpine_zone', label: 'Alpine' },
                ].map(({ key, label }) => (
                  <label key={key} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={stone[key as keyof Stone] as boolean || false}
                      onChange={(e) => setStone({ ...stone, [key]: e.target.checked })}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-900">{label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Applications/Uses */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Applications</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {[
                  { key: 'use_tiles', label: 'Tiles' },
                  { key: 'use_block_steps', label: 'Block Steps' },
                  { key: 'use_paving', label: 'Paving' },
                  { key: 'use_walls', label: 'Walls' },
                  { key: 'use_pool', label: 'Pool' },
                  { key: 'use_chippings', label: 'Chippings' },
                ].map(({ key, label }) => (
                  <label key={key} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={stone[key as keyof Stone] as boolean || false}
                      onChange={(e) => setStone({ ...stone, [key]: e.target.checked })}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-900">{label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Finish / Surface */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Finish / Surface</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { key: 'finish_split', label: 'Split' },
                  { key: 'finish_flamed', label: 'Flamed' },
                  { key: 'finish_flamed_wild', label: 'Flamed Wild' },
                  { key: 'finish_split_antique_wild', label: 'Split Antique Wild' },
                  { key: 'finish_blasted', label: 'Blasted' },
                  { key: 'finish_sawn', label: 'Sawn' },
                  { key: 'finish_hammered', label: 'Hammered' },
                  { key: 'finish_brushed', label: 'Brushed' },
                  { key: 'finish_polished', label: 'Polished' },
                  { key: 'finish_honed', label: 'Honed' },
                ].map(({ key, label }) => (
                  <label key={key} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={stone[key as keyof Stone] as boolean || false}
                      onChange={(e) => setStone({ ...stone, [key]: e.target.checked })}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-900">{label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Frost Resistance */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Frost Resistance</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {[
                  { key: 'frost_resistant', label: 'Frost Resistant' },
                  { key: 'less_frost_resistant', label: 'Less Frost Resistant' },
                  { key: 'not_frost_resistant', label: 'Not Frost Resistant' },
                ].map(({ key, label }) => (
                  <label key={key} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={stone[key as keyof Stone] as boolean || false}
                      onChange={(e) => setStone({ ...stone, [key]: e.target.checked })}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-900">{label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Images */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Images</h2>
              {isNewStone ? (
                <div className="space-y-2">
                  <label className="block">
                    <span className="text-sm font-medium text-gray-700">Stone Image (optional)</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleImageSelect(file);
                      }}
                      className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                  </label>
                  {pendingImageFile && (
                    <p className="text-sm text-blue-600">
                      Selected: {pendingImageFile.name} (will be uploaded when you save)
                    </p>
                  )}
                </div>
              ) : (
                <ImageUploader
                  itemId={Number(id)}
                  itemName={stone.name || 'Stone'}
                  currentImageUrl={stone.image_url}
                  type="stone"
                  onUploadComplete={loadStone}
                />
              )}
            </div>

            {/* Finish-Specific Images */}
            {!isNewStone && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Finish-Specific Images</h2>
                <p className="text-sm text-gray-600 mb-4">
                  Upload images for each finish type. These will be displayed when users scan QR codes for specific finishes.
                </p>
                <FinishImageManager
                  stone={stone as Stone}
                  onUpdate={loadStone}
                />
              </div>
            )}

            {/* QR Code Generation */}
            {!isNewStone && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">QR Codes for Finish / Surface</h2>
                <p className="text-sm text-gray-600 mb-4">
                  Generate and download QR codes for each finish. Users can scan these to view the specific finish.
                </p>
                <FinishQRCodeGenerator stone={stone as Stone} />
              </div>
            )}

            {/* Stone Combinations */}
            {!isNewStone && stone.stone_category && (stone.stone_category === 'tile' || stone.stone_category === 'cobblestone') && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Stone Combinations</h2>
                <StoneCombinationsManager
                  stoneId={Number(id)}
                  stoneCategory={stone.stone_category}
                  stoneName={stone.name || ''}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
