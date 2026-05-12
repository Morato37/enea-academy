import React, { useState, useEffect } from 'react';
import { Upload, FileText, X, CheckCircle, AlertCircle, Edit2, Save } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface PDFFile {
  id: string;
  name: string;
  displayName: string;
  description: string | null;
  category: 'general_information' | 'templates' | 'technical_information';
  url: string;
  size: number;
  uploadedAt: string;
}

interface PendingUpload {
  file: File;
  displayName: string;
  description: string;
  category: 'general_information' | 'templates' | 'technical_information';
}

const CATEGORIES = [
  { value: 'general_information', label: 'General Information' },
  { value: 'templates', label: 'Templates' },
  { value: 'technical_information', label: 'Technical Information' }
];

export default function PDFUploader() {
  const [pdfs, setPdfs] = useState<PDFFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [dragActive, setDragActive] = useState(false);
  const [pendingUploads, setPendingUploads] = useState<PendingUpload[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{
    displayName: string;
    description: string;
    category: string;
  }>({ displayName: '', description: '', category: '' });

  useEffect(() => {
    loadPDFs();
  }, []);

  const loadPDFs = async () => {
    try {
      const { data, error } = await supabase
        .from('documents_metadata')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const pdfFiles: PDFFile[] = data.map(doc => ({
        id: doc.id,
        name: doc.filename,
        displayName: doc.display_name,
        description: doc.description,
        category: doc.category,
        url: supabase.storage.from('documents').getPublicUrl(doc.storage_path).data.publicUrl,
        size: doc.file_size || 0,
        uploadedAt: doc.created_at
      }));

      setPdfs(pdfFiles);
    } catch (err) {
      console.error('Error loading PDFs:', err);
      setError('Fehler beim Laden der PDFs');
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = Array.from(e.dataTransfer.files).filter(
      file => file.type === 'application/pdf'
    );

    if (files.length === 0) {
      setError('Bitte nur PDF-Dateien hochladen');
      return;
    }

    preparePendingUploads(files);
  };

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;

    const files = Array.from(e.target.files).filter(
      file => file.type === 'application/pdf'
    );

    if (files.length === 0) {
      setError('Bitte nur PDF-Dateien hochladen');
      return;
    }

    preparePendingUploads(files);
  };

  const preparePendingUploads = (files: File[]) => {
    const pending: PendingUpload[] = files.map(file => ({
      file,
      displayName: file.name.replace('.pdf', ''),
      description: '',
      category: 'general_information'
    }));
    setPendingUploads(pending);
  };

  const updatePendingUpload = (index: number, field: keyof PendingUpload, value: string) => {
    const updated = [...pendingUploads];
    updated[index] = { ...updated[index], [field]: value };
    setPendingUploads(updated);
  };

  const removePendingUpload = (index: number) => {
    setPendingUploads(pendingUploads.filter((_, i) => i !== index));
  };

  const uploadPendingFiles = async () => {
    if (pendingUploads.length === 0) return;

    setUploading(true);
    setError('');
    setSuccess('');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      for (let i = 0; i < pendingUploads.length; i++) {
        const pending = pendingUploads[i];
        setUploadProgress(`Lade hoch ${i + 1}/${pendingUploads.length}: ${pending.file.name}`);

        const sanitizedFileName = pending.file.name
          .replace(/[^a-zA-Z0-9._-]/g, '_')
          .replace(/_+/g, '_');

        const storagePath = sanitizedFileName;

        const { error: uploadError } = await supabase.storage
          .from('documents')
          .upload(storagePath, pending.file, {
            upsert: true,
            contentType: 'application/pdf'
          });

        if (uploadError) {
          console.error('Upload error details:', uploadError);
          throw new Error(`${pending.file.name}: ${uploadError.message}`);
        }

        const { error: metadataError } = await supabase
          .from('documents_metadata')
          .insert({
            filename: sanitizedFileName,
            display_name: pending.displayName,
            description: pending.description || null,
            category: pending.category,
            file_size: pending.file.size,
            storage_path: storagePath,
            uploaded_by: user.id
          });

        if (metadataError) {
          console.error('Metadata error:', metadataError);
          throw new Error(`Metadata error: ${metadataError.message}`);
        }
      }

      setSuccess(`${pendingUploads.length} PDF(s) erfolgreich hochgeladen!`);
      setPendingUploads([]);
      await loadPDFs();
    } catch (err: any) {
      console.error('Upload error:', err);
      setError(`Fehler: ${err.message || 'Unbekannter Fehler beim Hochladen'}`);
    } finally {
      setUploading(false);
      setUploadProgress('');
    }
  };

  const startEdit = (pdf: PDFFile) => {
    setEditingId(pdf.id);
    setEditForm({
      displayName: pdf.displayName,
      description: pdf.description || '',
      category: pdf.category
    });
  };

  const saveEdit = async (id: string) => {
    try {
      const { error } = await supabase
        .from('documents_metadata')
        .update({
          display_name: editForm.displayName,
          description: editForm.description || null,
          category: editForm.category,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;

      setSuccess('Dokument erfolgreich aktualisiert!');
      setEditingId(null);
      await loadPDFs();
    } catch (err: any) {
      console.error('Update error:', err);
      setError(`Fehler beim Aktualisieren: ${err.message}`);
    }
  };

  const handleDelete = async (pdf: PDFFile) => {
    if (!confirm(`PDF "${pdf.displayName}" wirklich löschen?`)) return;

    try {
      const { error: storageError } = await supabase.storage
        .from('documents')
        .remove([pdf.name]);

      if (storageError) throw storageError;

      const { error: metadataError } = await supabase
        .from('documents_metadata')
        .delete()
        .eq('id', pdf.id);

      if (metadataError) throw metadataError;

      setSuccess(`PDF "${pdf.displayName}" gelöscht`);
      await loadPDFs();
    } catch (err: any) {
      console.error('Delete error:', err);
      setError(`Fehler beim Löschen: ${err.message}`);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getCategoryLabel = (category: string) => {
    return CATEGORIES.find(c => c.value === category)?.label || category;
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'general_information': return 'bg-cyan-100 text-cyan-800';
      case 'templates': return 'bg-emerald-100 text-emerald-800';
      case 'technical_information': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">PDF-Verwaltung</h2>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
          <p className="text-green-700">{success}</p>
        </div>
      )}

      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          dragActive
            ? 'border-green-500 bg-green-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-lg font-medium text-gray-700 mb-2">
          PDF-Dateien hier ablegen
        </p>
        <p className="text-sm text-gray-500 mb-4">oder</p>
        <label className="inline-block">
          <input
            type="file"
            className="hidden"
            accept="application/pdf"
            multiple
            onChange={handleFileInput}
            disabled={uploading}
          />
          <span className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 cursor-pointer inline-block">
            Dateien auswählen
          </span>
        </label>
        <p className="text-xs text-gray-400 mt-4">Max. 50MB pro PDF</p>
      </div>

      {pendingUploads.length > 0 && (
        <div className="bg-blue-50 border border-blue-300 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Upload vorbereiten ({pendingUploads.length} Datei{pendingUploads.length !== 1 ? 'en' : ''})
          </h3>
          <div className="space-y-4 mb-4">
            {pendingUploads.map((pending, index) => (
              <div key={index} className="bg-white rounded-lg p-4 border border-gray-200">
                <div className="flex items-start justify-between mb-3">
                  <FileText className="w-6 h-6 text-red-500 flex-shrink-0" />
                  <button
                    onClick={() => removePendingUpload(index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Dateiname
                    </label>
                    <input
                      type="text"
                      value={pending.displayName}
                      onChange={(e) => updatePendingUpload(index, 'displayName', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                      placeholder="Anzeigename"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Kategorie
                    </label>
                    <select
                      value={pending.category}
                      onChange={(e) => updatePendingUpload(index, 'category', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    >
                      {CATEGORIES.map(cat => (
                        <option key={cat.value} value={cat.value}>
                          {cat.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Beschreibung (optional)
                    </label>
                    <textarea
                      value={pending.description}
                      onChange={(e) => updatePendingUpload(index, 'description', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                      placeholder="Kurze Beschreibung des Dokuments"
                      rows={2}
                    />
                  </div>

                  <p className="text-xs text-gray-500">
                    Originaldatei: {pending.file.name} ({formatFileSize(pending.file.size)})
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-3">
            <button
              onClick={uploadPendingFiles}
              disabled={uploading}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {uploading ? 'Lädt hoch...' : 'Alle hochladen'}
            </button>
            <button
              onClick={() => setPendingUploads([])}
              disabled={uploading}
              className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
            >
              Abbrechen
            </button>
          </div>
        </div>
      )}

      {uploading && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
            <p className="text-blue-700">{uploadProgress}</p>
          </div>
        </div>
      )}

      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Hochgeladene PDFs ({pdfs.length})
        </h3>

        {pdfs.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            Keine PDFs vorhanden. Laden Sie die ersten PDFs hoch!
          </p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {pdfs.map((pdf) => (
              <div
                key={pdf.id}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                {editingId === pdf.id ? (
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={editForm.displayName}
                      onChange={(e) => setEditForm({ ...editForm, displayName: e.target.value })}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                      placeholder="Anzeigename"
                    />
                    <select
                      value={editForm.category}
                      onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                    >
                      {CATEGORIES.map(cat => (
                        <option key={cat.value} value={cat.value}>
                          {cat.label}
                        </option>
                      ))}
                    </select>
                    <textarea
                      value={editForm.description}
                      onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                      placeholder="Beschreibung"
                      rows={2}
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => saveEdit(pdf.id)}
                        className="flex-1 px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                      >
                        <Save className="w-4 h-4 inline mr-1" />
                        Speichern
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="px-3 py-1 bg-gray-200 text-gray-700 rounded text-sm hover:bg-gray-300"
                      >
                        Abbrechen
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-start justify-between mb-3">
                      <FileText className="w-8 h-8 text-red-500 flex-shrink-0" />
                      <div className="flex gap-1">
                        <button
                          onClick={() => startEdit(pdf)}
                          className="text-blue-500 hover:text-blue-700 p-1"
                          title="Bearbeiten"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(pdf)}
                          className="text-red-500 hover:text-red-700 p-1"
                          title="Löschen"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    </div>

                    <span className={`inline-block px-2 py-1 rounded text-xs font-medium mb-2 ${getCategoryColor(pdf.category)}`}>
                      {getCategoryLabel(pdf.category)}
                    </span>

                    <h4 className="font-medium text-gray-900 mb-1 break-words">
                      {pdf.displayName}
                    </h4>

                    {pdf.description && (
                      <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                        {pdf.description}
                      </p>
                    )}

                    <p className="text-xs text-gray-500 mb-3">
                      {formatFileSize(pdf.size)}
                    </p>

                    <div className="flex gap-2">
                      <a
                        href={pdf.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-center text-sm"
                      >
                        Öffnen
                      </a>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(pdf.url);
                          setSuccess('URL kopiert!');
                          setTimeout(() => setSuccess(''), 2000);
                        }}
                        className="px-3 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 text-sm"
                      >
                        URL
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
