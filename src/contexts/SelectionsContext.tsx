import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, UserSelection, Project, ProjectZone } from '../lib/supabase';
import { useAuth } from './AuthContext';

interface SelectionsContextType {
  selections: UserSelection[];
  projects: Project[];
  zones: ProjectZone[];
  currentProject: Project | null;
  loading: boolean;
  addPlantSelection: (plantId: number, quantity?: number) => Promise<void>;
  addStoneSelection: (stoneId: number, quantity?: number) => Promise<void>;
  addTileCombination: (tileId: number, cobblestoneIds: number[]) => Promise<void>;
  removeSelection: (selectionId: string) => Promise<void>;
  removeCombination: (parentSelectionId: string) => Promise<void>;
  updateSelectionQuantity: (selectionId: string, quantity: number) => Promise<void>;
  clearAllSelections: () => Promise<void>;
  isPlantSelected: (plantId: number) => boolean;
  isStoneSelected: (stoneId: number) => boolean;
  refreshSelections: () => Promise<void>;
  createProject: (name: string, description?: string) => Promise<Project | null>;
  updateProject: (projectId: string, name: string, description?: string) => Promise<void>;
  deleteProject: (projectId: string) => Promise<void>;
  setCurrentProject: (project: Project | null) => void;
  saveCurrentSelectionsToProject: (projectId: string) => Promise<void>;
  loadProjectSelections: (projectId: string) => Promise<void>;
  refreshProjects: () => Promise<void>;
  // Zone management
  createZone: (name: string) => Promise<ProjectZone | null>;
  updateZone: (zoneId: string, name: string) => Promise<void>;
  deleteZone: (zoneId: string) => Promise<void>;
  moveSelectionToZone: (selectionId: string, zoneId: string | null) => Promise<void>;
  refreshZones: () => Promise<void>;
}

const SelectionsContext = createContext<SelectionsContextType | undefined>(undefined);

export const useSelections = () => {
  const context = useContext(SelectionsContext);
  if (!context) {
    throw new Error('useSelections must be used within a SelectionsProvider');
  }
  return context;
};

export const SelectionsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [selections, setSelections] = useState<UserSelection[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [zones, setZones] = useState<ProjectZone[]>([]);
  const [currentProject, setCurrentProjectState] = useState<Project | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchProjects = async () => {
    if (!user) { setProjects([]); return; }
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });
      if (error) throw error;
      setProjects(data || []);
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  };

  const fetchZones = async (projectId?: string) => {
    if (!user) { setZones([]); return; }
    try {
      let query = supabase
        .from('project_zones')
        .select('*')
        .eq('user_id', user.id)
        .order('display_order', { ascending: true })
        .order('created_at', { ascending: true });

      if (projectId) {
        query = query.eq('project_id', projectId);
      } else {
        query = query.is('project_id', null);
      }

      const { data, error } = await query;
      if (error) throw error;
      setZones(data || []);
    } catch (error) {
      console.error('Error fetching zones:', error);
    }
  };

  const fetchSelections = async (projectId?: string) => {
    if (!user) { setSelections([]); return; }

    setLoading(true);
    try {
      let query = supabase
        .from('user_selections')
        .select('*, plant:plants_flat(*), stone:stones(*)')
        .eq('user_id', user.id)
        .is('parent_selection_id', null);

      if (projectId) {
        query = query.eq('project_id', projectId);
      } else {
        query = query.is('project_id', null);
      }

      const { data: parentSelections, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;

      const selectionsWithChildren = await Promise.all(
        (parentSelections || []).map(async (selection) => {
          if (selection.is_tile_combination) {
            const { data: children, error: childError } = await supabase
              .from('user_selections')
              .select('*, stone:stones(*)')
              .eq('parent_selection_id', selection.id)
              .order('created_at');
            if (childError) return selection;
            return { ...selection, child_selections: children || [] };
          }
          return selection;
        })
      );

      setSelections(selectionsWithChildren);
    } catch (error) {
      console.error('Error fetching selections:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
    fetchSelections(currentProject?.id);
    fetchZones(currentProject?.id);
  }, [user, currentProject?.id]);

  const addPlantSelection = async (plantId: number, quantity: number = 1) => {
    if (!user) return;
    try {
      const existing = selections.find(s => s.plant_id === plantId);
      if (existing) {
        await updateSelectionQuantity(existing.id, existing.quantity + quantity);
      } else {
        const { error } = await supabase.from('user_selections').insert({
          user_id: user.id,
          plant_id: plantId,
          quantity,
          project_id: currentProject?.id || null,
        });
        if (error) throw error;
        await fetchSelections(currentProject?.id);
      }
    } catch (error) {
      console.error('Error adding plant selection:', error);
    }
  };

  const addStoneSelection = async (stoneId: number, quantity: number = 1) => {
    if (!user) return;
    try {
      const existing = selections.find(s => s.stone_id === stoneId);
      if (existing) {
        await updateSelectionQuantity(existing.id, existing.quantity + quantity);
      } else {
        const { error } = await supabase.from('user_selections').insert({
          user_id: user.id,
          stone_id: stoneId,
          quantity,
          project_id: currentProject?.id || null,
        });
        if (error) throw error;
        await fetchSelections(currentProject?.id);
      }
    } catch (error) {
      console.error('Error adding stone selection:', error);
    }
  };

  const addTileCombination = async (tileId: number, cobblestoneIds: number[]) => {
    if (!user) return;
    try {
      const combinationRef = `tile_${tileId}_${Date.now()}`;
      const { data: tileSelection, error: tileError } = await supabase
        .from('user_selections')
        .insert({
          user_id: user.id,
          stone_id: tileId,
          quantity: 1,
          project_id: currentProject?.id || null,
          is_tile_combination: true,
          combination_reference: combinationRef,
        })
        .select()
        .single();
      if (tileError) throw tileError;

      const cobblestoneInserts = cobblestoneIds.map((cobblestoneId) => ({
        user_id: user.id,
        stone_id: cobblestoneId,
        quantity: 1,
        project_id: currentProject?.id || null,
        parent_selection_id: tileSelection.id,
        is_tile_combination: true,
        combination_reference: combinationRef,
      }));
      const { error: cobblestonesError } = await supabase.from('user_selections').insert(cobblestoneInserts);
      if (cobblestonesError) throw cobblestonesError;
      await fetchSelections(currentProject?.id);
    } catch (error) {
      console.error('Error adding tile combination:', error);
      throw error;
    }
  };

  const removeSelection = async (selectionId: string) => {
    try {
      const { error } = await supabase.from('user_selections').delete().eq('id', selectionId);
      if (error) throw error;
      await fetchSelections(currentProject?.id);
    } catch (error) {
      console.error('Error removing selection:', error);
    }
  };

  const removeCombination = async (parentSelectionId: string) => {
    try {
      const { error } = await supabase.from('user_selections').delete().eq('id', parentSelectionId);
      if (error) throw error;
      await fetchSelections(currentProject?.id);
    } catch (error) {
      console.error('Error removing combination:', error);
    }
  };

  const updateSelectionQuantity = async (selectionId: string, quantity: number) => {
    try {
      const { error } = await supabase.from('user_selections').update({ quantity }).eq('id', selectionId);
      if (error) throw error;
      await fetchSelections(currentProject?.id);
    } catch (error) {
      console.error('Error updating selection quantity:', error);
    }
  };

  const clearAllSelections = async () => {
    if (!user) return;
    try {
      let query = supabase.from('user_selections').delete().eq('user_id', user.id);
      if (currentProject) {
        query = query.eq('project_id', currentProject.id);
      } else {
        query = query.is('project_id', null);
      }
      const { error } = await query;
      if (error) throw error;
      setSelections([]);
    } catch (error) {
      console.error('Error clearing selections:', error);
    }
  };

  const createProject = async (name: string, description?: string): Promise<Project | null> => {
    if (!user) return null;
    try {
      const { data, error } = await supabase
        .from('projects')
        .insert({ user_id: user.id, name, description: description || null })
        .select()
        .single();
      if (error) throw error;
      await fetchProjects();
      return data;
    } catch (error) {
      console.error('Error creating project:', error);
      return null;
    }
  };

  const updateProject = async (projectId: string, name: string, description?: string) => {
    try {
      const { error } = await supabase
        .from('projects')
        .update({ name, description: description || null })
        .eq('id', projectId);
      if (error) throw error;
      await fetchProjects();
      if (currentProject?.id === projectId) {
        const updatedProject = projects.find(p => p.id === projectId);
        if (updatedProject) setCurrentProjectState(updatedProject);
      }
    } catch (error) {
      console.error('Error updating project:', error);
    }
  };

  const deleteProject = async (projectId: string) => {
    try {
      const { error } = await supabase.from('projects').delete().eq('id', projectId);
      if (error) throw error;
      if (currentProject?.id === projectId) setCurrentProjectState(null);
      await fetchProjects();
    } catch (error) {
      console.error('Error deleting project:', error);
    }
  };

  const setCurrentProject = (project: Project | null) => {
    setCurrentProjectState(project);
  };

  const saveCurrentSelectionsToProject = async (projectId: string) => {
    if (!user) return;
    try {
      const selectionsToMove = selections.filter(s => !s.project_id);
      for (const selection of selectionsToMove) {
        const { error } = await supabase
          .from('user_selections')
          .update({ project_id: projectId })
          .eq('id', selection.id);
        if (error) throw error;
      }
      const project = projects.find(p => p.id === projectId);
      if (project) setCurrentProjectState(project);
      await fetchSelections(projectId);
    } catch (error) {
      console.error('Error saving selections to project:', error);
    }
  };

  const loadProjectSelections = async (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    if (project) {
      setCurrentProjectState(project);
      await fetchSelections(projectId);
    }
  };

  const isPlantSelected = (plantId: number): boolean => selections.some(s => s.plant_id === plantId);
  const isStoneSelected = (stoneId: number): boolean => selections.some(s => s.stone_id === stoneId);
  const refreshSelections = async () => { await fetchSelections(currentProject?.id); };
  const refreshProjects = async () => { await fetchProjects(); };
  const refreshZones = async () => { await fetchZones(currentProject?.id); };

  // Zone CRUD
  const createZone = async (name: string): Promise<ProjectZone | null> => {
    if (!user) return null;
    try {
      const maxOrder = zones.length > 0 ? Math.max(...zones.map(z => z.display_order)) + 1 : 0;
      const { data, error } = await supabase
        .from('project_zones')
        .insert({
          user_id: user.id,
          project_id: currentProject?.id || null,
          name,
          display_order: maxOrder,
        })
        .select()
        .single();
      if (error) throw error;
      await fetchZones(currentProject?.id);
      return data;
    } catch (error) {
      console.error('Error creating zone:', error);
      return null;
    }
  };

  const updateZone = async (zoneId: string, name: string) => {
    try {
      const { error } = await supabase
        .from('project_zones')
        .update({ name, updated_at: new Date().toISOString() })
        .eq('id', zoneId);
      if (error) throw error;
      await fetchZones(currentProject?.id);
    } catch (error) {
      console.error('Error updating zone:', error);
    }
  };

  const deleteZone = async (zoneId: string) => {
    try {
      // Unassign selections from this zone before deleting
      await supabase.from('user_selections').update({ zone_id: null }).eq('zone_id', zoneId);
      const { error } = await supabase.from('project_zones').delete().eq('id', zoneId);
      if (error) throw error;
      await fetchZones(currentProject?.id);
      await fetchSelections(currentProject?.id);
    } catch (error) {
      console.error('Error deleting zone:', error);
    }
  };

  const moveSelectionToZone = async (selectionId: string, zoneId: string | null) => {
    try {
      const { error } = await supabase
        .from('user_selections')
        .update({ zone_id: zoneId })
        .eq('id', selectionId);
      if (error) throw error;
      // Optimistic update
      setSelections(prev =>
        prev.map(s => s.id === selectionId ? { ...s, zone_id: zoneId ?? undefined } : s)
      );
    } catch (error) {
      console.error('Error moving selection to zone:', error);
    }
  };

  const value: SelectionsContextType = {
    selections,
    projects,
    zones,
    currentProject,
    loading,
    addPlantSelection,
    addStoneSelection,
    addTileCombination,
    removeSelection,
    removeCombination,
    updateSelectionQuantity,
    clearAllSelections,
    isPlantSelected,
    isStoneSelected,
    refreshSelections,
    createProject,
    updateProject,
    deleteProject,
    setCurrentProject,
    saveCurrentSelectionsToProject,
    loadProjectSelections,
    refreshProjects,
    createZone,
    updateZone,
    deleteZone,
    moveSelectionToZone,
    refreshZones,
  };

  return <SelectionsContext.Provider value={value}>{children}</SelectionsContext.Provider>;
};
