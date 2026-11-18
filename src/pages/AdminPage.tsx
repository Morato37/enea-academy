import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Navigate, useSearchParams } from 'react-router-dom';
import {
  Leaf, Mountain, MapPin, Users, Upload, FileText, Ticket, Ruler, Library,
  Search, ArrowLeft,
} from 'lucide-react';
import { PlantList } from '../components/Admin/PlantList';
import { StoneList } from '../components/Admin/StoneList';
import { ZoneManagement } from '../components/Admin/ZoneManagement';
import { UserManagement } from '../components/Admin/UserManagement';
import { BulkImageUploader } from '../components/Admin/BulkImageUploader';
import PDFUploader from '../components/Admin/PDFUploader';
import { TicketManagement } from '../components/Admin/TicketManagement';
import { TreeSizeClassesEditor } from '../components/Admin/TreeSizeClassesEditor';
import { LibraryManagement } from '../components/Admin/LibraryManagement';
import { ImageDiagnostics } from '../components/Admin/ImageDiagnostics';
import { supabase } from '../lib/supabase';

type AdminTool =
  | 'plants' | 'stones' | 'zones' | 'users'
  | 'bulk-upload' | 'image-diagnostics' | 'pdfs' | 'tickets' | 'tree-sizes' | 'library';

interface ToolTile {
  key: AdminTool;
  label: string;
  description: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  hoverBg: string;
  ring: string;
}

const TOOLS: ToolTile[] = [
  {
    key: 'plants',
    label: 'Plants',
    description: 'Add, edit and manage the plant catalog',
    icon: Leaf,
    color: 'text-[#2F7041]',
    bgColor: 'bg-green-50',
    hoverBg: 'hover:bg-green-100',
    ring: 'hover:ring-green-300',
  },
  {
    key: 'stones',
    label: 'Stones',
    description: 'Manage stones, finishes and combinations',
    icon: Mountain,
    color: 'text-slate-600',
    bgColor: 'bg-slate-50',
    hoverBg: 'hover:bg-slate-100',
    ring: 'hover:ring-slate-300',
  },
  {
    key: 'library',
    label: 'Library',
    description: 'Manage book catalog and reservations',
    icon: Library,
    color: 'text-sky-600',
    bgColor: 'bg-sky-50',
    hoverBg: 'hover:bg-sky-100',
    ring: 'hover:ring-sky-300',
  },
  {
    key: 'zones',
    label: 'Zone Management',
    description: 'Postal codes and climate zone data',
    icon: MapPin,
    color: 'text-teal-600',
    bgColor: 'bg-teal-50',
    hoverBg: 'hover:bg-teal-100',
    ring: 'hover:ring-teal-300',
  },
  {
    key: 'tree-sizes',
    label: 'Tree Size Classes',
    description: 'Define size classes for tree benefit calculations',
    icon: Ruler,
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50',
    hoverBg: 'hover:bg-emerald-100',
    ring: 'hover:ring-emerald-300',
  },
  {
    key: 'users',
    label: 'User Management',
    description: 'Manage user accounts, roles and access',
    icon: Users,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    hoverBg: 'hover:bg-orange-100',
    ring: 'hover:ring-orange-300',
  },
  {
    key: 'bulk-upload',
    label: 'Bulk Image Upload',
    description: 'Upload multiple plant or stone images at once',
    icon: Upload,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    hoverBg: 'hover:bg-blue-100',
    ring: 'hover:ring-blue-300',
  },
  {
    key: 'image-diagnostics',
    label: 'Image Diagnostics',
    description: 'Find broken links, shared images, and missing plant pictures',
    icon: Search,
    color: 'text-cyan-600',
    bgColor: 'bg-cyan-50',
    hoverBg: 'hover:bg-cyan-100',
    ring: 'hover:ring-cyan-300',
  },
  {
    key: 'pdfs',
    label: 'Media Upload',
    description: 'Upload PDFs and other media documents',
    icon: FileText,
    color: 'text-rose-600',
    bgColor: 'bg-rose-50',
    hoverBg: 'hover:bg-rose-100',
    ring: 'hover:ring-rose-300',
  },
  {
    key: 'tickets',
    label: 'Tickets',
    description: 'Review and manage user-submitted tickets',
    icon: Ticket,
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
    hoverBg: 'hover:bg-amber-100',
    ring: 'hover:ring-amber-300',
  },
];

export const AdminPage: React.FC = () => {
  const { isAdmin } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [stats, setStats] = useState({ plants: 0, stones: 0, users: 0, tickets: 0 });

  const tabParam = searchParams.get('tab') as AdminTool | null;
  const activeTab: AdminTool | null = tabParam || null;

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const [plantsRes, stonesRes, usersRes, ticketsRes] = await Promise.all([
        supabase.from('plants_flat').select('id', { count: 'exact', head: true }),
        supabase.from('stones').select('id', { count: 'exact', head: true }),
        supabase.from('user_profiles').select('id', { count: 'exact', head: true }),
        supabase.from('tickets').select('id', { count: 'exact', head: true }),
      ]);

      setStats({
        plants: plantsRes.count || 0,
        stones: stonesRes.count || 0,
        users: usersRes.count || 0,
        tickets: ticketsRes.count || 0,
      });
    } catch {
      // Stats are decorative; ignore errors
    }
  };

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  const goBack = () => setSearchParams({});

  const statFor = (key: AdminTool): string | null => {
    switch (key) {
      case 'plants': return stats.plants.toLocaleString();
      case 'stones': return stats.stones.toLocaleString();
      case 'users': return stats.users.toLocaleString();
      case 'tickets': return stats.tickets.toLocaleString();
      default: return null;
    }
  };

  // --- Tool view (individual admin tool is active) ---
  if (activeTab) {
    const tool = TOOLS.find(t => t.key === activeTab);
    const ToolIcon = tool?.icon || Leaf;

    return (
      <div className="min-h-screen bg-gray-50">
        <div className="sticky top-0 z-30 bg-white border-b border-gray-200 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-14">
              <button
                onClick={goBack}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 font-medium transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                Dashboard
              </button>
              <div className="flex items-center gap-2">
                <ToolIcon className={`w-5 h-5 ${tool?.color || 'text-gray-600'}`} />
                <span className="font-semibold text-gray-900">{tool?.label || activeTab}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {activeTab === 'plants' ? (
            <PlantList />
          ) : activeTab === 'bulk-upload' ? (
            <BulkImageUploader />
          ) : activeTab === 'image-diagnostics' ? (
            <ImageDiagnostics />
          ) : activeTab === 'stones' ? (
            <StoneList />
          ) : activeTab === 'zones' ? (
            <ZoneManagement />
          ) : activeTab === 'users' ? (
            <UserManagement />
          ) : activeTab === 'pdfs' ? (
            <PDFUploader />
          ) : activeTab === 'tree-sizes' ? (
            <TreeSizeClassesEditor />
          ) : activeTab === 'library' ? (
            <LibraryManagement />
          ) : (
            <TicketManagement />
          )}
        </div>
      </div>
    );
  }

  // --- Overview (tile dashboard) ---
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight">Admin Dashboard</h1>
          <p className="text-gray-500 mt-2 text-lg">Select a tool to manage your platform</p>
        </div>

        {/* Stats row */}
        <div className="mb-10 grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Plants</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats.plants.toLocaleString()}</p>
              </div>
              <div className="w-11 h-11 rounded-lg bg-green-50 flex items-center justify-center">
                <Leaf className="w-6 h-6 text-[#2F7041]" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Stones</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats.stones.toLocaleString()}</p>
              </div>
              <div className="w-11 h-11 rounded-lg bg-slate-50 flex items-center justify-center">
                <Mountain className="w-6 h-6 text-slate-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Users</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats.users.toLocaleString()}</p>
              </div>
              <div className="w-11 h-11 rounded-lg bg-orange-50 flex items-center justify-center">
                <Users className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Tickets</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats.tickets.toLocaleString()}</p>
              </div>
              <div className="w-11 h-11 rounded-lg bg-amber-50 flex items-center justify-center">
                <Ticket className="w-6 h-6 text-amber-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Tool tiles */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {TOOLS.map(tool => {
            const Icon = tool.icon;
            const stat = statFor(tool.key);

            return (
              <button
                key={tool.key}
                onClick={() => setSearchParams({ tab: tool.key })}
                className={`group text-left bg-white rounded-xl shadow-sm border border-gray-100 p-6 ring-2 ring-transparent ${tool.hoverBg} ${tool.ring} transition-all duration-200 hover:shadow-md`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-14 h-14 rounded-xl ${tool.bgColor} flex items-center justify-center group-hover:scale-110 transition-transform duration-200`}>
                    <Icon className={`w-7 h-7 ${tool.color}`} />
                  </div>
                  {stat && (
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${tool.bgColor} ${tool.color}`}>
                      {stat}
                    </span>
                  )}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">{tool.label}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{tool.description}</p>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
