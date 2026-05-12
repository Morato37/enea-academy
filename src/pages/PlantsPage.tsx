import React, { useState, useEffect } from 'react';
import { PlantFilters } from '../components/Filters/PlantFilters';
import { LocationFilter } from '../components/Filters/LocationFilter';
import { PlantCard } from '../components/Cards/PlantCard';
import { Loader2, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import { LayerDistribution } from '../components/LayerDistribution';
import { usePlantsPage } from '../contexts/PlantsPageContext';

const PAGE_SIZE = 30;

export const PlantsPage: React.FC = () => {
  const {
    plants,
    filteredPlants,
    loading,
    refreshing,
    filters,
    setFilters,
    handleRefresh,
    plantImagesMap,
  } = usePlantsPage();

  const [page, setPage] = useState(1);

  // Reset to first page whenever filters change
  useEffect(() => {
    setPage(1);
  }, [filters]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-cyan-600 animate-spin" />
      </div>
    );
  }

  const totalPages = Math.max(1, Math.ceil(filteredPlants.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageStart = (safePage - 1) * PAGE_SIZE;
  const pagePlants = filteredPlants.slice(pageStart, pageStart + PAGE_SIZE);

  const goTo = (p: number) => {
    setPage(p);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const buildPageNumbers = () => {
    const pages: (number | 'ellipsis')[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (safePage > 3) pages.push('ellipsis');
      const start = Math.max(2, safePage - 1);
      const end = Math.min(totalPages - 1, safePage + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (safePage < totalPages - 2) pages.push('ellipsis');
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div className="min-h-screen relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Enea's Academy - Plant Database</h1>
            <p className="text-gray-700">
              Browse our collection of {plants.length} plants
              {filteredPlants.length !== plants.length &&
                ` (showing ${filteredPlants.length} results)`}
            </p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="Refresh plant data"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <aside className="lg:col-span-1 space-y-6 lg:sticky lg:top-4 lg:self-start lg:max-h-[calc(100vh-2rem)] lg:overflow-y-auto">
            <LocationFilter
              mode="zones"
              onZoneDetected={(zones) => {
                setFilters((prevFilters) => ({
                  ...prevFilters,
                  climateZones: zones
                }));
              }}
            />

            <PlantFilters filters={filters} onFilterChange={setFilters} />
          </aside>

          <main className="lg:col-span-3">
            {filteredPlants.length === 0 ? (
              <div className="bg-white border border-gray-300 rounded-lg p-12 text-center shadow-sm">
                <p className="text-gray-800 text-lg">
                  No plants found matching your criteria.
                </p>
                <p className="text-gray-600 text-sm mt-2">
                  Try adjusting your filters to see more results.
                </p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {pagePlants.map((plant) => (
                    <PlantCard
                      key={plant.id}
                      plant={plant}
                      images={plantImagesMap.get(plant.id) || (plant.image_url ? [plant.image_url] : [])}
                    />
                  ))}
                </div>

                {totalPages > 1 && (
                  <div className="mt-10 flex items-center justify-between gap-4">
                    <p className="text-sm text-gray-500">
                      {pageStart + 1}–{Math.min(pageStart + PAGE_SIZE, filteredPlants.length)} of {filteredPlants.length}
                    </p>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => goTo(safePage - 1)}
                        disabled={safePage === 1}
                        className="w-9 h-9 flex items-center justify-center rounded border border-gray-300 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>

                      {buildPageNumbers().map((p, idx) =>
                        p === 'ellipsis' ? (
                          <span key={`e-${idx}`} className="px-1 text-gray-400 select-none">…</span>
                        ) : (
                          <button
                            key={p}
                            onClick={() => goTo(p)}
                            className={`w-9 h-9 flex items-center justify-center rounded border text-sm font-medium transition-colors ${
                              p === safePage
                                ? 'border-cyan-500 bg-cyan-500 text-white'
                                : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                            }`}
                          >
                            {p}
                          </button>
                        )
                      )}

                      <button
                        onClick={() => goTo(safePage + 1)}
                        disabled={safePage === totalPages}
                        className="w-9 h-9 flex items-center justify-center rounded border border-gray-300 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      </div>

      {filters.naturalisticPlantingDesign && (
        <aside className="fixed right-8 top-32 w-64 sticky-right max-h-[calc(100vh-10rem)] overflow-y-auto">
          <LayerDistribution />
        </aside>
      )}
    </div>
  );
};
