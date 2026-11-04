import React, { useEffect, useMemo, useState } from 'react';
import {
  Archive, CheckCircle, Edit2, File, FileImage, FileText, Film, Save, Upload, X, AlertCircle,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

const MAX_FILE_SIZE = 1024 * 1024 * 1024; // 1 GB
const CATEGORIES = [
  { value: 'general_information', label: 'General Information' },
  { value: 'templates', label: 'Templates' },
  { value: 'technical_information', label: 'Technical Information' },
] as const;
const ACCEPTED_TYPES = [
  'application/pdf', 'video/mp4', 'video/webm', 'video/quicktime',
  'image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml',
  'text/plain', 'application/zip', 'application/x-zip-compressed',
  'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
];
type Category = typeof CATEGORIES[number]['value'];
interface MediaItem { id: string; filename: string; displayName: string; description: string | null; category: Category; subgroup: string | null; sortOrder: number; storagePath: string; mimeType: string; fileType: string; size: number; url: string; }
interface PendingUpload { file: File; displayName: string; description: string; category: Category; subgroup: string; sortOrder: number; }

const formatFileSize = (bytes: number) => {
  if (!bytes) return '0 Bytes';
  const units = ['Bytes', 'KB', 'MB', 'GB'];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${Math.round((bytes / 1024 ** index) * 100) / 100} ${units[index]}`;
};
const typeLabel = (mimeType: string) => mimeType.startsWith('video/') ? 'Video' : mimeType.startsWith('image/') ? 'Image' : mimeType === 'application/pdf' ? 'PDF' : 'File';
const IconForType = ({ mimeType, className = 'w-8 h-8' }: { mimeType: string; className?: string }) => mimeType.startsWith('video/') ? <Film className={className} /> : mimeType.startsWith('image/') ? <FileImage className={className} /> : mimeType === 'application/pdf' ? <FileText className={className} /> : mimeType.includes('zip') ? <Archive className={className} /> : <File className={className} />;

interface SubgroupFieldProps {
  value: string;
  options: string[];
  onChange: (value: string) => void;
}

const SubgroupField: React.FC<SubgroupFieldProps> = ({ value, options, onChange }) => (
  <div className="space-y-1">
    <select
      value={value === '' ? '' : options.includes(value) ? value : '__new__'}
      onChange={(event) => onChange(event.target.value === '__new__' ? '' : event.target.value)}
      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white"
      aria-label="Choose existing subgroup"
    >
      <option value="">No subgroup</option>
      {options.map((option) => <option key={option} value={option}>{option}</option>)}
      <option value="__new__">Create new subgroup…</option>
    </select>
    {(!value || !options.includes(value)) && (
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
        placeholder="New subgroup name"
        aria-label="New subgroup name"
      />
    )}
  </div>
);

export default function PDFUploader() {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [pending, setPending] = useState<PendingUpload[]>([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ displayName: '', description: '', category: 'general_information' as Category, subgroup: '', sortOrder: 0 });
  const subgroupOptions = useMemo(
    () => Array.from(new Set(items.map(item => item.subgroup).filter((value): value is string => Boolean(value && value.trim())))).sort((a, b) => a.localeCompare(b)),
    [items],
  );

  const loadItems = async () => {
    const { data, error: loadError } = await supabase.from('documents_metadata').select('*').order('created_at', { ascending: false });
    if (loadError) { console.error('Media load error:', loadError); setError('The files could not be loaded.'); return; }
    setItems((data || []).map((doc) => ({
      id: doc.id, filename: doc.filename, displayName: doc.display_name, description: doc.description,
      category: doc.category as Category, subgroup: doc.subgroup || null, sortOrder: doc.sort_order || 0, storagePath: doc.storage_path, mimeType: doc.mime_type || 'application/pdf',
      fileType: typeLabel(doc.mime_type || 'application/pdf'), size: doc.file_size || 0,
      url: supabase.storage.from('documents').getPublicUrl(doc.storage_path).data.publicUrl,
    })));
  };

  useEffect(() => { void loadItems(); }, []);

  const validateFiles = (files: File[]) => {
    const invalid = files.find((file) => !ACCEPTED_TYPES.includes(file.type) || file.size > MAX_FILE_SIZE);
    if (invalid) {
      setError(`${invalid.name} is not supported or is larger than 1 GB. Allowed: PDF, video, images, Office files, and archives.`);
      return [];
    }
    setError('');
    return files;
  };
  const prepareFiles = (files: File[]) => setPending(validateFiles(files).map((file) => ({ file, displayName: file.name.replace(/\.[^.]+$/, ''), description: '', category: 'general_information', subgroup: '', sortOrder: 0 })));
  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => { event.preventDefault(); setDragActive(false); prepareFiles(Array.from(event.dataTransfer.files)); };
  const handleInput = (event: React.ChangeEvent<HTMLInputElement>) => { prepareFiles(Array.from(event.target.files || [])); event.target.value = ''; };
  const updatePending = (index: number, field: 'displayName' | 'description' | 'category' | 'subgroup' | 'sortOrder', value: string) => setPending((current) => current.map((item, i) => i === index ? { ...item, [field]: field === 'sortOrder' ? Number(value) || 0 : value } as PendingUpload : item));

  const uploadFiles = async () => {
    if (!pending.length) return;
    setUploading(true); setError(''); setSuccess('');
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('not_authenticated');
      for (let index = 0; index < pending.length; index += 1) {
        const item = pending[index];
        setProgress(`Uploading ${index + 1}/${pending.length}: ${item.file.name}`);
        const extension = item.file.name.includes('.') ? `.${item.file.name.split('.').pop()}` : '';
        const storagePath = `${user.id}/${crypto.randomUUID()}${extension.toLowerCase()}`;
        const { error: uploadError } = await supabase.storage.from('documents').upload(storagePath, item.file, { upsert: false, contentType: item.file.type || 'application/octet-stream' });
        if (uploadError) throw uploadError;
        const { error: metadataError } = await supabase.from('documents_metadata').insert({
          filename: item.file.name, display_name: item.displayName.trim() || item.file.name, description: item.description.trim() || null,
          category: item.category, subgroup: item.subgroup.trim() || null, sort_order: item.sortOrder, file_size: item.file.size, storage_path: storagePath, uploaded_by: user.id,
          mime_type: item.file.type || 'application/octet-stream', file_type: typeLabel(item.file.type),
        });
        if (metadataError) throw metadataError;
      }
      setPending([]); setSuccess(`${pending.length} file(s) uploaded successfully.`); await loadItems();
    } catch (uploadError) {
      console.error('Media upload error:', uploadError);
      const details = uploadError as { message?: string; error?: string; statusCode?: string | number };
      const message = `${details.message || ''} ${details.error || ''}`.toLowerCase();
      if (message.includes('mime') || message.includes('content type') || message.includes('not supported')) {
        setError('This file type is not enabled in storage. Please add the file type to the documents bucket.');
      } else if (message.includes('size') || message.includes('large') || message.includes('exceed')) {
        setError('The global storage limit is still set to 50 MB. Increase it to at least 1 GB in the Supabase Storage settings; the bucket setting alone is not enough.');
      } else if (message.includes('duplicate') || message.includes('unique')) {
        setError('A file with this name already exists. Please choose a different file name.');
      } else if (message.includes('permission') || message.includes('row-level security') || details.statusCode === 403) {
        setError('This account is not allowed to upload files. Please check the storage permissions.');
      } else if (message.includes('column') || message.includes('schema cache')) {
        setError('The file table is not fully updated yet. Please add the mime_type and file_type columns.');
      } else {
        setError('The files could not be uploaded. Please check the browser console for details.');
      }
    } finally { setUploading(false); setProgress(''); }
  };
  const startEdit = (item: MediaItem) => { setEditingId(item.id); setEditForm({ displayName: item.displayName, description: item.description || '', category: item.category, subgroup: item.subgroup || '', sortOrder: item.sortOrder }); };
  const saveEdit = async (id: string) => {
    const subgroup = editForm.subgroup.trim() || null;
    const { data, error: updateError } = await supabase
      .from('documents_metadata')
      .update({ display_name: editForm.displayName.trim(), description: editForm.description.trim() || null, category: editForm.category, subgroup, sort_order: editForm.sortOrder, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('id, subgroup')
      .maybeSingle();
    if (updateError) {
      console.error('Media update error:', updateError);
      setError(`The file could not be updated: ${updateError.message}`);
      return;
    }
    if (!data) {
      setError('The file was not updated. Your account may not have permission to edit this file.');
      return;
    }
    setEditingId(null); setSuccess('File updated.'); await loadItems();
  };
  const deleteItem = async (item: MediaItem) => {
    if (!confirm(`Delete “${item.displayName}”?`)) return;
    const { error: storageError } = await supabase.storage.from('documents').remove([item.storagePath]);
    if (storageError) { console.error('Media delete error:', storageError); setError('The file could not be deleted.'); return; }
    const { error: metadataError } = await supabase.from('documents_metadata').delete().eq('id', item.id);
    if (metadataError) { console.error('Metadata delete error:', metadataError); setError('The file information could not be deleted.'); return; }
    setSuccess('File deleted.'); await loadItems();
  };

  return <div className="space-y-6">
    <div><h2 className="text-2xl font-bold text-gray-900">Media Management</h2><p className="text-sm text-gray-600 mt-1">PDFs, videos, images, Office files, and archives for the information areas.</p></div>
    {error && <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex gap-2 text-red-700"><AlertCircle className="w-5 h-5 shrink-0" /><p>{error}</p></div>}
    {success && <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex gap-2 text-green-700"><CheckCircle className="w-5 h-5 shrink-0" /><p>{success}</p></div>}
    <div className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${dragActive ? 'border-green-500 bg-green-50' : 'border-gray-300 hover:border-gray-400'}`} onDragEnter={(event) => { event.preventDefault(); setDragActive(true); }} onDragOver={(event) => event.preventDefault()} onDragLeave={() => setDragActive(false)} onDrop={handleDrop}>
      <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" /><p className="text-lg font-medium text-gray-700 mb-2">Drop files here</p><p className="text-sm text-gray-500 mb-4">or</p>
      <label className="inline-block"><input type="file" className="hidden" accept={ACCEPTED_TYPES.join(',')} multiple onChange={handleInput} disabled={uploading} /><span className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 cursor-pointer inline-block">Choose files</span></label>
      <p className="text-xs text-gray-500 mt-4">Maximum 1 GB per file. Allowed: PDF, MP4, WebM, MOV, JPG, PNG, WebP, GIF, Office files, TXT, and ZIP.</p>
    </div>
    {pending.length > 0 && <div className="bg-blue-50 border border-blue-300 rounded-lg p-6"><h3 className="text-lg font-semibold text-gray-900 mb-4">Prepare upload ({pending.length})</h3><div className="space-y-4 mb-4">{pending.map((item, index) => <div key={`${item.file.name}-${index}`} className="bg-white rounded-lg p-4 border border-gray-200"><div className="flex justify-between mb-3"><div className="flex items-center gap-2 text-gray-600"><IconForType mimeType={item.file.type} className="w-6 h-6" /><span className="text-sm">{formatFileSize(item.file.size)}</span></div><button onClick={() => setPending((current) => current.filter((_, i) => i !== index))} className="text-red-500"><X className="w-5 h-5" /></button></div><div className="grid gap-3 md:grid-cols-5"><input value={item.displayName} onChange={(event) => updatePending(index, 'displayName', event.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg" placeholder="Display name" /><select value={item.category} onChange={(event) => updatePending(index, 'category', event.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg">{CATEGORIES.map((category) => <option key={category.value} value={category.value}>{category.label}</option>)}</select><SubgroupField value={item.subgroup} options={subgroupOptions} onChange={(value) => updatePending(index, 'subgroup', value)} /><input type="number" min="0" value={item.sortOrder} onChange={(event) => updatePending(index, 'sortOrder', event.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg" placeholder="Order" /><input value={item.description} onChange={(event) => updatePending(index, 'description', event.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg" placeholder="Description (optional)" /></div></div>)}</div><div className="flex gap-3"><button onClick={() => void uploadFiles()} disabled={uploading} className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400">{uploading ? 'Uploading…' : 'Upload all'}</button><button onClick={() => setPending([])} disabled={uploading} className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg">Cancel</button></div></div>}
    {uploading && <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-blue-700">{progress}</div>}
    <div><h3 className="text-lg font-semibold text-gray-900 mb-4">Uploaded media ({items.length})</h3>{items.length === 0 ? <p className="text-gray-500 text-center py-8">No media available yet.</p> : <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{items.map((item) => <div key={item.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">{editingId === item.id ? <div className="space-y-3"><input value={editForm.displayName} onChange={(event) => setEditForm({ ...editForm, displayName: event.target.value })} className="w-full px-2 py-1 border border-gray-300 rounded" /><SubgroupField value={editForm.subgroup} options={subgroupOptions} onChange={(value) => setEditForm({ ...editForm, subgroup: value })} /><input type="number" min="0" value={editForm.sortOrder} onChange={(event) => setEditForm({ ...editForm, sortOrder: Number(event.target.value) || 0 })} className="w-full px-2 py-1 border border-gray-300 rounded" placeholder="Order" /><select value={editForm.category} onChange={(event) => setEditForm({ ...editForm, category: event.target.value as Category })} className="w-full px-2 py-1 border border-gray-300 rounded">{CATEGORIES.map((category) => <option key={category.value} value={category.value}>{category.label}</option>)}</select><textarea value={editForm.description} onChange={(event) => setEditForm({ ...editForm, description: event.target.value })} className="w-full px-2 py-1 border border-gray-300 rounded" rows={2} /><div className="flex gap-2"><button onClick={() => void saveEdit(item.id)} className="flex-1 px-3 py-1 bg-green-600 text-white rounded"><Save className="w-4 h-4 inline mr-1" />Save</button><button onClick={() => setEditingId(null)} className="px-3 py-1 bg-gray-200 rounded">Cancel</button></div></div> : <><div className="flex items-start justify-between mb-3"><IconForType mimeType={item.mimeType} className="w-8 h-8 text-cyan-600" /><div className="flex gap-1"><button onClick={() => startEdit(item)} className="text-blue-500 p-1" title="Edit"><Edit2 className="w-4 h-4" /></button><button onClick={() => void deleteItem(item)} className="text-red-500 p-1" title="Delete"><X className="w-5 h-5" /></button></div></div><span className="inline-block px-2 py-1 rounded text-xs font-medium mb-2 bg-cyan-100 text-cyan-800">{item.fileType} · {CATEGORIES.find((category) => category.value === item.category)?.label}</span><h4 className="font-medium text-gray-900 mb-1 break-words">{item.displayName}</h4>{item.description && <p className="text-sm text-gray-600 mb-2 line-clamp-2">{item.description}</p>}{item.subgroup && <p className="text-xs font-medium text-gray-600 mb-1">Subgroup: {item.subgroup} · Order: {item.sortOrder}</p>}<p className="text-xs text-gray-500 mb-3">{formatFileSize(item.size)}</p><a href={item.url} target="_blank" rel="noopener noreferrer" className="block px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-center text-sm">Open</a></>}</div>)}</div>}</div>
  </div>;
}
