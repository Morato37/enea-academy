import React, { useState, useEffect, useRef } from 'react';
import { supabase, Stone } from '../../lib/supabase';
import { Search, Plus, CreditCard as Edit, Loader, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const SCROLL_POSITION_KEY = 'admin-stone-list-scroll';
const SEARCH_TERM_KEY = 'admin-stone-list-search';

export const StoneList: React.FC = () => {
  const [stones, setStones] = useState<Stone[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState(() => {
    try {
      return sessionStorage.getItem(SEARCH_TERM_KEY) || '';
    } catch {
      return '';
    }
  });
  const navigate = useNavigate();
  const scrollRestoredRef = useRef(false);

  useEffect(() => {
    loadStones();
  }, []);

  useEffect(() => {
    if (!loading && stones.length > 0 && !scrollRestoredRef.current) {
      try {
        const savedScroll = sessionStorage.getItem(SCROLL_POSITION_KEY);
        if (savedScroll) {
          const scrollPosition = parseInt(savedScroll, 10);
          setTimeout(() => {
            window.scrollTo(0, scrollPosition);
          }, 0);
        }
        scrollRestoredRef.current = true;
      } catch (error) {
        console.error('Error restoring scroll position:', error);
      }
    }
  }, [loading, stones]);

  useEffect(() => {
    try {
      sessionStorage.setItem(SEARCH_TERM_KEY, searchTerm);
    } catch (error) {
      console.error('Error saving search term:', error);
    }
  }, [searchTerm]);

  useEffect(() => {
    const handleScroll = () => {
      try {
        sessionStorage.setItem(SCROLL_POSITION_KEY, window.scrollY.toString());
      } catch (error) {
        console.error('Error saving scroll position:', error);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const loadStones = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('stones')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      setStones(data || []);
    } catch (err) {
      console.error('Error loading stones:', err);
    } finally {
      setLoading(false);
    }
  };

  const deleteStone = async (stone: Stone) => {
    if (!window.confirm(`Are you sure you want to delete "${stone.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('stones')
        .delete()
        .eq('id', stone.id);

      if (error) throw error;

      setStones(stones.filter(s => s.id !== stone.id));
    } catch (err) {
      console.error('Error deleting stone:', err);
      alert('Failed to delete stone. Please try again.');
    }
  };

  const filteredStones = stones.filter((stone) =>
    stone.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    stone.origin?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader className="w-8 h-8 text-gray-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search stones..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-400"
          />
        </div>
        <button
          onClick={() => navigate('/admin/stone/new?from=stones')}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add New Stone
        </button>
      </div>

      <div className="bg-white rounded-lg border border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Origin
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Image
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredStones.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    No stones found
                  </td>
                </tr>
              ) : (
                filteredStones.map((stone) => (
                  <tr key={stone.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {stone.id}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {stone.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        stone.stone_category === 'tile'
                          ? 'bg-blue-100 text-blue-800'
                          : stone.stone_category === 'cobblestone'
                          ? 'bg-gray-100 text-gray-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {stone.stone_category || 'both'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {stone.origin || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {stone.image_url ? (
                        <img
                          src={stone.image_url}
                          alt={stone.name}
                          className="w-12 h-12 object-cover rounded"
                        />
                      ) : (
                        <span className="text-gray-400">No image</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => navigate(`/admin/stone/${stone.id}?from=stones`)}
                          className="inline-flex items-center gap-1 px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                        >
                          <Edit className="w-3 h-3" />
                          Edit
                        </button>
                        <button
                          onClick={() => deleteStone(stone)}
                          className="inline-flex items-center gap-1 px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                        >
                          <Trash2 className="w-3 h-3" />
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="text-sm text-gray-500">
        Showing {filteredStones.length} of {stones.length} stones
      </div>
    </div>
  );
};
