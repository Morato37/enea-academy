import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Copy, Trash2, Loader2, Flower } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface BloomCalendarSummary {
  id: string;
  title: string;
  center_text: string;
  created_at: string;
  updated_at: string;
  plant_count: number;
}

export const BloomCalendarListPage: React.FC = () => {
  const navigate = useNavigate();
  const [calendars, setCalendars] = useState<BloomCalendarSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null);

  const loadCalendars = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('bloom_calendars')
      .select('id, title, center_text, created_at, updated_at')
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error loading calendars:', error);
    } else {
      const ids = (data || []).map(c => c.id);
      let counts: Record<string, number> = {};
      if (ids.length) {
        const { data: plantData } = await supabase
          .from('bloom_calendar_plants')
          .select('calendar_id')
          .in('calendar_id', ids);
        if (plantData) {
          plantData.forEach(p => {
            counts[p.calendar_id] = (counts[p.calendar_id] || 0) + 1;
          });
        }
      }
      setCalendars((data || []).map(c => ({
        ...c,
        plant_count: counts[c.id] || 0,
      })));
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadCalendars();
  }, [loadCalendars]);

  const handleCreate = async () => {
    setCreating(true);
    const { data, error } = await supabase
      .from('bloom_calendars')
      .insert({ title: 'New Bloom Calendar' })
      .select('id')
      .single();

    if (error) {
      console.error('Error creating calendar:', error);
      setCreating(false);
      return;
    }
    navigate(`/bluehkalender/${data.id}`);
  };

  const handleDuplicate = async (id: string) => {
    setDuplicatingId(id);
    const { data: cal } = await supabase
      .from('bloom_calendars')
      .select('title, center_text, options, climate')
      .eq('id', id)
      .single();

    if (!cal) { setDuplicatingId(null); return; }

    const { data: newCal } = await supabase
      .from('bloom_calendars')
      .insert({ ...cal, title: cal.title + ' (Copy)' })
      .select('id')
      .single();

    if (newCal) {
      const { data: plants } = await supabase
        .from('bloom_calendar_plants')
        .select('plant_id, position, custom_name, months_override, bloom_color, leaf_color')
        .eq('calendar_id', id)
        .order('position');

      if (plants && plants.length) {
        await supabase
          .from('bloom_calendar_plants')
          .insert(plants.map(p => ({ ...p, calendar_id: newCal.id })));
      }
    }
    await loadCalendars();
    setDuplicatingId(null);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this bloom calendar?')) return;
    setDeletingId(id);
    await supabase.from('bloom_calendars').delete().eq('id', id);
    setCalendars(prev => prev.filter(c => c.id !== id));
    setDeletingId(null);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <Flower className="w-6 h-6 text-cyan-600" />
          Bloom Calendar
        </h1>
        <button
          onClick={handleCreate}
          disabled={creating}
          className="flex items-center gap-2 rounded-lg bg-cyan-600 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-700 disabled:opacity-50"
        >
          {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          New
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-gray-400">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
      ) : calendars.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <Flower className="w-12 h-12 mx-auto mb-4 opacity-40" />
          <p>No bloom calendars yet. Click "New" to create one.</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {calendars.map(cal => (
            <div
              key={cal.id}
              className="group rounded-xl border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => navigate(`/bluehkalender/${cal.id}`)}
            >
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold text-gray-800 truncate flex-1">{cal.title}</h3>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDuplicate(cal.id); }}
                    disabled={duplicatingId === cal.id}
                    className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-cyan-600"
                    title="Duplicate"
                  >
                    {duplicatingId === cal.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Copy className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDelete(cal.id); }}
                    disabled={deletingId === cal.id}
                    className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500"
                    title="Delete"
                  >
                    {deletingId === cal.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <p className="text-xs text-gray-400">{cal.plant_count} plants</p>
              <p className="text-xs text-gray-400 mt-1">
                {new Date(cal.updated_at).toLocaleDateString('en-US')}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
