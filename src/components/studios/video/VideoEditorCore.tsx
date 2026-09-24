import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Film,
  FolderPlus,
  History,
  Share2,
  ArrowLeft,
  Undo2,
  Redo2,
  HardDrive,
  PanelLeftClose,
  PanelLeftOpen,
  Sliders,
  Sparkles,
  Layers,
  Cpu,
  ShieldCheck,
  Wand2,
  Maximize2,
  Minimize2,
  Bot,
} from 'lucide-react';
import { useProjects } from '../../../context/ProjectContext';
import { useRenderQueue } from '../../../context/RenderQueueContext';
import { MediaAsset } from '../../../types';
import {
  TimelineClip,
  TimelineTrack,
  VideoEditorState,
  TimelineMarker,
  CanvasBackgroundSettings,
  CaptionStyle,
} from '../../../types/videoEditor';
import {
  INITIAL_TRACKS,
  INITIAL_CLIPS,
  DEFAULT_TRANSFORM,
  DEFAULT_SPEED,
  DEFAULT_COLOR,
  DEFAULT_AUDIO,
  DEFAULT_TEXT,
  generateWaveform,
} from '../../../data/videoEditorDefaults';

import { MediaBinPanel } from './MediaBinPanel';
import { VideoPreviewMonitor } from './VideoPreviewMonitor';
import { TimelineToolbar } from './TimelineToolbar';
import { MultiTrackTimeline } from './MultiTrackTimeline';
import { ClipInspectorPanel } from './ClipInspectorPanel';
import { LocalExportModal } from './LocalExportModal';
import { RenderQueueModal } from './RenderQueueModal';
import { QualityCheckerModal } from '../quality/QualityCheckerModal';
import { AutoEditModal } from '../autoedit/AutoEditModal';
import { AskVyroAssistantModal } from './AskVyroAssistantModal';
import { MobileVideoToolTray } from './MobileVideoToolTray';
import { MobileVideoToolSheet, MobileToolSheetType } from './MobileVideoToolSheet';

interface VideoEditorCoreProps {
  onBack: () => void;
  onOpenVersions: () => void;
  onOpenMedia: () => void;
  onOpenExport: () => void;
  onOpenModelRouter: () => void;
}

export const VideoEditorCore: React.FC<VideoEditorCoreProps> = ({
  onBack,
  onOpenVersions,
  onOpenMedia,
  onOpenExport,
  onOpenModelRouter,
}) => {
  const {
    activeProject,
    recordEditAction,
    undoEdit,
    redoEdit,
    canUndo,
    canRedo,
    triggerManualAutosave,
    addMediaToProject,
    removeMediaFromProject,
    updateProjectStateData,
    createVersionSnapshot,
  } = useProjects();

  const { activeJobCount } = useRenderQueue();

  // Load saved state or default
  const savedState: Partial<VideoEditorState> = activeProject?.stateData?.videoEditor || {};

  const [tracks, setTracks] = useState<TimelineTrack[]>(() => savedState.tracks || INITIAL_TRACKS);
  const [clips, setClips] = useState<TimelineClip[]>(() => savedState.clips || INITIAL_CLIPS);
  const [markers, setMarkers] = useState<TimelineMarker[]>(() => savedState.markers || []);
  const [playheadSec, setPlayheadSec] = useState<number>(() => savedState.playheadSec || 0);
  const [zoomPxPerSec, setZoomPxPerSec] = useState<number>(() => savedState.timelineZoom || 45);
  const [snappingEnabled, setSnappingEnabled] = useState<boolean>(() =>
    savedState.snappingEnabled !== undefined ? savedState.snappingEnabled : true
  );
  const [rippleDeleteEnabled, setRippleDeleteEnabled] = useState<boolean>(() =>
    savedState.rippleDeleteEnabled !== undefined ? savedState.rippleDeleteEnabled : false
  );
  const [selectedClipId, setSelectedClipId] = useState<string | null>(() =>
    savedState.selectedClipId || (savedState.clips?.[0]?.id ?? 'clip-v1-1')
  );

  // Professional Phase 6 States
  const [trackHeight, setTrackHeight] = useState<'compact' | 'standard' | 'expanded'>('standard');
  const [editTool, setEditTool] = useState<'select' | 'split' | 'slip' | 'slide' | 'ripple'>('select');
  const [clipboardAttributes, setClipboardAttributes] = useState<Partial<TimelineClip> | null>(null);
  const [sequenceBreadcrumbs, setSequenceBreadcrumbs] = useState<{ id: string; title: string }[]>([]);
  const [parentSequenceClips, setParentSequenceClips] = useState<TimelineClip[] | null>(null);

  // Canvas & Subtitle Settings (CapCut parity)
  const [canvasBackground, setCanvasBackground] = useState<CanvasBackgroundSettings>(() => (savedState as any).canvasBackground || { type: 'color', color: '#000000' });
  const [captions, setCaptions] = useState<Array<{ id: string; startSec: number; endSec: number; text: string }>>(() => (savedState as any).captions || []);
  const [captionStyle, setCaptionStyle] = useState<CaptionStyle>(() => (savedState as any).captionStyle || {
    fontFamily: 'Inter, sans-serif',
    fontSize: 20,
    textColor: '#FFFFFF',
    bgColor: 'rgba(0, 0, 0, 0.75)',
    position: 'bottom',
    animation: 'none',
  });

  // Layout UI states
  const [isMediaBinOpen, setIsMediaBinOpen] = useState(true);
  const [isLocalExportModalOpen, setIsLocalExportModalOpen] = useState(false);
  const [isRenderQueueOpen, setIsRenderQueueOpen] = useState(false);
  const [isQualityCheckerOpen, setIsQualityCheckerOpen] = useState(false);
  const [isAutoEditOpen, setIsAutoEditOpen] = useState(false);
  const [isAskVyroOpen, setIsAskVyroOpen] = useState(false);
  const [autoEditTab, setAutoEditTab] = useState<'auto_cut' | 'beat_sync' | 'color_match' | 'best_take'>('auto_cut');
  const [targetQualityMedia, setTargetQualityMedia] = useState<MediaAsset | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [mobileSheet, setMobileSheet] = useState<MobileToolSheetType | null>(null);

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

  // Playhead animation frame loop
  const animationFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(performance.now());

  // Calculate total timeline duration
  const totalDurationSec = Math.max(
    10,
    ...clips.map(c => c.startSec + c.durationSec)
  );

  // Persistence to Project Context
  const persistEditorState = useCallback(() => {
    const editorState: VideoEditorState = {
      tracks,
      clips: sequenceBreadcrumbs.length > 0 && parentSequenceClips ? parentSequenceClips : clips,
      playheadSec,
      timelineZoom: zoomPxPerSec,
      snappingEnabled,
      rippleDeleteEnabled,
      selectedClipId,
      selectedTrackId: null,
      markers,
    };
    updateProjectStateData('videoEditor', editorState);
  }, [
    tracks,
    clips,
    parentSequenceClips,
    sequenceBreadcrumbs.length,
    playheadSec,
    zoomPxPerSec,
    snappingEnabled,
    rippleDeleteEnabled,
    selectedClipId,
    markers,
    updateProjectStateData,
  ]);

  // Debounced auto-save of editor state
  useEffect(() => {
    const timer = setTimeout(() => {
      persistEditorState();
    }, 600);
    return () => clearTimeout(timer);
  }, [persistEditorState]);

  // Real-time playback loop
  useEffect(() => {
    if (!isPlaying) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      return;
    }

    lastTimeRef.current = performance.now();

    const loop = (currentTime: number) => {
      const deltaSec = (currentTime - lastTimeRef.current) / 1000;
      lastTimeRef.current = currentTime;

      setPlayheadSec(prev => {
        const next = prev + deltaSec;
        if (next >= totalDurationSec) {
          return 0; // loop back to start
        }
        return next;
      });

      animationFrameRef.current = requestAnimationFrame(loop);
    };

    animationFrameRef.current = requestAnimationFrame(loop);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying, totalDurationSec]);

  // Keyboard Shortcuts (Space, S/C split, M marker, Cmd+Z/Y, V/C/Y/U tools)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        setIsPlaying(p => !p);
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        const step = e.shiftKey ? 1.0 : 1 / (activeProject?.fps || 30);
        setPlayheadSec(p => Math.max(0, p - step));
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        const step = e.shiftKey ? 1.0 : 1 / (activeProject?.fps || 30);
        setPlayheadSec(p => Math.min(totalDurationSec, p + step));
      } else if (e.key === 'c' || e.key === 'C' || e.key === 's' || e.key === 'S') {
        e.preventDefault();
        handleSplitAtPlayhead();
      } else if (e.key === 'm' || e.key === 'M') {
        e.preventDefault();
        handleAddMarker();
      } else if (e.key === 'v' || e.key === 'V') {
        setEditTool('select');
      } else if (e.key === 'y' || e.key === 'Y') {
        setEditTool('slip');
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedClipId) {
          e.preventDefault();
          handleDeleteClip(selectedClipId);
        }
      } else if ((e.key === 'd' || e.key === 'D') && !e.metaKey && !e.ctrlKey) {
        if (selectedClipId) {
          e.preventDefault();
          handleDuplicateClip(selectedClipId);
        }
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          if (canRedo) redoEdit();
        } else {
          if (canUndo) undoEdit();
        }
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        if (canRedo) redoEdit();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedClipId, playheadSec, totalDurationSec, canUndo, canRedo, undoEdit, redoEdit]);

  // Selected Clip
  const selectedClip = clips.find(c => c.id === selectedClipId) || null;

  // Clip Operations
  const handleUpdateClip = (clipId: string, updates: Partial<TimelineClip>) => {
    setClips(prev =>
      prev.map(c => {
        if (c.id === clipId) {
          return { ...c, ...updates };
        }
        return c;
      })
    );
  };

  // Split Clip at Playhead
  const handleSplitAtPlayhead = () => {
    if (!selectedClip) return;
    const cutTime = playheadSec;

    if (cutTime <= selectedClip.startSec || cutTime >= selectedClip.startSec + selectedClip.durationSec) {
      return;
    }

    const firstDuration = cutTime - selectedClip.startSec;
    const secondDuration = selectedClip.durationSec - firstDuration;

    const updatedFirst: TimelineClip = {
      ...selectedClip,
      durationSec: firstDuration,
      trimOutSec: selectedClip.trimInSec + firstDuration,
    };

    const newSecond: TimelineClip = {
      ...selectedClip,
      id: `clip-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      startSec: cutTime,
      durationSec: secondDuration,
      trimInSec: selectedClip.trimInSec + firstDuration,
      trimOutSec: selectedClip.trimOutSec,
    };

    setClips(prev => prev.map(c => (c.id === selectedClip.id ? updatedFirst : c)).concat(newSecond));
    setSelectedClipId(newSecond.id);
    recordEditAction('SPLIT_CLIP', `Split clip "${selectedClip.title}" at ${cutTime.toFixed(2)}s`);
  };

  // Trim In/Out at playhead
  const handleTrimInToPlayhead = () => {
    if (!selectedClip) return;
    if (playheadSec <= selectedClip.startSec || playheadSec >= selectedClip.startSec + selectedClip.durationSec) return;

    const shiftSec = playheadSec - selectedClip.startSec;
    const newDuration = selectedClip.durationSec - shiftSec;

    handleUpdateClip(selectedClip.id, {
      startSec: playheadSec,
      durationSec: newDuration,
      trimInSec: selectedClip.trimInSec + shiftSec,
    });
    recordEditAction('TRIM_IN', `Trimmed start of "${selectedClip.title}" to ${playheadSec.toFixed(2)}s`);
  };

  const handleTrimOutToPlayhead = () => {
    if (!selectedClip) return;
    if (playheadSec <= selectedClip.startSec || playheadSec >= selectedClip.startSec + selectedClip.durationSec) return;

    const newDuration = playheadSec - selectedClip.startSec;
    handleUpdateClip(selectedClip.id, {
      durationSec: newDuration,
      trimOutSec: selectedClip.trimInSec + newDuration,
    });
    recordEditAction('TRIM_OUT', `Trimmed end of "${selectedClip.title}" to ${playheadSec.toFixed(2)}s`);
  };

  // Duplicate Clip
  const handleDuplicateClip = (clipId: string) => {
    const target = clips.find(c => c.id === clipId);
    if (!target) return;

    const duplicated: TimelineClip = {
      ...target,
      id: `clip-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      title: `${target.title} (Copy)`,
      startSec: target.startSec + target.durationSec,
    };

    setClips(prev => [...prev, duplicated]);
    setSelectedClipId(duplicated.id);
    recordEditAction('DUPLICATE_CLIP', `Duplicated "${target.title}"`);
  };

  // Delete Clip with optional ripple
  const handleDeleteClip = (clipId: string) => {
    const clipToDelete = clips.find(c => c.id === clipId);
    if (!clipToDelete) return;

    if (rippleDeleteEnabled) {
      const deletedStart = clipToDelete.startSec;
      const deletedDur = clipToDelete.durationSec;
      const targetTrackId = clipToDelete.trackId;

      setClips(prev =>
        prev
          .filter(c => c.id !== clipId)
          .map(c => {
            if (c.trackId === targetTrackId && c.startSec > deletedStart) {
              return { ...c, startSec: Math.max(deletedStart, c.startSec - deletedDur) };
            }
            return c;
          })
      );
    } else {
      setClips(prev => prev.filter(c => c.id !== clipId));
    }

    if (selectedClipId === clipId) {
      setSelectedClipId(null);
    }
    recordEditAction('DELETE_CLIP', `Deleted "${clipToDelete.title}"`);
  };

  // Add Marker
  const handleAddMarker = (timeSec?: number) => {
    const markerTime = timeSec !== undefined ? timeSec : playheadSec;
    const newMarker: TimelineMarker = {
      id: `marker-${Date.now()}`,
      timeSec: Math.round(markerTime * 100) / 100,
      label: `Marker ${markers.length + 1}`,
      color: '#06b6d4',
    };
    setMarkers(prev => [...prev, newMarker]);
    recordEditAction('ADD_MARKER', `Added marker at ${markerTime.toFixed(2)}s`);
  };

  const handleDeleteMarker = (markerId: string) => {
    setMarkers(prev => prev.filter(m => m.id !== markerId));
  };

  // Freeze Frame at Playhead (CapCut parity)
  const handleFreezeClip = (clipId: string) => {
    const target = clips.find(c => c.id === clipId);
    if (!target) return;
    const freezeClip: TimelineClip = {
      ...target,
      id: `freeze-${Date.now()}`,
      title: `${target.title} (Freeze)`,
      startSec: playheadSec,
      durationSec: 2.0,
      isFrozen: true,
      speed: { ...target.speed, speed: 0, freezeFrame: true },
    };
    setClips(prev => [...prev, freezeClip]);
    setSelectedClipId(freezeClip.id);
    recordEditAction('FREEZE_FRAME', `Created 2s Freeze Frame of "${target.title}"`);
  };

  // Extract Audio from Clip (CapCut parity)
  const handleExtractAudio = (clipId: string) => {
    const target = clips.find(c => c.id === clipId);
    if (!target) return;
    let audioTrack = tracks.find(t => t.type === 'audio');
    if (!audioTrack) {
      audioTrack = {
        id: `a-${Date.now()}`,
        label: 'Extracted Audio',
        type: 'audio',
        muted: false,
        solo: false,
        locked: false,
        hidden: false,
        volume: 100,
      };
      setTracks(prev => [...prev, audioTrack!]);
    }
    const extractedClip: TimelineClip = {
      id: `audio-ext-${Date.now()}`,
      trackId: audioTrack.id,
      title: `${target.title} (Audio)`,
      type: 'audio',
      mediaAssetId: target.mediaAssetId,
      startSec: target.startSec,
      durationSec: target.durationSec,
      trimInSec: target.trimInSec,
      trimOutSec: target.trimOutSec,
      colorBadge: '#10b981',
      keyframes: [],
      transform: { ...DEFAULT_TRANSFORM },
      speed: { ...target.speed },
      colorAdjustments: { ...DEFAULT_COLOR },
      audio: { ...target.audio, volume: target.audio.volume || 100, muted: false },
      waveformSamples: target.waveformSamples || generateWaveform(50),
    };
    setClips(prev => [
      ...prev.map(c => (c.id === clipId ? { ...c, extractedAudioClipId: extractedClip.id, audio: { ...c.audio, muted: true } } : c)),
      extractedClip,
    ]);
    setSelectedClipId(extractedClip.id);
    recordEditAction('EXTRACT_AUDIO', `Extracted audio from "${target.title}"`);
  };

  // Create Compound Clip
  const handleCreateCompoundClip = () => {
    if (!selectedClip) return;

    const compoundClip: TimelineClip = {
      id: `compound-${Date.now()}`,
      title: `Compound (${selectedClip.title})`,
      type: 'compound',
      trackId: selectedClip.trackId,
      startSec: selectedClip.startSec,
      durationSec: selectedClip.durationSec,
      trimInSec: 0,
      trimOutSec: selectedClip.durationSec,
      compoundChildren: [selectedClip],
      transform: { ...selectedClip.transform },
      colorAdjustments: { ...selectedClip.colorAdjustments },
      audio: { ...selectedClip.audio },
      speed: { ...selectedClip.speed },
      keyframes: [],
      colorBadge: 'bg-indigo-900 border-indigo-500 text-indigo-100',
    };

    setClips(prev => prev.map(c => (c.id === selectedClip.id ? compoundClip : c)));
    setSelectedClipId(compoundClip.id);
    recordEditAction('CREATE_COMPOUND', `Created compound sequence from "${selectedClip.title}"`);
  };

  // Open Compound Clip
  const handleOpenCompoundClip = (clipId: string) => {
    const compoundClip = clips.find(c => c.id === clipId);
    if (!compoundClip || !compoundClip.compoundChildren) return;

    setParentSequenceClips(clips);
    setSequenceBreadcrumbs(prev => [...prev, { id: compoundClip.id, title: compoundClip.title }]);
    setClips(compoundClip.compoundChildren);
    setSelectedClipId(compoundClip.compoundChildren[0]?.id || null);
  };

  // Navigate sequence breadcrumb
  const handleNavigateBreadcrumb = (index: number) => {
    if (index === -1 && parentSequenceClips) {
      setClips(parentSequenceClips);
      setParentSequenceClips(null);
      setSequenceBreadcrumbs([]);
      setSelectedClipId(parentSequenceClips[0]?.id || null);
    }
  };

  // Add Adjustment Layer
  const handleAddAdjustmentLayer = () => {
    const topVideoTrack = tracks.filter(t => t.type === 'video').pop()?.id || 'v1';

    const adjClip: TimelineClip = {
      id: `adj-${Date.now()}`,
      title: `Adjustment Layer ${clips.filter(c => c.type === 'adjustment').length + 1}`,
      type: 'adjustment',
      trackId: topVideoTrack,
      startSec: playheadSec,
      durationSec: 5.0,
      trimInSec: 0,
      trimOutSec: 5.0,
      colorBadge: 'bg-purple-900 border-purple-500 text-purple-100',
      transform: { ...DEFAULT_TRANSFORM },
      colorAdjustments: { ...DEFAULT_COLOR, contrast: 10, saturation: 110 },
      audio: { ...DEFAULT_AUDIO },
      speed: { ...DEFAULT_SPEED },
      keyframes: [],
    };

    setClips(prev => [...prev, adjClip]);
    setSelectedClipId(adjClip.id);
    recordEditAction('ADD_ADJUSTMENT', `Added adjustment layer at ${playheadSec.toFixed(2)}s`);
  };

  // Copy / Paste Attributes
  const handleCopyAttributes = (sourceClip: TimelineClip) => {
    setClipboardAttributes({
      transform: { ...sourceClip.transform },
      colorAdjustments: { ...sourceClip.colorAdjustments },
      audio: { ...sourceClip.audio },
      speed: { ...sourceClip.speed },
      masks: sourceClip.masks ? [...sourceClip.masks] : undefined,
      chromaKey: sourceClip.chromaKey ? { ...sourceClip.chromaKey } : undefined,
      cornerPin: sourceClip.cornerPin ? { ...sourceClip.cornerPin } : undefined,
      motionBlur: sourceClip.motionBlur ? { ...sourceClip.motionBlur } : undefined,
      keyframes: sourceClip.keyframes ? [...sourceClip.keyframes] : undefined,
    });
  };

  const handlePasteAttributes = (targetClipId: string) => {
    if (!clipboardAttributes) return;
    handleUpdateClip(targetClipId, clipboardAttributes);
    recordEditAction('PASTE_ATTRIBUTES', `Pasted grading & transform attributes`);
  };

  // Add Text Clip
  const handleAddTextClip = () => {
    const textTrack = tracks.find(t => t.type === 'text')?.id || 't1';
    const newClip: TimelineClip = {
      id: `clip-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      trackId: textTrack,
      type: 'text',
      title: 'Lower Third Title',
      startSec: playheadSec,
      durationSec: 4.0,
      trimInSec: 0,
      trimOutSec: 4.0,
      colorBadge: 'bg-amber-800/80 border-amber-600/70 text-amber-100',
      transform: { ...DEFAULT_TRANSFORM, positionY: 140 },
      keyframes: [],
      speed: { ...DEFAULT_SPEED },
      colorAdjustments: { ...DEFAULT_COLOR },
      audio: { ...DEFAULT_AUDIO, muted: true },
      text: { ...DEFAULT_TEXT, text: 'CINEMATIC SCENE TITLE' },
    };

    setClips(prev => [...prev, newClip]);
    setSelectedClipId(newClip.id);
    recordEditAction('ADD_TEXT', `Added text clip at ${playheadSec.toFixed(2)}s`);
  };

  // Add Tracks
  const handleAddVideoTrack = () => {
    const newTrack: TimelineTrack = {
      id: `v${tracks.filter(t => t.type === 'video').length + 1}`,
      label: `V${tracks.filter(t => t.type === 'video').length + 1} (Video)`,
      type: 'video',
      muted: false,
      locked: false,
      hidden: false,
      volume: 1,
    };
    setTracks(prev => [...prev, newTrack]);
    recordEditAction('ADD_TRACK', `Created new video track ${newTrack.label}`);
  };

  const handleAddAudioTrack = () => {
    const newTrack: TimelineTrack = {
      id: `a${tracks.filter(t => t.type === 'audio').length + 1}`,
      label: `A${tracks.filter(t => t.type === 'audio').length + 1} (Audio)`,
      type: 'audio',
      muted: false,
      locked: false,
      hidden: false,
      volume: 1,
    };
    setTracks(prev => [...prev, newTrack]);
    recordEditAction('ADD_TRACK', `Created new audio track ${newTrack.label}`);
  };

  // Insert media asset to timeline
  const handleInsertMediaAsset = (asset: MediaAsset) => {
    const isAudio = asset.type === 'audio';
    const targetTrackId = isAudio ? 'a1' : 'v1';

    const newClip: TimelineClip = {
      id: `clip-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      trackId: targetTrackId,
      mediaAssetId: asset.id,
      type: asset.type,
      title: asset.name,
      url: asset.url,
      startSec: playheadSec,
      durationSec: asset.durationSec || 5.0,
      trimInSec: 0,
      trimOutSec: asset.durationSec || 5.0,
      colorBadge: isAudio
        ? 'bg-purple-800/80 border-purple-600/70 text-purple-100'
        : 'bg-emerald-800/80 border-emerald-600/70 text-emerald-100',
      transform: { ...DEFAULT_TRANSFORM },
      keyframes: [],
      speed: { ...DEFAULT_SPEED },
      colorAdjustments: { ...DEFAULT_COLOR },
      audio: { ...DEFAULT_AUDIO },
      waveformSamples: isAudio ? generateWaveform(40) : undefined,
    };

    setClips(prev => [...prev, newClip]);
    setSelectedClipId(newClip.id);
    recordEditAction('INSERT_MEDIA', `Inserted "${asset.name}" to track ${targetTrackId}`);
    triggerManualAutosave();
  };

  // Track state toggles
  const handleToggleTrackMute = (trackId: string) => {
    setTracks(prev => prev.map(t => (t.id === trackId ? { ...t, muted: !t.muted } : t)));
  };

  const handleToggleTrackSolo = (trackId: string) => {
    setTracks(prev => prev.map(t => (t.id === trackId ? { ...t, solo: !t.solo } : t)));
  };

  const handleToggleTrackLock = (trackId: string) => {
    setTracks(prev => prev.map(t => (t.id === trackId ? { ...t, locked: !t.locked } : t)));
  };

  const handleToggleTrackHidden = (trackId: string) => {
    setTracks(prev => prev.map(t => (t.id === trackId ? { ...t, hidden: !t.hidden } : t)));
  };

  const handleRenameTrack = (trackId: string, label: string) => {
    setTracks(prev => prev.map(t => (t.id === trackId ? { ...t, label } : t)));
  };

  const handleDeleteTrack = (trackId: string) => {
    if (tracks.length <= 1) return;
    setTracks(prev => prev.filter(t => t.id !== trackId));
    setClips(prev => prev.filter(c => c.trackId !== trackId));
  };

  const handleChangeTrackVolume = (trackId: string, volume: number) => {
    setTracks(prev => prev.map(t => (t.id === trackId ? { ...t, volume } : t)));
  };

  return (
    <div
      id="video-editor-core-root"
      className="h-[100dvh] md:h-[calc(100vh-3.5rem)] flex flex-col bg-neutral-100 dark:bg-[#0c0e12] overflow-hidden select-none"
    >
      {/* Mobile Top Bar (Clean & Focused) */}
      <div className="flex md:hidden h-12 px-3 border-b border-neutral-200 dark:border-neutral-800 items-center justify-between bg-white dark:bg-[#13161c] text-xs shrink-0 z-20">
        <div className="flex items-center gap-2 min-w-0">
          <button
            onClick={onBack}
            className="p-1.5 -ml-1 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white rounded-lg active:scale-95"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <span className="font-bold text-neutral-900 dark:text-neutral-100 truncate max-w-[110px] sm:max-w-[160px] text-xs">
            {activeProject?.title || 'Video Editor'}
          </span>

          <span className="font-mono text-[10px] text-neutral-500 bg-neutral-100 dark:bg-neutral-800 px-1.5 py-0.5 rounded shrink-0">
            {activeProject?.aspectRatio || '16:9'}
          </span>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            disabled={!canUndo}
            onClick={undoEdit}
            className="p-1.5 text-neutral-600 dark:text-neutral-400 disabled:opacity-30 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 active:scale-95"
            title="Undo"
          >
            <Undo2 className="w-4 h-4" />
          </button>
          <button
            disabled={!canRedo}
            onClick={redoEdit}
            className="p-1.5 text-neutral-600 dark:text-neutral-400 disabled:opacity-30 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 active:scale-95"
            title="Redo"
          >
            <Redo2 className="w-4 h-4" />
          </button>

          <button
            onClick={onOpenVersions}
            className="p-1.5 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 active:scale-95"
            title="Snapshots"
          >
            <History className="w-4 h-4" />
          </button>

          <button
            onClick={() => setIsLocalExportModalOpen(true)}
            className="ml-1 px-3 py-1.5 bg-neutral-900 dark:bg-white text-white dark:text-neutral-950 font-bold rounded-xl text-xs flex items-center gap-1 shadow-xs active:scale-95 transition-all"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Desktop Top Professional Toolbar */}
      <div className="hidden md:flex h-12 px-4 border-b border-neutral-200 dark:border-neutral-800 items-center justify-between bg-white dark:bg-[#13161c] text-xs shrink-0 z-20">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Dashboard</span>
          </button>
          <span className="text-neutral-300 dark:text-neutral-700">/</span>

          <div className="flex items-center gap-1.5 font-semibold text-neutral-900 dark:text-neutral-100">
            <Film className="w-4 h-4 text-neutral-900 dark:text-white" />
            <span>{activeProject?.title || 'Video Editor'}</span>
          </div>

          <div className="flex items-center gap-1 font-mono text-[10px] text-neutral-500 bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded">
            <span>{activeProject?.aspectRatio || '16:9'}</span>
            <span>•</span>
            <span>{activeProject?.resolution || '1080p'}</span>
            <span>•</span>
            <span>{activeProject?.fps || 30}fps</span>
          </div>

          {/* Offline indicator badge */}
          <div className="flex items-center gap-1 text-[10px] font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-900/50">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>32-Bit Real-Time Pipeline</span>
          </div>
        </div>

        {/* Global Toolbar Actions */}
        <div className="flex items-center gap-2">
          {/* Media Bin Toggle */}
          <button
            onClick={() => setIsMediaBinOpen(o => !o)}
            className={`px-2.5 py-1 rounded border text-[11px] flex items-center gap-1.5 transition-colors ${
              isMediaBinOpen
                ? 'bg-neutral-100 dark:bg-neutral-800 border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white font-medium'
                : 'border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
            }`}
            title="Toggle Media Bin"
          >
            {isMediaBinOpen ? <PanelLeftClose className="w-3.5 h-3.5" /> : <PanelLeftOpen className="w-3.5 h-3.5" />}
            <span>Media Bin</span>
          </button>

          {/* Ask VYRO - Smart Creator AI Edit Assistant */}
          <button
            onClick={() => setIsAskVyroOpen(true)}
            className="px-2.5 py-1 rounded border border-purple-800 bg-purple-950/50 hover:bg-purple-900/60 text-purple-200 text-[11px] font-semibold flex items-center gap-1.5 transition-colors shadow-xs shadow-purple-950/40"
            title="Ask VYRO: Natural language commands, transcript editing, smart beat sync & B-roll"
          >
            <Bot className="w-3.5 h-3.5 text-purple-400" />
            <span>Ask VYRO</span>
          </button>

          {/* AI Quality Checker */}
          <button
            onClick={() => {
              setTargetQualityMedia(null);
              setIsQualityCheckerOpen(true);
            }}
            className="px-2.5 py-1 rounded border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 text-[11px] flex items-center gap-1.5 transition-colors"
            title="Inspect project & media for technical defects"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>Quality Check</span>
          </button>

          {/* Smart Auto Edit Suite */}
          <button
            onClick={() => {
              setAutoEditTab('auto_cut');
              setIsAutoEditOpen(true);
            }}
            className="px-2.5 py-1 rounded border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 text-[11px] flex items-center gap-1.5 transition-colors"
            title="Smart Auto-Cut, Beat-Sync, and Color Match"
          >
            <Wand2 className="w-3.5 h-3.5 text-amber-500" />
            <span>Auto Edit</span>
          </button>

          {/* Background Render Queue */}
          <button
            onClick={() => setIsRenderQueueOpen(true)}
            className="px-2.5 py-1 rounded border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 text-[11px] flex items-center gap-1.5 transition-colors"
            title="Background Render Queue & Exports"
          >
            <Cpu className="w-3.5 h-3.5 text-purple-500" />
            <span>Render Queue</span>
            {activeJobCount > 0 && (
              <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse" />
            )}
          </button>

          {/* Focus Mode Toggle */}
          <button
            id="video-editor-focus-mode-toggle"
            onClick={() => setIsFocusMode(f => !f)}
            className={`px-2.5 py-1 rounded border text-[11px] flex items-center gap-1.5 transition-colors ${
              isFocusMode
                ? 'bg-blue-600 text-white border-blue-600 font-semibold shadow-xs'
                : 'border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800'
            }`}
            title="Focus Mode: Hides non-essential panels and toolbars for distraction-free editing (Press F)"
          >
            {isFocusMode ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{isFocusMode ? 'Exit Focus' : 'Focus Mode'}</span>
            <kbd className={`hidden md:inline-block font-mono text-[9px] px-1 rounded ${isFocusMode ? 'bg-blue-700 text-white' : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500'}`}>
              F
            </kbd>
          </button>

          {/* Undo / Redo */}
          <div className="flex items-center gap-0.5 border border-neutral-200 dark:border-neutral-800 rounded-md p-0.5">
            <button
              disabled={!canUndo}
              onClick={undoEdit}
              className="p-1 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white disabled:opacity-30 rounded"
              title="Undo action (Ctrl+Z)"
            >
              <Undo2 className="w-3.5 h-3.5" />
            </button>
            <button
              disabled={!canRedo}
              onClick={redoEdit}
              className="p-1 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white disabled:opacity-30 rounded"
              title="Redo action (Ctrl+Y)"
            >
              <Redo2 className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Version Checkpoints */}
          <button
            onClick={onOpenVersions}
            className="px-2.5 py-1 rounded border border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center gap-1.5 text-[11px]"
            title="Project Checkpoints & Rollback"
          >
            <History className="w-3.5 h-3.5" />
            <span>Snapshots</span>
          </button>

          {/* Export button */}
          <button
            onClick={() => setIsLocalExportModalOpen(true)}
            className="px-3.5 py-1 bg-neutral-900 dark:bg-white text-white dark:text-neutral-950 font-medium rounded-lg hover:opacity-90 flex items-center gap-1.5 shadow-xs transition-all"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Export Video</span>
          </button>
        </div>
      </div>

      {/* Main Workspace Body: Left Media Bin + Center Preview + Right Inspector */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Left Media Bin Dock (Desktop only) */}
        {isMediaBinOpen && !isFocusMode && (
          <div className="hidden md:block w-64 h-full shrink-0 animate-in fade-in duration-150">
            <MediaBinPanel
              mediaAssets={activeProject?.mediaAssets || []}
              onImportAsset={addMediaToProject}
              onRemoveAsset={removeMediaFromProject}
              onAddToTimeline={handleInsertMediaAsset}
              onQualityCheckAsset={asset => {
                setTargetQualityMedia(asset);
                setIsQualityCheckerOpen(true);
              }}
              onSeekTimeline={sec => setPlayheadSec(sec)}
            />
          </div>
        )}

        {/* Center Live Video Preview Monitor */}
        <div className="flex-1 flex flex-col relative overflow-hidden min-h-0">
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
          <VideoPreviewMonitor
            tracks={tracks}
            clips={clips}
            playheadSec={playheadSec}
            totalDurationSec={totalDurationSec}
            isPlaying={isPlaying}
            fps={activeProject?.fps || 30}
            aspectRatio={activeProject?.aspectRatio || '16:9'}
            resolution={activeProject?.resolution || '1080p'}
            selectedClipId={selectedClipId}
            onTogglePlay={() => setIsPlaying(p => !p)}
            onSeek={time => setPlayheadSec(Math.max(0, Math.min(totalDurationSec, time)))}
            onOpenRenderQueue={() => setIsRenderQueueOpen(true)}
            activeJobsCount={activeJobCount}
            canvasBackground={canvasBackground}
            captions={captions}
            captionStyle={captionStyle}
          />
        </div>

        {/* Right Context-Sensitive Clip Inspector (Desktop only) */}
        {!isFocusMode && (
          <div className="hidden md:block">
            <ClipInspectorPanel
              clip={selectedClip}
              playheadSec={playheadSec}
              tracks={tracks}
              onUpdateClip={handleUpdateClip}
              onSplitClip={handleSplitAtPlayhead}
              onDuplicateClip={handleDuplicateClip}
              onDeleteClip={handleDeleteClip}
              onSaveAsVersion={desc => createVersionSnapshot('Clip State', desc)}
              onCopyAttributes={handleCopyAttributes}
              onPasteAttributes={handlePasteAttributes}
              hasClipboard={!!clipboardAttributes}
              onFreezeClip={handleFreezeClip}
              onExtractAudio={handleExtractAudio}
              canvasBackground={canvasBackground}
              onUpdateCanvasBackground={setCanvasBackground}
              captions={captions}
              onUpdateCaptions={setCaptions}
              captionStyle={captionStyle}
              onUpdateCaptionStyle={setCaptionStyle}
            />
          </div>
        )}
      </div>

      {/* Bottom Multi-Track Timeline & Toolbar Container */}
      <div className="h-44 sm:h-56 md:h-72 border-t border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#0e1117] flex flex-col shrink-0">
        {/* Timeline Editing Toolbar (Desktop only) */}
        <div className="hidden md:block">
          <TimelineToolbar
            canUndo={canUndo}
            canRedo={canRedo}
            snappingEnabled={snappingEnabled}
            rippleDeleteEnabled={rippleDeleteEnabled}
            hasSelectedClip={!!selectedClip}
            zoomPxPerSec={zoomPxPerSec}
            trackHeight={trackHeight}
            activeEditTool={editTool}
            onUndo={undoEdit}
            onRedo={redoEdit}
            onSplitAtPlayhead={handleSplitAtPlayhead}
            onTrimInToPlayhead={handleTrimInToPlayhead}
            onTrimOutToPlayhead={handleTrimOutToPlayhead}
            onDeleteSelected={() => selectedClipId && handleDeleteClip(selectedClipId)}
            onRippleDeleteSelected={() => selectedClipId && handleDeleteClip(selectedClipId)}
            onDuplicateSelected={() => selectedClipId && handleDuplicateClip(selectedClipId)}
            onToggleSnapping={() => setSnappingEnabled(s => !s)}
            onToggleRippleDelete={() => setRippleDeleteEnabled(r => !r)}
            onAddTextClip={handleAddTextClip}
            onAddVideoTrack={handleAddVideoTrack}
            onAddAudioTrack={handleAddAudioTrack}
            onAddAdjustmentLayer={handleAddAdjustmentLayer}
            onCreateCompoundClip={handleCreateCompoundClip}
            onAddMarker={() => handleAddMarker()}
            onChangeZoom={setZoomPxPerSec}
            onChangeTrackHeight={setTrackHeight}
            onChangeEditTool={setEditTool}
            onFitZoomToScreen={() => {
              const containerWidth = window.innerWidth - (isMediaBinOpen ? 256 : 0) - 336 - 208;
              const fitZoom = Math.max(20, Math.min(120, containerWidth / totalDurationSec));
              setZoomPxPerSec(fitZoom);
            }}
          />
        </div>

        {/* Multi-Track Interactive Timeline */}
        <MultiTrackTimeline
          tracks={tracks}
          clips={clips}
          playheadSec={playheadSec}
          totalDurationSec={totalDurationSec}
          zoomPxPerSec={zoomPxPerSec}
          snappingEnabled={snappingEnabled}
          selectedClipId={selectedClipId}
          markers={markers}
          trackHeight={trackHeight}
          editTool={editTool}
          sequenceBreadcrumbs={sequenceBreadcrumbs}
          onSelectClip={setSelectedClipId}
          onSeek={time => setPlayheadSec(Math.max(0, Math.min(totalDurationSec, time)))}
          onUpdateClip={handleUpdateClip}
          onToggleTrackMute={handleToggleTrackMute}
          onToggleTrackSolo={handleToggleTrackSolo}
          onToggleTrackLock={handleToggleTrackLock}
          onToggleTrackHidden={handleToggleTrackHidden}
          onRenameTrack={handleRenameTrack}
          onDeleteTrack={handleDeleteTrack}
          onChangeTrackVolume={handleChangeTrackVolume}
          onAddMarker={handleAddMarker}
          onDeleteMarker={handleDeleteMarker}
          onOpenCompoundClip={handleOpenCompoundClip}
          onNavigateBreadcrumb={handleNavigateBreadcrumb}
        />
      </div>

      {/* Mobile Bottom Tool Tray (CapCut / VN style) */}
      <MobileVideoToolTray
        hasSelectedClip={!!selectedClip}
        onOpenSheet={setMobileSheet}
        onSplitAtPlayhead={handleSplitAtPlayhead}
        onDeleteSelected={() => selectedClipId && handleDeleteClip(selectedClipId)}
        onDuplicateSelected={() => selectedClipId && handleDuplicateClip(selectedClipId)}
        activeSheet={mobileSheet}
      />

      {/* Mobile Bottom Tool Sheet */}
      <MobileVideoToolSheet
        sheetType={mobileSheet}
        onClose={() => setMobileSheet(null)}
        clip={selectedClip}
        onUpdateClip={handleUpdateClip}
        onSplitClip={() => handleSplitAtPlayhead()}
        onDuplicateClip={() => selectedClipId && handleDuplicateClip(selectedClipId)}
        onDeleteClip={() => selectedClipId && handleDeleteClip(selectedClipId)}
        onOpenAutoEdit={() => {
          setAutoEditTab('auto_cut');
          setIsAutoEditOpen(true);
        }}
        onOpenQualityCheck={() => {
          setTargetQualityMedia(null);
          setIsQualityCheckerOpen(true);
        }}
        mediaAssets={activeProject?.mediaAssets || []}
        onImportMedia={addMediaToProject}
        onInsertMedia={handleInsertMediaAsset}
      />

      {/* Local Export Modal */}
      <LocalExportModal
        isOpen={isLocalExportModalOpen}
        onClose={() => setIsLocalExportModalOpen(false)}
        projectTitle={activeProject?.title || 'Untitled Video Project'}
        tracks={tracks}
        clips={clips}
        totalDurationSec={totalDurationSec}
        aspectRatio={activeProject?.aspectRatio || '16:9'}
        fps={activeProject?.fps || 30}
        project={activeProject}
        onOpenQualityChecker={() => setIsQualityCheckerOpen(true)}
      />

      {/* Background Render Queue Modal */}
      <RenderQueueModal
        isOpen={isRenderQueueOpen}
        onClose={() => setIsRenderQueueOpen(false)}
      />

      {/* AI Quality Checker Modal */}
      <QualityCheckerModal
        isOpen={isQualityCheckerOpen}
        onClose={() => {
          setIsQualityCheckerOpen(false);
          setTargetQualityMedia(null);
        }}
        initialTargetMedia={targetQualityMedia}
      />

      {/* Smart Auto Edit Modal */}
      <AutoEditModal
        isOpen={isAutoEditOpen}
        onClose={() => setIsAutoEditOpen(false)}
        defaultTab={autoEditTab}
      />

      {/* Ask VYRO - Smart Creator AI Edit Assistant Modal */}
      <AskVyroAssistantModal
        isOpen={isAskVyroOpen}
        onClose={() => setIsAskVyroOpen(false)}
        clips={clips}
        tracks={tracks}
        onUpdateClips={setClips}
        onUpdateTracks={setTracks}
        onAddCaptions={newCaps => {
          setCaptions(prev => [...prev, ...newCaps]);
        }}
        onOpenAutoEdit={tab => {
          setIsAskVyroOpen(false);
          setAutoEditTab(tab);
          setIsAutoEditOpen(true);
        }}
      />
    </div>
  );
};
