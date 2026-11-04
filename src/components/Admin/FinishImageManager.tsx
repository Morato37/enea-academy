import React, { useState, useEffect } from 'react';
import { supabase, Stone } from '../../lib/supabase';
import { Upload, Loader, X, Image as ImageIcon, Save, Plus, Trash2 } from 'lucide-react';

interface FinishImageManagerProps {
  stone: Stone;
  onUpdate: () => void;
}

type FinishType = 'split' | 'flamed' | 'flamed_wild' | 'split_antique_wild' | 'blasted' | 'sawn' | 'hammered' | 'brushed' | 'polished' | 'honed';

interface StoneFinish {
  id: number;
  stone_id: number;
  finish_type: string;
  image_url: string | null;
  grout: string | null;
  size: string | null;
  pattern: string | null;
}

const FINISH_TYPES: { key: FinishType; label: string; enabledKey: keyof Stone }[] = [
  { key: 'split', label: 'Split', enabledKey: 'finish_split' },
  { key: 'flamed', label: 'Flamed', enabledKey: 'finish_flamed' },
  { key: 'flamed_wild', label: 'Flamed Wild', enabledKey: 'finish_flamed_wild' },
  { key: 'split_antique_wild', label: 'Split Antique Wild', enabledKey: 'finish_split_antique_wild' },
  { key: 'blasted', label: 'Blasted', enabledKey: 'finish_blasted' },
  { key: 'sawn', label: 'Sawn', enabledKey: 'finish_sawn' },
  { key: 'hammered', label: 'Hammered', enabledKey: 'finish_hammered' },
  { key: 'brushed', label: 'Brushed', enabledKey: 'finish_brushed' },
  { key: 'polished', label: 'Polished', enabledKey: 'finish_polished' },
  { key: 'honed', label: 'Honed', enabledKey: 'finish_honed' },
];

export const FinishImageManager: React.FC<FinishImageManagerProps> = ({ stone, onUpdate }) => {
  const [finishes, setFinishes] = useState<StoneFinish[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<number | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [saving, setSaving] = useState<number | 'new' | null>(null);
  const [deletingFinish, setDeletingFinish] = useState<number | null>(null);
  const [editingFinish, setEditingFinish] = useState<{ [key: number]: { grout: string; size: string; pattern: string } }>({});
  const [showAddFinish, setShowAddFinish] = useState(false);
  const [newFinishType, setNewFinishType] = useState('');

  useEffect(() => {
    loadFinishes();
  }, [stone.id]);

  const loadFinishes = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('stone_finishes')
        .select('*')
        .eq('stone_id', stone.id);

      if (error) throw error;
      setFinishes(data || []);

      const editState: { [key: number]: { grout: string; size: string; pattern: string } } = {};
      (data || []).forEach(f => {
        editState[f.id] = {
          grout: f.grout || '',
          size: f.size || '',
          pattern: f.pattern || ''
        };
      });
      setEditingFinish(editState);
    } catch (err) {
      console.error('Error loading finishes:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (finishId: number, file: File) => {
    setUploading(finishId);
    try {
      const finish = finishes.find(f => f.id === finishId);
      if (!finish) return;

      const fileExt = file.name.split('.').pop();
      const fileName = `${stone.id}_${finish.finish_type}_${Date.now()}.${fileExt}`;
      const filePath = `stones/finishes/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('stone-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('stone-images')
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from('stone_finishes')
        .update({ image_url: publicUrl })
        .eq('id', finishId);

      if (updateError) throw updateError;

      await loadFinishes();
      onUpdate();
    } catch (err) {
      console.error('Error uploading finish image:', err);
      alert('Failed to upload image');
    } finally {
      setUploading(null);
    }
  };

  const handleDelete = async (finishId: number) => {
    const finish = finishes.find(f => f.id === finishId);
    if (!finish || !window.confirm(`Delete ${finish.finish_type} finish image?`)) return;

    setDeleting(finishId);
    try {
      if (finish.image_url) {
        const path = finish.image_url.split('/stones/finishes/')[1];
        if (path) {
          await supabase.storage
            .from('stone-images')
            .remove([`stones/finishes/${path}`]);
        }
      }

      const { error } = await supabase
        .from('stone_finishes')
        .update({ image_url: null })
        .eq('id', finishId);

      if (error) throw error;

      await loadFinishes();
      onUpdate();
    } catch (err) {
      console.error('Error deleting finish image:', err);
      alert('Failed to delete image');
    } finally {
      setDeleting(null);
    }
  };

  const handleSaveAttributes = async (finishId: number) => {
    setSaving(finishId);
    try {
      const editData = editingFinish[finishId];
      if (!editData) return;

      const { error: updateError } = await supabase
        .from('stone_finishes')
        .update({
          grout: editData.grout || null,
          size: editData.size || null,
          pattern: editData.pattern || null
        })
        .eq('id', finishId);

      if (updateError) throw updateError;

      await loadFinishes();
      onUpdate();
    } catch (err) {
      console.error('Error saving finish attributes:', err);
      alert('Failed to save attributes');
    } finally {
      setSaving(null);
    }
  };

  const updateEditingFinish = (finishId: number, field: 'grout' | 'size' | 'pattern', value: string) => {
    setEditingFinish(prev => ({
      ...prev,
      [finishId]: {
        ...prev[finishId],
        [field]: value
      }
    }));
  };

  const handleCreateFinish = async () => {
    if (!newFinishType.trim()) {
      alert('Please enter a finish type');
      return;
    }

    setSaving('new');
    try {
      const { error } = await supabase
        .from('stone_finishes')
        .insert({
          stone_id: stone.id,
          finish_type: newFinishType.toLowerCase().trim()
        });

      if (error) throw error;

      setNewFinishType('');
      setShowAddFinish(false);
      await loadFinishes();
      onUpdate();
    } catch (err) {
      console.error('Error creating finish:', err);
      alert('Failed to create finish');
    } finally {
      setSaving(null);
    }
  };

  const handleDeleteFinish = async (finishId: number) => {
    const finish = finishes.find(f => f.id === finishId);
    if (!finish || !window.confirm(`Delete the entire "${finish.finish_type}" finish? This will remove all associated data.`)) {
      return;
    }

    setDeletingFinish(finishId);
    try {
      if (finish.image_url) {
        const path = finish.image_url.split('/stones/finishes/')[1];
        if (path) {
          await supabase.storage
            .from('stone-images')
            .remove([`stones/finishes/${path}`]);
        }
      }

      const { error } = await supabase
        .from('stone_finishes')
        .delete()
        .eq('id', finishId);

      if (error) throw error;

      await loadFinishes();
      onUpdate();
    } catch (err) {
      console.error('Error deleting finish:', err);
      alert('Failed to delete finish');
    } finally {
      setDeletingFinish(null);
    }
  };

  const displayFinishes = finishes.map(finish => {
    const standardFinish = FINISH_TYPES.find(f => f.key === finish.finish_type);
    return {
      id: finish.id,
      label: standardFinish?.label || finish.finish_type.charAt(0).toUpperCase() + finish.finish_type.slice(1),
      isCustom: !standardFinish,
      finish
    };
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader className="w-8 h-8 text-gray-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">Finish-Specific Images & Attributes</h3>
        <button
          onClick={() => setShowAddFinish(!showAddFinish)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Finish
        </button>
      </div>

      {showAddFinish && (
        <div className="bg-gray-50 border border-gray-300 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-3">Create New Finish</h4>
          <div className="flex gap-3">
            <input
              type="text"
              value={newFinishType}
              onChange={(e) => setNewFinishType(e.target.value)}
              placeholder="Enter finish type (e.g., sandblasted, bush-hammered)"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreateFinish();
              }}
            />
            <button
              onClick={handleCreateFinish}
              disabled={saving === 'new'}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition-colors flex items-center gap-2"
            >
              {saving === 'new' ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Create
                </>
              )}
            </button>
            <button
              onClick={() => {
                setShowAddFinish(false);
                setNewFinishType('');
              }}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
            >
              Cancel
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Tip: Standard finishes include split, flamed, blasted, sawn, hammered, brushed, polished, and honed
          </p>
        </div>
      )}

      {displayFinishes.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-600">No finishes created yet</p>
          <p className="text-sm text-gray-500 mt-1">Click "Add Finish" to create your first finish</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayFinishes.map(({ id, label, isCustom, finish }) => {
        const imageUrl = finish.image_url;
        const isUploading = uploading === id;
        const isDeleting = deleting === id;
        const isSaving = saving === id;
        const editData = editingFinish[id] || { grout: '', size: '', pattern: '' };

        return (
          <div key={id} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="bg-gray-50 px-4 py-2 border-b border-gray-200 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <h4 className="font-semibold text-gray-900">{label}</h4>
                {isCustom && (
                  <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded-full">
                    Custom
                  </span>
                )}
              </div>
              <button
                onClick={() => handleDeleteFinish(id)}
                disabled={deletingFinish === id}
                className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                title="Delete this finish"
              >
                {deletingFinish === id ? (
                  <Loader className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
              </button>
            </div>

            <div className="p-4 space-y-4">
              {/* Image Section */}
              {imageUrl ? (
                <div className="space-y-3">
                  <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden">
                    <img
                      src={imageUrl}
                      alt={`${label} finish`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <button
                    onClick={() => handleDelete(id)}
                    disabled={isDeleting}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 transition-colors text-sm"
                  >
                    {isDeleting ? (
                      <>
                        <Loader className="w-4 h-4 animate-spin" />
                        Deleting...
                      </>
                    ) : (
                      <>
                        <X className="w-4 h-4" />
                        Remove Image
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300">
                    <ImageIcon className="w-12 h-12 text-gray-400" />
                  </div>
                  <label className="block">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleUpload(id, file);
                      }}
                      disabled={isUploading}
                      className="hidden"
                    />
                    <div className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors cursor-pointer text-sm">
                      {isUploading ? (
                        <>
                          <Loader className="w-4 h-4 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4" />
                          Upload Image
                        </>
                      )}
                    </div>
                  </label>
                </div>
              )}

              {/* Attributes Section */}
              <div className="space-y-3 border-t border-gray-200 pt-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Grout
                  </label>
                  <input
                    type="text"
                    value={editData.grout}
                    onChange={(e) => updateEditingFinish(id, 'grout', e.target.value)}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                    placeholder="e.g., 5mm, 10mm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Size
                  </label>
                  <input
                    type="text"
                    value={editData.size}
                    onChange={(e) => updateEditingFinish(id, 'size', e.target.value)}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                    placeholder="e.g., 60x40cm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Pattern
                  </label>
                  <input
                    type="text"
                    value={editData.pattern}
                    onChange={(e) => updateEditingFinish(id, 'pattern', e.target.value)}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                    placeholder="e.g., 10X5"
                  />
                </div>
                <button
                  onClick={() => handleSaveAttributes(id)}
                  disabled={isSaving}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition-colors text-sm"
                >
                  {isSaving ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Save Attributes
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        );
      })}
        </div>
      )}
    </div>
  );
};
