import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase, Stone } from '../lib/supabase';
import { StoneFilterState } from '../components/Filters/StoneFilters';

/** Refresh data when the tab was in the background longer than this. */
const REFRESH_AFTER_HIDDEN_MS = 5 * 60 * 1000;

interface StonesPageContextType {
  stones: Stone[];
  filteredStones: Stone[];
  loading: boolean;
  refreshing: boolean;
  filters: StoneFilterState;
  setFilters: React.Dispatch<React.SetStateAction<StoneFilterState>>;
  fetchStones: (isRefresh?: boolean) => Promise<void>;
  handleRefresh: () => void;
}

const StonesPageContext = createContext<StonesPageContextType | undefined>(undefined);

const SESSION_STORAGE_KEY = 'stones-view-state';

const defaultFilters: StoneFilterState = {
  search: '',
  regions: [],
  stoneTypes: [],
  applications: [],
  colors: [],
  categories: [],
};

export const StonesPageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [stones, setStones] = useState<Stone[]>([]);
  const [filteredStones, setFilteredStones] = useState<Stone[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filters, setFilters] = useState<StoneFilterState>(() => {
    try {
      const saved = sessionStorage.getItem(SESSION_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return { ...defaultFilters, ...parsed };
      }
    } catch (error) {
      console.error('Error loading stones view state:', error);
    }
    return defaultFilters;
  });

  useEffect(() => {
    try {
      sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(filters));
    } catch (error) {
      console.error('Error saving stones view state:', error);
    }
  }, [filters]);

  useEffect(() => {
    fetchStones();

    // Coming back to the tab: refresh quietly in the background, and only if the tab was hidden
    // for a while. Before, every tab switch reloaded everything (focus and visibility both fired).
    let hiddenAt: number | null = null;
    const handleVisibilityChange = () => {
      if (document.hidden) {
        hiddenAt = Date.now();
        return;
      }
      if (hiddenAt !== null && Date.now() - hiddenAt > REFRESH_AFTER_HIDDEN_MS) fetchStones(true);
      hiddenAt = null;
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  useEffect(() => {
    applyFilters();
  }, [stones, filters]);

  const fetchStones = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const { data, error } = await supabase
        .from('stones')
        .select('*')
        .order('name');

      if (error) throw error;

      setStones(data || []);
    } catch (error) {
      console.error('Error fetching stones:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    fetchStones(true);
  };

  const applyFilters = () => {
    let filtered = [...stones];

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(
        (stone) =>
          stone.name.toLowerCase().includes(searchLower) ||
          stone.producer_seller?.toLowerCase().includes(searchLower) ||
          stone.morphology?.toLowerCase().includes(searchLower)
      );
    }

    if (filters.categories.length > 0) {
      filtered = filtered.filter(
        (stone) => stone.stone_category && filters.categories.includes(stone.stone_category)
      );
    }

    if (filters.regions.length > 0) {
      filtered = filtered.filter((stone) =>
        filters.regions.some((region) => {
          let regionKey: keyof Stone;
          if (region === 'central_european') {
            regionKey = 'central_europe_zone';
          } else {
            regionKey = `${region}_zone` as keyof Stone;
          }
          return stone[regionKey] === true;
        })
      );
    }

    if (filters.stoneTypes.length > 0) {
      filtered = filtered.filter(
        (stone) => stone.morphology && filters.stoneTypes.includes(stone.morphology)
      );
    }

    if (filters.applications.length > 0) {
      filtered = filtered.filter((stone) =>
        filters.applications.some((app) => {
          const appKey = `use_${app}` as keyof Stone;
          return stone[appKey] === true;
        })
      );
    }

    if (filters.colors.length > 0) {
      filtered = filtered.filter(
        (stone) => stone.stone_color && filters.colors.includes(stone.stone_color)
      );
    }

    setFilteredStones(filtered);
  };

  const value: StonesPageContextType = {
    stones,
    filteredStones,
    loading,
    refreshing,
    filters,
    setFilters,
    fetchStones,
    handleRefresh,
  };

  return (
    <StonesPageContext.Provider value={value}>
      {children}
    </StonesPageContext.Provider>
  );
};

export const useStonesPage = () => {
  const context = useContext(StonesPageContext);
  if (context === undefined) {
    throw new Error('useStonesPage must be used within a StonesPageProvider');
  }
  return context;
};
