import React, { useState, useEffect, useRef } from 'react';
import { useProjects } from '../../../context/ProjectContext';
import {
  AudioClip,
  AudioTrack,
  AudioEditorTab,
  AudioProjectState,
  DEFAULT_AUDIO_TRACKS,
  DEFAULT_AUDIO_CLIPS,
} from '../../../types/audioEditor';
import { AudioToolbar } from './AudioToolbar';
import { AudioTimeline } from './AudioTimeline';
import { AudioClipInspector } from './AudioClipInspector';
import { AudioMixerPanel } from './AudioMixerPanel';
import { AudioAiPrepPanel } from './AudioAiPrepPanel';
import { AudioExportModal } from './AudioExportModal';
import { QualityCheckerModal } from '../quality/QualityCheckerModal';
import { Scissors, Copy, Trash2, Volume2, ListMusic, Sliders, Sparkles } from 'lucide-react';

interface AudioEditorCoreProps {
  onBack: () => void;
  onOpenVersions: () => void;
  onOpenMedia: () => void;
  onOpenExport: () => void;
  onOpenModelRouter: () => void;
}

export const AudioEditorCore: React.FC<AudioEditorCoreProps> = ({
  onBack,
  onOpenVersions,
  onOpenMedia,
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
    updateProjectStateData,
  } = useProjects();

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize tracks and clips from activeProject or defaults
  const [tracks, setTracks] = useState<AudioTrack[]>(() => {
    return activeProject?.stateData?.audioState?.tracks || DEFAULT_AUDIO_TRACKS;
  });

  const [clips, setClips] = useState<AudioClip[]>(() => {
    return activeProject?.stateData?.audioState?.clips || DEFAULT_AUDIO_CLIPS;
  });

  const [selectedClipId, setSelectedClipId] = useState<string | null>(() => {
    return activeProject?.stateData?.audioState?.selectedClipId || clips[0]?.id || null;
  });

  const [selectedTrackId, setSelectedTrackId] = useState<string | null>(() => {
    return activeProject?.stateData?.audioState?.selectedTrackId || tracks[0]?.id || null;
  });

  const [activeTab, setActiveTab] = useState<AudioEditorTab>('timeline');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTimeSec, setCurrentTimeSec] = useState(0);
  const [zoom, setZoom] = useState(60); // pixels per second
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isQualityCheckerOpen, setIsQualityCheckerOpen] = useState(false);
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

  // Master bus state
  const [masterVolumeDb, setMasterVolumeDb] = useState(0);
  const [masterPan, setMasterPan] = useState(0);
  const [masterMute, setMasterMute] = useState(false);
  const [masterEq, setMasterEq] = useState({
    bassDb: 0,
    midDb: 0,
    trebleDb: 0,
    bassFreq: 100,
    midFreq: 1000,
    trebleFreq: 8000,
    enabled: true,
  });

  // Calculate total duration based on clips
  const totalDurationSec = Math.max(
    30,
    ...clips.map(c => c.startSec + c.durationSec + 5)
  );

  // Audio Playback synthesis using Web Audio API
  const audioContextRef = useRef<AudioContext | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const playStartTimeRef = useRef<number>(0);
  const playStartAudioTimeRef = useRef<number>(0);

  // Autosave audio state to project context
  useEffect(() => {
    const audioState: AudioProjectState = {
      tracks,
      clips,
      selectedClipId,
      selectedTrackId,
      masterVolumeDb,
      masterPan,
      masterMute,
      masterEq,
      totalDurationSec,
      zoom,
      activeTab,
    };
    updateProjectStateData('audioState', audioState);
    triggerManualAutosave();
  }, [tracks, clips, selectedClipId, selectedTrackId, masterVolumeDb, masterPan, masterMute, masterEq]);

  // Handle Play/Pause
  const handleTogglePlay = () => {
    if (isPlaying) {
      setIsPlaying(false);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    } else {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      if (audioContextRef.current.state === 'suspended') {
        audioContextRef.current.resume();
      }

      playStartTimeRef.current = performance.now();
      playStartAudioTimeRef.current = currentTimeSec;
      setIsPlaying(true);
    }
  };

  const handleStop = () => {
    setIsPlaying(false);
    setCurrentTimeSec(0);
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
  };

  // Playhead update loop during playback
  useEffect(() => {
    if (!isPlaying) return;

    const tick = () => {
      const elapsed = (performance.now() - playStartTimeRef.current) / 1000;
      const newTime = playStartAudioTimeRef.current + elapsed;

      if (newTime >= totalDurationSec) {
        setIsPlaying(false);
        setCurrentTimeSec(0);
      } else {
        setCurrentTimeSec(newTime);
        animationFrameRef.current = requestAnimationFrame(tick);
      }
    };

    animationFrameRef.current = requestAnimationFrame(tick);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying, totalDurationSec]);

  // Audio Import
  const handleImportAudio = () => {
    fileInputRef.current?.click();
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const targetTrackId = selectedTrackId || tracks[0]?.id || 'track-1';
    const targetTrack = tracks.find(t => t.id === targetTrackId) || tracks[0];

    // Mock realistic waveform samples
    const sampleWaveform = Array.from({ length: 32 }, () => Math.random() * 0.7 + 0.2);

    const newClip: AudioClip = {
      id: `clip-${Date.now()}`,
      trackId: targetTrack.id,
      title: file.name.replace(/\.[^/.]+$/, ''),
      startSec: Math.round(currentTimeSec),
      durationSec: 10,
      sourceDurationSec: 10,
      volumeDb: 0,
      pan: 0,
      fadeInSec: 0.2,
      fadeOutSec: 0.2,
      crossfadeSec: 0,
      muted: false,
      pitchSemitones: 0,
      speed: 1,
      color: targetTrack.color,
      waveformSamples: sampleWaveform,
      originalAudioUrl: URL.createObjectURL(file),
    };

    setClips(prev => [...prev, newClip]);
    setSelectedClipId(newClip.id);
    recordEditAction('IMPORT_AUDIO', `Imported audio stem: ${file.name}`);
  };

  // Clip editing operations (Split, Duplicate, Delete)
  const handleSplitClip = () => {
    if (!selectedClipId) return;
    const clip = clips.find(c => c.id === selectedClipId);
    if (!clip) return;

    // Check if playhead is within clip boundaries
    if (currentTimeSec <= clip.startSec || currentTimeSec >= clip.startSec + clip.durationSec) {
      return;
    }

    const firstDuration = currentTimeSec - clip.startSec;
    const secondDuration = clip.durationSec - firstDuration;

    const clipPart1: AudioClip = {
      ...clip,
      durationSec: firstDuration,
    };

    const clipPart2: AudioClip = {
      ...clip,
      id: `clip-${Date.now()}`,
      startSec: currentTimeSec,
      durationSec: secondDuration,
      fadeInSec: 0.1,
    };

    setClips(prev => prev.map(c => (c.id === clip.id ? clipPart1 : c)).concat(clipPart2));
    setSelectedClipId(clipPart2.id);
    recordEditAction('SPLIT_AUDIO', `Split clip "${clip.title}" at ${currentTimeSec.toFixed(2)}s`);
  };

  const handleDuplicateClip = () => {
    if (!selectedClipId) return;
    const clip = clips.find(c => c.id === selectedClipId);
    if (!clip) return;

    const duplicated: AudioClip = {
      ...clip,
      id: `clip-${Date.now()}`,
      title: `${clip.title} (Copy)`,
      startSec: clip.startSec + clip.durationSec + 1,
    };

    setClips(prev => [...prev, duplicated]);
    setSelectedClipId(duplicated.id);
    recordEditAction('DUPLICATE_AUDIO', `Duplicated clip "${clip.title}"`);
  };

  const handleDeleteClip = () => {
    if (!selectedClipId) return;
    setClips(prev => prev.filter(c => c.id !== selectedClipId));
    setSelectedClipId(null);
    recordEditAction('DELETE_AUDIO', 'Deleted audio clip');
  };

  // Revert clip to original untouched audio
  const handleRevertToOriginalAudio = (clipId: string) => {
    setClips(prev =>
      prev.map(c =>
        c.id === clipId
          ? {
              ...c,
              volumeDb: 0,
              pan: 0,
              fadeInSec: 0,
              fadeOutSec: 0,
              crossfadeSec: 0,
              pitchSemitones: 0,
              speed: 1,
              muted: false,
            }
          : c
      )
    );
    recordEditAction('REVERT_AUDIO', 'Reverted audio clip to original asset');
  };

  // Track operations
  const handleAddTrack = () => {
    const newIndex = tracks.length + 1;
    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];
    const newTrack: AudioTrack = {
      id: `track-${Date.now()}`,
      name: `Audio Track 0${newIndex}`,
      color: colors[(newIndex - 1) % colors.length],
      volumeDb: 0,
      pan: 0,
      muted: false,
      solo: false,
      eq: {
        bassDb: 0,
        midDb: 0,
        trebleDb: 0,
        bassFreq: 100,
        midFreq: 1000,
        trebleFreq: 8000,
        enabled: true,
      },
    };
    setTracks(prev => [...prev, newTrack]);
    setSelectedTrackId(newTrack.id);
    recordEditAction('ADD_TRACK', `Added ${newTrack.name}`);
  };

  const handleDeleteTrack = (trackId: string) => {
    if (tracks.length <= 1) return;
    setTracks(prev => prev.filter(t => t.id !== trackId));
    setClips(prev => prev.filter(c => c.trackId !== trackId));
    recordEditAction('DELETE_TRACK', 'Deleted audio track');
  };

  const handleUpdateClip = (clipId: string, updates: Partial<AudioClip>) => {
    setClips(prev => prev.map(c => (c.id === clipId ? { ...c, ...updates } : c)));
  };

  const handleUpdateTrack = (trackId: string, updates: Partial<AudioTrack>) => {
    setTracks(prev => prev.map(t => (t.id === trackId ? { ...t, ...updates } : t)));
  };

  const selectedClip = clips.find(c => c.id === selectedClipId) || null;

  return (
    <div id="audio-studio-core-root" className="h-[100dvh] md:h-[calc(100vh-3.5rem)] flex flex-col bg-neutral-100 dark:bg-[#0c0e12] text-neutral-900 dark:text-neutral-100 overflow-hidden select-none">
      {/* Hidden file input for native audio file import */}
      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*"
        className="hidden"
        onChange={handleFileInputChange}
      />

      {/* Main Top Toolbar */}
      <AudioToolbar
        projectTitle={activeProject?.title || 'Audio Studio'}
        isPlaying={isPlaying}
        onTogglePlay={handleTogglePlay}
        onStop={handleStop}
        currentTimeSec={currentTimeSec}
        totalDurationSec={totalDurationSec}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={undoEdit}
        onRedo={redoEdit}
        zoom={zoom}
        onZoomChange={setZoom}
        hasSelectedClip={!!selectedClipId}
        onSplitClip={handleSplitClip}
        onDuplicateClip={handleDuplicateClip}
        onDeleteClip={handleDeleteClip}
        onBack={onBack}
        onOpenVersions={onOpenVersions}
        onOpenMedia={onOpenMedia}
        onOpenExport={() => setIsExportOpen(true)}
        onImportAudio={handleImportAudio}
        onOpenQualityChecker={() => setIsQualityCheckerOpen(true)}
        isFocusMode={isFocusMode}
        onToggleFocusMode={() => setIsFocusMode(f => !f)}
      />

      {/* Main Workspace: Timeline + Inspector or Mixer/AI Tabs */}
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

        {activeTab === 'timeline' && (
          <>
            <div className="flex-1 flex flex-col min-h-0 overflow-hidden relative">
              <AudioTimeline
                tracks={tracks}
                clips={clips}
                selectedClipId={selectedClipId}
                selectedTrackId={selectedTrackId}
                currentTimeSec={currentTimeSec}
                totalDurationSec={totalDurationSec}
                zoomPixelsPerSec={zoom}
                onSelectClip={setSelectedClipId}
                onSelectTrack={setSelectedTrackId}
                onSeek={setCurrentTimeSec}
                onUpdateClip={handleUpdateClip}
                onUpdateTrack={handleUpdateTrack}
                onAddTrack={handleAddTrack}
                onDeleteTrack={handleDeleteTrack}
              />

              {/* Mobile Quick Action Pill when clip is selected */}
              {selectedClip && (
                <div className="md:hidden absolute bottom-2 left-3 right-3 z-20 bg-neutral-900/95 dark:bg-neutral-950/95 backdrop-blur-md text-white px-3 py-2 rounded-2xl shadow-xl border border-white/10 flex items-center justify-between text-xs animate-in slide-in-from-bottom-2 duration-150">
                  <span className="truncate max-w-[120px] font-semibold text-[11px] text-neutral-200">
                    {selectedClip.title}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={handleSplitClip}
                      className="p-1.5 hover:bg-white/10 rounded-lg active:scale-95 text-neutral-300 hover:text-white"
                      title="Split Clip"
                    >
                      <Scissors className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={handleDuplicateClip}
                      className="p-1.5 hover:bg-white/10 rounded-lg active:scale-95 text-neutral-300 hover:text-white"
                      title="Duplicate Clip"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={handleDeleteClip}
                      className="p-1.5 hover:bg-white/10 rounded-lg active:scale-95 text-rose-400 hover:text-rose-300"
                      title="Delete Clip"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setActiveTab('inspector')}
                      className="ml-1 px-2.5 py-1 bg-white text-neutral-950 font-bold rounded-lg text-[11px] flex items-center gap-1 active:scale-95 transition-all shadow-xs"
                    >
                      <Volume2 className="w-3 h-3 text-emerald-600" />
                      <span>Tune</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Context-Sensitive Inspector for Selected Clip on Desktop (hidden in Focus Mode) */}
            {selectedClip && !isFocusMode && (
              <div className="hidden md:flex h-full shrink-0">
                <AudioClipInspector
                  clip={selectedClip}
                  onUpdateClip={handleUpdateClip}
                  onRevertToOriginalAudio={handleRevertToOriginalAudio}
                />
              </div>
            )}
          </>
        )}

        {activeTab === 'inspector' && (
          <div className="flex-1 flex flex-col md:flex-row overflow-y-auto">
            <div className="hidden md:flex flex-1 p-6 flex-col items-center justify-center text-center text-neutral-400 bg-neutral-900/40">
              <span className="font-semibold text-neutral-200 text-sm">Clip Inspector Mode</span>
              <p className="text-xs text-neutral-500 max-w-sm mt-1">
                Fine-tune the parameters of the currently highlighted audio clip on the right panel.
              </p>
            </div>
            <div className="w-full md:w-80 h-full">
              <AudioClipInspector
                clip={selectedClip}
                onUpdateClip={handleUpdateClip}
                onRevertToOriginalAudio={handleRevertToOriginalAudio}
              />
            </div>
          </div>
        )}

        {activeTab === 'mixer' && (
          <AudioMixerPanel
            tracks={tracks}
            masterVolumeDb={masterVolumeDb}
            masterPan={masterPan}
            masterMute={masterMute}
            masterEq={masterEq}
            isPlaying={isPlaying}
            onUpdateTrack={handleUpdateTrack}
            onUpdateMasterVolume={setMasterVolumeDb}
            onUpdateMasterPan={setMasterPan}
            onToggleMasterMute={() => setMasterMute(!masterMute)}
            onUpdateMasterEq={setMasterEq}
          />
        )}

        {activeTab === 'ai_prep' && <AudioAiPrepPanel />}
      </div>

      {/* Mobile Bottom Dock (CapCut / VN style) */}
      <div className="md:hidden border-t border-neutral-200 dark:border-neutral-800 bg-white/95 dark:bg-[#111318]/95 backdrop-blur-md px-2 py-1.5 flex items-center justify-around shrink-0 z-30 pb-[max(0.375rem,env(safe-area-inset-bottom))]">
        {[
          { id: 'timeline' as AudioEditorTab, label: 'Timeline', icon: ListMusic },
          { id: 'inspector' as AudioEditorTab, label: 'Inspector', icon: Volume2 },
          { id: 'mixer' as AudioEditorTab, label: 'Mixer & EQ', icon: Sliders },
          { id: 'ai_prep' as AudioEditorTab, label: 'AI Audio', icon: Sparkles },
        ].map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all min-w-[64px] ${
                isActive
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
      <AudioExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        tracks={tracks}
        clips={clips}
        projectTitle={activeProject?.title || 'Audio Project'}
      />

      {/* AI Quality Checker Modal */}
      <QualityCheckerModal
        isOpen={isQualityCheckerOpen}
        onClose={() => setIsQualityCheckerOpen(false)}
      />
    </div>
  );
};
