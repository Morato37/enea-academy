import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  supabase, UserSelection, Project, ProjectZone,
  ProjectShare, ProjectShareWithUser, SharedProjectEntry, UserSearchResult,
} from '../lib/supabase';
import { useAuth } from './AuthContext';
import { setShrubSalesDetails, setTreeSalesDetails, ShrubSalesDetails, TreeSalesDetails } from '../lib/plantCategories';

interface SelectionsContextType {
  selections: UserSelection[];
  projects: Project[];
  sharedProjects: SharedProjectEntry[];
  zones: ProjectZone[];
  currentProject: Project | null;
  currentProjectPermission: 'owner' | 'view' | 'edit' | null;
  loading: boolean;
  addPlantSelection: (plantId: number, quantity?: number) => Promise<void>;
  addStoneSelection: (stoneId: number, quantity?: number) => Promise<void>;
  addTileCombination: (tileId: number, cobblestoneIds: number[]) => Promise<void>;
  removeSelection: (selectionId: string) => Promise<void>;
  removeCombination: (parentSelectionId: string) => Promise<void>;
  updateSelectionQuantity: (selectionId: string, quantity: number) => Promise<void>;
  updateShrubSalesDetails: (selectionId: string, details: ShrubSalesDetails) => Promise<void>;
  updateTreeSalesDetails: (selectionId: string, details: TreeSalesDetails) => Promise<void>;
  updatePruningForm: (selectionId: string, form: string | null) => Promise<void>;
  clearAllSelections: () => Promise<void>;
  isPlantSelected: (plantId: number) => boolean;
  isStoneSelected: (stoneId: number) => boolean;
  refreshSelections: () => Promise<void>;
  createProject: (name: string, description?: string, folderUrl?: string) => Promise<Project | null>;
  updateProject: (projectId: string, name: string, description?: string, folderUrl?: string) => Promise<void>;
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
  duplicateSelectionToZone: (selectionId: string, targetZoneId: string) => Promise<void>;
  refreshZones: () => Promise<void>;
  reorderZones: (zoneId: string, targetIndex: number) => Promise<void>;
  // Share management
  getProjectShares: (projectId: string) => Promise<ProjectShareWithUser[]>;
  addProjectShare: (projectId: string, userId: string, permission: 'view' | 'edit') => Promise<void>;
  removeProjectShare: (shareId: string) => Promise<void>;
  updateProjectShare: (shareId: string, permission: 'view' | 'edit') => Promise<void>;
  searchUsers: (query: string) => Promise<UserSearchResult[]>;
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
  const [sharedProjects, setSharedProjects] = useState<SharedProjectEntry[]>([]);
  const [zones, setZones] = useState<ProjectZone[]>([]);
  const [currentProject, setCurrentProjectState] = useState<Project | null>(null);
  const [loading, setLoading] = useState(false);

  const currentProjectPermission = useMemo((): 'owner' | 'view' | 'edit' | null => {
    if (!currentProject || !user) return null;
    if (currentProject.user_id === user.id) return 'owner';
    const entry = sharedProjects.find(e => e.project.id === currentProject.id);
    return (entry?.share.permission as 'view' | 'edit') ?? null;
  }, [currentProject, user, sharedProjects]);

  const fetchProjects = async () => {
    if (!user) { setProjects([]); setSharedProjects([]); return; }
    try {
      const { data: ownedData, error: ownedError } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });
      if (ownedError) throw ownedError;
      setProjects(ownedData || []);

      const { data: sharesData, error: sharesError } = await supabase
        .from('project_shares')
        .select('id, project_id, owner_id, shared_with_user_id, permission, created_at, project:projects(*)')
        .eq('shared_with_user_id', user.id);
      if (sharesError) throw sharesError;

      if (sharesData && sharesData.length > 0) {
        const ownerIds = [...new Set(sharesData.map((s: any) => s.owner_id as string))];
        const { data: ownerProfiles } = await supabase
          .from('user_profiles')
          .select('id, email, full_name')
          .in('id', ownerIds);

        const entries: SharedProjectEntry[] = sharesData
          .filter((s: any) => s.project)
          .map((s: any) => ({
            share: {
              id: s.id,
              project_id: s.project_id,
              owner_id: s.owner_id,
              shared_with_user_id: s.shared_with_user_id,
              permission: s.permission,
              created_at: s.created_at,
            } as ProjectShare,
            project: s.project as Project,
            owner_profile: ownerProfiles?.find((p: any) => p.id === s.owner_id),
          }));
        setSharedProjects(entries);
      } else {
        setSharedProjects([]);
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  };

  const fetchZones = async (projectId?: string) => {
    if (!user) { setZones([]); return; }
    try {
      if (projectId) {
        const { data, error } = await supabase
          .from('project_zones')
          .select('*')
          .eq('project_id', projectId)
          .order('display_order', { ascending: true })
          .order('created_at', { ascending: true });
        if (error) throw error;
        setZones(data || []);
      } else {
        const { data, error } = await supabase
          .from('project_zones')
          .select('*')
          .eq('user_id', user.id)
          .is('project_id', null)
          .order('display_order', { ascending: true })
          .order('created_at', { ascending: true });
        if (error) throw error;
        setZones(data || []);
      }
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
        .is('parent_selection_id', null);

      if (projectId) {
        // Project context: all contributors' selections for this project
        query = query.eq('project_id', projectId);
      } else {
        // Current working set: only own unassigned selections
        query = query.eq('user_id', user.id).is('project_id', null);
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

  const addPlantSelection = async (plantId: number, quantity: number = 1, pruningForm?: string | null) => {
    if (!user) return;
    if (currentProject && currentProject.user_id !== user.id) {
      const entry = sharedProjects.find(e => e.project.id === currentProject.id);
      if (!entry || entry.share.permission !== 'edit') return;
    }
    try {
      // Only dedup against current user's selections
      const existing = selections.find(s => s.plant_id === plantId && s.user_id === user.id);
      if (existing) {
        await updateSelectionQuantity(existing.id, existing.quantity + quantity);
      } else {
        const { error } = await supabase.from('user_selections').insert({
          user_id: user.id,
          plant_id: plantId,
          quantity,
          project_id: currentProject?.id || null,
          ...(pruningForm ? { pruning_form: pruningForm } : {}),
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
    if (currentProject && currentProject.user_id !== user.id) {
      const entry = sharedProjects.find(e => e.project.id === currentProject.id);
      if (!entry || entry.share.permission !== 'edit') return;
    }
    try {
      const existing = selections.find(s => s.stone_id === stoneId && s.user_id === user.id);
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
    if (currentProject && currentProject.user_id !== user.id) {
      const entry = sharedProjects.find(e => e.project.id === currentProject.id);
      if (!entry || entry.share.permission !== 'edit') return;
    }
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
    if (currentProject && currentProject.user_id !== user?.id && !sharedProjects.some(entry => entry.project.id === currentProject.id && entry.share.permission === 'edit')) return;
    try {
      const { error } = await supabase.from('user_selections').delete().eq('id', selectionId);
      if (error) throw error;
      await fetchSelections(currentProject?.id);
    } catch (error) {
      console.error('Error removing selection:', error);
    }
  };

  const removeCombination = async (parentSelectionId: string) => {
    if (currentProject && currentProject.user_id !== user?.id && !sharedProjects.some(entry => entry.project.id === currentProject.id && entry.share.permission === 'edit')) return;
    try {
      const { error } = await supabase.from('user_selections').delete().eq('id', parentSelectionId);
      if (error) throw error;
      await fetchSelections(currentProject?.id);
    } catch (error) {
      console.error('Error removing combination:', error);
    }
  };

  const updateSelectionQuantity = async (selectionId: string, quantity: number) => {
    const prevSelections = selections;
    setSelections(prev => prev.map(s => s.id === selectionId ? { ...s, quantity } : s));
    try {
      const { error } = await supabase.from('user_selections').update({ quantity }).eq('id', selectionId);
      if (error) throw error;
    } catch (error) {
      console.error('Error updating selection quantity:', error);
      setSelections(prevSelections);
    }
  };

  const updateShrubSalesDetails = async (selectionId: string, details: ShrubSalesDetails) => {
    const selection = selections.find(item => item.id === selectionId);
    if (!selection) return;
    const notes = setShrubSalesDetails(selection.notes, details);
    setSelections(prev => prev.map(item => item.id === selectionId ? { ...item, notes: notes || undefined } : item));
    try {
      const { error } = await supabase.from('user_selections').update({ notes }).eq('id', selectionId);
      if (error) throw error;
    } catch (error) {
      console.error('Error updating shrub sales details:', error);
      await fetchSelections(currentProject?.id);
    }
  };

  const updateTreeSalesDetails = async (selectionId: string, details: TreeSalesDetails) => {
    const selection = selections.find(item => item.id === selectionId);
    if (!selection) return;
    const notes = setTreeSalesDetails(selection.notes, { heightCm: undefined });
    const tree_height_cm = details.heightCm ?? null;
    setSelections(prev => prev.map(item => item.id === selectionId ? { ...item, notes: notes || undefined, tree_height_cm } : item));
    try {
      const { error } = await supabase.from('user_selections').update({ notes, tree_height_cm }).eq('id', selectionId);
      if (error) throw error;
    } catch (error) {
      console.error('Error updating tree sales details:', error);
      await fetchSelections(currentProject?.id);
    }
  };

  const updatePruningForm = async (selectionId: string, form: string | null) => {
    const prevSelections = selections;
    setSelections(prev => prev.map(item => item.id === selectionId ? { ...item, pruning_form: form } : item));
    try {
      const { error } = await supabase.from('user_selections').update({ pruning_form: form }).eq('id', selectionId);
      if (error) throw error;
    } catch (error) {
      console.error('Error updating pruning form:', error);
      setSelections(prevSelections);
    }
  };

  const clearAllSelections = async () => {
    if (!user || (currentProject && currentProject.user_id !== user.id && !sharedProjects.some(entry => entry.project.id === currentProject.id && entry.share.permission === 'edit'))) return;
    try {
      if (currentProject) {
        // Project owner clears all; collaborator clears only own rows (RLS enforces this)
        const { error } = await supabase
          .from('user_selections')
          .delete()
          .eq('project_id', currentProject.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('user_selections')
          .delete()
          .eq('user_id', user.id)
          .is('project_id', null);
        if (error) throw error;
      }
      setSelections([]);
    } catch (error) {
      console.error('Error clearing selections:', error);
    }
  };

  const createProject = async (name: string, description?: string, folderUrl?: string): Promise<Project | null> => {
    if (!user) return null;
    try {
      const { data, error } = await supabase
        .from('projects')
        .insert({ user_id: user.id, name, description: description || null, folder_url: folderUrl || null })
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

  const updateProject = async (projectId: string, name: string, description?: string, folderUrl?: string) => {
    try {
      const { error } = await supabase
        .from('projects')
        .update({ name, description: description || null, folder_url: folderUrl || null })
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
    if (!user || !projects.some(project => project.id === projectId && project.user_id === user.id)) return;
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
      const { error: selError } = await supabase
        .from('user_selections')
        .update({ project_id: projectId })
        .eq('user_id', user.id)
        .is('project_id', null);
      if (selError) throw selError;

      const { error: zoneError } = await supabase
        .from('project_zones')
        .update({ project_id: projectId })
        .eq('user_id', user.id)
        .is('project_id', null);
      if (zoneError) throw zoneError;

      const project = projects.find(p => p.id === projectId);
      if (project) setCurrentProjectState(project);
      await Promise.all([fetchSelections(projectId), fetchZones(projectId)]);
    } catch (error) {
      console.error('Error saving selections to project:', error);
    }
  };

  const loadProjectSelections = async (projectId: string) => {
    let project = projects.find(p => p.id === projectId);
    if (!project) {
      const entry = sharedProjects.find(e => e.project.id === projectId);
      if (entry) project = entry.project;
    }
    if (project) {
      setCurrentProjectState(project);
      await Promise.all([fetchSelections(projectId), fetchZones(projectId)]);
    }
  };

  const isPlantSelected = (plantId: number): boolean => selections.some(s => s.plant_id === plantId);
  const isStoneSelected = (stoneId: number): boolean => selections.some(s => s.stone_id === stoneId);
  const refreshSelections = async () => { await fetchSelections(currentProject?.id); };
  const refreshProjects = async () => { await fetchProjects(); };
  const refreshZones = async () => { await fetchZones(currentProject?.id); };

  const reorderZones = async (zoneId: string, targetIndex: number) => {
    if (currentProject && currentProject.user_id !== user?.id) {
      const entry = sharedProjects.find(e => e.project.id === currentProject.id);
      if (!entry || entry.share.permission !== 'edit') return;
    }

    const orderedZones = [...zones].sort((a, b) => a.display_order - b.display_order);
    const sourceIndex = orderedZones.findIndex(zone => zone.id === zoneId);
    if (sourceIndex < 0 || targetIndex < 0 || targetIndex >= orderedZones.length || sourceIndex === targetIndex) return;

    const [movedZone] = orderedZones.splice(sourceIndex, 1);
    orderedZones.splice(targetIndex, 0, movedZone);

    try {
      const results = await Promise.all(
        orderedZones.map((zone, index) =>
          supabase.from('project_zones').update({ display_order: index, updated_at: new Date().toISOString() }).eq('id', zone.id)
        )
      );
      const failed = results.find(result => result.error);
      if (failed?.error) throw failed.error;
      setZones(orderedZones.map((zone, index) => ({ ...zone, display_order: index })));
    } catch (error) {
      console.error('Error reordering zones:', error);
    }
  };

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
    if (currentProject && currentProject.user_id !== user?.id && !sharedProjects.some(entry => entry.project.id === currentProject.id && entry.share.permission === 'edit')) return;
    try {
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
      setSelections(prev =>
        prev.map(s => s.id === selectionId ? { ...s, zone_id: zoneId ?? undefined } : s)
      );
    } catch (error) {
      console.error('Error moving selection to zone:', error);
    }
  };

  const duplicateSelectionToZone = async (selectionId: string, targetZoneId: string) => {
    if (!user) return;
    try {
      const source = selections.find(s => s.id === selectionId);
      if (!source) return;
      const { error } = await supabase.from('user_selections').insert({
        user_id: user.id,
        plant_id: source.plant_id ?? null,
        stone_id: source.stone_id ?? null,
        quantity: source.quantity,
        notes: source.notes ?? null,
        project_id: source.project_id ?? null,
        zone_id: targetZoneId,
        pruning_form: source.pruning_form ?? null,
        tree_height_cm: source.tree_height_cm ?? null,
      });
      if (error) throw error;
      await fetchSelections(currentProject?.id);
    } catch (error) {
      console.error('Error duplicating selection to zone:', error);
    }
  };

  // Share management
  const getProjectShares = async (projectId: string): Promise<ProjectShareWithUser[]> => {
    try {
      const { data, error } = await supabase
        .from('project_shares')
        .select('*')
        .eq('project_id', projectId);
      if (error) throw error;

      const userIds = (data || []).map((s: any) => s.shared_with_user_id as string);
      const { data: profiles } = userIds.length > 0
        ? await supabase.from('user_profiles').select('id, email, full_name').in('id', userIds)
        : { data: [] };

      return (data || []).map((share: any) => ({
        ...share,
        user_profile: profiles?.find((p: any) => p.id === share.shared_with_user_id) || undefined,
      })) as ProjectShareWithUser[];
    } catch (error) {
      console.error('Error fetching project shares:', error);
      return [];
    }
  };

  const addProjectShare = async (projectId: string, userId: string, permission: 'view' | 'edit') => {
    if (!user) return;
    const { error } = await supabase.from('project_shares').insert({
      project_id: projectId,
      owner_id: user.id,
      shared_with_user_id: userId,
      permission,
    });
    if (error) throw error;
  };

  const removeProjectShare = async (shareId: string) => {
    const { error } = await supabase.from('project_shares').delete().eq('id', shareId);
    if (error) throw error;
  };

  const updateProjectShare = async (shareId: string, permission: 'view' | 'edit') => {
    const { error } = await supabase.from('project_shares').update({ permission }).eq('id', shareId);
    if (error) throw error;
  };

  const searchUsers = async (query: string): Promise<UserSearchResult[]> => {
    if (!query.trim() || !user) return [];
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('id, email, full_name')
        .neq('id', user.id)
        .or(`email.ilike.%${query}%,full_name.ilike.%${query}%`)
        .limit(8);
      if (error) throw error;
      return (data || []) as UserSearchResult[];
    } catch {
      return [];
    }
  };

  const value: SelectionsContextType = {
    selections,
    projects,
    sharedProjects,
    zones,
    currentProject,
    currentProjectPermission,
    loading,
    addPlantSelection,
    addStoneSelection,
    addTileCombination,
    removeSelection,
    removeCombination,
    updateSelectionQuantity,
    updateShrubSalesDetails,
    updateTreeSalesDetails,
    updatePruningForm,
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
    duplicateSelectionToZone,
    refreshZones,
    reorderZones,
    getProjectShares,
    addProjectShare,
    removeProjectShare,
    updateProjectShare,
    searchUsers,
  };

  return <SelectionsContext.Provider value={value}>{children}</SelectionsContext.Provider>;
};
