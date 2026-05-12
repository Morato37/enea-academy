import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { supabase, Stone } from '../lib/supabase';
import { ArrowLeft, MapPin, Palette, Mountain, Snowflake, Package, Ruler, Grid2x2 as Grid } from 'lucide-react';

interface StoneCombination {
  id: number;
  child_stone_id: number;
  child_stone: {
    id: number;
    name: string;
    stone_color: string;
    image_url: string | null;
  };
}

interface StoneFinish {
  id: number;
  stone_id: number;
  finish_type: string;
  image_url: string | null;
  grout: string | null;
  size: string | null;
}

export const PublicStoneDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stone, setStone] = useState<Stone | null>(null);
  const [combinations, setCombinations] = useState<StoneCombination[]>([]);
  const [finishDetails, setFinishDetails] = useState<StoneFinish[]>([]);

  const finishParam = searchParams.get('finish');

  useEffect(() => {
    loadStone();
    loadFinishDetails();
  }, [id]);

  const loadStone = async () => {
    setLoading(true);
    try {
      const { data: stoneData, error: stoneError } = await supabase
        .from('stones')
        .select('*')
        .eq('id', id)
        .single();

      if (stoneError) throw stoneError;
      setStone(stoneData);

      if (stoneData.stone_category === 'tile' || stoneData.stone_category === 'cobblestone') {
        const { data: combos, error: combosError } = await supabase
          .from('stone_combinations')
          .select(`
            id,
            child_stone_id,
            child_stone:stones!stone_combinations_child_stone_id_fkey (
              id,
              name,
              stone_color,
              image_url
            )
          `)
          .eq('parent_stone_id', id);

        if (!combosError && combos) {
          setCombinations(combos as any);
        }
      }
    } catch (err) {
      console.error('Error loading stone:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadFinishDetails = async () => {
    try {
      const { data, error } = await supabase
        .from('stone_finishes')
        .select('*')
        .eq('stone_id', id);

      if (error) throw error;
      setFinishDetails(data || []);
    } catch (err) {
      console.error('Error loading finish details:', err);
    }
  };

  const getZones = () => {
    const zones = [];
    if (stone?.mediterranean_zone) zones.push('Mediterranean');
    if (stone?.central_europe_zone) zones.push('Central Europe');
    if (stone?.alpine_zone) zones.push('Alpine');
    return zones;
  };

  const getApplications = () => {
    const apps = [];
    if (stone?.use_tiles) apps.push('Tiles');
    if (stone?.use_block_steps) apps.push('Block Steps');
    if (stone?.use_paving) apps.push('Paving');
    if (stone?.use_walls) apps.push('Walls');
    if (stone?.use_pool) apps.push('Pool');
    if (stone?.use_chippings) apps.push('Chippings');
    return apps;
  };

  const getFinishes = () => {
    const finishes = [];
    if (stone?.finish_split) finishes.push('Split');
    if (stone?.finish_flamed) finishes.push('Flamed');
    if (stone?.finish_flamed_wild) finishes.push('Flamed Wild');
    if (stone?.finish_split_antique_wild) finishes.push('Split Antique Wild');
    if (stone?.finish_blasted) finishes.push('Blasted');
    if (stone?.finish_sawn) finishes.push('Sawn');
    if (stone?.finish_hammered) finishes.push('Hammered');
    if (stone?.finish_brushed) finishes.push('Brushed');
    if (stone?.finish_polished) finishes.push('Polished');
    if (stone?.finish_honed) finishes.push('Honed');
    return finishes;
  };

  const getFrostResistance = () => {
    if (stone?.frost_resistant) return { label: 'Frost Resistant', color: 'text-green-700 bg-green-50' };
    if (stone?.less_frost_resistant) return { label: 'Less Frost Resistant', color: 'text-orange-700 bg-orange-50' };
    if (stone?.not_frost_resistant) return { label: 'Not Frost Resistant', color: 'text-red-700 bg-red-50' };
    return null;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  if (!stone) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Stone not found</h2>
          <button
            onClick={() => navigate('/stones')}
            className="text-blue-600 hover:text-blue-700"
          >
            Back to overview
          </button>
        </div>
      </div>
    );
  }

  const zones = getZones();
  const applications = getApplications();
  const finishes = getFinishes();
  const frostResistance = getFrostResistance();

  const getDisplayImage = (): string | null => {
    if (finishParam) {
      const finishImageKey = `finish_${finishParam.toLowerCase()}_image_url` as keyof Stone;
      const finishImage = stone[finishImageKey] as string | undefined;
      if (finishImage) return finishImage;
    }
    return stone.image_url || null;
  };

  const getFinishLabel = (): string | null => {
    if (!finishParam) return null;
    return finishParam.charAt(0).toUpperCase() + finishParam.slice(1).toLowerCase();
  };

  const displayImage = getDisplayImage();
  const finishLabel = getFinishLabel();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back</span>
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            {displayImage ? (
              <img
                src={displayImage}
                alt={`${stone.name}${finishLabel ? ` - ${finishLabel}` : ''}`}
                className="w-full h-96 object-cover"
              />
            ) : (
              <div className="w-full h-96 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                <Mountain className="w-24 h-24 text-gray-400" />
              </div>
            )}
            {finishLabel && (
              <div className="px-6 py-3 bg-amber-50 border-t border-amber-100">
                <div className="flex items-center gap-2 text-amber-900">
                  <Palette className="w-4 h-4" />
                  <span className="font-semibold">Finish: {finishLabel}</span>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">{stone.name}</h1>
              {stone.stone_category && (
                <span className="inline-block px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-sm font-medium">
                  {stone.stone_category === 'tile' ? 'Tile' : 'Cobblestone'}
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {stone.morphology && (
                <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                  <div className="flex items-center gap-2 text-gray-600 mb-1">
                    <Mountain className="w-4 h-4" />
                    <span className="text-sm font-medium">Morphology</span>
                  </div>
                  <p className="text-gray-900 font-semibold">{stone.morphology}</p>
                </div>
              )}

              {stone.origin && (
                <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                  <div className="flex items-center gap-2 text-gray-600 mb-1">
                    <MapPin className="w-4 h-4" />
                    <span className="text-sm font-medium">Origin</span>
                  </div>
                  <p className="text-gray-900 font-semibold">{stone.origin}</p>
                </div>
              )}

              {stone.stone_color && (
                <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                  <div className="flex items-center gap-2 text-gray-600 mb-1">
                    <Palette className="w-4 h-4" />
                    <span className="text-sm font-medium">Color</span>
                  </div>
                  <p className="text-gray-900 font-semibold">{stone.stone_color}</p>
                </div>
              )}

              {stone.producer_seller && (
                <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                  <div className="flex items-center gap-2 text-gray-600 mb-1">
                    <Package className="w-4 h-4" />
                    <span className="text-sm font-medium">Producer</span>
                  </div>
                  <p className="text-gray-900 font-semibold">{stone.producer_seller}</p>
                </div>
              )}
            </div>

            {frostResistance && (
              <div className={`rounded-xl p-4 border-2 ${frostResistance.color}`}>
                <div className="flex items-center gap-2">
                  <Snowflake className="w-5 h-5" />
                  <span className="font-semibold">{frostResistance.label}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {zones.length > 0 && (
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Mountain className="w-5 h-5 text-blue-600" />
                Climate Zones
              </h2>
              <div className="space-y-2">
                {zones.map((zone, index) => (
                  <div key={index} className="flex items-center gap-2 text-gray-700">
                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                    <span>{zone}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {applications.length > 0 && (
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Package className="w-5 h-5 text-green-600" />
                Applications
              </h2>
              <div className="space-y-2">
                {applications.map((app, index) => (
                  <div key={index} className="flex items-center gap-2 text-gray-700">
                    <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                    <span>{app}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {finishes.length > 0 && (
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Palette className="w-5 h-5 text-amber-600" />
                Finish / Surface
              </h2>
              <div className="space-y-2">
                {finishes.map((finish, index) => (
                  <div key={index} className="flex items-center gap-2 text-gray-700">
                    <div className="w-2 h-2 bg-amber-600 rounded-full"></div>
                    <span>{finish}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {finishDetails.length > 0 && (
          <div className="mt-8 bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Palette className="w-6 h-6 text-amber-600" />
              Finish / Surface Details
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {finishDetails.map((finish) => {
                const finishLabel = finish.finish_type.charAt(0).toUpperCase() + finish.finish_type.slice(1);
                return (
                  <div key={finish.id} className="bg-gradient-to-br from-gray-50 to-white rounded-xl overflow-hidden border border-gray-200 hover:shadow-lg transition-shadow">
                    {finish.image_url ? (
                      <img
                        src={finish.image_url}
                        alt={`${finishLabel} finish`}
                        className="w-full h-48 object-cover"
                      />
                    ) : (
                      <div className="w-full h-48 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                        <Palette className="w-12 h-12 text-gray-400" />
                      </div>
                    )}
                    <div className="p-4 space-y-3">
                      <h3 className="text-lg font-bold text-gray-900">{finishLabel}</h3>
                      {(finish.grout || finish.size) && (
                        <div className="space-y-2">
                          {finish.grout && (
                            <div className="flex items-center gap-2 text-sm">
                              <Grid className="w-4 h-4 text-gray-500" />
                              <span className="text-gray-600 font-medium">Grout:</span>
                              <span className="text-gray-900">{finish.grout}</span>
                            </div>
                          )}
                          {finish.size && (
                            <div className="flex items-center gap-2 text-sm">
                              <Ruler className="w-4 h-4 text-gray-500" />
                              <span className="text-gray-600 font-medium">Size:</span>
                              <span className="text-gray-900">{finish.size}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {combinations.length > 0 && (
          <div className="mt-8 bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Combinations</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {combinations.map((combo) => (
                <button
                  key={combo.id}
                  onClick={() => navigate(`/stone/${combo.child_stone.id}`)}
                  className="group bg-white rounded-xl overflow-hidden border-2 border-gray-100 hover:border-blue-500 transition-all hover:shadow-md"
                >
                  {combo.child_stone.image_url ? (
                    <img
                      src={combo.child_stone.image_url}
                      alt={combo.child_stone.name}
                      className="w-full h-24 object-cover"
                    />
                  ) : (
                    <div className="w-full h-24 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                      <Mountain className="w-8 h-8 text-gray-400" />
                    </div>
                  )}
                  <div className="p-2">
                    <p className="text-xs font-medium text-gray-900 truncate group-hover:text-blue-600">
                      {combo.child_stone.name}
                    </p>
                    {combo.child_stone.stone_color && (
                      <p className="text-xs text-gray-500 truncate">{combo.child_stone.stone_color}</p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
