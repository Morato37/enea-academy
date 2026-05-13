import React, { useState, useEffect } from 'react';
import { useSelections } from '../contexts/SelectionsContext';
import { Trash2, Download, Loader2, Plus, Minus, Save, CreditCard as Edit2, RefreshCw, Image, Calendar } from 'lucide-react';
import { generatePDF } from '../lib/pdfExport';
import { generateMoodboardPDF } from '../lib/moodboardExport';
import { generateBloomingCalendarPDF } from '../lib/bloomingCalendarExport';
import { generatePlantSelectionPDF } from '../lib/plantSelectionExport';
import { LanguageSelectionModal } from '../components/LanguageSelectionModal';

export const SelectionsPage: React.FC = () => {
  const {
    selections,
    projects,
    currentProject,
    removeSelection,
    removeCombination,
    updateSelectionQuantity,
    clearAllSelections,
    loading,
    createProject,
    updateProject,
    deleteProject,
    setCurrentProject,
    saveCurrentSelectionsToProject,
    loadProjectSelections,
    refreshSelections,
  } = useSelections();

  const [generatingPDF, setGeneratingPDF] = useState(false);
  const [generatingMoodboard, setGeneratingMoodboard] = useState(false);
  const [generatingCalendar, setGeneratingCalendar] = useState(false);
  const [generatingPlantSelection, setGeneratingPlantSelection] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [showSaveToProjectModal, setShowSaveToProjectModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDescription, setNewProjectDescription] = useState('');
  const [editingProject, setEditingProject] = useState<{ id: string; name: string; description: string } | null>(null);

  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [pendingExport, setPendingExport] = useState<'pdf' | 'moodboard' | 'calendar' | 'plantselection' | null>(null);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        refreshSelections();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', () => refreshSelections());

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', () => refreshSelections());
    };
  }, []);

  const plantSelections = selections.filter(s => s.plant_id);
  const tileCombinations = selections.filter(s => s.is_tile_combination && s.stone_id && !s.parent_selection_id);
  const regularStoneSelections = selections.filter(s => s.stone_id && !s.is_tile_combination);

  const handleExportPDF = async () => {
    setPendingExport('pdf');
    setShowLanguageModal(true);
  };

  const handleExportMoodboard = async () => {
    const plantSelections = selections.filter(s => s.plant_id);
    if (plantSelections.length === 0) {
      alert('No plant selections to export.');
      return;
    }
    setPendingExport('moodboard');
    setShowLanguageModal(true);
  };

  const handleExportBloomingCalendar = async () => {
    const plantSelections = selections.filter(s => s.plant_id);
    if (plantSelections.length === 0) {
      alert('No plant selections to export.');
      return;
    }
    setPendingExport('calendar');
    setShowLanguageModal(true);
  };

  const handleExportPlantSelection = async () => {
    const plantSelections = selections.filter(s => s.plant_id);
    if (plantSelections.length === 0) {
      alert('No plant selections to export.');
      return;
    }
    setPendingExport('plantselection');
    setShowLanguageModal(true);
  };

  const handleLanguageSelection = async (language: 'de' | 'en') => {
    setShowLanguageModal(false);

    try {
      await refreshSelections();

      if (pendingExport === 'pdf') {
        setGeneratingPDF(true);
        await generatePDF(selections, language);
      } else if (pendingExport === 'moodboard') {
        setGeneratingMoodboard(true);
        const plantSelections = selections.filter(s => s.plant_id);
        const projectName = currentProject?.name;
        await generateMoodboardPDF(plantSelections, projectName, language);
      } else if (pendingExport === 'calendar') {
        setGeneratingCalendar(true);
        const plantSelections = selections.filter(s => s.plant_id);
        const projectName = currentProject?.name;
        await generateBloomingCalendarPDF(plantSelections, projectName, language);
      } else if (pendingExport === 'plantselection') {
        setGeneratingPlantSelection(true);
        const plantSelections = selections.filter(s => s.plant_id);
        const projectName = currentProject?.name;
        await generatePlantSelectionPDF(plantSelections, projectName, language);
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setGeneratingPDF(false);
      setGeneratingMoodboard(false);
      setGeneratingCalendar(false);
      setGeneratingPlantSelection(false);
      setPendingExport(null);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshSelections();
    } finally {
      setRefreshing(false);
    }
  };

  const handleClearAll = async () => {
    await clearAllSelections();
    setShowClearConfirm(false);
  };

  const handleQuantityChange = async (selectionId: string, currentQuantity: number, delta: number) => {
    const newQuantity = Math.max(1, currentQuantity + delta);
    await updateSelectionQuantity(selectionId, newQuantity);
  };

  const handleCreateProject = async () => {
    if (!newProjectName.trim()) return;

    const project = await createProject(newProjectName, newProjectDescription);
    if (project) {
      setNewProjectName('');
      setNewProjectDescription('');
      setShowNewProjectModal(false);
    }
  };

  const handleRenameProject = async () => {
    if (!editingProject || !editingProject.name.trim()) return;

    await updateProject(editingProject.id, editingProject.name, editingProject.description);
    setEditingProject(null);
    setShowRenameModal(false);
  };

  const handleDeleteProject = async (projectId: string) => {
    if (confirm('Are you sure you want to delete this project? All selections in this project will also be deleted.')) {
      await deleteProject(projectId);
    }
  };

  const handleSaveToProject = async (projectId: string) => {
    await saveCurrentSelectionsToProject(projectId);
    setShowSaveToProjectModal(false);
    await handleLoadProject(projectId);
  };

  const handleLoadProject = async (projectId: string) => {
    await loadProjectSelections(projectId);
  };

  if (loading) {
    return (
      <div className="min-h-screen  flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-cyan-600 animate-spin" />
      </div>
    );
  }

  const hasNoSelections = selections.length === 0;

  if (hasNoSelections && projects.length === 0 && !currentProject) {
    return (
      <div className="min-h-screen ">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">My Selections</h1>
          <div className="bg-white border border-gray-300 rounded-lg p-12 text-center">
            <p className="text-gray-600 text-lg mb-4">Your selection is empty</p>
            <p className="text-gray-500">
              Browse plants and stones to add items to your selection
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen ">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          <aside className="lg:w-64 space-y-4">
            <div className="bg-white border border-gray-300 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Projects</h2>
                <button
                  onClick={() => setShowNewProjectModal(true)}
                  className="p-1 text-cyan-600 hover:text-cyan-400 transition-colors"
                  title="New Project"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>

              <button
                onClick={() => setCurrentProject(null)}
                className={`w-full text-left px-3 py-2 rounded mb-2 transition-colors ${
                  !currentProject
                    ? 'bg-cyan-500 text-gray-900'
                    : 'text-gray-700 hover:bg-white'
                }`}
              >
                Current Selection
              </button>

              <div className="space-y-1 max-h-96 overflow-y-auto">
                {projects.map(project => (
                  <div
                    key={project.id}
                    className={`group flex items-center justify-between px-3 py-2 rounded transition-colors ${
                      currentProject?.id === project.id
                        ? 'bg-cyan-500 text-gray-900'
                        : 'text-gray-700 hover:bg-white'
                    }`}
                  >
                    <button
                      onClick={() => handleLoadProject(project.id)}
                      className="flex-1 text-left truncate"
                      title={project.name}
                    >
                      {project.name}
                    </button>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => {
                          setEditingProject({
                            id: project.id,
                            name: project.name,
                            description: project.description || '',
                          });
                          setShowRenameModal(true);
                        }}
                        className="p-1 hover:text-cyan-400 transition-colors"
                        title="Rename"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => handleDeleteProject(project.id)}
                        className="p-1 hover:text-orange-600 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {!currentProject && selections.length > 0 && (
                <button
                  onClick={() => setShowSaveToProjectModal(true)}
                  className="w-full mt-4 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-gray-900 rounded transition-colors flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  Save to Project
                </button>
              )}
            </div>
          </aside>

          <main className="flex-1">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {currentProject ? currentProject.name : 'Current Selection'}
                </h1>
                {currentProject?.description && (
                  <p className="text-gray-600">{currentProject.description}</p>
                )}
                <p className="text-gray-600 mt-2">
                  {plantSelections.length} plants, {tileCombinations.length} tile combinations, {regularStoneSelections.length} stones
                </p>
              </div>

              {!hasNoSelections && (
                <div className="flex gap-3">
                  <button
                    onClick={handleRefresh}
                    disabled={refreshing}
                    className="px-4 py-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    title="Refresh data"
                  >
                    <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
                    {refreshing ? 'Refreshing...' : 'Refresh'}
                  </button>

                  <button
                    onClick={handleExportPDF}
                    disabled={generatingPDF}
                    className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-gray-900 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {generatingPDF ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Download className="w-5 h-5" />
                        Export PDF
                      </>
                    )}
                  </button>

                  <button
                    onClick={handleExportMoodboard}
                    disabled={generatingMoodboard || plantSelections.length === 0}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    title="Export plant selection as moodboard"
                  >
                    {generatingMoodboard ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Image className="w-5 h-5" />
                        Plants Page
                      </>
                    )}
                  </button>

                  <button
                    onClick={handleExportBloomingCalendar}
                    disabled={generatingCalendar || plantSelections.length === 0}
                    className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    title="Export blooming calendar"
                  >
                    {generatingCalendar ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Calendar className="w-5 h-5" />
                        Blooming Calendar
                      </>
                    )}
                  </button>

                  <button
                    onClick={handleExportPlantSelection}
                    disabled={generatingPlantSelection || plantSelections.length === 0}
                    className="px-4 py-2 bg-stone-600 hover:bg-stone-700 text-white rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    title="Export plant selection"
                  >
                    {generatingPlantSelection ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Image className="w-5 h-5" />
                        Plant Selection
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => setShowClearConfirm(true)}
                    className="px-4 py-2 bg-white hover:bg-gray-50 text-gray-700 rounded transition-colors flex items-center gap-2"
                  >
                    <Trash2 className="w-5 h-5" />
                    Clear All
                  </button>
                </div>
              )}
            </div>

            {hasNoSelections && (
              <div className="bg-white border border-gray-300 rounded-lg p-12 text-center">
                <p className="text-gray-600 text-lg mb-4">
                  {currentProject ? 'This project has no selections yet' : 'Your current selection is empty'}
                </p>
                <p className="text-gray-500">
                  Browse plants and stones to add items to your selection
                </p>
              </div>
            )}

            {plantSelections.length > 0 && (
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Plants</h2>
                <div className="space-y-4">
                  {plantSelections.map(selection => {
                    const plant = selection.plant;
                    if (!plant) return null;

                    return (
                      <div
                        key={selection.id}
                        className="bg-white border border-gray-300 rounded-lg p-6 hover:border-cyan-500 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">
                              {plant.botanical_name}
                            </h3>
                            {plant.common_name_en && (
                              <p className="text-gray-600 mb-1">{plant.common_name_en}</p>
                            )}
                          </div>

                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleQuantityChange(selection.id, selection.quantity, -1)}
                                className="p-1 bg-white hover:bg-gray-50 text-gray-700 rounded transition-colors"
                              >
                                <Minus className="w-4 h-4" />
                              </button>
                              <span className="text-gray-900 font-medium w-12 text-center">
                                {selection.quantity}
                              </span>
                              <button
                                onClick={() => handleQuantityChange(selection.id, selection.quantity, 1)}
                                className="p-1 bg-white hover:bg-gray-50 text-gray-700 rounded transition-colors"
                              >
                                <Plus className="w-4 h-4" />
                              </button>
                            </div>

                            <button
                              onClick={() => removeSelection(selection.id)}
                              className="p-2 bg-white hover:bg-orange-500 text-gray-700 hover:text-gray-900 rounded transition-colors"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {tileCombinations.length > 0 && (
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Tile Combinations</h2>
                <div className="space-y-4">
                  {tileCombinations.map(selection => {
                    const tile = selection.stone;
                    if (!tile) return null;

                    return (
                      <div
                        key={selection.id}
                        className="bg-white border border-gray-300 rounded-lg p-6 hover:border-cyan-500 transition-colors"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="px-2 py-1 bg-cyan-600 text-gray-900 rounded text-xs font-medium">
                                Tile
                              </span>
                              <h3 className="text-xl font-semibold text-gray-900">
                                {tile.name}
                              </h3>
                            </div>
                            {tile.morphology && (
                              <p className="text-gray-600 mb-1">{tile.morphology}</p>
                            )}
                          </div>

                          <button
                            onClick={() => removeCombination(selection.id)}
                            className="p-2 bg-gray-200 hover:bg-orange-500 text-gray-700 hover:text-gray-900 rounded transition-colors"
                            title="Remove entire combination"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>

                        {selection.child_selections && selection.child_selections.length > 0 && (
                          <div className="mt-4 pl-4 border-l-2 border-cyan-600">
                            <h4 className="text-sm font-semibold text-gray-700 mb-3">Cobblestones:</h4>
                            <div className="space-y-2">
                              {selection.child_selections.map(childSelection => {
                                const cobblestone = childSelection.stone;
                                if (!cobblestone) return null;

                                return (
                                  <div
                                    key={childSelection.id}
                                    className="flex items-center gap-2 text-sm"
                                  >
                                    <span className="px-2 py-0.5 bg-cyan-600 text-gray-900 rounded text-xs font-medium">
                                      Cobblestone
                                    </span>
                                    <span className="text-gray-900 font-medium">
                                      {cobblestone.name}
                                    </span>
                                    {cobblestone.morphology && (
                                      <span className="text-gray-500">({cobblestone.morphology})</span>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {regularStoneSelections.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Individual Stones</h2>
                <div className="space-y-4">
                  {regularStoneSelections.map(selection => {
                    const stone = selection.stone;
                    if (!stone) return null;

                    return (
                      <div
                        key={selection.id}
                        className="bg-white border border-gray-300 rounded-lg p-6 hover:border-cyan-500 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">
                              {stone.name}
                            </h3>
                            {stone.morphology && (
                              <p className="text-gray-600 mb-1">{stone.morphology}</p>
                            )}
                          </div>

                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleQuantityChange(selection.id, selection.quantity, -1)}
                                className="p-1 bg-white hover:bg-gray-50 text-gray-700 rounded transition-colors"
                              >
                                <Minus className="w-4 h-4" />
                              </button>
                              <span className="text-gray-900 font-medium w-12 text-center">
                                {selection.quantity}
                              </span>
                              <button
                                onClick={() => handleQuantityChange(selection.id, selection.quantity, 1)}
                                className="p-1 bg-white hover:bg-gray-50 text-gray-700 rounded transition-colors"
                              >
                                <Plus className="w-4 h-4" />
                              </button>
                            </div>

                            <button
                              onClick={() => removeSelection(selection.id)}
                              className="p-2 bg-white hover:bg-orange-500 text-gray-700 hover:text-gray-900 rounded transition-colors"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </main>
        </div>
      </div>

      {showClearConfirm && (
        <div className="fixed inset-0  bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white border border-gray-300 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Confirm Clear All</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to clear all selections? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="px-4 py-2 bg-white hover:bg-gray-50 text-gray-700 rounded transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleClearAll}
                className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-gray-900 rounded transition-colors"
              >
                Clear All
              </button>
            </div>
          </div>
        </div>
      )}

      {showNewProjectModal && (
        <div className="fixed inset-0  bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white border border-gray-300 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Create New Project</h3>
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Project Name
                </label>
                <input
                  type="text"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  placeholder="e.g., Garden Renovation 2024"
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  onKeyPress={(e) => e.key === 'Enter' && handleCreateProject()}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description (Optional)
                </label>
                <textarea
                  value={newProjectDescription}
                  onChange={(e) => setNewProjectDescription(e.target.value)}
                  placeholder="Brief project description..."
                  rows={3}
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowNewProjectModal(false);
                  setNewProjectName('');
                  setNewProjectDescription('');
                }}
                className="px-4 py-2 bg-white hover:bg-gray-50 text-gray-700 rounded transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateProject}
                disabled={!newProjectName.trim()}
                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-gray-900 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Create Project
              </button>
            </div>
          </div>
        </div>
      )}

      {showRenameModal && editingProject && (
        <div className="fixed inset-0  bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white border border-gray-300 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Edit Project</h3>
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Project Name
                </label>
                <input
                  type="text"
                  value={editingProject.name}
                  onChange={(e) => setEditingProject({ ...editingProject, name: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded text-gray-900 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={editingProject.description}
                  onChange={(e) => setEditingProject({ ...editingProject, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded text-gray-900 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowRenameModal(false);
                  setEditingProject(null);
                }}
                className="px-4 py-2 bg-white hover:bg-gray-50 text-gray-700 rounded transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleRenameProject}
                disabled={!editingProject.name.trim()}
                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-gray-900 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {showSaveToProjectModal && (
        <div className="fixed inset-0  bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white border border-gray-300 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Save to Project</h3>
            <p className="text-gray-600 mb-4">
              Select a project to save your current selections:
            </p>
            <div className="space-y-2 mb-6 max-h-64 overflow-y-auto">
              {projects.map(project => (
                <button
                  key={project.id}
                  onClick={() => handleSaveToProject(project.id)}
                  className="w-full text-left px-4 py-3 bg-white hover:bg-gray-50 text-gray-900 rounded transition-colors"
                >
                  <div className="font-medium">{project.name}</div>
                  {project.description && (
                    <div className="text-sm text-gray-600 mt-1">{project.description}</div>
                  )}
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowSaveToProjectModal(false)}
              className="w-full px-4 py-2 bg-white hover:bg-gray-50 text-gray-700 rounded transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <LanguageSelectionModal
        isOpen={showLanguageModal}
        onClose={() => {
          setShowLanguageModal(false);
          setPendingExport(null);
        }}
        onSelectLanguage={handleLanguageSelection}
        title={
          pendingExport === 'pdf'
            ? 'Pflanzenliste Export'
            : pendingExport === 'moodboard'
            ? 'Moodboard Export'
            : pendingExport === 'calendar'
            ? 'Blütekalender Export'
            : 'Pflanzenauswahl Export'
        }
      />
    </div>
  );
};
