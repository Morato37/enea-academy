import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { MapPin, Plus, Trash2, CheckCircle, XCircle, Save } from 'lucide-react';

interface ZoneAdjustment {
  id: string;
  location_identifier: string;
  latitude: number | null;
  longitude: number | null;
  original_zone: string | null;
  adjusted_zone: string;
  adjustment_reason: string;
  verified_by: string | null;
  confidence_score: number;
  is_active: boolean;
  created_at: string;
}

interface MicroclimateFactor {
  id: string;
  location_name: string;
  latitude_min: number;
  latitude_max: number;
  longitude_min: number;
  longitude_max: number;
  factor_type: string;
  zone_adjustment: number;
  description: string | null;
  confidence_score: number;
  is_active: boolean;
}

export function ZoneManagement() {
  const [adjustments, setAdjustments] = useState<ZoneAdjustment[]>([]);
  const [factors, setFactors] = useState<MicroclimateFactor[]>([]);
  const [activeTab, setActiveTab] = useState<'adjustments' | 'factors'>('adjustments');
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  const [newAdjustment, setNewAdjustment] = useState({
    location_identifier: '',
    latitude: '',
    longitude: '',
    original_zone: '',
    adjusted_zone: '',
    adjustment_reason: '',
    verified_by: 'Admin',
  });

  const [newFactor, setNewFactor] = useState({
    location_name: '',
    latitude_min: '',
    latitude_max: '',
    longitude_min: '',
    longitude_max: '',
    factor_type: 'urban_heat_island',
    zone_adjustment: '0.5',
    description: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [adjResult, factorResult] = await Promise.all([
        supabase.from('zone_adjustments').select('*').order('created_at', { ascending: false }),
        supabase.from('microclimate_factors').select('*').order('location_name'),
      ]);

      if (adjResult.data) setAdjustments(adjResult.data);
      if (factorResult.data) setFactors(factorResult.data);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function addAdjustment() {
    if (!newAdjustment.location_identifier || !newAdjustment.adjusted_zone || !newAdjustment.adjustment_reason) {
      alert('Please fill in required fields: Location, Adjusted Zone, and Reason');
      return;
    }

    const { error } = await supabase.from('zone_adjustments').insert({
      location_identifier: newAdjustment.location_identifier,
      latitude: newAdjustment.latitude ? parseFloat(newAdjustment.latitude) : null,
      longitude: newAdjustment.longitude ? parseFloat(newAdjustment.longitude) : null,
      original_zone: newAdjustment.original_zone || null,
      adjusted_zone: newAdjustment.adjusted_zone,
      adjustment_reason: newAdjustment.adjustment_reason,
      verified_by: newAdjustment.verified_by,
      confidence_score: 0.99,
      is_active: true,
    });

    if (error) {
      alert('Failed to add adjustment: ' + error.message);
    } else {
      setNewAdjustment({
        location_identifier: '',
        latitude: '',
        longitude: '',
        original_zone: '',
        adjusted_zone: '',
        adjustment_reason: '',
        verified_by: 'Admin',
      });
      setShowAddForm(false);
      loadData();
    }
  }

  async function addFactor() {
    if (!newFactor.location_name || !newFactor.latitude_min || !newFactor.latitude_max) {
      alert('Please fill in required fields');
      return;
    }

    const { error } = await supabase.from('microclimate_factors').insert({
      location_name: newFactor.location_name,
      latitude_min: parseFloat(newFactor.latitude_min),
      latitude_max: parseFloat(newFactor.latitude_max),
      longitude_min: parseFloat(newFactor.longitude_min),
      longitude_max: parseFloat(newFactor.longitude_max),
      factor_type: newFactor.factor_type,
      zone_adjustment: parseFloat(newFactor.zone_adjustment),
      description: newFactor.description || null,
      confidence_score: 0.85,
      is_active: true,
    });

    if (error) {
      alert('Failed to add factor: ' + error.message);
    } else {
      setNewFactor({
        location_name: '',
        latitude_min: '',
        latitude_max: '',
        longitude_min: '',
        longitude_max: '',
        factor_type: 'urban_heat_island',
        zone_adjustment: '0.5',
        description: '',
      });
      setShowAddForm(false);
      loadData();
    }
  }

  async function toggleActive(id: string, table: 'zone_adjustments' | 'microclimate_factors', currentState: boolean) {
    const { error } = await supabase
      .from(table)
      .update({ is_active: !currentState })
      .eq('id', id);

    if (!error) {
      loadData();
    }
  }

  async function deleteItem(id: string, table: 'zone_adjustments' | 'microclimate_factors') {
    if (!confirm('Are you sure you want to delete this item?')) return;

    const { error } = await supabase.from(table).delete().eq('id', id);

    if (!error) {
      loadData();
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <MapPin className="w-6 h-6" />
          Zone Management
        </h2>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg flex items-center gap-2 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add New
        </button>
      </div>

      <div className="flex gap-2 border-b border-zinc-700">
        <button
          onClick={() => setActiveTab('adjustments')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'adjustments'
              ? 'text-emerald-400 border-b-2 border-emerald-400'
              : 'text-gray-400 hover:text-gray-300'
          }`}
        >
          Zone Adjustments ({adjustments.length})
        </button>
        <button
          onClick={() => setActiveTab('factors')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'factors'
              ? 'text-emerald-400 border-b-2 border-emerald-400'
              : 'text-gray-400 hover:text-gray-300'
          }`}
        >
          Microclimate Factors ({factors.length})
        </button>
      </div>

      {showAddForm && (
        <div className="bg-zinc-800 rounded-lg p-6 border border-zinc-700">
          <h3 className="text-lg font-semibold text-white mb-4">
            {activeTab === 'adjustments' ? 'Add Zone Adjustment' : 'Add Microclimate Factor'}
          </h3>

          {activeTab === 'adjustments' ? (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-300 mb-1">Location Name *</label>
                <input
                  type="text"
                  value={newAdjustment.location_identifier}
                  onChange={(e) => setNewAdjustment({ ...newAdjustment, location_identifier: e.target.value })}
                  placeholder="Milano, Italy"
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded text-white"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">Adjusted Zone *</label>
                <input
                  type="text"
                  value={newAdjustment.adjusted_zone}
                  onChange={(e) => setNewAdjustment({ ...newAdjustment, adjusted_zone: e.target.value })}
                  placeholder="9a"
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded text-white"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">Latitude</label>
                <input
                  type="number"
                  step="0.0001"
                  value={newAdjustment.latitude}
                  onChange={(e) => setNewAdjustment({ ...newAdjustment, latitude: e.target.value })}
                  placeholder="45.4642"
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded text-white"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">Longitude</label>
                <input
                  type="number"
                  step="0.0001"
                  value={newAdjustment.longitude}
                  onChange={(e) => setNewAdjustment({ ...newAdjustment, longitude: e.target.value })}
                  placeholder="9.1900"
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded text-white"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">Original Zone</label>
                <input
                  type="text"
                  value={newAdjustment.original_zone}
                  onChange={(e) => setNewAdjustment({ ...newAdjustment, original_zone: e.target.value })}
                  placeholder="8b"
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded text-white"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">Verified By</label>
                <input
                  type="text"
                  value={newAdjustment.verified_by}
                  onChange={(e) => setNewAdjustment({ ...newAdjustment, verified_by: e.target.value })}
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded text-white"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm text-gray-300 mb-1">Reason *</label>
                <textarea
                  value={newAdjustment.adjustment_reason}
                  onChange={(e) => setNewAdjustment({ ...newAdjustment, adjustment_reason: e.target.value })}
                  placeholder="Jelitto verified - Po Valley climate with mild winters"
                  rows={2}
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded text-white"
                />
              </div>
              <div className="col-span-2 flex gap-2">
                <button
                  onClick={addAdjustment}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  Save Adjustment
                </button>
                <button
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-white rounded"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-300 mb-1">Location Name *</label>
                <input
                  type="text"
                  value={newFactor.location_name}
                  onChange={(e) => setNewFactor({ ...newFactor, location_name: e.target.value })}
                  placeholder="Milano Urban Area"
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded text-white"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">Factor Type *</label>
                <select
                  value={newFactor.factor_type}
                  onChange={(e) => setNewFactor({ ...newFactor, factor_type: e.target.value })}
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded text-white"
                >
                  <option value="urban_heat_island">Urban Heat Island</option>
                  <option value="coastal_moderation">Coastal Moderation</option>
                  <option value="valley_pooling">Valley Cooling</option>
                  <option value="lake_effect">Lake Effect</option>
                  <option value="wind_exposure">Wind Exposure</option>
                  <option value="custom">Custom</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">Latitude Min *</label>
                <input
                  type="number"
                  step="0.01"
                  value={newFactor.latitude_min}
                  onChange={(e) => setNewFactor({ ...newFactor, latitude_min: e.target.value })}
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded text-white"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">Latitude Max *</label>
                <input
                  type="number"
                  step="0.01"
                  value={newFactor.latitude_max}
                  onChange={(e) => setNewFactor({ ...newFactor, latitude_max: e.target.value })}
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded text-white"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">Longitude Min *</label>
                <input
                  type="number"
                  step="0.01"
                  value={newFactor.longitude_min}
                  onChange={(e) => setNewFactor({ ...newFactor, longitude_min: e.target.value })}
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded text-white"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">Longitude Max *</label>
                <input
                  type="number"
                  step="0.01"
                  value={newFactor.longitude_max}
                  onChange={(e) => setNewFactor({ ...newFactor, longitude_max: e.target.value })}
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded text-white"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">Zone Adjustment *</label>
                <input
                  type="number"
                  step="0.1"
                  value={newFactor.zone_adjustment}
                  onChange={(e) => setNewFactor({ ...newFactor, zone_adjustment: e.target.value })}
                  placeholder="0.5 for +half zone, -0.5 for -half zone"
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded text-white"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm text-gray-300 mb-1">Description</label>
                <textarea
                  value={newFactor.description}
                  onChange={(e) => setNewFactor({ ...newFactor, description: e.target.value })}
                  placeholder="City center urban heat island effect"
                  rows={2}
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded text-white"
                />
              </div>
              <div className="col-span-2 flex gap-2">
                <button
                  onClick={addFactor}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  Save Factor
                </button>
                <button
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-white rounded"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading...</div>
      ) : (
        <div className="space-y-4">
          {activeTab === 'adjustments' ? (
            adjustments.length === 0 ? (
              <div className="text-center py-12 text-gray-400">No zone adjustments yet</div>
            ) : (
              adjustments.map((adj) => (
                <div key={adj.id} className="bg-zinc-800 rounded-lg p-4 border border-zinc-700">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-semibold text-white">{adj.location_identifier}</h3>
                        {adj.is_active ? (
                          <CheckCircle className="w-5 h-5 text-emerald-400" />
                        ) : (
                          <XCircle className="w-5 h-5 text-gray-500" />
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        {adj.original_zone && (
                          <p className="text-gray-400">
                            Original Zone: <span className="text-white">{adj.original_zone}</span>
                          </p>
                        )}
                        <p className="text-gray-400">
                          Adjusted Zone: <span className="text-emerald-400 font-semibold">{adj.adjusted_zone}</span>
                        </p>
                        {adj.latitude && adj.longitude && (
                          <p className="text-gray-400 col-span-2">
                            Coordinates: {Number(adj.latitude).toFixed(4)}, {Number(adj.longitude).toFixed(4)}
                          </p>
                        )}
                        <p className="text-gray-400 col-span-2">
                          Reason: <span className="text-gray-300">{adj.adjustment_reason}</span>
                        </p>
                        {adj.verified_by && (
                          <p className="text-gray-400">
                            Verified by: <span className="text-gray-300">{adj.verified_by}</span>
                          </p>
                        )}
                        <p className="text-gray-400">
                          Confidence: <span className="text-emerald-400">{Math.round(adj.confidence_score * 100)}%</span>
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => toggleActive(adj.id, 'zone_adjustments', adj.is_active)}
                        className={`px-3 py-1 rounded text-sm ${
                          adj.is_active
                            ? 'bg-zinc-700 hover:bg-zinc-600 text-gray-300'
                            : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                        }`}
                      >
                        {adj.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                      <button
                        onClick={() => deleteItem(adj.id, 'zone_adjustments')}
                        className="p-2 bg-red-600 hover:bg-red-700 text-white rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )
          ) : factors.length === 0 ? (
            <div className="text-center py-12 text-gray-400">No microclimate factors yet</div>
          ) : (
            factors.map((factor) => (
              <div key={factor.id} className="bg-zinc-800 rounded-lg p-4 border border-zinc-700">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold text-white">{factor.location_name}</h3>
                      {factor.is_active ? (
                        <CheckCircle className="w-5 h-5 text-emerald-400" />
                      ) : (
                        <XCircle className="w-5 h-5 text-gray-500" />
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <p className="text-gray-400">
                        Type: <span className="text-white">{factor.factor_type.replace(/_/g, ' ')}</span>
                      </p>
                      <p className="text-gray-400">
                        Adjustment:{' '}
                        <span className={factor.zone_adjustment > 0 ? 'text-orange-400' : 'text-blue-400'}>
                          {factor.zone_adjustment > 0 ? '+' : ''}
                          {factor.zone_adjustment} zones
                        </span>
                      </p>
                      <p className="text-gray-400 col-span-2">
                        Area: {Number(factor.latitude_min).toFixed(2)} to {Number(factor.latitude_max).toFixed(2)}°N,{' '}
                        {Number(factor.longitude_min).toFixed(2)} to {Number(factor.longitude_max).toFixed(2)}°E
                      </p>
                      {factor.description && (
                        <p className="text-gray-400 col-span-2">
                          <span className="text-gray-300">{factor.description}</span>
                        </p>
                      )}
                      <p className="text-gray-400">
                        Confidence: <span className="text-emerald-400">{Math.round(factor.confidence_score * 100)}%</span>
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => toggleActive(factor.id, 'microclimate_factors', factor.is_active)}
                      className={`px-3 py-1 rounded text-sm ${
                        factor.is_active
                          ? 'bg-zinc-700 hover:bg-zinc-600 text-gray-300'
                          : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      }`}
                    >
                      {factor.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                    <button
                      onClick={() => deleteItem(factor.id, 'microclimate_factors')}
                      className="p-2 bg-red-600 hover:bg-red-700 text-white rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
