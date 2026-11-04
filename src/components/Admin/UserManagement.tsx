import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Users, UserPlus, Shield, Clock, Check, X, Key, Loader2, Trash2, Copy } from 'lucide-react';

interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  role: 'admin' | 'user';
  status: 'active' | 'inactive' | 'pending';
  invited_by: string | null;
  invited_at: string;
  last_login: string | null;
  created_at: string;
  updated_at: string;
  temporary_password: string | null;
  must_change_password: boolean;
  password_changed_at: string | null;
}

export const UserManagement: React.FC = () => {
  const { user, refreshUserProfile } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteFullName, setInviteFullName] = useState('');
  const [inviteRole, setInviteRole] = useState<'user' | 'admin'>('user');
  const [inviting, setInviting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [generatedOTP, setGeneratedOTP] = useState<string | null>(null);
  const [showOTP, setShowOTP] = useState(false);
  const [regeneratingOTP, setRegeneratingOTP] = useState<string | null>(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (err) {
      console.error('Error loading users:', err);
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const generateOTP = (): string => {
    const chars = '0123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz';
    let result = '';
    for (let i = 0; i < 12; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const handleInviteUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviting(true);
    setError(null);
    setSuccess(null);
    setGeneratedOTP(null);

    try {
      const otp = generateOTP();

      const { data: { session } } = await supabase.auth.getSession();

      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-user`;
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: inviteEmail,
          password: otp,
          full_name: inviteFullName,
          role: inviteRole,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to create user');
      }

      setGeneratedOTP(otp);
      setShowOTP(true);
      setSuccess(`User created successfully. Share the OTP with ${inviteEmail}`);
      setInviteEmail('');
      setInviteFullName('');
      setInviteRole('user');

      await loadUsers();
    } catch (err: any) {
      console.error('Error creating user:', err);
      setError(err.message || 'Failed to create user');
    } finally {
      setInviting(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setSuccess('OTP copied to clipboard');
  };

  const handleUpdateUserStatus = async (userId: string, newStatus: 'active' | 'inactive') => {
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ status: newStatus })
        .eq('id', userId);

      if (error) throw error;

      setSuccess(`User status updated to ${newStatus}`);
      await loadUsers();
    } catch (err) {
      console.error('Error updating user status:', err);
      setError('Failed to update user status');
    }
  };

  const handleUpdateUserRole = async (userId: string, newRole: 'admin' | 'user') => {
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ role: newRole })
        .eq('id', userId);

      if (error) throw error;

      setSuccess(`User role updated to ${newRole}`);
      await loadUsers();

      if (user?.id === userId) {
        await refreshUserProfile();
      }
    } catch (err) {
      console.error('Error updating user role:', err);
      setError('Failed to update user role');
    }
  };

  const handleRegenerateOTP = async (userId: string, userEmail: string, _fullName: string) => {
    if (!confirm(`Generate a new OTP for ${userEmail}?`)) {
      return;
    }

    setRegeneratingOTP(userId);
    setError(null);
    setSuccess(null);

    try {
      const otp = generateOTP();
      const { data: { session } } = await supabase.auth.getSession();

      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/reset-user-password`;
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          new_password: otp,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to reset password');
      }

      setGeneratedOTP(otp);
      setShowOTP(true);
      setSuccess(`New OTP generated for ${userEmail}`);
      await loadUsers();
    } catch (err: any) {
      console.error('Error regenerating OTP:', err);
      setError(err.message || 'Failed to regenerate OTP');
    } finally {
      setRegeneratingOTP(null);
    }
  };

  const handleDeleteUser = async (userId: string, userEmail: string) => {
    if (!confirm(`Are you sure you want to delete user ${userEmail}? This action cannot be undone.`)) {
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();

      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete-user`;
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to delete user');
      }

      setSuccess(`User ${userEmail} deleted successfully`);
      await loadUsers();
    } catch (err: any) {
      console.error('Error deleting user:', err);
      setError(err.message || 'Failed to delete user. You may need admin privileges.');
    }
  };

  const formatLastLogin = (ts: string | null) => {
    if (!ts) return { main: 'Never', sub: null };
    const date = new Date(ts);
    const now = Date.now();
    const diff = now - date.getTime();
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    let relative: string;
    if (mins < 2) relative = 'just now';
    else if (mins < 60) relative = `${mins}m ago`;
    else if (hours < 24) relative = `${hours}h ago`;
    else if (days < 30) relative = `${days}d ago`;
    else relative = `${Math.floor(days / 30)}mo ago`;

    return {
      main: date.toLocaleDateString(undefined, { day: '2-digit', month: '2-digit', year: 'numeric' }),
      sub: `${date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })} · ${relative}`,
    };
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'inactive': return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
      case 'pending': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getRoleColor = (role: string) => {
    return role === 'admin'
      ? 'bg-purple-500/20 text-purple-400 border-purple-500/30'
      : 'bg-blue-500/20 text-blue-400 border-blue-500/30';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Users className="w-6 h-6 text-emerald-400" />
          <h2 className="text-2xl font-bold text-white">User Management</h2>
        </div>
        <button
          onClick={() => setShowInviteForm(!showInviteForm)}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors"
        >
          <UserPlus className="w-4 h-4" />
          Invite User
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 flex items-start gap-3">
          <X className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-red-400 font-medium">Error</p>
            <p className="text-red-300 text-sm mt-1">{error}</p>
          </div>
          <button onClick={() => setError(null)} className="text-red-400 hover:text-red-300">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {success && (
        <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 flex items-start gap-3">
          <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-green-400 font-medium">Success</p>
            <p className="text-green-300 text-sm mt-1">{success}</p>
          </div>
          <button onClick={() => setSuccess(null)} className="text-green-400 hover:text-green-300">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {showInviteForm && (
        <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Key className="w-5 h-5 text-emerald-400" />
            Create New User
          </h3>
          <form onSubmit={handleInviteUser} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Email Address
              </label>
              <input
                type="email"
                required
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                placeholder="user@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Full Name
              </label>
              <input
                type="text"
                required
                value={inviteFullName}
                onChange={(e) => setInviteFullName(e.target.value)}
                className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                placeholder="John Doe"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Role
              </label>
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as 'user' | 'admin')}
                className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={inviting}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-600/50 text-white rounded-lg transition-colors"
              >
                {inviting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Creating User...
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    Create User
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => setShowInviteForm(false)}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {generatedOTP && showOTP && (
        <div className="bg-gradient-to-r from-emerald-900/50 to-emerald-800/50 border border-emerald-700 rounded-lg p-6">
          <div className="flex items-start justify-between mb-4">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <Key className="w-5 h-5 text-emerald-400" />
              One-Time Password Generated
            </h3>
            <button
              onClick={() => setShowOTP(false)}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="bg-zinc-900 rounded-lg p-4 mb-4">
            <div className="flex items-center justify-between">
              <div className="font-mono text-2xl text-white tracking-wider">
                {generatedOTP}
              </div>
              <button
                onClick={() => copyToClipboard(generatedOTP)}
                className="flex items-center gap-2 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors"
              >
                <Copy className="w-4 h-4" />
                Copy
              </button>
            </div>
          </div>
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
            <p className="text-yellow-400 text-sm">
              <strong>Important:</strong> Share this OTP securely with the user. They will need to change this password on their first login.
            </p>
          </div>
        </div>
      )}

      <div className="bg-zinc-900 border border-zinc-700 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-zinc-800 border-b border-zinc-700">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Last Login
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-4 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-zinc-800/50 transition-colors">
                  <td className="px-6 py-4">
                    <div>
                      <div className="font-medium text-white">{user.full_name || 'Unknown'}</div>
                      <div className="text-sm text-gray-400">{user.email}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <select
                      value={user.role}
                      onChange={(e) => handleUpdateUserRole(user.id, e.target.value as 'admin' | 'user')}
                      className={`px-3 py-1 rounded-full text-xs font-medium border ${getRoleColor(user.role)} bg-transparent cursor-pointer`}
                    >
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                  <td className="px-6 py-4">
                    <select
                      value={user.status}
                      onChange={(e) => handleUpdateUserStatus(user.id, e.target.value as 'active' | 'inactive')}
                      className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(user.status)} bg-transparent cursor-pointer`}
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="pending">Pending</option>
                    </select>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="w-4 h-4 text-gray-500 flex-shrink-0" />
                      {(() => {
                        const { main, sub } = formatLastLogin(user.last_login);
                        return (
                          <div>
                            <div className={main === 'Never' ? 'text-gray-600 italic' : 'text-gray-300'}>{main}</div>
                            {sub && <div className="text-xs text-gray-500">{sub}</div>}
                          </div>
                        );
                      })()}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-400">
                      {new Date(user.created_at).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleRegenerateOTP(user.id, user.email, user.full_name || 'Unknown')}
                        disabled={regeneratingOTP === user.id}
                        className="inline-flex items-center gap-2 px-3 py-1 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {regeneratingOTP === user.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Key className="w-4 h-4" />
                        )}
                        Reset OTP
                      </button>
                      <button
                        onClick={() => handleDeleteUser(user.id, user.email)}
                        className="inline-flex items-center gap-2 px-3 py-1 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {users.length === 0 && (
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-gray-700 mx-auto mb-4" />
            <p className="text-gray-400 text-lg mb-2">No Users Found</p>
            <p className="text-gray-600 text-sm">
              Invite users to get started with user management
            </p>
          </div>
        )}
      </div>

      <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Shield className="w-5 h-5 text-emerald-400" />
          User Statistics
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-zinc-800 rounded-lg p-4">
            <div className="text-gray-400 text-sm mb-1">Total Users</div>
            <div className="text-2xl font-bold text-white">{users.length}</div>
          </div>
          <div className="bg-zinc-800 rounded-lg p-4">
            <div className="text-gray-400 text-sm mb-1">Active Users</div>
            <div className="text-2xl font-bold text-green-400">
              {users.filter(u => u.status === 'active').length}
            </div>
          </div>
          <div className="bg-zinc-800 rounded-lg p-4">
            <div className="text-gray-400 text-sm mb-1">Admins</div>
            <div className="text-2xl font-bold text-purple-400">
              {users.filter(u => u.role === 'admin').length}
            </div>
          </div>
          <div className="bg-zinc-800 rounded-lg p-4">
            <div className="text-gray-400 text-sm mb-1">Pending</div>
            <div className="text-2xl font-bold text-yellow-400">
              {users.filter(u => u.status === 'pending').length}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
