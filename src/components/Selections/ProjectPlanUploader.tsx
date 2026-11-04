import React, { useState, useRef, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react';
import {
  Upload, FileText, X, Loader2, Trash2,
  MapPin, Eye, EyeOff, Download, AlertCircle, Maximize2,
} from 'lucide-react';
import html2canvas from 'html2canvas';
import { supabase } from '../../lib/supabase';
import { ProjectPlan, ProjectPlanZone } from '../../lib/supabase';
import * as pdfjsLib from 'pdfjs-dist';
import type { PDFDocumentLoadingTask, PDFPageProxy } from 'pdfjs-dist/types/src/display/api';

// Use the bundled worker via Vite's ?url import for correct resolution in dev + build
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

interface ProjectPlanUploaderProps {
  projectId: string | null;
  zones: { id: string; name: string }[];
  readOnly?: boolean;
}

const ZONE_COLORS = [
  '#2563eb', '#16a34a', '#d97706', '#dc2626',
  '#0891b2', '#7c3aed', '#be185d', '#065f46',
  '#92400e', '#1e3a5f',
];

const getZoneColor = (index: number) => ZONE_COLORS[index % ZONE_COLORS.length];

interface DragRect {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}

// ── Reusable PDF canvas with overlay interaction ─────────────────────────────
interface PdfPlanCanvasProps {
  pdfUrl: string;
  zones: { id: string; name: string }[];
  planZones: ProjectPlanZone[];
  selectedZoneId: string;
  showOverlays: boolean;
  readOnly: boolean;
  zoneColorMap: Map<string, string>;
  activePlanId: string;
  onAddZone: (planId: string, zoneId: string, x: number, y: number, w: number, h: number, polygonPoints?: Array<{ x: number; y: number }>) => Promise<void>;
  onUpdateZone: (id: string, updates: Partial<ProjectPlanZone>) => void;
  onPersistZone: (id: string) => Promise<void>;
  onDeleteZone: (id: string) => Promise<void>;
  className?: string;
  style?: React.CSSProperties;
  innerRef?: React.RefObject<HTMLDivElement>;
}

const PdfPlanCanvas: React.FC<PdfPlanCanvasProps> = ({
  pdfUrl, zones, planZones, selectedZoneId, showOverlays, readOnly,
  zoneColorMap, activePlanId, onAddZone, onUpdateZone, onPersistZone,
  onDeleteZone, className, style, innerRef: innerRefProp,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const localInnerRef = useRef<HTMLDivElement>(null);
  const innerRef = innerRefProp || localInnerRef;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pdfLoadingTaskRef = useRef<PDFDocumentLoadingTask | null>(null);
  const pageRef = useRef<PDFPageProxy | null>(null);
  const renderTaskRef = useRef<{ cancel: () => void } | null>(null);
  const renderTokenRef = useRef(0);
  const [pdfRendering, setPdfRendering] = useState(false);
  const [renderError, setRenderError] = useState('');
  const [renderAttempt, setRenderAttempt] = useState(0);
  const [dragRect, setDragRect] = useState<DragRect | null>(null);
  const [drawingPoints, setDrawingPoints] = useState<Array<{ x: number; y: number }>>([]);
  const [draggingZoneId, setDraggingZoneId] = useState<string | null>(null);
  const [dragMode, setDragMode] = useState<'create' | 'move' | 'resize'>('create');
  const [resizeCorner, setResizeCorner] = useState('');
  const [polygonVertexIndex, setPolygonVertexIndex] = useState<number | null>(null);

  // ── Render PDF page to canvas ──────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    const renderPage = () => {
      if (cancelled || !pageRef.current || !canvasRef.current || !containerRef.current) return;

      // Cancel any in-flight render before starting a new one
      if (renderTaskRef.current) {
        try { renderTaskRef.current.cancel(); } catch { /* ignore */ }
        renderTaskRef.current = null;
      }

      const container = containerRef.current;
      const containerWidth = container.clientWidth || 1;
      const baseViewport = pageRef.current.getViewport({ scale: 1 });
      const scale = Math.max(0.1, containerWidth / baseViewport.width);
      const viewport = pageRef.current.getViewport({ scale });

      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!canvas || !ctx) return;

      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.floor(viewport.width * dpr);
      canvas.height = Math.floor(viewport.height * dpr);
      canvas.style.width = `${viewport.width}px`;
      canvas.style.height = `${viewport.height}px`;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const token = ++renderTokenRef.current;
      const task = pageRef.current.render({ canvas, canvasContext: ctx, viewport });
      renderTaskRef.current = task;

      task.promise.then(() => {
        if (token === renderTokenRef.current) renderTaskRef.current = null;
      }).catch((e: any) => {
        if (token === renderTokenRef.current) renderTaskRef.current = null;
        if (cancelled) return;
        if (e?.name !== 'RenderingCancelledException') {
          console.error('PDF render error:', e);
          setRenderError('Could not display the PDF.');
        }
      });
    };

    const renderPdf = async () => {
      if (!pdfUrl || !canvasRef.current || !containerRef.current) return;

      setPdfRendering(true);
      setRenderError('');

      try {
        if (pdfLoadingTaskRef.current) {
          pdfLoadingTaskRef.current.destroy();
          pdfLoadingTaskRef.current = null;
        }

        const loadingTask = pdfjsLib.getDocument({
          url: pdfUrl,
          disableRange: true,
          disableStream: true,
          disableAutoFetch: true,
        });
        pdfLoadingTaskRef.current = loadingTask;
        const pdfDoc = await loadingTask.promise;
        if (cancelled) {
          loadingTask.destroy();
          return;
        }

        const page: PDFPageProxy = await pdfDoc.getPage(1);
        if (cancelled) return;

        pageRef.current = page;
        renderPage();

        // Debounced resize re-render
        let resizeTimer: ReturnType<typeof setTimeout> | null = null;
        const ro = new ResizeObserver(() => {
          if (resizeTimer) clearTimeout(resizeTimer);
          resizeTimer = setTimeout(renderPage, 150);
        });
        if (containerRef.current) ro.observe(containerRef.current);

        if (!cancelled) setPdfRendering(false);

        return () => {
          ro.disconnect();
          if (resizeTimer) clearTimeout(resizeTimer);
        };
      } catch (e: any) {
        if (!cancelled) {
          console.error('PDF render error:', e);
          setRenderError('Could not display the PDF.');
        }
      } finally {
        if (!cancelled) setPdfRendering(false);
      }
    };

    renderPdf();

    return () => {
      cancelled = true;
      if (renderTaskRef.current) {
        try { renderTaskRef.current.cancel(); } catch { /* ignore */ }
        renderTaskRef.current = null;
      }
      if (pdfLoadingTaskRef.current) {
        pdfLoadingTaskRef.current.destroy();
        pdfLoadingTaskRef.current = null;
      }
    };
  }, [pdfUrl, renderAttempt]);

  // ── Mouse helpers ──────────────────────────────────────────────────────────
  const getRelativePos = (e: React.MouseEvent): { x: number; y: number } => {
    const inner = innerRef.current;
    if (!inner) return { x: 0, y: 0 };
    const rect = inner.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
    };
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (readOnly || !selectedZoneId) return;
    if (e.detail > 1) return;
    e.preventDefault();
  };

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (readOnly || !selectedZoneId || draggingZoneId) return;
    const pos = getRelativePos(e);
    setDrawingPoints(prev => [...prev, pos]);
  };

  const handleCanvasDoubleClick = async (e: React.MouseEvent) => {
    if (readOnly || !selectedZoneId) return;
    e.preventDefault();
    const pos = getRelativePos(e);
    const points = [...drawingPoints, pos];
    if (points.length < 3) return;
    const xs = points.map(point => point.x);
    const ys = points.map(point => point.y);
    await onAddZone(activePlanId, selectedZoneId, Math.min(...xs), Math.min(...ys), Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys), points);
    setDrawingPoints([]);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragRect) return;
    e.preventDefault();
    const pos = getRelativePos(e);

    if (dragMode === 'create') {
      setDragRect({ ...dragRect, endX: pos.x, endY: pos.y });
    } else if (dragMode === 'move' && draggingZoneId) {
      const dz = planZones.find(z => z.id === draggingZoneId);
      if (!dz) return;
      const dx = pos.x - dragRect.startX;
      const dy = pos.y - dragRect.startY;
      if (dz.polygon_points && dz.polygon_points.length >= 3) {
        const minX = Math.min(...dz.polygon_points.map(point => point.x));
        const maxX = Math.max(...dz.polygon_points.map(point => point.x));
        const minY = Math.min(...dz.polygon_points.map(point => point.y));
        const maxY = Math.max(...dz.polygon_points.map(point => point.y));
        const boundedDx = Math.max(-minX, Math.min(100 - maxX, dx));
        const boundedDy = Math.max(-minY, Math.min(100 - maxY, dy));
        const polygonPoints = dz.polygon_points.map(point => ({ x: point.x + boundedDx, y: point.y + boundedDy }));
        onUpdateZone(draggingZoneId, {
          polygon_points: polygonPoints,
          x_pct: Math.min(...polygonPoints.map(point => point.x)),
          y_pct: Math.min(...polygonPoints.map(point => point.y)),
          w_pct: Math.max(...polygonPoints.map(point => point.x)) - Math.min(...polygonPoints.map(point => point.x)),
          h_pct: Math.max(...polygonPoints.map(point => point.y)) - Math.min(...polygonPoints.map(point => point.y)),
        });
      } else {
        onUpdateZone(draggingZoneId, {
          x_pct: Math.max(0, Math.min(100 - dz.w_pct, dz.x_pct + dx)),
          y_pct: Math.max(0, Math.min(100 - dz.h_pct, dz.y_pct + dy)),
        });
      }
      setDragRect({ ...dragRect, startX: pos.x, startY: pos.y });
    } else if (dragMode === 'resizePolygon' && draggingZoneId && polygonVertexIndex !== null) {
      const dz = planZones.find(z => z.id === draggingZoneId);
      if (!dz?.polygon_points) return;
      const polygonPoints = dz.polygon_points.map((point, index) => index === polygonVertexIndex
        ? { x: Math.max(0, Math.min(100, pos.x)), y: Math.max(0, Math.min(100, pos.y)) }
        : point);
      onUpdateZone(draggingZoneId, {
        polygon_points: polygonPoints,
        x_pct: Math.min(...polygonPoints.map(point => point.x)),
        y_pct: Math.min(...polygonPoints.map(point => point.y)),
        w_pct: Math.max(...polygonPoints.map(point => point.x)) - Math.min(...polygonPoints.map(point => point.x)),
        h_pct: Math.max(...polygonPoints.map(point => point.y)) - Math.min(...polygonPoints.map(point => point.y)),
      });
    } else if (dragMode === 'resize' && draggingZoneId) {
      const dz = planZones.find(z => z.id === draggingZoneId);
      if (!dz) return;
      let newX = dz.x_pct, newY = dz.y_pct, newW = dz.w_pct, newH = dz.h_pct;
      if (resizeCorner.includes('e')) newW = Math.max(3, pos.x - dz.x_pct);
      if (resizeCorner.includes('s')) newH = Math.max(3, pos.y - dz.y_pct);
      if (resizeCorner.includes('w')) {
        newX = Math.min(dz.x_pct + dz.w_pct - 3, pos.x);
        newW = dz.x_pct + dz.w_pct - newX;
      }
      if (resizeCorner.includes('n')) {
        newY = Math.min(dz.y_pct + dz.h_pct - 3, pos.y);
        newH = dz.y_pct + dz.h_pct - newY;
      }
      onUpdateZone(draggingZoneId, {
        x_pct: newX, y_pct: newY, w_pct: newW, h_pct: newH,
      });
    }
  };

  const handleMouseUp = async () => {
    if (dragMode === 'create' && dragRect && selectedZoneId) {
      const x = Math.min(dragRect.startX, dragRect.endX);
      const y = Math.min(dragRect.startY, dragRect.endY);
      const w = Math.abs(dragRect.endX - dragRect.startX);
      const h = Math.abs(dragRect.endY - dragRect.startY);

      if (w > 2 && h > 2) {
        await onAddZone(activePlanId, selectedZoneId, x, y, w, h);
      }
    }

    if (draggingZoneId && (dragMode === 'move' || dragMode === 'resize' || dragMode === 'resizePolygon')) {
      await onPersistZone(draggingZoneId);
    }

    setDragRect(null);
    setDraggingZoneId(null);
    setDragMode('create');
    setResizeCorner('');
    setPolygonVertexIndex(null);
  };

  const handleZoneDragStart = (e: React.MouseEvent, zoneId: string) => {
    if (readOnly) return;
    e.stopPropagation();
    e.preventDefault();
    const pos = getRelativePos(e);
    setDragMode('move');
    setDraggingZoneId(zoneId);
    setDragRect({ startX: pos.x, startY: pos.y, endX: pos.x, endY: pos.y });
  };

  const handlePolygonMoveStart = (e: React.MouseEvent, zoneId: string) => {
    if (readOnly) return;
    e.stopPropagation();
    e.preventDefault();
    const pos = getRelativePos(e);
    setDragMode('move');
    setDraggingZoneId(zoneId);
    setDragRect({ startX: pos.x, startY: pos.y, endX: pos.x, endY: pos.y });
  };

  const handlePolygonVertexStart = (e: React.MouseEvent, zoneId: string, index: number) => {
    if (readOnly) return;
    e.stopPropagation();
    e.preventDefault();
    const pos = getRelativePos(e);
    setDragMode('resizePolygon');
    setDraggingZoneId(zoneId);
    setPolygonVertexIndex(index);
    setDragRect({ startX: pos.x, startY: pos.y, endX: pos.x, endY: pos.y });
  };

  const handleZoneResizeStart = (e: React.MouseEvent, zoneId: string, corner: string) => {
    if (readOnly) return;
    e.stopPropagation();
    e.preventDefault();
    const pos = getRelativePos(e);
    setDragMode('resize');
    setDraggingZoneId(zoneId);
    setResizeCorner(corner);
    setDragRect({ startX: pos.x, startY: pos.y, endX: pos.x, endY: pos.y });
  };

  const renderRect = dragRect && dragMode === 'create' ? {
    x: Math.min(dragRect.startX, dragRect.endX),
    y: Math.min(dragRect.startY, dragRect.endY),
    w: Math.abs(dragRect.endX - dragRect.startX),
    h: Math.abs(dragRect.endY - dragRect.startY),
  } : null;

  return (
    <div
      ref={containerRef}
      className={`bg-gray-100 border border-gray-200 select-none ${className || ''}`}
      style={style}
    >
      <div
        ref={innerRef}
        className="relative"
        onMouseDown={handleMouseDown}
        onClick={handleCanvasClick}
        onDoubleClick={handleCanvasDoubleClick}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <canvas ref={canvasRef} className="block" />

        {drawingPoints.length > 0 && (
          <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
            <polyline
              points={drawingPoints.map(point => `${point.x},${point.y}`).join(' ')}
              fill={`${selectedZoneId ? (zoneColorMap.get(selectedZoneId) || '#2563eb') : '#2563eb'}30`}
              stroke={selectedZoneId ? (zoneColorMap.get(selectedZoneId) || '#2563eb') : '#2563eb'}
              strokeWidth="0.25"
              strokeDasharray="0.8 0.5"
            />
            {drawingPoints.map((point, index) => (
              <circle key={index} cx={point.x} cy={point.y} r="0.65" fill="white" stroke={selectedZoneId ? (zoneColorMap.get(selectedZoneId) || '#2563eb') : '#2563eb'} strokeWidth="0.25" />
            ))}
          </svg>
        )}

        {pdfRendering && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-50/80">
            <Loader2 className="w-8 h-8 text-cyan-600 animate-spin" />
          </div>
        )}

        {renderError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-gray-50/95 p-4">
            <p className="text-sm text-gray-500">{renderError}</p>
            <button
              type="button"
              onClick={() => setRenderAttempt(value => value + 1)}
              className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
            >
              Try again
            </button>
          </div>
        )}



        {showOverlays && planZones.map(z => {
          const zone = zones.find(zz => zz.id === z.zone_id);
          const color = zone ? (zoneColorMap.get(z.zone_id!) || '#2563eb') : '#6b7280';
          const isSelected = selectedZoneId === z.zone_id;
          return (
            <div
              key={z.id}
              className={`absolute rounded-md transition-shadow ${
                !readOnly && !z.polygon_points?.length ? 'cursor-move' : ''
              } ${isSelected && !z.polygon_points?.length ? 'ring-2 ring-offset-1' : ''}`}
              style={{
                left: `${z.x_pct}%`,
                top: `${z.y_pct}%`,
                width: `${z.w_pct}%`,
                height: `${z.h_pct}%`,
                backgroundColor: z.polygon_points?.length ? 'transparent' : color + '30',
                borderColor: z.polygon_points?.length ? 'transparent' : color,
                borderWidth: z.polygon_points?.length ? 0 : '2px',
                borderStyle: 'solid',
                ['--tw-ring-color' as string]: color,
                pointerEvents: z.polygon_points?.length ? 'none' : 'auto',
              }}
              onMouseDown={(e) => handleZoneDragStart(e, z.id)}
            >
              {!z.polygon_points?.length && <div
                className="absolute top-0 left-0 px-1.5 py-0.5 text-xs font-medium rounded-br-md whitespace-nowrap"
                style={{
                  backgroundColor: color,
                  color: 'white',
                  maxWidth: '100%',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {zone?.name || 'Unassigned'}
              </div>}

              {!readOnly && !z.polygon_points?.length && (
                <button
                  onClick={(e) => { e.stopPropagation(); onDeleteZone(z.id); }}
                  className="absolute -top-2 -right-2 w-5 h-5 bg-white rounded-full shadow-md flex items-center justify-center text-red-500 hover:bg-red-50 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              )}

              {!readOnly && !z.polygon_points?.length && (
                <>
                  {['nw', 'ne', 'sw', 'se'].map(corner => (
                    <div
                      key={corner}
                      onMouseDown={(e) => handleZoneResizeStart(e, z.id, corner)}
                      className="absolute w-3 h-3 bg-white border-2 rounded-full"
                      style={{
                        borderColor: color,
                        cursor: `${corner}-resize`,
                        ...(corner.includes('n') ? { top: '-6px' } : { bottom: '-6px' }),
                        ...(corner.includes('w') ? { left: '-6px' } : { right: '-6px' }),
                      }}
                    />
                  ))}
                </>
              )}
            </div>
          );
        })}

        {showOverlays && planZones.some(z => z.polygon_points && z.polygon_points.length >= 3) && (
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            {planZones.filter(z => z.polygon_points && z.polygon_points.length >= 3).map(z => {
              const zone = zones.find(zz => zz.id === z.zone_id);
              const color = zone ? (zoneColorMap.get(z.zone_id!) || '#2563eb') : '#6b7280';
              const points = z.polygon_points!;
              const center = points.reduce((sum, point) => ({ x: sum.x + point.x / points.length, y: sum.y + point.y / points.length }), { x: 0, y: 0 });
              return (
                <g key={z.id}>
                  <polygon
                    points={points.map(point => `${point.x},${point.y}`).join(' ')}
                    fill={`${color}30`}
                    stroke={color}
                    strokeWidth="0.25"
                    className={!readOnly ? 'cursor-move' : ''}
                    onMouseDown={(e) => handlePolygonMoveStart(e, z.id)}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <text
                    x={center.x}
                    y={center.y}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill={color}
                    fontSize="1.8"
                    fontWeight="600"
                    stroke="white"
                    strokeWidth="0.45"
                    paintOrder="stroke"
                    pointerEvents={!readOnly ? 'auto' : 'none'}
                    className={!readOnly ? 'cursor-move select-none' : ''}
                    onMouseDown={(e) => handlePolygonMoveStart(e, z.id)}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {zone?.name || 'Unassigned'}
                  </text>
                  {!readOnly && points.map((point, index) => (
                    <circle
                      key={`${z.id}-${index}`}
                      cx={point.x}
                      cy={point.y}
                      r="0.8"
                      fill="white"
                      stroke={color}
                      strokeWidth="0.25"
                      className="cursor-crosshair"
                      onMouseDown={(e) => handlePolygonVertexStart(e, z.id, index)}
                    />
                  ))}
                </g>
              );
            })}
          </svg>
        )}

        {renderRect && (
          <div
            className="absolute rounded-md pointer-events-none"
            style={{
              left: `${renderRect.x}%`,
              top: `${renderRect.y}%`,
              width: `${renderRect.w}%`,
              height: `${renderRect.h}%`,
              backgroundColor: (selectedZoneId ? (zoneColorMap.get(selectedZoneId) || '#2563eb') : '#2563eb') + '30',
              border: `2px dashed ${selectedZoneId ? (zoneColorMap.get(selectedZoneId) || '#2563eb') : '#2563eb'}`,
            }}
          />
        )}
      </div>
    </div>
  );
};

// ── Main component ───────────────────────────────────────────────────────────
export interface ProjectPlanUploaderHandle {
  capturePlanImage: () => Promise<string | null>;
}

export const ProjectPlanUploader = forwardRef<ProjectPlanUploaderHandle, ProjectPlanUploaderProps>(({
  projectId,
  zones,
  readOnly = false,
}, ref) => {
  const [plans, setPlans] = useState<ProjectPlan[]>([]);
  const [activePlan, setActivePlan] = useState<ProjectPlan | null>(null);
  const [planZones, setPlanZones] = useState<ProjectPlanZone[]>([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [pdfUrl, setPdfUrl] = useState('');
  const [selectedZoneId, setSelectedZoneId] = useState<string>('');
  const [showOverlays, setShowOverlays] = useState(true);
  const [showFullscreen, setShowFullscreen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const planInnerRef = useRef<HTMLDivElement>(null);

  useImperativeHandle(ref, () => ({
    capturePlanImage: async () => {
      const el = planInnerRef.current;
      if (!el) return null;
      const canvas = await html2canvas(el, {
        backgroundColor: '#ffffff',
        scale: 2,
        useCORS: true,
      });
      return canvas.toDataURL('image/png');
    },
  }), []);

  const zoneColorMap = new Map<string, string>(
    zones.map((z, i) => [z.id, getZoneColor(i)])
  );

  // ── Load plans for this project ──────────────────────────────────────────
  const loadPlans = useCallback(async () => {
    if (!projectId) {
      setPlans([]);
      return;
    }
    setLoading(true);
    try {
      const { data, error: err } = await supabase
        .from('project_plans')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (err) throw err;
      setPlans(data || []);
      if (data && data.length > 0 && !activePlan) {
        setActivePlan(data[0]);
      }
    } catch (e: any) {
      setError(e.message || 'Failed to load plans');
    } finally {
      setLoading(false);
    }
  }, [projectId]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Load zone overlays for active plan ────────────────────────────────────
  const loadPlanZones = useCallback(async (planId: string) => {
    try {
      const { data, error: err } = await supabase
        .from('project_plan_zones')
        .select('*')
        .eq('plan_id', planId)
        .order('created_at', { ascending: true });

      if (err) throw err;
      setPlanZones(data || []);
    } catch (e: any) {
      console.error('Failed to load plan zones:', e);
    }
  }, []);

  useEffect(() => {
    loadPlans();
  }, [loadPlans]);

  useEffect(() => {
    let cancelled = false;
    if (activePlan) {
      const { data: publicUrlData } = supabase.storage
        .from('project-plans')
        .getPublicUrl(activePlan.storage_path);
      if (!cancelled && publicUrlData.publicUrl) {
        setPdfUrl(publicUrlData.publicUrl);
        loadPlanZones(activePlan.id);
      }
    } else {
      setPdfUrl('');
      setPlanZones([]);
    }
    return () => { cancelled = true; };
  }, [activePlan, loadPlanZones]);

  // ── Upload ──────────────────────────────────────────────────────────────────
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !projectId) return;

    if (file.type !== 'application/pdf') {
      setError('Please select a PDF file');
      return;
    }

    setUploading(true);
    setError('');
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const sanitized = file.name.replace(/[^a-zA-Z0-9._-]/g, '_').replace(/_+/g, '_');
      const storagePath = `${projectId}/${Date.now()}_${sanitized}`;

      const { error: uploadErr } = await supabase.storage
        .from('project-plans')
        .upload(storagePath, file, { contentType: 'application/pdf' });

      if (uploadErr) throw uploadErr;

      const { data: planData, error: insertErr } = await supabase
        .from('project_plans')
        .insert({
          project_id: projectId,
          user_id: user.id,
          display_name: file.name.replace(/\.pdf$/i, ''),
          storage_path: storagePath,
          file_size: file.size,
        })
        .select()
        .single();

      if (insertErr) throw insertErr;

      await loadPlans();
      setActivePlan(planData);
    } catch (e: any) {
      setError(e.message || 'Upload failed');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDeletePlan = async (plan: ProjectPlan) => {
    if (!confirm(`Delete plan "${plan.display_name}"?`)) return;
    try {
      await supabase.storage.from('project-plans').remove([plan.storage_path]);
      await supabase.from('project_plans').delete().eq('id', plan.id);
      if (activePlan?.id === plan.id) setActivePlan(null);
      await loadPlans();
    } catch (e: any) {
      setError(e.message || 'Delete failed');
    }
  };

  // ── Zone overlay callbacks (shared by inline + fullscreen) ─────────────────
  const handleAddZone = async (planId: string, zoneId: string, x: number, y: number, w: number, h: number, polygonPoints?: Array<{ x: number; y: number }>) => {
    try {
      const { data, error: err } = await supabase
        .from('project_plan_zones')
        .insert({
          plan_id: planId,
          zone_id: zoneId,
          x_pct: x, y_pct: y, w_pct: w, h_pct: h,
          polygon_points: polygonPoints ?? null,
          page_number: 1,
        })
        .select()
        .single();

      if (err) throw err;
      setPlanZones(prev => [...prev, data]);
    } catch (e: any) {
      setError(e.message || 'Failed to add zone overlay');
    }
  };

  const updateZoneOverlay = (id: string, updates: Partial<ProjectPlanZone>) => {
    setPlanZones(prev => prev.map(z => z.id === id ? { ...z, ...updates } : z));
  };

  const persistZone = async (zoneId: string) => {
    const dz = planZones.find(z => z.id === zoneId);
    if (!dz) return;
    try {
      await supabase.from('project_plan_zones').update({
        x_pct: dz.x_pct, y_pct: dz.y_pct, w_pct: dz.w_pct, h_pct: dz.h_pct,
        polygon_points: dz.polygon_points ?? null,
      }).eq('id', zoneId);
    } catch (e: any) {
      console.error('Failed to persist zone:', e);
    }
  };

  const handleDeleteZone = async (zoneOverlayId: string) => {
    try {
      await supabase.from('project_plan_zones').delete().eq('id', zoneOverlayId);
      setPlanZones(prev => prev.filter(z => z.id !== zoneOverlayId));
    } catch (e: any) {
      setError(e.message || 'Failed to delete zone overlay');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  if (!projectId) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <div className="flex items-center gap-2 mb-2">
          <FileText className="w-5 h-5 text-gray-400" />
          <h3 className="text-base font-semibold text-gray-700">PDF Plan</h3>
        </div>
        <p className="text-sm text-gray-400">Save your selection to a project first to upload a PDF plan.</p>
      </div>
    );
  }

  // Shared props for PdfPlanCanvas
  const canvasProps = {
    pdfUrl,
    zones,
    planZones,
    selectedZoneId,
    showOverlays,
    readOnly,
    zoneColorMap,
    activePlanId: activePlan?.id || '',
    onAddZone: handleAddZone,
    onUpdateZone: updateZoneOverlay,
    onPersistZone: persistZone,
    onDeleteZone: handleDeleteZone,
    innerRef: planInnerRef,
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-cyan-600" />
          <h3 className="text-base font-semibold text-gray-800">PDF Plan</h3>
          {plans.length > 0 && (
            <span className="text-xs text-gray-400">({plans.length})</span>
          )}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {activePlan && !readOnly && zones.length > 0 && (
            <select
              value={selectedZoneId}
              onChange={e => setSelectedZoneId(e.target.value)}
              className="text-xs px-2 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-cyan-400 bg-white"
            >
              <option value="">Select zone to draw…</option>
              {zones.map((z) => (
                <option key={z.id} value={z.id}>
                  {z.name}
                </option>
              ))}
            </select>
          )}
          {activePlan && (
            <>
              <button
                onClick={() => setShowOverlays(v => !v)}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                title={showOverlays ? 'Hide overlays' : 'Show overlays'}
              >
                {showOverlays ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              </button>
              <button
                onClick={() => setShowFullscreen(true)}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                title="Open in popup"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
            </>
          )}
          {!readOnly && (
            <label className="cursor-pointer">
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={handleFileUpload}
                disabled={uploading}
              />
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-cyan-600 hover:bg-cyan-700 text-white text-xs rounded-lg transition-colors disabled:opacity-50">
                {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                Upload PDF
              </span>
            </label>
          )}
        </div>
      </div>

      {error && (
        <div className="mx-5 mt-3 bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
          <p className="text-xs text-red-700">{error}</p>
          <button onClick={() => setError('')} className="ml-auto text-red-400 hover:text-red-600">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Plan tabs */}
      {plans.length > 0 && (
        <div className="flex gap-1 px-5 pt-3 overflow-x-auto">
          {plans.map(plan => (
            <button
              key={plan.id}
              onClick={() => setActivePlan(plan)}
              className={`shrink-0 px-3 py-1.5 text-xs rounded-lg transition-colors flex items-center gap-1.5 ${
                activePlan?.id === plan.id
                  ? 'bg-cyan-50 text-cyan-700 border border-cyan-200'
                  : 'text-gray-500 hover:bg-gray-50 border border-transparent'
              }`}
            >
              <FileText className="w-3 h-3" />
              {plan.display_name}
            </button>
          ))}
        </div>
      )}

      {/* PDF viewer with overlay */}
      {activePlan && pdfUrl && (
        <div className="p-5">
          {selectedZoneId && !readOnly && (
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-800 bg-amber-50 border border-amber-200 px-3 py-2.5 rounded-lg">
              <MapPin className="w-4 h-4 text-red-600" />
              <span>
                Drawing mode: <strong className="text-cyan-700">
                  {zones.find(z => z.id === selectedZoneId)?.name}
                </strong>
                — <strong className="text-red-700 font-bold">click point by point on the PDF and double-click to finish the zone area.</strong>
              </span>
              <button
                onClick={() => setSelectedZoneId('')}
                className="ml-auto text-gray-400 hover:text-gray-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Inline canvas — scrollable so the full PDF is visible */}
          <PdfPlanCanvas
            {...canvasProps}
            className="rounded-lg overflow-auto"
            style={{ maxHeight: '60vh', minHeight: '300px' }}
          />

          {/* Legend */}
          {planZones.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-3">
              {planZones.map(z => {
                const zone = zones.find(zz => zz.id === z.zone_id);
                const color = zone ? (zoneColorMap.get(z.zone_id!) || '#2563eb') : '#6b7280';
                return (
                  <div key={z.id} className="flex items-center gap-1.5 text-xs text-gray-600">
                    <div className="w-3 h-3 rounded" style={{ backgroundColor: color + '40', border: `1.5px solid ${color}` }} />
                    {zone?.name || 'Unassigned'}
                    {!readOnly && (
                      <button
                        onClick={() => handleDeleteZone(z.id)}
                        className="text-gray-300 hover:text-red-500 ml-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Download / Delete */}
          <div className="mt-4 flex items-center gap-2">
            <a
              href={pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs rounded-lg transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              Open PDF
            </a>
            <button
              onClick={() => setShowFullscreen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs rounded-lg transition-colors"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              Open in popup
            </button>
            {!readOnly && (
              <button
                onClick={() => handleDeletePlan(activePlan)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 hover:bg-red-50 hover:border-red-200 text-gray-500 hover:text-red-600 text-xs rounded-lg transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete Plan
              </button>
            )}
            <span className="ml-auto text-xs text-gray-400">
              {formatFileSize(activePlan.file_size)}
            </span>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!activePlan && plans.length === 0 && !loading && (
        <div className="p-8 text-center">
          <FileText className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-500 mb-1">No PDF plan uploaded yet</p>
          <p className="text-xs text-gray-400">
            Upload a site plan or garden layout PDF to draw zone overlays on it.
          </p>
        </div>
      )}

      {loading && (
        <div className="p-8 flex items-center justify-center">
          <Loader2 className="w-6 h-6 text-cyan-600 animate-spin" />
        </div>
      )}

      {/* ── Fullscreen popup modal ─────────────────────────────────────────── */}
      {showFullscreen && activePlan && pdfUrl && (
        <div className="fixed inset-0 z-50 flex flex-col bg-gray-900/95">
          {/* Modal header */}
          <div className="flex items-center justify-between px-5 py-3 bg-white border-b border-gray-200 shrink-0">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-cyan-600" />
              <h3 className="text-sm font-semibold text-gray-800">{activePlan.display_name}</h3>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {!readOnly && zones.length > 0 && (
                <select
                  value={selectedZoneId}
                  onChange={e => setSelectedZoneId(e.target.value)}
                  className="text-xs px-2 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-cyan-400 bg-white"
                >
                  <option value="">Select zone to draw…</option>
                  {zones.map((z) => (
                    <option key={z.id} value={z.id}>
                      {z.name}
                    </option>
                  ))}
                </select>
              )}
              <button
                onClick={() => setShowOverlays(v => !v)}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                title={showOverlays ? 'Hide overlays' : 'Show overlays'}
              >
                {showOverlays ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              </button>
              <a
                href={pdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs rounded-lg transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                Open PDF
              </a>
              <button
                onClick={() => setShowFullscreen(false)}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                title="Close popup"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Drawing mode banner */}
          {selectedZoneId && !readOnly && (
            <div className="px-5 py-2.5 bg-amber-50 border-b border-amber-200 flex items-center gap-2 text-sm font-semibold text-slate-800 shrink-0">
              <MapPin className="w-4 h-4 text-red-600" />
              <span>
                Drawing mode: <strong className="text-cyan-700">
                  {zones.find(z => z.id === selectedZoneId)?.name}
                </strong>
                — <strong className="text-red-700 font-bold">click point by point on the PDF and double-click to finish the zone area.</strong>
              </span>
              <button
                onClick={() => setSelectedZoneId('')}
                className="ml-auto text-gray-400 hover:text-gray-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Modal canvas — fills available space */}
          <div className="flex-1 overflow-auto p-4 flex justify-center items-start">
            <PdfPlanCanvas
              {...canvasProps}
              className="rounded-lg shadow-2xl"
              style={{ width: '100%', maxWidth: '100%', height: '100%' }}
            />
          </div>

          {/* Legend */}
          {planZones.length > 0 && (
            <div className="px-5 py-3 bg-white border-t border-gray-200 flex flex-wrap gap-3 shrink-0">
              {planZones.map(z => {
                const zone = zones.find(zz => zz.id === z.zone_id);
                const color = zone ? (zoneColorMap.get(z.zone_id!) || '#2563eb') : '#6b7280';
                return (
                  <div key={z.id} className="flex items-center gap-1.5 text-xs text-gray-600">
                    <div className="w-3 h-3 rounded" style={{ backgroundColor: color + '40', border: `1.5px solid ${color}` }} />
                    {zone?.name || 'Unassigned'}
                    {!readOnly && (
                      <button
                        onClick={() => handleDeleteZone(z.id)}
                        className="text-gray-300 hover:text-red-500 ml-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
});
