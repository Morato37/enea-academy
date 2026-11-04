import React, { useEffect, useRef, useState } from 'react';
import { X, Search, UserPlus, Trash2, Shield, Eye, CreditCard as Edit3, Loader2 } from 'lucide-react';
import { useSelections } from '../../contexts/SelectionsContext';
import { ProjectShareWithUser, UserSearchResult } from '../../lib/supabase';

interface ProjectShareModalProps {
  projectId: string;
  projectName: string;
  onClose: () => void;
}

export const ProjectShareModal: React.FC<ProjectShareModalProps> = ({
  projectId,
  projectName,
  onClose,
}) => {
  const { getProjectShares, addProjectShare, removeProjectShare, updateProjectShare, searchUsers } =
    useSelections();

  const [shares, setShares] = useState<ProjectShareWithUser[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [loadingShares, setLoadingShares] = useState(true);
  const [addingUser, setAddingUser] = useState<string | null>(null);
  const [removingShare, setRemovingShare] = useState<string | null>(null);
  const [updatingShare, setUpdatingShare] = useState<string | null>(null);
  const [newPermission, setNewPermission] = useState<'view' | 'edit'>('edit');
  const [error, setError] = useState<string | null>(null);

  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadShares = async () => {
    setLoadingShares(true);
    const data = await getProjectShares(projectId);
    setShares(data);
    setLoadingShares(false);
  };

  useEffect(() => {
    loadShares();
  }, [projectId]);

  // Debounced search
  useEffect(() => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    searchTimerRef.current = setTimeout(async () => {
      const results = await searchUsers(searchQuery);
      // Exclude already-shared users
      const sharedIds = new Set(shares.map(s => s.shared_with_user_id));
      setSearchResults(results.filter(r => !sharedIds.has(r.id)));
      setSearching(false);
    }, 300);
    return () => {
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    };
  }, [searchQuery, shares]);

  const handleAdd = async (user: UserSearchResult) => {
    setAddingUser(user.id);
    setError(null);
    try {
      await addProjectShare(projectId, user.id, newPermission);
      setSearchQuery('');
      setSearchResults([]);
      await loadShares();
    } catch (err: any) {
      setError(err.message || 'Failed to share project');
    } finally {
      setAddingUser(null);
    }
  };

  const handleRemove = async (shareId: string) => {
    setRemovingShare(shareId);
    try {
      await removeProjectShare(shareId);
      setShares(prev => prev.filter(s => s.id !== shareId));
    } catch {
      setError('Failed to remove share');
    } finally {
      setRemovingShare(null);
    }
  };

  const handleUpdatePermission = async (shareId: string, permission: 'view' | 'edit') => {
    setUpdatingShare(shareId);
    try {
      await updateProjectShare(shareId, permission);
      setShares(prev => prev.map(s => s.id === shareId ? { ...s, permission } : s));
    } catch {
      setError('Failed to update permission');
    } finally {
      setUpdatingShare(null);
    }
  };

  const displayName = (user: { email: string; full_name?: string | null }) =>
    user.full_name || user.email;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
              <Shield className="w-4 h-4 text-cyan-600" />
              Share Project
            </h2>
            <p className="text-xs text-gray-500 mt-0.5 truncate max-w-[280px]">{projectName}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
          {/* Error */}
          {error && (
            <div className="px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
              {error}
            </div>
          )}

          {/* Current shares */}
          <div>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Shared with
            </h3>
            {loadingShares ? (
              <div className="flex items-center gap-2 text-sm text-gray-400 py-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading...
              </div>
            ) : shares.length === 0 ? (
              <p className="text-sm text-gray-400 py-2">Not shared with anyone yet.</p>
            ) : (
              <div className="space-y-2">
                {shares.map(share => (
                  <div
                    key={share.id}
                    className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl"
                  >
                    <div className="w-8 h-8 rounded-full bg-cyan-100 text-cyan-700 flex items-center justify-center text-sm font-semibold shrink-0 uppercase">
                      {(share.user_profile?.full_name || share.user_profile?.email || '?')[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {share.user_profile ? displayName(share.user_profile) : share.shared_with_user_id}
                      </p>
                      {share.user_profile?.full_name && (
                        <p className="text-xs text-gray-500 truncate">{share.user_profile.email}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {/* Permission toggle */}
                      <div className="flex rounded-lg overflow-hidden border border-gray-200">
                        <button
                          onClick={() => share.permission !== 'view' && handleUpdatePermission(share.id, 'view')}
                          disabled={!!updatingShare}
                          className={`px-2 py-1 text-xs flex items-center gap-1 transition-colors ${
                            share.permission === 'view'
                              ? 'bg-gray-200 text-gray-700 font-medium'
                              : 'bg-white text-gray-400 hover:bg-gray-50'
                          }`}
                        >
                          <Eye className="w-3 h-3" />
                          View
                        </button>
                        <button
                          onClick={() => share.permission !== 'edit' && handleUpdatePermission(share.id, 'edit')}
                          disabled={!!updatingShare}
                          className={`px-2 py-1 text-xs flex items-center gap-1 transition-colors ${
                            share.permission === 'edit'
                              ? 'bg-cyan-600 text-white font-medium'
                              : 'bg-white text-gray-400 hover:bg-gray-50'
                          }`}
                        >
                          {updatingShare === share.id
                            ? <Loader2 className="w-3 h-3 animate-spin" />
                            : <Edit3 className="w-3 h-3" />
                          }
                          Edit
                        </button>
                      </div>
                      <button
                        onClick={() => handleRemove(share.id)}
                        disabled={removingShare === share.id}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-gray-300 hover:text-red-500 transition-colors disabled:opacity-40"
                      >
                        {removingShare === share.id
                          ? <Loader2 className="w-4 h-4 animate-spin" />
                          : <Trash2 className="w-4 h-4" />
                        }
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Add new share */}
          <div>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Add people
            </h3>

            {/* Permission selector for new shares */}
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs text-gray-500">Permission:</span>
              <div className="flex rounded-lg overflow-hidden border border-gray-200">
                <button
                  onClick={() => setNewPermission('view')}
                  className={`px-3 py-1.5 text-xs flex items-center gap-1.5 transition-colors ${
                    newPermission === 'view'
                      ? 'bg-gray-200 text-gray-700 font-medium'
                      : 'bg-white text-gray-400 hover:bg-gray-50'
                  }`}
                >
                  <Eye className="w-3 h-3" />
                  View only
                </button>
                <button
                  onClick={() => setNewPermission('edit')}
                  className={`px-3 py-1.5 text-xs flex items-center gap-1.5 transition-colors ${
                    newPermission === 'edit'
                      ? 'bg-cyan-600 text-white font-medium'
                      : 'bg-white text-gray-400 hover:bg-gray-50'
                  }`}
                >
                  <Edit3 className="w-3 h-3" />
                  Can edit
                </button>
              </div>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => { setSearchQuery(e.target.value); setError(null); }}
                placeholder="Search by name or email..."
                className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
              />
              {searching && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 animate-spin" />
              )}
            </div>

            {/* Results */}
            {searchResults.length > 0 && (
              <div className="mt-2 border border-gray-200 rounded-xl overflow-hidden">
                {searchResults.map((result, i) => (
                  <div
                    key={result.id}
                    className={`flex items-center gap-3 px-4 py-3 ${
                      i > 0 ? 'border-t border-gray-100' : ''
                    }`}
                  >
                    <div className="w-8 h-8 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center text-sm font-semibold shrink-0 uppercase">
                      {(result.full_name || result.email)[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {result.full_name || result.email}
                      </p>
                      {result.full_name && (
                        <p className="text-xs text-gray-500 truncate">{result.email}</p>
                      )}
                    </div>
                    <button
                      onClick={() => handleAdd(result)}
                      disabled={addingUser === result.id}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-600 hover:bg-cyan-700 text-white text-xs rounded-lg transition-colors disabled:opacity-50 shrink-0"
                    >
                      {addingUser === result.id
                        ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        : <UserPlus className="w-3.5 h-3.5" />
                      }
                      Add
                    </button>
                  </div>
                ))}
              </div>
            )}

            {searchQuery.trim() && !searching && searchResults.length === 0 && (
              <p className="text-sm text-gray-400 mt-2 px-1">No users found</p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100">
          <p className="text-xs text-gray-400 text-center">
            <strong className="text-gray-500">View</strong> — can see selections and export.&nbsp;
            <strong className="text-gray-500">Edit</strong> — can add and remove selections.
          </p>
        </div>
      </div>
    </div>
  );
};
