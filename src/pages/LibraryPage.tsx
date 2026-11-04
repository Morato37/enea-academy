import React, { useEffect, useState, useCallback } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Book, Search, Library, Calendar, User, X, Clock, CheckCircle2, Loader2 } from 'lucide-react';
import { BookCover } from '../components/BookCover';

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

const formatDueDate = (dueDate: string): string => {
  return new Date(dueDate).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });
};

const isOverdue = (dueDate: string): boolean => {
  return new Date(dueDate).getTime() < Date.now();
};

export const LibraryPage: React.FC = () => {
  const { user, isAdmin } = useAuth();

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }
  const [books, setBooks] = useState<LibraryBook[]>([]);
  const [reservations, setReservations] = useState<LibraryReservation[]>([]);
  const [myReservations, setMyReservations] = useState<LibraryReservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [reservingBookId, setReservingBookId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const categories: string[] = ['all', ...Array.from(new Set(books.map(b => b.category).filter(Boolean)))];

  const loadData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const [booksRes, reservationsRes] = await Promise.all([
        supabase.from('library_books').select('*').order('created_at', { ascending: false }),
        supabase.from('library_reservations').select('*').eq('status', 'active').order('reserved_at', { ascending: false }),
      ]);

      if (booksRes.error) throw booksRes.error;
      if (reservationsRes.error) throw reservationsRes.error;

      const activeReservations = reservationsRes.data || [];
      const userIds = [...new Set(activeReservations.map(r => r.user_id))];

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

      const reservationsWithEmails = activeReservations.map(r => ({
        ...r,
        user_email: profileMap[r.user_id] || 'Unknown',
      }));

      setBooks(booksRes.data || []);
      setReservations(reservationsWithEmails);
      setMyReservations(reservationsWithEmails.filter(r => r.user_id === user.id));
    } catch (err: any) {
      if (err.message?.includes('relation') || err.code === 'PGRST205' || err.code === '42P01') {
        setError('The library system has not been set up yet. Please ask an administrator to run the database migration.');
      } else {
        setError(err.message || 'Failed to load library data');
      }
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleReserve = async (bookId: string) => {
    if (!user) return;
    setReservingBookId(bookId);
    setError(null);
    try {
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + LOAN_PERIOD_DAYS);

      const { error: insertError } = await supabase
        .from('library_reservations')
        .insert({
          book_id: bookId,
          user_id: user.id,
          status: 'active',
          due_date: dueDate.toISOString(),
        });

      if (insertError) throw insertError;
      await loadData();
    } catch (err: any) {
      if (err.code === '23505') {
        setError('This book is already reserved by someone else.');
      } else {
        setError(err.message || 'Failed to reserve book');
      }
    } finally {
      setReservingBookId(null);
    }
  };

  const handleCancelReservation = async (reservationId: string) => {
    if (!user) return;
    if (!confirm('Are you sure you want to cancel this reservation?')) return;
    try {
      const { error: deleteError } = await supabase
        .from('library_reservations')
        .delete()
        .eq('id', reservationId)
        .eq('user_id', user.id);

      if (deleteError) throw deleteError;
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to cancel reservation');
    }
  };

  const getReservationForBook = (bookId: string): LibraryReservation | undefined => {
    return reservations.find(r => r.book_id === bookId && r.status === 'active');
  };

  const filteredBooks = books.filter(book => {
    const matchesSearch =
      book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      book.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (book.isbn || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || book.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-cyan-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-sky-100 rounded-lg flex items-center justify-center">
              <Library className="w-7 h-7 text-sky-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Library</h1>
              <p className="text-gray-600 mt-1">Browse and reserve books from the Enea collection</p>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
            <X className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {myReservations.length > 0 && (
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Book className="w-5 h-5 text-sky-600" />
              My Active Reservations ({myReservations.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {myReservations.map(res => {
                const book = books.find(b => b.id === res.book_id);
                const overdue = isOverdue(res.due_date);
                return (
                  <div key={res.id} className={`bg-white rounded-lg border p-5 shadow-sm ${overdue ? 'border-red-300' : 'border-gray-200'}`}>
                    <div className="flex items-start gap-4">
                      <BookCover
                        coverUrl={book?.cover_image_url}
                        isbn={book?.isbn}
                        title={book?.title || ''}
                        className="w-16 h-24 object-cover rounded shadow-sm flex-shrink-0"
                        iconClassName="w-8 h-8 text-gray-300"
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 truncate">{book?.title || 'Unknown'}</h3>
                        <p className="text-sm text-gray-600">{book?.author}</p>
                        <div className="mt-2 space-y-1">
                          <p className="text-xs text-gray-500 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Reserved {formatDuration(res.reserved_at)} ago
                          </p>
                          <p className={`text-xs flex items-center gap-1 ${overdue ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
                            <Calendar className="w-3 h-3" />
                            {overdue ? 'Overdue - ' : 'Due: '} {formatDueDate(res.due_date)}
                          </p>
                        </div>
                        <button
                          onClick={() => handleCancelReservation(res.id)}
                          className="mt-3 inline-flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors"
                        >
                          <X className="w-3 h-3" />
                          Cancel Reservation
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        <section>
          <div className="mb-6 space-y-4">
            <div className="flex gap-2 overflow-x-auto pb-1">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                    selectedCategory === cat
                      ? 'bg-sky-600 text-white'
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {cat === 'all' ? 'All Categories' : cat}
                </button>
              ))}
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by title, author, or ISBN..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 text-gray-900"
              />
            </div>
          </div>

          {filteredBooks.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
              <Book className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 text-lg font-medium">No books found</p>
              <p className="text-gray-500 text-sm mt-1">
                {books.length === 0 ? 'The library catalog is empty. Ask an admin to add books.' : 'Try a different search or category.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredBooks.map(book => {
                const reservation = getReservationForBook(book.id);
                const isReservedByMe = reservation?.user_id === user?.id;
                const isAvailable = !reservation;

                return (
                  <div
                    key={book.id}
                    className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col"
                  >
                    <div className="aspect-[3/4] bg-gray-100 relative">
                      <BookCover
                        coverUrl={book.cover_image_url}
                        isbn={book.isbn}
                        title={book.title}
                        className="w-full h-full object-cover"
                        iconClassName="w-16 h-16 text-gray-300"
                      />
                      <div className="absolute top-2 right-2">
                        {isAvailable ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-500 text-white text-xs font-medium rounded-full shadow-sm">
                            <CheckCircle2 className="w-3 h-3" />
                            Available
                          </span>
                        ) : (
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full shadow-sm ${
                            isReservedByMe ? 'bg-sky-500 text-white' : 'bg-red-500 text-white'
                          }`}>
                            <Clock className="w-3 h-3" />
                            {isReservedByMe ? 'Reserved by you' : 'Reserved'}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="p-4 flex-1 flex flex-col">
                      <h3 className="font-semibold text-gray-900 line-clamp-2">{book.title}</h3>
                      <p className="text-sm text-gray-600 mt-1">{book.author}</p>
                      {book.category && book.category !== 'General' && (
                        <span className="inline-block mt-2 px-2 py-0.5 bg-sky-50 text-sky-700 text-xs rounded">
                          {book.category}
                        </span>
                      )}
                      {book.description && (
                        <p className="text-sm text-gray-500 mt-2 line-clamp-2 flex-1">{book.description}</p>
                      )}

                      {!isAvailable && !isReservedByMe && reservation && (
                        <div className="mt-3 pt-3 border-t border-gray-100 space-y-1">
                          <p className="text-xs text-gray-500 flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {reservation.user_email}
                          </p>
                          <p className="text-xs text-gray-500 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            For {formatDuration(reservation.reserved_at)}
                          </p>
                          <p className={`text-xs flex items-center gap-1 ${isOverdue(reservation.due_date) ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
                            <Calendar className="w-3 h-3" />
                            {isOverdue(reservation.due_date) ? 'Overdue' : 'Due'}: {formatDueDate(reservation.due_date)}
                          </p>
                        </div>
                      )}

                      <div className="mt-4">
                        {isAvailable ? (
                          <button
                            onClick={() => handleReserve(book.id)}
                            disabled={reservingBookId === book.id}
                            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-sky-600 text-white rounded-lg text-sm font-medium hover:bg-sky-700 transition-colors disabled:opacity-50"
                          >
                            {reservingBookId === book.id ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Reserving...
                              </>
                            ) : (
                              <>
                                <Book className="w-4 h-4" />
                                Reserve
                              </>
                            )}
                          </button>
                        ) : isReservedByMe ? (
                          <button
                            onClick={() => handleCancelReservation(reservation!.id)}
                            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors"
                          >
                            <X className="w-4 h-4" />
                            Cancel Reservation
                          </button>
                        ) : (
                          <button
                            disabled
                            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 text-gray-400 rounded-lg text-sm font-medium cursor-not-allowed"
                          >
                            <Clock className="w-4 h-4" />
                            Unavailable
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};
