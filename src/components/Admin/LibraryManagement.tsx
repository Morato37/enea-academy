import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { importLibraryFromCsv, updateBookCovers, type ImportProgress } from '../../lib/libraryImport';
import { BookCover } from '../BookCover';
import { Book, Plus, Pencil, Trash2, Search, Library, Clock, Calendar, User, X, CheckCircle2, Loader2, AlertTriangle, RotateCcw, Upload, ImageIcon } from 'lucide-react';

interface LibraryBook {
  id: string;
  title: string;
  author: string;
  isbn: string | null;
  description: string | null;
  category: string;
  cover_image_url: string | null;
  created_at: string;
}

interface LibraryReservation {
  id: string;
  book_id: string;
  user_id: string;
  status: 'active' | 'returned';
  reserved_at: string;
  due_date: string;
  returned_at: string | null;
  user_email?: string;
  book?: LibraryBook;
}

const LOAN_PERIOD_DAYS = 30;

const formatDuration = (fromDate: string): string => {
  const now = Date.now();
  const diff = now - new Date(fromDate).getTime();
  const days = Math.floor(diff / 86400000);
  if (days < 1) return 'today';
  if (days === 1) return '1 day';
  return `${days} days`;
};

const formatDate = (dateStr: string): string => {
  return new Date(dateStr).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });
};

const isOverdue = (dueDate: string): boolean => {
  return new Date(dueDate).getTime() < Date.now();
};

type AdminTab = 'catalog' | 'reservations';

export const LibraryManagement: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<AdminTab>('catalog');
  const [books, setBooks] = useState<LibraryBook[]>([]);
  const [reservations, setReservations] = useState<LibraryReservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showBookForm, setShowBookForm] = useState(false);
  const [editingBook, setEditingBook] = useState<LibraryBook | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Book form state
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    isbn: '',
    description: '',
    category: 'General',
    cover_image_url: '',
  });
  const [savingBook, setSavingBook] = useState(false);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreviewUrl, setCoverPreviewUrl] = useState<string | null>(null);

  // Reservation action state
  const [actingReservationId, setActingReservationId] = useState<string | null>(null);

  // CSV import state
  const [importProgress, setImportProgress] = useState<ImportProgress | null>(null);
  const [importing, setImporting] = useState(false);
  const [updatingCovers, setUpdatingCovers] = useState(false);

  const handleUpdateCovers = async () => {
    setUpdatingCovers(true);
    setImportProgress({ phase: 'parsing', total: 0, processed: 0, inserted: 0, skipped: 0, message: 'Starting cover update...' });
    try {
      await updateBookCovers((p) => setImportProgress(p));
      await loadData();
    } catch (err: any) {
      setImportProgress({ phase: 'error', total: 0, processed: 0, inserted: 0, skipped: 0, message: err.message || 'Cover update failed' });
    } finally {
      setUpdatingCovers(false);
    }
  };

  const handleImportCsv = async () => {
    if (!confirm('Import all books from the Enea Planungsbibliothek CSV? This will add ~600 books to the catalog. Books that already exist (by title + author) will be skipped.')) return;
    setImporting(true);
    setImportProgress({ phase: 'parsing', total: 0, processed: 0, inserted: 0, skipped: 0, message: 'Starting...' });
    try {
      await importLibraryFromCsv('/data/library_20261015_174958.csv', (p) => setImportProgress(p));
      await loadData();
    } catch (err: any) {
      setImportProgress({ phase: 'error', total: 0, processed: 0, inserted: 0, skipped: 0, message: err.message || 'Import failed' });
    } finally {
      setImporting(false);
    }
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [booksRes, reservationsRes] = await Promise.all([
        supabase.from('library_books').select('*').order('created_at', { ascending: false }),
        supabase.from('library_reservations').select('*').order('reserved_at', { ascending: false }),
      ]);

      if (booksRes.error) throw booksRes.error;
      if (reservationsRes.error) throw reservationsRes.error;

      const allReservations = reservationsRes.data || [];
      const userIds = [...new Set(allReservations.map(r => r.user_id))];

      let profileMap: Record<string, string> = {};
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from('user_profiles')
          .select('id, email, full_name')
          .in('id', userIds);
        profiles?.forEach(p => {
          profileMap[p.id] = p.full_name || p.email;
        });
      }

      const bookMap: Record<string, LibraryBook> = {};
      (booksRes.data || []).forEach(b => { bookMap[b.id] = b; });

      const reservationsWithEmails = allReservations.map(r => ({
        ...r,
        user_email: profileMap[r.user_id] || 'Unknown',
        book: bookMap[r.book_id],
      }));

      setBooks(booksRes.data || []);
      setReservations(reservationsWithEmails);
    } catch (err: any) {
      if (err.message?.includes('relation') || err.code === 'PGRST205' || err.code === '42P01') {
        setError('The library tables have not been created yet. Please run the database migration first.');
      } else {
        setError(err.message || 'Failed to load library data');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const resetForm = () => {
    if (coverPreviewUrl) URL.revokeObjectURL(coverPreviewUrl);
    setFormData({ title: '', author: '', isbn: '', description: '', category: 'General', cover_image_url: '' });
    setCoverFile(null);
    setCoverPreviewUrl(null);
    setEditingBook(null);
  };

  const handleCoverFileChange = (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('The cover image must be smaller than 10 MB.');
      return;
    }
    if (coverPreviewUrl) URL.revokeObjectURL(coverPreviewUrl);
    setCoverFile(file);
    setCoverPreviewUrl(URL.createObjectURL(file));
    setError(null);
  };

  const uploadCoverImage = async (file: File): Promise<string> => {
    const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const path = `library-covers/${crypto.randomUUID()}.${extension}`;
    const { error: uploadError } = await supabase.storage
      .from('plant-images')
      .upload(path, file, { contentType: file.type, cacheControl: '31536000', upsert: false });
    if (uploadError) throw uploadError;
    return supabase.storage.from('plant-images').getPublicUrl(path).data.publicUrl;
  };

  const handleEditBook = (book: LibraryBook) => {
    if (coverPreviewUrl) URL.revokeObjectURL(coverPreviewUrl);
    setCoverFile(null);
    setCoverPreviewUrl(null);
    setEditingBook(book);
    setFormData({
      title: book.title,
      author: book.author,
      isbn: book.isbn || '',
      description: book.description || '',
      category: book.category || 'General',
      cover_image_url: book.cover_image_url || '',
    });
    setShowBookForm(true);
  };

  const handleSaveBook = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingBook(true);
    setError(null);
    try {
      const uploadedCoverUrl = coverFile ? await uploadCoverImage(coverFile) : formData.cover_image_url;
      const payload = {
        title: formData.title,
        author: formData.author,
        isbn: formData.isbn || null,
        description: formData.description || null,
        category: formData.category || 'General',
        cover_image_url: uploadedCoverUrl || null,
      };

      if (editingBook) {
        const { error: updateError } = await supabase
          .from('library_books')
          .update(payload)
          .eq('id', editingBook.id);
        if (updateError) throw updateError;
        setSuccess(`Updated "${formData.title}"`);
      } else {
        const { error: insertError } = await supabase
          .from('library_books')
          .insert(payload);
        if (insertError) throw insertError;
        setSuccess(`Added "${formData.title}" to the library`);
      }

      setShowBookForm(false);
      resetForm();
      await loadData();
    } catch (err) {
      console.error('Failed to save book:', err);
      setError('The book could not be saved. Please try again.');
    } finally {
      setSavingBook(false);
    }
  };

  const handleDeleteBook = async (book: LibraryBook) => {
    if (!confirm(`Delete "${book.title}"? This will also remove all its reservations.`)) return;
    try {
      const { error: deleteError } = await supabase
        .from('library_books')
        .delete()
        .eq('id', book.id);
      if (deleteError) throw deleteError;
      setSuccess(`Deleted "${book.title}"`);
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to delete book');
    }
  };

  const handleMarkReturned = async (reservationId: string) => {
    setActingReservationId(reservationId);
    try {
      const { error: updateError } = await supabase
        .from('library_reservations')
        .update({ status: 'returned', returned_at: new Date().toISOString() })
        .eq('id', reservationId);
      if (updateError) throw updateError;
      setSuccess('Book marked as returned');
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to mark book as returned');
    } finally {
      setActingReservationId(null);
    }
  };

  const handleExtendLoan = async (reservationId: string, currentDueDate: string) => {
    setActingReservationId(reservationId);
    try {
      const newDueDate = new Date(currentDueDate);
      newDueDate.setDate(newDueDate.getDate() + LOAN_PERIOD_DAYS);
      const { error: updateError } = await supabase
        .from('library_reservations')
        .update({ due_date: newDueDate.toISOString() })
        .eq('id', reservationId);
      if (updateError) throw updateError;
      setSuccess(`Loan extended by ${LOAN_PERIOD_DAYS} days`);
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to extend loan');
    } finally {
      setActingReservationId(null);
    }
  };

  const handleCancelReservation = async (reservationId: string) => {
    if (!confirm('Cancel this reservation? The book will become available again.')) return;
    setActingReservationId(reservationId);
    try {
      const { error: deleteError } = await supabase
        .from('library_reservations')
        .delete()
        .eq('id', reservationId);
      if (deleteError) throw deleteError;
      setSuccess('Reservation cancelled');
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to cancel reservation');
    } finally {
      setActingReservationId(null);
    }
  };

  const filteredBooks = books.filter(book =>
    book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    book.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (book.isbn || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const activeReservations = reservations.filter(r => r.status === 'active');
  const overdueCount = activeReservations.filter(r => isOverdue(r.due_date)).length;
  const returnedReservations = reservations.filter(r => r.status === 'returned');

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-sky-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Library className="w-6 h-6 text-sky-600" />
          <h2 className="text-2xl font-bold text-gray-900">Library Management</h2>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleUpdateCovers}
            disabled={updatingCovers || importing}
            className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors disabled:opacity-50"
          >
            {updatingCovers ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImageIcon className="w-4 h-4" />}
            Replace Covers
          </button>
          <button
            onClick={handleImportCsv}
            disabled={importing || updatingCovers}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors disabled:opacity-50"
          >
            {importing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            Import CSV
          </button>
          <button
            onClick={() => { resetForm(); setShowBookForm(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Book
          </button>
        </div>
      </div>

      {importProgress && (
        <div className={`rounded-lg p-4 flex items-start gap-3 ${
          importProgress.phase === 'error' ? 'bg-red-50 border border-red-200' :
          importProgress.phase === 'done' ? 'bg-green-50 border border-green-200' :
          'bg-sky-50 border border-sky-200'
        }`}>
          {importProgress.phase === 'error' ? (
            <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          ) : importProgress.phase === 'done' ? (
            <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
          ) : (
            <Loader2 className="w-5 h-5 text-sky-500 animate-spin flex-shrink-0 mt-0.5" />
          )}
          <div className="flex-1">
            <p className={`text-sm font-medium ${
              importProgress.phase === 'error' ? 'text-red-700' :
              importProgress.phase === 'done' ? 'text-green-700' : 'text-sky-700'
            }`}>
              {importProgress.message}
            </p>
            {importProgress.phase === 'inserting' && importProgress.total > 0 && (
              <div className="mt-2">
                <div className="h-2 bg-sky-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-sky-600 rounded-full transition-all"
                    style={{ width: `${(importProgress.processed / importProgress.total) * 100}%` }}
                  />
                </div>
                <p className="text-xs text-sky-600 mt-1">
                  {importProgress.processed} / {importProgress.total} processed · {importProgress.inserted} inserted · {importProgress.skipped} skipped
                </p>
              </div>
            )}
          </div>
          {(importProgress.phase === 'done' || importProgress.phase === 'error') && (
            <button onClick={() => setImportProgress(null)} className="text-gray-400 hover:text-gray-600">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-red-700 text-sm flex-1">{error}</p>
          <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
          <p className="text-green-700 text-sm flex-1">{success}</p>
          <button onClick={() => setSuccess(null)} className="text-green-400 hover:text-green-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Tab switcher */}
      <div className="flex gap-2 border-b border-gray-200 pb-px">
        <button
          onClick={() => setActiveTab('catalog')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'catalog' ? 'border-sky-600 text-sky-600' : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          <Book className="w-4 h-4" />
          Catalog ({books.length})
        </button>
        <button
          onClick={() => setActiveTab('reservations')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'reservations' ? 'border-sky-600 text-sky-600' : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          <Clock className="w-4 h-4" />
          Reservations ({activeReservations.length})
          {overdueCount > 0 && (
            <span className="ml-1 px-1.5 py-0.5 bg-red-100 text-red-700 text-xs rounded-full font-medium">{overdueCount} overdue</span>
          )}
        </button>
      </div>

      {/* Catalog Tab */}
      {activeTab === 'catalog' && (
        <div>
          <div className="mb-4 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search books..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm text-gray-900"
            />
          </div>

          {filteredBooks.length === 0 ? (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-12 text-center">
              <Book className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-600 font-medium">No books in the catalog</p>
              <p className="text-gray-500 text-sm mt-1">Click "Add Book" to create the first entry</p>
            </div>
          ) : (
            <div className="overflow-x-auto bg-white rounded-lg border border-gray-200">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Cover</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Title</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Author</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Category</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">ISBN</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-600 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredBooks.map(book => (
                    <tr key={book.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <BookCover
                          coverUrl={book.cover_image_url}
                          isbn={book.isbn}
                          title={book.title}
                          className="w-10 h-14 object-cover rounded shadow-sm"
                          iconClassName="w-5 h-5 text-gray-300"
                        />
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 max-w-xs truncate">{book.title}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{book.author}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{book.category}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">{book.isbn || '-'}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleEditBook(book)}
                            className="p-1.5 text-gray-500 hover:text-sky-600 hover:bg-sky-50 rounded transition-colors"
                            title="Edit"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteBook(book)}
                            className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Reservations Tab */}
      {activeTab === 'reservations' && (
        <div className="space-y-6">
          {activeReservations.length === 0 ? (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-12 text-center">
              <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-600 font-medium">No active reservations</p>
              <p className="text-gray-500 text-sm mt-1">Books reserved by users will appear here</p>
            </div>
          ) : (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Active Reservations</h3>
              <div className="overflow-x-auto bg-white rounded-lg border border-gray-200">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Book</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Reserved by</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Reserved</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Due Date</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Duration</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-600 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {activeReservations.map(res => {
                      const overdue = isOverdue(res.due_date);
                      return (
                        <tr key={res.id} className={overdue ? 'bg-red-50' : 'hover:bg-gray-50'}>
                          <td className="px-4 py-3 text-sm font-medium text-gray-900 max-w-xs truncate">
                            {res.book?.title || 'Unknown book'}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">{res.user_email}</td>
                          <td className="px-4 py-3 text-sm text-gray-500">{formatDate(res.reserved_at)}</td>
                          <td className="px-4 py-3 text-sm">
                            <span className={overdue ? 'text-red-600 font-medium' : 'text-gray-600'}>
                              {formatDate(res.due_date)}
                            </span>
                            {overdue && (
                              <span className="ml-2 inline-flex items-center gap-1 px-1.5 py-0.5 bg-red-100 text-red-700 text-xs rounded-full">
                                <AlertTriangle className="w-3 h-3" />
                                Overdue
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-500">{formatDuration(res.reserved_at)}</td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleMarkReturned(res.id)}
                                disabled={actingReservationId === res.id}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-green-50 text-green-700 rounded-lg text-xs font-medium hover:bg-green-100 transition-colors disabled:opacity-50"
                                title="Mark as returned"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                Return
                              </button>
                              <button
                                onClick={() => handleExtendLoan(res.id, res.due_date)}
                                disabled={actingReservationId === res.id}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-xs font-medium hover:bg-blue-100 transition-colors disabled:opacity-50"
                                title="Extend by 30 days"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                                Extend
                              </button>
                              <button
                                onClick={() => handleCancelReservation(res.id)}
                                disabled={actingReservationId === res.id}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-red-50 text-red-600 rounded-lg text-xs font-medium hover:bg-red-100 transition-colors disabled:opacity-50"
                                title="Cancel reservation"
                              >
                                <X className="w-3.5 h-3.5" />
                                Cancel
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {returnedReservations.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Returned Books ({returnedReservations.length})</h3>
              <div className="overflow-x-auto bg-white rounded-lg border border-gray-200">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Book</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Reserved by</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Reserved</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Returned</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {returnedReservations.slice(0, 20).map(res => (
                      <tr key={res.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium text-gray-700 max-w-xs truncate">{res.book?.title || 'Unknown'}</td>
                        <td className="px-4 py-3 text-sm text-gray-500">{res.user_email}</td>
                        <td className="px-4 py-3 text-sm text-gray-500">{formatDate(res.reserved_at)}</td>
                        <td className="px-4 py-3 text-sm text-gray-500">{res.returned_at ? formatDate(res.returned_at) : '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Book form modal */}
      {showBookForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingBook ? 'Edit Book' : 'Add New Book'}
              </h3>
              <button
                onClick={() => { setShowBookForm(false); resetForm(); }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveBook} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 text-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Author *</label>
                <input
                  type="text"
                  required
                  value={formData.author}
                  onChange={e => setFormData({ ...formData, author: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 text-gray-900"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ISBN</label>
                  <input
                    type="text"
                    value={formData.isbn}
                    onChange={e => setFormData({ ...formData, isbn: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 text-gray-900"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cover Image</label>
                <div className="flex items-start gap-3">
                  {(coverPreviewUrl || formData.cover_image_url) && (
                    <img
                      src={coverPreviewUrl || formData.cover_image_url}
                      alt="Cover preview"
                      className="w-14 h-20 rounded object-cover border border-gray-200"
                    />
                  )}
                  <div className="flex-1 space-y-2">
                    <label className="flex items-center justify-center gap-2 px-3 py-2 border border-dashed border-gray-300 rounded-lg text-sm text-gray-600 hover:border-sky-400 hover:text-sky-600 cursor-pointer transition-colors">
                      <Upload className="w-4 h-4" />
                      Upload image
                      <input
                        type="file"
                        accept="image/*"
                        onChange={e => handleCoverFileChange(e.target.files?.[0])}
                        className="hidden"
                      />
                    </label>
                    <input
                      type="url"
                      placeholder="Or paste an image URL"
                      value={formData.cover_image_url}
                      onChange={e => setFormData({ ...formData, cover_image_url: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 text-gray-900"
                    />
                    <p className="text-xs text-gray-500">JPG, PNG, WebP or GIF up to 10 MB.</p>
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 text-gray-900"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowBookForm(false); resetForm(); }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingBook}
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg transition-colors text-sm font-medium disabled:opacity-50"
                >
                  {savingBook ? 'Saving...' : editingBook ? 'Update Book' : 'Add Book'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
