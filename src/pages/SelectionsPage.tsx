import React, { useState, useRef } from 'react';
import { useSelections } from '../contexts/SelectionsContext';
import {
  Trash2, Download, Loader2, Plus, Minus, Save,
  CreditCard as Edit2, RefreshCw, Image, Calendar,
  MapPin, X, Check, ChevronDown, ChevronRight,
  GripVertical, Layers, Share2, Users, Eye, Lock
} from 'lucide-react';
import { generatePDF } from '../lib/pdfExport';
import { generateMoodboardPDF } from '../lib/moodboardExport';
import { generateBloomingCalendarPDF } from '../lib/bloomingCalendarExport';
import { generatePlantSelectionPDF } from '../lib/plantSelectionExport';
import { LanguageSelectionModal } from '../components/LanguageSelectionModal';
import { ProjectShareModal } from '../components/Selections/ProjectShareModal';
import { UserSelection, ProjectZone } from '../lib/supabase';

// ── Drag state shared via refs ──────────────────────────────────────────────
interface DragState {
  selectionId: string;
  sourceZoneId: string | null;
}

// ── Small reusable components ───────────────────────────────────────────────

const ZoneBadge: React.FC<{ color: string; name: string }> = ({ color, name }) => (
  <span
    className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium"
    style={{ backgroundColor: color + '22', color }}
  >
    <MapPin className="w-3 h-3" />
    {name}
  </span>
);

const ZONE_COLORS = [
  '#2563eb', '#16a34a', '#d97706', '#dc2626',
  '#0891b2', '#7c3aed', '#be185d', '#065f46',
  '#92400e', '#1e3a5f',
];

const getZoneColor = (index: number) => ZONE_COLORS[index % ZONE_COLORS.length];

// ── SelectionCard ─────────────────────────────────────────────────────────

interface SelectionCardProps {
  selection: UserSelection;
  zones: ProjectZone[];
  onRemove: () => void;
  onQuantityChange: (delta: number) => void;
  onMoveToZone: (zoneId: string | null) => void;
  onDuplicateToZone: (zoneId: string) => void;
  dragRef: React.MutableRefObject<DragState | null>;
  isDragging: boolean;
  onDragStart: () => void;
  onDragEnd: () => void;
  zoneColorMap: Map<string, string>;
  readOnly?: boolean;
}

const SelectionCard: React.FC<SelectionCardProps> = ({
  selection, zones, onRemove, onQuantityChange, onMoveToZone, onDuplicateToZone,
  dragRef, onDragStart, onDragEnd, zoneColorMap, readOnly = false,
}) => {
  const [showZoneMenu, setShowZoneMenu] = useState(false);
  const item = selection.plant || selection.stone;
  const title = selection.plant
    ? (selection.plant.common_name_de || selection.plant.common_name_en || selection.plant.botanical_name)
    : selection.stone?.name;
  const subtitle = selection.plant?.botanical_name || selection.stone?.morphology;
  const currentZone = zones.find(z => z.id === selection.zone_id);

  const handleDragStart = (e: React.DragEvent) => {
    if (readOnly) return;
    dragRef.current = { selectionId: selection.id, sourceZoneId: selection.zone_id ?? null };
    e.dataTransfer.effectAllowed = 'move';
    onDragStart();
  };

  if (!item) return null;

  return (
    <div
      draggable={!readOnly}
      onDragStart={handleDragStart}
      onDragEnd={onDragEnd}
      className={`bg-white border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-all group select-none ${
        readOnly ? 'cursor-default' : 'cursor-grab active:cursor-grabbing'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2 flex-1 min-w-0">
          {!readOnly && (
            <GripVertical className="w-4 h-4 text-gray-300 mt-0.5 shrink-0 group-hover:text-gray-400 transition-colors" />
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium text-gray-900 text-sm truncate">{title}</span>
              {currentZone && (
                <ZoneBadge
                  color={zoneColorMap.get(currentZone.id) || '#2563eb'}
                  name={currentZone.name}
                />
              )}
            </div>
            {subtitle && (
              <p className="text-xs text-gray-500 italic mt-0.5 truncate">{subtitle}</p>
            )}
          </div>
        </div>

        {!readOnly && (
          <div className="flex items-center gap-1 shrink-0">
            {/* Zone assignment */}
            <div className="relative">
              <button
                onClick={() => setShowZoneMenu(v => !v)}
                className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                title="Assign to zone"
              >
                <MapPin className="w-4 h-4" />
              </button>
              {showZoneMenu && (
                <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 min-w-[180px] py-1">
                  <p className="px-3 py-1 text-xs font-semibold text-gray-400 uppercase tracking-wide">Move to</p>
                  <button
                    onClick={() => { onMoveToZone(null); setShowZoneMenu(false); }}
                    className="w-full text-left px-3 py-1.5 text-sm hover:bg-gray-50 flex items-center gap-2 text-gray-500"
                  >
                    <X className="w-3 h-3" />
                    No zone
                  </button>
                  {zones.map((zone, idx) => (
                    <button
                      key={zone.id}
                      onClick={() => { onMoveToZone(zone.id); setShowZoneMenu(false); }}
                      className="w-full text-left px-3 py-1.5 text-sm hover:bg-gray-50 flex items-center gap-2"
                      style={{ color: getZoneColor(idx) }}
                    >
                      <MapPin className="w-3 h-3" />
                      {zone.name}
                      {selection.zone_id === zone.id && <Check className="w-3 h-3 ml-auto" />}
                    </button>
                  ))}
                  {zones.length === 0 && (
                    <p className="px-3 py-1.5 text-xs text-gray-400">No zones yet</p>
                  )}
                  {zones.filter(z => z.id !== selection.zone_id).length > 0 && (
                    <>
                      <div className="my-1 border-t border-gray-100" />
                      <p className="px-3 py-1 text-xs font-semibold text-gray-400 uppercase tracking-wide">Copy to</p>
                      {zones.filter(z => z.id !== selection.zone_id).map((zone, idx) => (
                        <button
                          key={zone.id}
                          onClick={() => { onDuplicateToZone(zone.id); setShowZoneMenu(false); }}
                          className="w-full text-left px-3 py-1.5 text-sm hover:bg-gray-50 flex items-center gap-2"
                          style={{ color: getZoneColor(zones.indexOf(zone)) }}
                        >
                          <Plus className="w-3 h-3" />
                          {zone.name}
                        </button>
                      ))}
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Quantity */}
            {!selection.is_tile_combination && (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => onQuantityChange(-1)}
                  className="w-6 h-6 flex items-center justify-center rounded hover:bg-gray-100 text-gray-500 transition-colors"
                >
                  <Minus className="w-3 h-3" />
                </button>
                <span className="text-sm font-medium text-gray-700 w-6 text-center">{selection.quantity}</span>
                <button
                  onClick={() => onQuantityChange(1)}
                  className="w-6 h-6 flex items-center justify-center rounded hover:bg-gray-100 text-gray-500 transition-colors"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>
            )}

            <button
              onClick={onRemove}
              className="p-1.5 rounded hover:bg-red-50 text-gray-300 hover:text-red-500 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}

        {readOnly && !selection.is_tile_combination && (
          <span className="text-xs text-gray-400 shrink-0">×{selection.quantity}</span>
        )}
      </div>

      {selection.child_selections && selection.child_selections.length > 0 && (
        <div className="mt-2 pl-6 space-y-1">
          {selection.child_selections.map(child => (
            <div key={child.id} className="flex items-center gap-1.5 text-xs text-gray-500">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0" />
              <span>{child.stone?.name}</span>
              {child.stone?.morphology && <span className="text-gray-400">({child.stone.morphology})</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ── ZoneColumn ─────────────────────────────────────────────────────────

interface ZoneColumnProps {
  zone: ProjectZone | null;
  color: string;
  selections: UserSelection[];
  allZones: ProjectZone[];
  isEditingName: boolean;
  onRename: (name: string) => void;
  onStartRename: () => void;
  onDelete: () => void;
  onDrop: (selectionId: string) => void;
  onRemoveSelection: (id: string) => void;
  onQuantityChange: (id: string, current: number, delta: number) => void;
  onMoveToZone: (selectionId: string, zoneId: string | null) => void;
  onDuplicateToZone: (selectionId: string, zoneId: string) => void;
  dragRef: React.MutableRefObject<DragState | null>;
  draggingId: string | null;
  setDraggingId: (id: string | null) => void;
  zoneColorMap: Map<string, string>;
  readOnly?: boolean;
  onExportPlantBoard?: () => void;
  onExportPlantSelection?: () => void;
  onExportCalendar?: () => void;
  generatingExport: string | null;
}

const ZoneColumn: React.FC<ZoneColumnProps> = ({
  zone, color, selections, allZones, isEditingName, onRename, onStartRename, onDelete,
  onDrop, onRemoveSelection, onQuantityChange, onMoveToZone, onDuplicateToZone, dragRef, draggingId, setDraggingId,
  zoneColorMap, readOnly = false, onExportPlantBoard, onExportPlantSelection, onExportCalendar, generatingExport,
}) => {
  const [dragOver, setDragOver] = useState(false);
  const [editName, setEditName] = useState(zone?.name || '');
  const [collapsed, setCollapsed] = useState(false);

  const isUnassigned = zone === null;
  const title = isUnassigned ? 'Unassigned' : zone.name;
  const plantCount = selections.filter(s => s.plant_id).length;

  const handleDragOver = (e: React.DragEvent) => {
    if (readOnly) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOver(true);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (dragRef.current) {
      onDrop(dragRef.current.selectionId);
      dragRef.current = null;
    }
  };

  return (
    <div
      className={`flex flex-col rounded-xl border-2 transition-all min-w-[260px] ${
        dragOver ? 'border-dashed shadow-lg scale-[1.01]' : 'border-gray-100'
      }`}
      style={dragOver ? { borderColor: color } : {}}
      onDragOver={handleDragOver}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
    >
      {/* Zone header */}
      <div
        className="flex items-center gap-2 px-4 py-3 rounded-t-xl"
        style={{ backgroundColor: color + '15' }}
      >
        <button
          onClick={() => setCollapsed(v => !v)}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />

        {isEditingName && !readOnly ? (
          <input
            autoFocus
            value={editName}
            onChange={e => setEditName(e.target.value)}
            onBlur={() => { if (editName.trim()) onRename(editName.trim()); }}
            onKeyDown={e => {
              if (e.key === 'Enter' && editName.trim()) onRename(editName.trim());
              if (e.key === 'Escape') onRename(zone?.name || '');
            }}
            className="flex-1 text-sm font-semibold bg-white border border-gray-300 rounded px-2 py-0.5 focus:outline-none focus:ring-2"
            style={{ '--tw-ring-color': color } as React.CSSProperties}
          />
        ) : (
          <button
            onDoubleClick={() => { if (!readOnly && !isUnassigned) { setEditName(zone?.name || ''); onStartRename(); } }}
            className="flex-1 text-left text-sm font-semibold text-gray-800 hover:text-gray-600 transition-colors"
            title={readOnly ? undefined : 'Double-click to rename'}
          >
            {title}
          </button>
        )}

        <span className="text-xs text-gray-400 shrink-0">{selections.length}</span>

        {!isUnassigned && !readOnly && (
          <div className="flex items-center gap-1">
            <button
              onClick={() => { setEditName(zone?.name || ''); onStartRename(); }}
              className="p-1 rounded hover:bg-white/60 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <Edit2 className="w-3 h-3" />
            </button>
            <button
              onClick={onDelete}
              className="p-1 rounded hover:bg-white/60 text-gray-400 hover:text-red-500 transition-colors"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>

      {/* Export bar */}
      {!isUnassigned && !collapsed && plantCount > 0 && (
        <div
          className="flex items-center gap-1 px-4 py-2 border-b border-gray-100"
          style={{ backgroundColor: color + '08' }}
        >
          <span className="text-xs text-gray-400 mr-1">Export:</span>
          {onExportPlantBoard && (
            <button
              onClick={onExportPlantBoard}
              disabled={!!generatingExport}
              className="px-2 py-0.5 text-xs rounded flex items-center gap-1 transition-colors disabled:opacity-50"
              style={{ backgroundColor: color + '20', color }}
            >
              {generatingExport === 'plantboard' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Image className="w-3 h-3" />}
              Plant Board
            </button>
          )}
          {onExportPlantSelection && (
            <button
              onClick={onExportPlantSelection}
              disabled={!!generatingExport}
              className="px-2 py-0.5 text-xs rounded flex items-center gap-1 transition-colors disabled:opacity-50"
              style={{ backgroundColor: color + '20', color }}
            >
              {generatingExport === 'plantselection' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Layers className="w-3 h-3" />}
              Plant Selection
            </button>
          )}
          {onExportCalendar && (
            <button
              onClick={onExportCalendar}
              disabled={!!generatingExport}
              className="px-2 py-0.5 text-xs rounded flex items-center gap-1 transition-colors disabled:opacity-50"
              style={{ backgroundColor: color + '20', color }}
            >
              {generatingExport === 'calendar' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Calendar className="w-3 h-3" />}
              Blooming Calendar
            </button>
          )}
        </div>
      )}

      {/* Cards */}
      {!collapsed && (
        <div className="flex-1 p-3 space-y-2 min-h-[80px]">
          {selections.length === 0 && (
            <div
              className="h-16 border-2 border-dashed rounded-lg flex items-center justify-center text-xs transition-colors"
              style={{ borderColor: color + '40', color: color + '80' }}
            >
              {readOnly ? 'Empty' : 'Drop plants here'}
            </div>
          )}
          {selections.map(sel => (
            <SelectionCard
              key={sel.id}
              selection={sel}
              zones={allZones}
              onRemove={() => onRemoveSelection(sel.id)}
              onQuantityChange={(delta) => onQuantityChange(sel.id, sel.quantity, delta)}
              onMoveToZone={(zoneId) => onMoveToZone(sel.id, zoneId)}
              onDuplicateToZone={(zoneId) => onDuplicateToZone(sel.id, zoneId)}
              dragRef={dragRef}
              isDragging={draggingId === sel.id}
              onDragStart={() => setDraggingId(sel.id)}
              onDragEnd={() => setDraggingId(null)}
              zoneColorMap={zoneColorMap}
              readOnly={readOnly}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// ── Main Page ─────────────────────────────────────────────────────────────

export const SelectionsPage: React.FC = () => {
  const {
    selections, projects, sharedProjects, zones, currentProject,
    currentProjectPermission, loading,
    removeSelection, removeCombination, updateSelectionQuantity, clearAllSelections,
    createProject, updateProject, deleteProject, setCurrentProject,
    saveCurrentSelectionsToProject, loadProjectSelections, refreshSelections,
    createZone, updateZone, deleteZone, moveSelectionToZone, duplicateSelectionToZone,
  } = useSelections();

  const [generatingPDF, setGeneratingPDF] = useState(false);
  const [generatingMoodboard, setGeneratingMoodboard] = useState(false);
  const [generatingCalendar, setGeneratingCalendar] = useState(false);
  const [generatingPlantSelection, setGeneratingPlantSelection] = useState(false);
  const [zoneGenerating, setZoneGenerating] = useState<{ zoneId: string; type: string } | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [showSaveToProjectModal, setShowSaveToProjectModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDescription, setNewProjectDescription] = useState('');
  const [editingProject, setEditingProject] = useState<{ id: string; name: string; description: string } | null>(null);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [shareModalProjectId, setShareModalProjectId] = useState<string | null>(null);
  const [pendingExport, setPendingExport] = useState<{
    type: 'pdf' | 'moodboard' | 'calendar' | 'plantselection';
    zoneId?: string;
  } | null>(null);
  const [editingZoneId, setEditingZoneId] = useState<string | null>(null);
  const [newZoneName, setNewZoneName] = useState('');
  const [showNewZoneInput, setShowNewZoneInput] = useState(false);
  const [draggingId, setDraggingId] = useState<string | null>(null);

  const dragRef = useRef<DragState | null>(null);

  const isReadOnly = currentProjectPermission === 'view';
  const canEdit = currentProjectPermission !== 'view';
  const isOwner = currentProjectPermission === 'owner' || currentProjectPermission === null;

  const zoneColorMap = new Map<string, string>(
    zones.map((z, i) => [z.id, getZoneColor(i)])
  );

  const plantSelections = selections.filter(s => s.plant_id);
  const tileCombinations = selections.filter(s => s.is_tile_combination && s.stone_id && !s.parent_selection_id);
  const regularStoneSelections = selections.filter(s => s.stone_id && !s.is_tile_combination);

  const unassignedSelections = selections.filter(s => !s.zone_id && !s.parent_selection_id);
  const getZoneSelections = (zoneId: string) =>
    selections.filter(s => s.zone_id === zoneId && !s.parent_selection_id);

  // ── Export handlers ──────────────────────────────────────────────────────
  const triggerExport = (type: typeof pendingExport) => {
    setPendingExport(type);
    setShowLanguageModal(true);
  };

  const getExportSelections = (zoneId?: string) => {
    if (zoneId) return selections.filter(s => s.plant_id && s.zone_id === zoneId);
    return selections.filter(s => s.plant_id);
  };

  const handleLanguageSelection = async (language: 'de' | 'en') => {
    setShowLanguageModal(false);
    if (!pendingExport) return;

    const { type, zoneId } = pendingExport;
    const exportSelections = getExportSelections(zoneId);
    const zoneName = zoneId ? zones.find(z => z.id === zoneId)?.name : undefined;
    const projectName = zoneName
      ? `${currentProject?.name || 'Project'} — ${zoneName}`
      : currentProject?.name;

    const setZoneGen = zoneId
      ? (t: string | null) => setZoneGenerating(t ? { zoneId, type: t } : null)
      : null;

    try {
      await refreshSelections();
      if (type === 'pdf') {
        setGeneratingPDF(true);
        await generatePDF(selections, language);
      } else if (type === 'moodboard') {
        setZoneGen?.('plantboard'); setGeneratingMoodboard(true);
        await generateMoodboardPDF(exportSelections, projectName, language);
      } else if (type === 'calendar') {
        setZoneGen?.('calendar'); setGeneratingCalendar(true);
        await generateBloomingCalendarPDF(exportSelections, projectName, language);
      } else if (type === 'plantselection') {
        setZoneGen?.('plantselection'); setGeneratingPlantSelection(true);
        await generatePlantSelectionPDF(exportSelections, projectName, language);
      }
    } catch (error) {
      console.error('Error generating export:', error);
      alert('Failed to generate export. Please try again.');
    } finally {
      setGeneratingPDF(false);
      setGeneratingMoodboard(false);
      setGeneratingCalendar(false);
      setGeneratingPlantSelection(false);
      setZoneGenerating(null);
      setPendingExport(null);
    }
  };

  // ── Project handlers ─────────────────────────────────────────────────────
  const handleRefresh = async () => {
    setRefreshing(true);
    try { await refreshSelections(); } finally { setRefreshing(false); }
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
      setNewProjectName(''); setNewProjectDescription('');
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
    if (confirm('Delete this project and all its selections?')) await deleteProject(projectId);
  };

  const handleSaveToProject = async (projectId: string) => {
    await saveCurrentSelectionsToProject(projectId);
    setShowSaveToProjectModal(false);
  };

  const handleLoadProject = async (projectId: string) => {
    await loadProjectSelections(projectId);
  };

  // ── Zone handlers ────────────────────────────────────────────────────────
  const handleCreateZone = async () => {
    if (!newZoneName.trim()) return;
    await createZone(newZoneName.trim());
    setNewZoneName('');
    setShowNewZoneInput(false);
  };

  const handleDropOnZone = async (selectionId: string, zoneId: string | null) => {
    await moveSelectionToZone(selectionId, zoneId);
  };

  const handleRemoveSelection = async (sel: UserSelection) => {
    if (sel.is_tile_combination) await removeCombination(sel.id);
    else await removeSelection(sel.id);
  };

  const shareModalProject = shareModalProjectId
    ? projects.find(p => p.id === shareModalProjectId)
    : null;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-cyan-600 animate-spin" />
      </div>
    );
  }

  const hasNoSelections = selections.length === 0;

  if (hasNoSelections && projects.length === 0 && sharedProjects.length === 0 && !currentProject) {
    return (
      <div className="min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">My Selections</h1>
          <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
            <p className="text-gray-600 text-lg mb-2">Your selection is empty</p>
            <p className="text-gray-400 text-sm">Browse plants and stones to add items to your selection</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">

          {/* ── Sidebar ─────────────────────────────────────── */}
          <aside className="lg:w-64 shrink-0 space-y-4">
            <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Projects</h2>
                <button
                  onClick={() => setShowNewProjectModal(true)}
                  className="p-1 text-gray-400 hover:text-cyan-600 transition-colors"
                  title="New Project"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              <button
                onClick={() => setCurrentProject(null)}
                className={`w-full text-left px-3 py-2 rounded-lg mb-1 text-sm transition-colors ${
                  !currentProject ? 'bg-cyan-50 text-cyan-700 font-medium' : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                Current Selection
              </button>

              {/* Owned projects */}
              <div className="space-y-0.5 max-h-60 overflow-y-auto">
                {projects.map(project => (
                  <div
                    key={project.id}
                    className={`group flex items-center gap-1 px-3 py-2 rounded-lg transition-colors ${
                      currentProject?.id === project.id
                        ? 'bg-cyan-50 text-cyan-700'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <button
                      onClick={() => handleLoadProject(project.id)}
                      className="flex-1 text-left text-sm truncate font-medium"
                      title={project.name}
                    >
                      {project.name}
                    </button>
                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => setShareModalProjectId(project.id)}
                        className="p-1 hover:text-cyan-600 transition-colors"
                        title="Share project"
                      >
                        <Share2 className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => {
                          setEditingProject({ id: project.id, name: project.name, description: project.description || '' });
                          setShowRenameModal(true);
                        }}
                        className="p-1 hover:text-cyan-600 transition-colors"
                        title="Rename"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => handleDeleteProject(project.id)}
                        className="p-1 hover:text-red-500 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Shared with me */}
              {sharedProjects.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <div className="flex items-center gap-1.5 px-1 mb-2">
                    <Users className="w-3 h-3 text-gray-400" />
                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Shared with me</span>
                  </div>
                  <div className="space-y-0.5 max-h-48 overflow-y-auto">
                    {sharedProjects.map(entry => (
                      <div
                        key={entry.share.id}
                        className={`group flex items-center gap-1.5 px-3 py-2 rounded-lg transition-colors ${
                          currentProject?.id === entry.project.id
                            ? 'bg-cyan-50 text-cyan-700'
                            : 'text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        <button
                          onClick={() => handleLoadProject(entry.project.id)}
                          className="flex-1 text-left text-sm truncate font-medium min-w-0"
                          title={entry.project.name}
                        >
                          {entry.project.name}
                        </button>
                        <div className="flex items-center gap-1 shrink-0">
                          {entry.share.permission === 'view'
                            ? <Eye className="w-3 h-3 text-gray-400" title="View only" />
                            : <Edit2 className="w-3 h-3 text-cyan-500" title="Can edit" />
                          }
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {!currentProject && selections.length > 0 && (
                <button
                  onClick={() => setShowSaveToProjectModal(true)}
                  className="w-full mt-3 px-3 py-2 bg-cyan-600 hover:bg-cyan-700 text-white text-sm rounded-lg transition-colors flex items-center justify-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  Save to Project
                </button>
              )}
            </div>

            {/* Zones panel */}
            <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Zones</h2>
                {isOwner && (
                  <button
                    onClick={() => setShowNewZoneInput(v => !v)}
                    className="p-1 text-gray-400 hover:text-cyan-600 transition-colors"
                    title="Add Zone"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                )}
              </div>

              {showNewZoneInput && isOwner && (
                <div className="flex gap-1.5 mb-3">
                  <input
                    autoFocus
                    value={newZoneName}
                    onChange={e => setNewZoneName(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') handleCreateZone();
                      if (e.key === 'Escape') { setShowNewZoneInput(false); setNewZoneName(''); }
                    }}
                    placeholder="Zone name..."
                    className="flex-1 text-sm px-2 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                  <button
                    onClick={handleCreateZone}
                    disabled={!newZoneName.trim()}
                    className="px-2 py-1.5 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 disabled:opacity-40 transition-colors"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                </div>
              )}

              <div className="space-y-1">
                {zones.map((zone, idx) => (
                  <div key={zone.id} className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm text-gray-700">
                    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: getZoneColor(idx) }} />
                    <span className="flex-1 truncate">{zone.name}</span>
                    <span className="text-xs text-gray-400">{getZoneSelections(zone.id).length}</span>
                  </div>
                ))}
                {zones.length === 0 && (
                  <p className="text-xs text-gray-400 text-center py-2">No zones yet</p>
                )}
              </div>
            </div>
          </aside>

          {/* ── Main content ─────────────────────────────────── */}
          <main className="flex-1 min-w-0">
            {/* Header */}
            <div className="flex items-start justify-between mb-6 gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold text-gray-900">
                    {currentProject ? currentProject.name : 'Current Selection'}
                  </h1>
                  {/* Permission badge for shared projects */}
                  {currentProjectPermission === 'view' && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-amber-50 text-amber-700 border border-amber-200">
                      <Lock className="w-3 h-3" />
                      View only
                    </span>
                  )}
                  {currentProjectPermission === 'edit' && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-cyan-50 text-cyan-700 border border-cyan-200">
                      <Edit2 className="w-3 h-3" />
                      Collaborator
                    </span>
                  )}
                </div>
                {currentProject?.description && (
                  <p className="text-gray-500 text-sm mt-0.5">{currentProject.description}</p>
                )}
                {/* Show owner info for shared projects */}
                {currentProjectPermission !== 'owner' && currentProjectPermission !== null && currentProject && (
                  <p className="text-xs text-gray-400 mt-0.5">
                    by {sharedProjects.find(e => e.project.id === currentProject.id)?.owner_profile?.full_name
                      || sharedProjects.find(e => e.project.id === currentProject.id)?.owner_profile?.email
                      || 'another user'}
                  </p>
                )}
                <p className="text-gray-400 text-xs mt-1">
                  {plantSelections.length} plants · {tileCombinations.length} tile combinations · {regularStoneSelections.length} stones
                </p>
              </div>

              {!hasNoSelections && (
                <div className="flex flex-wrap gap-2 shrink-0">
                  <button
                    onClick={handleRefresh}
                    disabled={refreshing}
                    className="px-3 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 rounded-lg text-sm transition-colors disabled:opacity-50 flex items-center gap-1.5"
                  >
                    <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                    {refreshing ? 'Refreshing...' : 'Refresh'}
                  </button>

                  <button
                    onClick={() => triggerExport({ type: 'pdf' })}
                    disabled={generatingPDF}
                    className="px-3 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg text-sm transition-colors disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {generatingPDF ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                    Export PDF
                  </button>

                  <button
                    onClick={() => triggerExport({ type: 'moodboard' })}
                    disabled={generatingMoodboard || plantSelections.length === 0}
                    className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm transition-colors disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {generatingMoodboard ? <Loader2 className="w-4 h-4 animate-spin" /> : <Image className="w-4 h-4" />}
                    Plant Board
                  </button>

                  <button
                    onClick={() => triggerExport({ type: 'calendar' })}
                    disabled={generatingCalendar || plantSelections.length === 0}
                    className="px-3 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-sm transition-colors disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {generatingCalendar ? <Loader2 className="w-4 h-4 animate-spin" /> : <Calendar className="w-4 h-4" />}
                    Blooming Calendar
                  </button>

                  <button
                    onClick={() => triggerExport({ type: 'plantselection' })}
                    disabled={generatingPlantSelection || plantSelections.length === 0}
                    className="px-3 py-2 bg-stone-600 hover:bg-stone-700 text-white rounded-lg text-sm transition-colors disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {generatingPlantSelection ? <Loader2 className="w-4 h-4 animate-spin" /> : <Layers className="w-4 h-4" />}
                    Plant Selection
                  </button>

                  {canEdit && (
                    <button
                      onClick={() => setShowClearConfirm(true)}
                      className="px-3 py-2 bg-white border border-gray-200 hover:bg-red-50 hover:border-red-200 text-gray-500 hover:text-red-600 rounded-lg text-sm transition-colors flex items-center gap-1.5"
                    >
                      <Trash2 className="w-4 h-4" />
                      Clear All
                    </button>
                  )}
                </div>
              )}
            </div>

            {hasNoSelections ? (
              <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
                <p className="text-gray-500 mb-1">
                  {currentProject ? 'This project has no selections yet' : 'Your current selection is empty'}
                </p>
                <p className="text-gray-400 text-sm">
                  {isReadOnly ? 'This project is view-only.' : 'Browse plants and stones to add items'}
                </p>
              </div>
            ) : (
              <>
                {/* ── Zones board ──────────────────────────────── */}
                {zones.length > 0 && (
                  <div className="mb-8">
                    <div className="flex items-center gap-3 mb-4">
                      <h2 className="text-base font-semibold text-gray-700">Zones</h2>
                      {isOwner && (
                        <button
                          onClick={() => setShowNewZoneInput(true)}
                          className="flex items-center gap-1 px-2 py-1 text-xs text-gray-500 hover:text-cyan-600 border border-dashed border-gray-300 hover:border-cyan-400 rounded-lg transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                          Add zone
                        </button>
                      )}
                    </div>

                    <div className="flex gap-4 overflow-x-auto pb-2">
                      {zones.map((zone, idx) => {
                        const color = getZoneColor(idx);
                        const zoneSelections = getZoneSelections(zone.id);
                        const zonePlants = zoneSelections.filter(s => s.plant_id);

                        return (
                          <ZoneColumn
                            key={zone.id}
                            zone={zone}
                            color={color}
                            selections={zoneSelections}
                            allZones={zones}
                            isEditingName={editingZoneId === zone.id}
                            onStartRename={() => setEditingZoneId(zone.id)}
                            onRename={async (name) => {
                              await updateZone(zone.id, name);
                              setEditingZoneId(null);
                            }}
                            onDelete={() => {
                              if (confirm(`Delete zone "${zone.name}"? Plants will become unassigned.`)) {
                                deleteZone(zone.id);
                              }
                            }}
                            onDrop={(selectionId) => handleDropOnZone(selectionId, zone.id)}
                            onRemoveSelection={(id) => {
                              const sel = selections.find(s => s.id === id);
                              if (sel) handleRemoveSelection(sel);
                            }}
                            onQuantityChange={handleQuantityChange}
                            onMoveToZone={moveSelectionToZone}
                            onDuplicateToZone={duplicateSelectionToZone}
                            dragRef={dragRef}
                            draggingId={draggingId}
                            setDraggingId={setDraggingId}
                            zoneColorMap={zoneColorMap}
                            readOnly={isReadOnly}
                            generatingExport={zoneGenerating?.zoneId === zone.id ? zoneGenerating.type : null}
                            onExportPlantBoard={zonePlants.length > 0
                              ? () => triggerExport({ type: 'moodboard', zoneId: zone.id })
                              : undefined}
                            onExportPlantSelection={zonePlants.length > 0
                              ? () => triggerExport({ type: 'plantselection', zoneId: zone.id })
                              : undefined}
                            onExportCalendar={zonePlants.length > 0
                              ? () => triggerExport({ type: 'calendar', zoneId: zone.id })
                              : undefined}
                          />
                        );
                      })}

                      {/* Unassigned column */}
                      <ZoneColumn
                        zone={null}
                        color="#9ca3af"
                        selections={unassignedSelections}
                        allZones={zones}
                        isEditingName={false}
                        onStartRename={() => {}}
                        onRename={() => {}}
                        onDelete={() => {}}
                        onDrop={(selectionId) => handleDropOnZone(selectionId, null)}
                        onRemoveSelection={(id) => {
                          const sel = selections.find(s => s.id === id);
                          if (sel) handleRemoveSelection(sel);
                        }}
                        onQuantityChange={handleQuantityChange}
                        onMoveToZone={moveSelectionToZone}
                        onDuplicateToZone={duplicateSelectionToZone}
                        dragRef={dragRef}
                        draggingId={draggingId}
                        setDraggingId={setDraggingId}
                        zoneColorMap={zoneColorMap}
                        readOnly={isReadOnly}
                        generatingExport={null}
                      />
                    </div>
                  </div>
                )}

                {/* ── Flat list ─────── */}
                {zones.length === 0 && (
                  <>
                    {canEdit && (
                      <div className="mb-6 flex items-center gap-3 p-4 bg-blue-50 border border-blue-100 rounded-xl text-sm text-blue-700">
                        <MapPin className="w-4 h-4 shrink-0" />
                        <span>Organize your selections by creating zones — then drag plants into them.</span>
                        {isOwner && (
                          <button
                            onClick={() => setShowNewZoneInput(true)}
                            className="ml-auto shrink-0 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-xs font-medium"
                          >
                            Add first zone
                          </button>
                        )}
                      </div>
                    )}

                    {plantSelections.length > 0 && (
                      <div className="mb-6">
                        <h2 className="text-base font-semibold text-gray-700 mb-3">Plants</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2">
                          {plantSelections.map(selection => (
                            <SelectionCard
                              key={selection.id}
                              selection={selection}
                              zones={zones}
                              onRemove={() => handleRemoveSelection(selection)}
                              onQuantityChange={(delta) => handleQuantityChange(selection.id, selection.quantity, delta)}
                              onMoveToZone={(zoneId) => moveSelectionToZone(selection.id, zoneId)}
                              onDuplicateToZone={(zoneId) => duplicateSelectionToZone(selection.id, zoneId)}
                              dragRef={dragRef}
                              isDragging={draggingId === selection.id}
                              onDragStart={() => setDraggingId(selection.id)}
                              onDragEnd={() => setDraggingId(null)}
                              zoneColorMap={zoneColorMap}
                              readOnly={isReadOnly}
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {tileCombinations.length > 0 && (
                      <div className="mb-6">
                        <h2 className="text-base font-semibold text-gray-700 mb-3">Tile Combinations</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2">
                          {tileCombinations.map(selection => (
                            <SelectionCard
                              key={selection.id}
                              selection={selection}
                              zones={zones}
                              onRemove={() => handleRemoveSelection(selection)}
                              onQuantityChange={(delta) => handleQuantityChange(selection.id, selection.quantity, delta)}
                              onMoveToZone={(zoneId) => moveSelectionToZone(selection.id, zoneId)}
                              onDuplicateToZone={(zoneId) => duplicateSelectionToZone(selection.id, zoneId)}
                              dragRef={dragRef}
                              isDragging={draggingId === selection.id}
                              onDragStart={() => setDraggingId(selection.id)}
                              onDragEnd={() => setDraggingId(null)}
                              zoneColorMap={zoneColorMap}
                              readOnly={isReadOnly}
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {regularStoneSelections.length > 0 && (
                      <div>
                        <h2 className="text-base font-semibold text-gray-700 mb-3">Individual Stones</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2">
                          {regularStoneSelections.map(selection => (
                            <SelectionCard
                              key={selection.id}
                              selection={selection}
                              zones={zones}
                              onRemove={() => handleRemoveSelection(selection)}
                              onQuantityChange={(delta) => handleQuantityChange(selection.id, selection.quantity, delta)}
                              onMoveToZone={(zoneId) => moveSelectionToZone(selection.id, zoneId)}
                              onDuplicateToZone={(zoneId) => duplicateSelectionToZone(selection.id, zoneId)}
                              dragRef={dragRef}
                              isDragging={draggingId === selection.id}
                              onDragStart={() => setDraggingId(selection.id)}
                              onDragEnd={() => setDraggingId(null)}
                              zoneColorMap={zoneColorMap}
                              readOnly={isReadOnly}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </>
            )}
          </main>
        </div>
      </div>

      {/* ── Modals ───────────────────────────────────────────────────────── */}

      {showClearConfirm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-xl">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Clear All</h3>
            <p className="text-gray-500 text-sm mb-6">
              {currentProjectPermission === 'owner'
                ? 'All selections from all collaborators will be removed. This cannot be undone.'
                : 'Your selections in this project will be removed. This cannot be undone.'}
            </p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setShowClearConfirm(false)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">Cancel</button>
              <button onClick={handleClearAll} className="px-4 py-2 text-sm bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors">Clear All</button>
            </div>
          </div>
        </div>
      )}

      {showNewProjectModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-xl">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Create New Project</h3>
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Project Name</label>
                <input
                  type="text"
                  value={newProjectName}
                  onChange={e => setNewProjectName(e.target.value)}
                  placeholder="e.g., Garden Renovation 2024"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  onKeyDown={e => e.key === 'Enter' && handleCreateProject()}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Description (optional)</label>
                <textarea
                  value={newProjectDescription}
                  onChange={e => setNewProjectDescription(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none"
                />
              </div>
            </div>
            <div className="flex gap-3 justify-end">
              <button onClick={() => { setShowNewProjectModal(false); setNewProjectName(''); setNewProjectDescription(''); }} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">Cancel</button>
              <button onClick={handleCreateProject} disabled={!newProjectName.trim()} className="px-4 py-2 text-sm bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors disabled:opacity-50">Create</button>
            </div>
          </div>
        </div>
      )}

      {showRenameModal && editingProject && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-xl">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Edit Project</h3>
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Project Name</label>
                <input
                  type="text"
                  value={editingProject.name}
                  onChange={e => setEditingProject({ ...editingProject, name: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
                <textarea
                  value={editingProject.description}
                  onChange={e => setEditingProject({ ...editingProject, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none"
                />
              </div>
            </div>
            <div className="flex gap-3 justify-end">
              <button onClick={() => { setShowRenameModal(false); setEditingProject(null); }} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">Cancel</button>
              <button onClick={handleRenameProject} disabled={!editingProject.name.trim()} className="px-4 py-2 text-sm bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors disabled:opacity-50">Save</button>
            </div>
          </div>
        </div>
      )}

      {showSaveToProjectModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-xl">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Save to Project</h3>
            <div className="space-y-1 mb-6 max-h-64 overflow-y-auto">
              {projects.map(project => (
                <button
                  key={project.id}
                  onClick={() => handleSaveToProject(project.id)}
                  className="w-full text-left px-4 py-3 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <div className="text-sm font-medium text-gray-900">{project.name}</div>
                  {project.description && <div className="text-xs text-gray-500 mt-0.5">{project.description}</div>}
                </button>
              ))}
            </div>
            <button onClick={() => setShowSaveToProjectModal(false)} className="w-full px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">Cancel</button>
          </div>
        </div>
      )}

      <LanguageSelectionModal
        isOpen={showLanguageModal}
        onClose={() => { setShowLanguageModal(false); setPendingExport(null); }}
        onSelectLanguage={handleLanguageSelection}
        title={
          pendingExport?.type === 'pdf' ? 'Pflanzenliste Export'
          : pendingExport?.type === 'moodboard' ? 'Plant Board Export'
          : pendingExport?.type === 'calendar' ? 'Blooming Calendar Export'
          : 'Plant Selection Export'
        }
      />

      {shareModalProjectId && shareModalProject && (
        <ProjectShareModal
          projectId={shareModalProjectId}
          projectName={shareModalProject.name}
          onClose={() => setShareModalProjectId(null)}
        />
      )}
    </div>
  );
};
