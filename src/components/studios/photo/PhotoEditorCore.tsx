import React, { useState, useEffect, useRef } from 'react';
import { useProjects } from '../../../context/ProjectContext';
import {
  PhotoProjectState,
  PhotoAdjustments,
  PhotoTransform,
  PhotoLayer,
  PhotoToolType,
  PhotoShapeType,
  DEFAULT_PHOTO_ADJUSTMENTS,
  DEFAULT_PHOTO_TRANSFORM,
  DrawPath,
  ShapeElement,
  TextElement,
  SelectionRegion,
} from '../../../types/photoEditor';
import { PhotoCanvasStage } from './PhotoCanvasStage';
import { PhotoToolbar } from './PhotoToolbar';
import { PhotoAdjustmentsPanel } from './PhotoAdjustmentsPanel';
import { PhotoTransformPanel } from './PhotoTransformPanel';
import { PhotoLayersPanel } from './PhotoLayersPanel';
import { PhotoDrawingToolsPanel } from './PhotoDrawingToolsPanel';
import { PhotoAiPrepPanel } from './PhotoAiPrepPanel';
import { PhotoExportModal } from './PhotoExportModal';
import { QualityCheckerModal } from '../quality/QualityCheckerModal';
import { Sliders, Crop, Layers, PenTool, Sparkles } from 'lucide-react';

interface PhotoEditorCoreProps {
  onBack: () => void;
  onOpenVersions: () => void;
  onOpenMedia: () => void;
  onOpenExport: () => void;
  onOpenModelRouter: () => void;
}

// Sample high-definition initial stock master image for instant preview & testing
const DEMO_PHOTO_MASTER =
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1600&q=80';

export const PhotoEditorCore: React.FC<PhotoEditorCoreProps> = ({
  onBack,
  onOpenVersions,
  onOpenMedia,
}) => {
  const {
    activeProject,
    recordEditAction,
    undoEdit,
    redoEdit,
    canUndo,
    canRedo,
    triggerManualAutosave,
    updateProjectStateData,
  } = useProjects();

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize photo editor state from activeProject or default
  const [layers, setLayers] = useState<PhotoLayer[]>(() => {
    if (activeProject?.stateData?.photoState?.layers) {
      return activeProject.stateData.photoState.layers;
    }
    return [
      {
        id: 'layer-master',
        name: 'Master Photo',
        type: 'image',
        visible: true,
        opacity: 100,
        blendMode: 'normal',
        isMasked: false,
        maskInverted: false,
        imageUrl: DEMO_PHOTO_MASTER,
        originalImageUrl: DEMO_PHOTO_MASTER,
      },
    ];
  });

  const [activeLayerId, setActiveLayerId] = useState<string>(() => {
    return activeProject?.stateData?.photoState?.activeLayerId || 'layer-master';
  });

  const [adjustments, setAdjustments] = useState<PhotoAdjustments>(() => {
    return activeProject?.stateData?.photoState?.globalAdjustments || DEFAULT_PHOTO_ADJUSTMENTS;
  });

  const [transform, setTransform] = useState<PhotoTransform>(() => {
    return activeProject?.stateData?.photoState?.transform || DEFAULT_PHOTO_TRANSFORM;
  });

  const [activeTool, setActiveTool] = useState<PhotoToolType>('adjust');
  const [zoom, setZoom] = useState<number>(100);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isQualityCheckerOpen, setIsQualityCheckerOpen] = useState(false);
  const [isMobilePanelOpen, setIsMobilePanelOpen] = useState(true);

  const [brushConfig, setBrushConfig] = useState({
    color: '#ffffff',
    size: 8,
    opacity: 0.9,
  });

  const [shapeConfig, setShapeConfig] = useState<{
    type: PhotoShapeType;
    fillColor: string;
    strokeColor: string;
    strokeWidth: number;
  }>({
    type: 'rectangle',
    fillColor: 'rgba(59, 130, 246, 0.4)',
    strokeColor: '#3b82f6',
    strokeWidth: 2,
  });

  const [textConfig, setTextConfig] = useState({
    fontSize: 36,
    fontFamily: 'Inter, sans-serif',
    color: '#ffffff',
    fontWeight: 'bold',
  });

  const [selection, setSelection] = useState<SelectionRegion>({
    type: 'none',
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    active: false,
  });

  const [isFocusMode, setIsFocusMode] = useState(false);

  // Global hotkey listener for Focus Mode (F or Esc)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = (e.target as HTMLElement)?.tagName;
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(activeTag)) return;

      if ((e.key === 'f' || e.key === 'F') && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        setIsFocusMode(prev => !prev);
      } else if (e.key === 'Escape' && isFocusMode) {
        setIsFocusMode(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFocusMode]);

  // Autosave to active project
  useEffect(() => {
    const photoState: PhotoProjectState = {
      layers,
      activeLayerId,
      globalAdjustments: adjustments,
      transform,
      zoom,
      selection,
      activeTool,
      brushConfig,
      shapeConfig,
      textConfig,
    };
    updateProjectStateData('photoState', photoState);
    triggerManualAutosave();
  }, [layers, activeLayerId, adjustments, transform]);

  // Image import handler
  const handleImportFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = e => {
      const url = e.target?.result as string;
      const newLayer: PhotoLayer = {
        id: `layer-img-${Date.now()}`,
        name: file.name.replace(/\.[^/.]+$/, ''),
        type: 'image',
        visible: true,
        opacity: 100,
        blendMode: 'normal',
        isMasked: false,
        maskInverted: false,
        imageUrl: url,
        originalImageUrl: url, // Preserves original untouched
      };
      setLayers(prev => [newLayer, ...prev]);
      setActiveLayerId(newLayer.id);
      recordEditAction('IMPORT_PHOTO', `Imported photo layer: ${file.name}`);
    };
    reader.readAsDataURL(file);
  };

  const handleOpenFileDialog = () => {
    fileInputRef.current?.click();
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImportFile(file);
    }
  };

  // Layer manipulations
  const handleAddLayer = (type: PhotoLayer['type']) => {
    const newLayer: PhotoLayer = {
      id: `layer-${Date.now()}`,
      name: `Paint Layer ${layers.length + 1}`,
      type,
      visible: true,
      opacity: 100,
      blendMode: 'normal',
      isMasked: false,
      maskInverted: false,
      drawPaths: [],
      shapes: [],
      texts: [],
    };
    setLayers(prev => [newLayer, ...prev]);
    setActiveLayerId(newLayer.id);
    recordEditAction('ADD_LAYER', `Added ${type} layer`);
  };

  const handleDeleteLayer = (id: string) => {
    if (layers.length <= 1) return;
    setLayers(prev => prev.filter(l => l.id !== id));
    if (activeLayerId === id) {
      const remaining = layers.filter(l => l.id !== id);
      setActiveLayerId(remaining[0]?.id || '');
    }
    recordEditAction('DELETE_LAYER', `Deleted layer`);
  };

  const handleDuplicateLayer = (id: string) => {
    const target = layers.find(l => l.id === id);
    if (!target) return;
    const duplicated: PhotoLayer = {
      ...target,
      id: `layer-${Date.now()}`,
      name: `${target.name} Copy`,
    };
    setLayers(prev => [duplicated, ...prev]);
    setActiveLayerId(duplicated.id);
    recordEditAction('DUPLICATE_LAYER', `Duplicated layer`);
  };

  const handleReorderLayer = (id: string, direction: 'up' | 'down') => {
    const index = layers.findIndex(l => l.id === id);
    if (index < 0) return;
    const newLayers = [...layers];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newLayers.length) return;

    const [removed] = newLayers.splice(index, 1);
    newLayers.splice(targetIndex, 0, removed);
    setLayers(newLayers);
    recordEditAction('REORDER_LAYERS', `Reordered layers`);
  };

  const handleUpdateLayer = (id: string, updates: Partial<PhotoLayer>) => {
    setLayers(prev => prev.map(l => (l.id === id ? { ...l, ...updates } : l)));
  };

  // Revert to original pristine master image
  const handleRevertToOriginal = () => {
    const master = layers.find(l => l.originalImageUrl);
    if (master && master.originalImageUrl) {
      setAdjustments(DEFAULT_PHOTO_ADJUSTMENTS);
      setTransform(DEFAULT_PHOTO_TRANSFORM);
      setLayers(prev =>
        prev.map(l =>
          l.id === master.id
            ? { ...l, imageUrl: master.originalImageUrl, drawPaths: [], shapes: [], texts: [] }
            : l
        )
      );
      recordEditAction('REVERT_PHOTO', `Reverted photo to pristine original asset`);
    }
  };

  // Drawing and shapes
  const handleUpdateLayerPaths = (layerId: string, paths: DrawPath[]) => {
    handleUpdateLayer(layerId, { drawPaths: paths });
  };

  const handleAddShape = (shape: ShapeElement) => {
    const target = layers.find(l => l.id === activeLayerId) || layers[0];
    const existing = target.shapes || [];
    handleUpdateLayer(target.id, { shapes: [...existing, shape] });
    recordEditAction('ADD_SHAPE', `Added ${shape.type} shape`);
  };

  const handleAddText = (text: TextElement) => {
    const target = layers.find(l => l.id === activeLayerId) || layers[0];
    const existing = target.texts || [];
    handleUpdateLayer(target.id, { texts: [...existing, text] });
    recordEditAction('ADD_TEXT', `Added text element: "${text.text}"`);
  };

  return (
    <div id="photo-studio-core-root" className="h-[100dvh] md:h-[calc(100vh-3.5rem)] flex flex-col bg-neutral-100 dark:bg-[#0c0e12] text-neutral-900 dark:text-neutral-100 overflow-hidden select-none">
      {/* Hidden file input for native image import */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileInputChange}
      />

      {/* Main Top Toolbar */}
      <PhotoToolbar
        projectTitle={activeProject?.title || 'Photo Project'}
        canvasSize={{ width: transform.canvasWidth, height: transform.canvasHeight }}
        activeTool={activeTool}
        onSelectTool={tool => setActiveTool(tool)}
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={undoEdit}
        onRedo={redoEdit}
        zoom={zoom}
        onZoomChange={setZoom}
        onBack={onBack}
        onOpenVersions={onOpenVersions}
        onOpenMedia={onOpenMedia}
        onOpenExport={() => setIsExportOpen(true)}
        onImportImage={handleOpenFileDialog}
        onOpenQualityChecker={() => setIsQualityCheckerOpen(true)}
        isFocusMode={isFocusMode}
        onToggleFocusMode={() => setIsFocusMode(f => !f)}
      />

      {/* Main Workspace Area: Canvas Stage + Context-Sensitive Tool Dock */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative min-h-0">
        {/* Floating Focus Mode Banner */}
        {isFocusMode && (
          <div className="absolute top-3 right-3 z-30 flex items-center gap-2 bg-neutral-900/85 dark:bg-black/85 backdrop-blur-md text-white text-xs px-3 py-1.5 rounded-full shadow-lg border border-white/10 animate-in fade-in">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-medium">Focus Workspace</span>
            <button
              onClick={() => setIsFocusMode(false)}
              className="ml-1.5 px-2 py-0.5 rounded bg-white/20 hover:bg-white/30 text-[10px] font-medium transition-colors"
              title="Exit Focus Mode (Esc / F)"
            >
              Exit (Esc)
            </button>
          </div>
        )}

        {/* Canvas Center Stage */}
        <div className="flex-1 min-h-0 relative flex items-center justify-center overflow-hidden">
          <PhotoCanvasStage
            layers={layers}
            activeLayerId={activeLayerId}
            adjustments={adjustments}
            transform={transform}
            zoom={zoom}
            activeTool={activeTool}
            selection={selection}
            brushConfig={brushConfig}
            shapeConfig={shapeConfig}
            onUpdateLayerPaths={handleUpdateLayerPaths}
            onUpdateCrop={crop => setTransform(prev => ({ ...prev, crop }))}
          />
        </div>

        {/* Context-Sensitive Sidebar: On mobile, docked bottom panel (max-h-[46vh]); On desktop, right dock (w-80 h-full) */}
        {!isFocusMode && (
          <div className={`w-full md:w-80 max-h-[46vh] md:max-h-full md:h-full border-t md:border-t-0 md:border-l border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#111318] flex flex-col overflow-y-auto shrink-0 z-20 ${isMobilePanelOpen ? 'flex' : 'hidden md:flex'}`}>
            {activeTool === 'adjust' && (
              <PhotoAdjustmentsPanel
                adjustments={adjustments}
                onChangeAdjustments={newAdj => {
                  setAdjustments(newAdj);
                  recordEditAction('PHOTO_ADJUST', 'Adjusted light & color settings');
                }}
                onResetAll={() => {
                  setAdjustments(DEFAULT_PHOTO_ADJUSTMENTS);
                  recordEditAction('PHOTO_RESET_ADJUST', 'Reset adjustments to neutral');
                }}
              />
            )}

            {(activeTool === 'crop' || activeTool === 'transform') && (
              <PhotoTransformPanel
                transform={transform}
                onChangeTransform={newT => {
                  setTransform(newT);
                  recordEditAction('PHOTO_TRANSFORM', 'Applied crop/orientation transform');
                }}
                onResetTransform={() => {
                  setTransform(DEFAULT_PHOTO_TRANSFORM);
                  recordEditAction('PHOTO_RESET_TRANSFORM', 'Reset transform to default');
                }}
              />
            )}

            {activeTool === 'select' && (
              <PhotoLayersPanel
                layers={layers}
                activeLayerId={activeLayerId}
                onSelectLayer={setActiveLayerId}
                onAddLayer={handleAddLayer}
                onDeleteLayer={handleDeleteLayer}
                onDuplicateLayer={handleDuplicateLayer}
                onReorderLayer={handleReorderLayer}
                onUpdateLayer={handleUpdateLayer}
                onRevertToOriginalImage={handleRevertToOriginal}
              />
            )}

            {(activeTool === 'brush' ||
              activeTool === 'eraser' ||
              activeTool === 'shape' ||
              activeTool === 'text' ||
              activeTool === 'marquee' ||
              activeTool === 'lasso') && (
              <PhotoDrawingToolsPanel
                activeTool={activeTool}
                onSelectTool={setActiveTool}
                brushConfig={brushConfig}
                onChangeBrushConfig={setBrushConfig}
                shapeConfig={shapeConfig}
                onChangeShapeConfig={setShapeConfig}
                textConfig={textConfig}
                onChangeTextConfig={setTextConfig}
                selection={selection}
                onChangeSelection={setSelection}
                onAddShapeToLayer={handleAddShape}
                onAddTextToLayer={handleAddText}
              />
            )}

            {activeTool === 'ai_prep' && <PhotoAiPrepPanel />}
          </div>
        )}
      </div>

      {/* Mobile Tool Navigation Tray (CapCut / VN style) */}
      <div className="md:hidden border-t border-neutral-200 dark:border-neutral-800 bg-white/95 dark:bg-[#111318]/95 backdrop-blur-md px-2 py-1.5 flex items-center justify-around shrink-0 z-30 pb-[max(0.375rem,env(safe-area-inset-bottom))]">
        {[
          { id: 'adjust' as PhotoToolType, label: 'Adjust', icon: Sliders },
          { id: 'crop' as PhotoToolType, label: 'Crop', icon: Crop },
          { id: 'select' as PhotoToolType, label: 'Layers', icon: Layers },
          { id: 'brush' as PhotoToolType, label: 'Draw', icon: PenTool },
          { id: 'ai_prep' as PhotoToolType, label: 'AI Magic', icon: Sparkles },
        ].map(item => {
          const Icon = item.icon;
          const isActive = 
            item.id === activeTool ||
            (item.id === 'select' && activeTool === 'select') ||
            (item.id === 'brush' && (activeTool === 'brush' || activeTool === 'eraser' || activeTool === 'shape' || activeTool === 'text')) ||
            (item.id === 'crop' && (activeTool === 'crop' || activeTool === 'transform'));

          return (
            <button
              key={item.id}
              onClick={() => {
                if (isActive) {
                  setIsMobilePanelOpen(o => !o);
                } else {
                  setActiveTool(item.id);
                  setIsMobilePanelOpen(true);
                }
              }}
              className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all min-w-[56px] ${
                isActive && isMobilePanelOpen
                  ? 'text-neutral-950 dark:text-white font-bold bg-neutral-100 dark:bg-neutral-800/80 scale-105'
                  : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200'
              }`}
            >
              <Icon className="w-4 h-4 mb-0.5" />
              <span className="text-[10px] tracking-tight">{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Export Modal */}
      <PhotoExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        layers={layers}
        adjustments={adjustments}
        transform={transform}
        projectTitle={activeProject?.title || 'Creative Photo'}
      />

      {/* AI Quality Checker Modal */}
      <QualityCheckerModal
        isOpen={isQualityCheckerOpen}
        onClose={() => setIsQualityCheckerOpen(false)}
      />
    </div>
  );
};
