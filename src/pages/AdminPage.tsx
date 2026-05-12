import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Navigate, useSearchParams } from 'react-router-dom';
import { Leaf, Mountain, MapPin, Users, Upload, FileText, Ticket } from 'lucide-react';
import { PlantList } from '../components/Admin/PlantList';
import { StoneList } from '../components/Admin/StoneList';
import { ZoneManagement } from '../components/Admin/ZoneManagement';
import { UserManagement } from '../components/Admin/UserManagement';
import { BulkImageUploader } from '../components/Admin/BulkImageUploader';
import PDFUploader from '../components/Admin/PDFUploader';
import { TicketManagement } from '../components/Admin/TicketManagement';
import { supabase } from '../lib/supabase';

export const AdminPage: React.FC = () => {
  const { isAdmin } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [stats, setStats] = useState({ plants: 0, stones: 0 });

  const tabParam = searchParams.get('tab') as 'plants' | 'stones' | 'zones' | 'users' | 'bulk-upload' | 'pdfs' | 'tickets' | null;
  const activeTab = tabParam || 'plants';

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const [plantsResult, stonesResult] = await Promise.all([
        supabase.from('plants_flat').select('id', { count: 'exact', head: true }),
        supabase.from('stones').select('id', { count: 'exact', head: true }),
      ]);

      setStats({
        plants: plantsResult.count || 0,
        stones: stonesResult.count || 0,
      });
    } catch (err) {
      console.error('Error loading stats:', err);
    }
  };

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-transparent">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Admin Dashboard</h1>

        <div className="mb-8 grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-cyan-600 font-medium">Total Plants</p>
                <p className="text-2xl font-bold text-cyan-900 mt-1">{stats.plants}</p>
              </div>
              <Leaf className="w-8 h-8 text-cyan-600" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Total Stones</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats.stones}</p>
              </div>
              <Mountain className="w-8 h-8 text-gray-600" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Total Items</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats.plants + stats.stones}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-orange-600 font-medium">User Management</p>
                <p className="text-sm text-gray-600 mt-1">Manage users & access</p>
              </div>
              <Users className="w-8 h-8 text-orange-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm">
          <div className="border-b border-gray-200">
            <div className="flex overflow-x-auto">
              <button
                onClick={() => setSearchParams({ tab: 'plants' })}
                className={`flex items-center px-6 py-4 font-medium transition-colors whitespace-nowrap ${
                  activeTab === 'plants'
                    ? 'border-b-2 border-cyan-600 text-cyan-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Leaf className="w-5 h-5 mr-2" />
                Manage Plants
              </button>
              <button
                onClick={() => setSearchParams({ tab: 'bulk-upload' })}
                className={`flex items-center px-6 py-4 font-medium transition-colors whitespace-nowrap ${
                  activeTab === 'bulk-upload'
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Upload className="w-5 h-5 mr-2" />
                Bulk Upload
              </button>
              <button
                onClick={() => setSearchParams({ tab: 'stones' })}
                className={`flex items-center px-6 py-4 font-medium transition-colors whitespace-nowrap ${
                  activeTab === 'stones'
                    ? 'border-b-2 border-gray-600 text-gray-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Mountain className="w-5 h-5 mr-2" />
                Manage Stones
              </button>
              <button
                onClick={() => setSearchParams({ tab: 'zones' })}
                className={`flex items-center px-6 py-4 font-medium transition-colors whitespace-nowrap ${
                  activeTab === 'zones'
                    ? 'border-b-2 border-cyan-600 text-cyan-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <MapPin className="w-5 h-5 mr-2" />
                Zone Management
              </button>
              <button
                onClick={() => setSearchParams({ tab: 'users' })}
                className={`flex items-center px-6 py-4 font-medium transition-colors whitespace-nowrap ${
                  activeTab === 'users'
                    ? 'border-b-2 border-orange-600 text-orange-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Users className="w-5 h-5 mr-2" />
                User Management
              </button>
              <button
                onClick={() => setSearchParams({ tab: 'pdfs' })}
                className={`flex items-center px-6 py-4 font-medium transition-colors whitespace-nowrap ${
                  activeTab === 'pdfs'
                    ? 'border-b-2 border-red-600 text-red-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <FileText className="w-5 h-5 mr-2" />
                PDF Upload
              </button>
              <button
                onClick={() => setSearchParams({ tab: 'tickets' })}
                className={`flex items-center px-6 py-4 font-medium transition-colors whitespace-nowrap ${
                  activeTab === 'tickets'
                    ? 'border-b-2 border-purple-600 text-purple-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Ticket className="w-5 h-5 mr-2" />
                Tickets
              </button>
            </div>
          </div>

          <div className="p-8">
            {activeTab === 'plants' ? (
              <PlantList />
            ) : activeTab === 'bulk-upload' ? (
              <BulkImageUploader />
            ) : activeTab === 'stones' ? (
              <StoneList />
            ) : activeTab === 'zones' ? (
              <ZoneManagement />
            ) : activeTab === 'users' ? (
              <UserManagement />
            ) : activeTab === 'pdfs' ? (
              <PDFUploader />
            ) : (
              <TicketManagement />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
