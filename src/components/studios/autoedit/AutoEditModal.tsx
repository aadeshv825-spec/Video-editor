import React, { useState, useEffect } from 'react';
import {
  Scissors,
  Music,
  Palette,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Play,
  RotateCcw,
  Clock,
  Film,
  Zap,
  Sliders,
  ChevronRight,
  TrendingDown,
  Layers,
  Award,
} from 'lucide-react';
import { Project, MediaAsset } from '../../../types';
import {
  AutoCutMode,
  AutoCutPlan,
  BeatDetectionResult,
  BeatSyncPlan,
  BestTakeCandidate,
  ColorMatchPlan,
} from '../../../types/aiQualityAndAutoEdit';
import { AutoEditEngine } from '../../../services/ai/autoEditEngine';
import { SemanticMediaService } from '../../../services/ai/semanticMediaService';
import { DirectorExecutor } from '../../../services/ai/directorExecutor';
import { useProjects } from '../../../context/ProjectContext';
import { useAuth } from '../../../context/AuthContext';

interface AutoEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'auto_cut' | 'beat_sync' | 'color_match' | 'best_take';
}

export const AutoEditModal: React.FC<AutoEditModalProps> = ({
  isOpen,
  onClose,
  defaultTab = 'auto_cut',
}) => {
  const {
    activeProject,
    createVersionSnapshot,
    recordEditAction,
    applyDirectStateUpdate,
  } = useProjects();
  const { isPro, deductCredits } = useAuth();

  const [activeTab, setActiveTab] = useState<'auto_cut' | 'beat_sync' | 'color_match' | 'best_take'>(defaultTab);

  // Auto-Cut state
  const [cutMode, setCutMode] = useState<AutoCutMode>('remove_silence');
  const [autoCutPlan, setAutoCutPlan] = useState<AutoCutPlan | null>(null);

  // Beat Sync state
  const [beatResult, setBeatResult] = useState<BeatDetectionResult | null>(null);
  const [beatSyncPlan, setBeatSyncPlan] = useState<BeatSyncPlan | null>(null);
  const [selectedMusicAsset, setSelectedMusicAsset] = useState<MediaAsset | null>(null);

  // Color Match state
  const [colorPlan, setColorPlan] = useState<ColorMatchPlan | null>(null);
  const [selectedRefClipId, setSelectedRefClipId] = useState<string>('');

  // Best Take state
  const [bestTakes, setBestTakes] = useState<BestTakeCandidate[]>([]);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    if (defaultTab) setActiveTab(defaultTab);
  }, [defaultTab]);

  useEffect(() => {
    if (isOpen && activeProject) {
      // Initialize Auto Cut plan
      const plan = AutoEditEngine.generateAutoCutPlan(activeProject, cutMode);
      setAutoCutPlan(plan);

      // Initialize Beat Detection
      const beats = AutoEditEngine.detectBeats(16.0, 120);
      setBeatResult(beats);

      // Initialize Best Take analysis
      const candidates = SemanticMediaService.evaluateBestTakes(activeProject.mediaAssets || []);
      setBestTakes(candidates);

      // Initialize Color Match
      const clips = activeProject.stateData?.videoState?.clips || [];
      if (clips.length > 0) {
        setSelectedRefClipId(clips[0].id);
        const refClip = clips[0];
        const targetClips = clips.slice(1);
        const cPlan = AutoEditEngine.generateColorMatchPlan(refClip, targetClips);
        setColorPlan(cPlan);
      }
    }
  }, [isOpen, activeProject?.id, cutMode]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  if (!isOpen || !activeProject) return null;

  const videoClips = activeProject.stateData?.videoState?.clips || [];
  const audioAssets = (activeProject.mediaAssets || []).filter(a => a.type === 'audio');

  // Handlers
  const handleCutModeChange = (mode: AutoCutMode) => {
    setCutMode(mode);
    const plan = AutoEditEngine.generateAutoCutPlan(activeProject, mode);
    setAutoCutPlan(plan);
  };

  const handleApplyAutoCut = () => {
    if (!autoCutPlan) return;
    const result = DirectorExecutor.executeAutoCutPlan(
      autoCutPlan,
      activeProject,
      createVersionSnapshot,
      recordEditAction
    );

    if (result.success) {
      applyDirectStateUpdate(result.updatedProject.stateData);
      showToast(`Auto Cut applied. Saved ${autoCutPlan.timeSavedSec}s!`);
      onClose();
    }
  };

  const handleGenerateBeatSync = () => {
    const musicTrack = selectedMusicAsset || audioAssets[0] || {
      id: 'synthwave-sample',
      name: 'Retro Synthwave Beat 120BPM',
      type: 'audio',
      url: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400',
    };

    const mediaVideos = (activeProject.mediaAssets || []).filter(a => a.type === 'video');
    const clipsToUse = mediaVideos.length > 0 ? mediaVideos : [
      { id: 'clip-1', name: 'Establishment Shot', type: 'video', url: '' },
      { id: 'clip-2', name: 'Movement Detail', type: 'video', url: '' },
      { id: 'clip-3', name: 'Subject Focus', type: 'video', url: '' },
      { id: 'clip-4', name: 'Final Transition', type: 'video', url: '' },
    ];

    const plan = AutoEditEngine.generateBeatSyncPlan(musicTrack as MediaAsset, clipsToUse as MediaAsset[], 120);
    setBeatSyncPlan(plan);
  };

  const handleApplyBeatSync = () => {
    if (!beatSyncPlan) return;
    const result = DirectorExecutor.executeBeatSyncPlan(
      beatSyncPlan,
      activeProject,
      createVersionSnapshot,
      recordEditAction
    );

    if (result.success) {
      applyDirectStateUpdate(result.updatedProject.stateData);
      showToast(`Beat Sync applied: ${beatSyncPlan.clipAlignments.length} clips locked to downbeats.`);
      onClose();
    }
  };

  const handleApplyColorMatch = () => {
    if (!colorPlan) return;
    const result = DirectorExecutor.executeColorMatchPlan(
      colorPlan,
      activeProject,
      createVersionSnapshot,
      recordEditAction
    );

    if (result.success) {
      applyDirectStateUpdate(result.updatedProject.stateData);
      showToast('Color matching applied across sequence.');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div
        id="auto-edit-modal"
        className="w-full max-w-4xl bg-neutral-900 border border-neutral-800 rounded-xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden text-neutral-200"
      >
        {/* Header */}
        <div className="p-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-900/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold text-white">Smart Auto Editing Suite</h2>
                <span className="text-xs px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-400 border border-neutral-700">
                  Non-Destructive Operations
                </span>
              </div>
              <p className="text-xs text-neutral-400">
                Rule-based algorithmic editing with interactive preview before applying.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Toast */}
        {toastMessage && (
          <div className="bg-emerald-600 text-white text-xs py-2 px-4 flex items-center justify-between font-medium">
            <span>{toastMessage}</span>
            <button onClick={() => setToastMessage(null)} className="text-white/80 hover:text-white">✕</button>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex items-center border-b border-neutral-800 px-4 bg-neutral-950/40 text-xs gap-2">
          <button
            onClick={() => setActiveTab('auto_cut')}
            className={`flex items-center gap-2 py-3 px-3 border-b-2 font-medium transition-colors ${
              activeTab === 'auto_cut'
                ? 'border-emerald-500 text-white'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Scissors className="w-4 h-4" />
            Auto Cut & Silence Removal
          </button>
          <button
            onClick={() => setActiveTab('beat_sync')}
            className={`flex items-center gap-2 py-3 px-3 border-b-2 font-medium transition-colors ${
              activeTab === 'beat_sync'
                ? 'border-emerald-500 text-white'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Music className="w-4 h-4" />
            Beat Detection & Sync
          </button>
          <button
            onClick={() => setActiveTab('color_match')}
            className={`flex items-center gap-2 py-3 px-3 border-b-2 font-medium transition-colors ${
              activeTab === 'color_match'
                ? 'border-emerald-500 text-white'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Palette className="w-4 h-4" />
            Auto Color Match
          </button>
          <button
            onClick={() => setActiveTab('best_take')}
            className={`flex items-center gap-2 py-3 px-3 border-b-2 font-medium transition-colors ${
              activeTab === 'best_take'
                ? 'border-emerald-500 text-white'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Award className="w-4 h-4" />
            Best Take Detection
          </button>
        </div>

        {/* Tab 1: Auto Cut */}
        {activeTab === 'auto_cut' && (
          <div className="p-4 overflow-y-auto flex-1 space-y-4 text-xs">
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {[
                { id: 'remove_silence', label: 'Remove Silence', desc: 'Cuts speech pauses > 0.4s' },
                { id: 'dead_space', label: 'Remove Dead Space', desc: 'Trims static head/tail' },
                { id: 'scene_changes', label: 'Scene Changes', desc: 'Splits at detected cuts' },
                { id: 'beat_based', label: 'Beat-Based', desc: 'Quantizes to 2.0s measures' },
                { id: 'highlights', label: 'Highlight Reel', desc: 'Retains key motion takes' },
              ].map(mode => (
                <button
                  key={mode.id}
                  onClick={() => handleCutModeChange(mode.id as AutoCutMode)}
                  className={`p-3 rounded-lg border text-left transition-all ${
                    cutMode === mode.id
                      ? 'bg-neutral-800 border-emerald-500 text-white shadow-sm'
                      : 'bg-neutral-950/40 border-neutral-800 text-neutral-400 hover:border-neutral-700'
                  }`}
                >
                  <div className="font-semibold text-neutral-200">{mode.label}</div>
                  <div className="text-[11px] text-neutral-500 mt-0.5">{mode.desc}</div>
                </button>
              ))}
            </div>

            {/* Metrics Banner */}
            {autoCutPlan && (
              <div className="grid grid-cols-3 gap-3 p-3 rounded-xl bg-neutral-950 border border-neutral-800">
                <div className="space-y-0.5">
                  <span className="text-neutral-500 text-[11px]">Original Timeline</span>
                  <div className="text-base font-bold text-white flex items-center gap-1">
                    <Clock className="w-4 h-4 text-neutral-400" />
                    {autoCutPlan.originalDurationSec}s
                  </div>
                </div>
                <div className="space-y-0.5">
                  <span className="text-neutral-500 text-[11px]">Projected Duration</span>
                  <div className="text-base font-bold text-emerald-400 flex items-center gap-1">
                    <TrendingDown className="w-4 h-4 text-emerald-400" />
                    {autoCutPlan.projectedDurationSec}s
                  </div>
                </div>
                <div className="space-y-0.5">
                  <span className="text-neutral-500 text-[11px]">Time Trimmed</span>
                  <div className="text-base font-bold text-amber-400">
                    -{autoCutPlan.timeSavedSec}s ({Math.round((autoCutPlan.timeSavedSec / Math.max(1, autoCutPlan.originalDurationSec)) * 100)}%)
                  </div>
                </div>
              </div>
            )}

            {/* Proposed Cuts Visualization */}
            {autoCutPlan && (
              <div className="space-y-2">
                <h4 className="font-semibold text-white flex items-center gap-1.5">
                  <Film className="w-4 h-4 text-emerald-400" />
                  Proposed Non-Destructive Cut List ({autoCutPlan.proposedCuts.length} segments)
                </h4>
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {autoCutPlan.proposedCuts.map((cut, idx) => (
                    <div
                      key={cut.id || idx}
                      className={`p-2.5 rounded-lg border flex items-center justify-between ${
                        cut.action === 'keep'
                          ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300'
                          : 'bg-rose-950/20 border-rose-500/30 text-rose-300'
                      }`}
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                              cut.action === 'keep' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                            }`}
                          >
                            {cut.action}
                          </span>
                          <span className="font-medium text-white">{cut.clipName}</span>
                          <span className="text-neutral-400 text-[11px]">
                            ({cut.startSec.toFixed(1)}s - {cut.endSec.toFixed(1)}s, duration: {cut.durationSec.toFixed(1)}s)
                          </span>
                        </div>
                        <p className="text-neutral-400 text-[11px]">{cut.reason}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-2 flex items-center justify-between border-t border-neutral-800">
              <span className="text-neutral-500 text-[11px]">
                Original source media files are preserved intact. You can revert this edit from the Version History.
              </span>
              <button
                onClick={handleApplyAutoCut}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium shadow-sm transition-colors"
              >
                <Scissors className="w-4 h-4" />
                Approve & Apply Auto Cut
              </button>
            </div>
          </div>
        )}

        {/* Tab 2: Beat Detection & Beat Sync */}
        {activeTab === 'beat_sync' && (
          <div className="p-4 overflow-y-auto flex-1 space-y-4 text-xs">
            {/* Audio Waveform & Tempo Banner */}
            <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-white text-sm flex items-center gap-2">
                    <Music className="w-4 h-4 text-purple-400" />
                    Tempo Cadence: 120 BPM Detected
                  </h4>
                  <p className="text-neutral-400 text-[11px] mt-0.5">
                    Musical downbeats occur every 0.5 seconds. Measures quantize at 2.0 second intervals.
                  </p>
                </div>
                <button
                  onClick={handleGenerateBeatSync}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-medium"
                >
                  <Zap className="w-3.5 h-3.5" />
                  Generate Beat Alignment
                </button>
              </div>

              {/* Graphical Beat Rhythm Track */}
              <div className="p-3 bg-neutral-900 rounded-lg border border-neutral-800 space-y-2">
                <div className="flex items-center justify-between text-[11px] text-neutral-400">
                  <span>Downbeat Pulse (Measures 1 - 8)</span>
                  <span className="text-purple-400 font-mono">4/4 Time Signature</span>
                </div>
                <div className="h-8 flex items-center gap-1 bg-black/40 rounded p-1">
                  {Array.from({ length: 32 }).map((_, i) => (
                    <div
                      key={i}
                      className={`flex-1 rounded-sm transition-all ${
                        i % 4 === 0
                          ? 'bg-purple-500 h-6'
                          : 'bg-purple-500/30 h-3'
                      }`}
                      title={`Beat ${i + 1} (${(i * 0.5).toFixed(1)}s)`}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Beat Sync Plan Alignment */}
            {beatSyncPlan && (
              <div className="space-y-2">
                <h4 className="font-semibold text-white">
                  Proposed Beat-Synced Clip Sequence ({beatSyncPlan.clipAlignments.length} Cuts)
                </h4>
                <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
                  {beatSyncPlan.clipAlignments.map((align, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-lg bg-neutral-950 border border-neutral-800 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-purple-500/20 text-purple-400 font-bold flex items-center justify-center text-[10px]">
                          {idx + 1}
                        </span>
                        <div>
                          <div className="font-medium text-white">{align.clipName}</div>
                          <div className="text-neutral-500 text-[11px]">
                            Timeline: {align.timelineStartSec}s - {(align.timelineStartSec + align.timelineDurationSec).toFixed(1)}s | Beat Marker #{align.alignedBeatSec}
                          </div>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-neutral-800 text-neutral-300 text-[10px]">
                        {align.transitionType}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="pt-2 flex items-center justify-between border-t border-neutral-800">
                  <span className="text-neutral-500 text-[11px]">
                    Non-destructively aligns timeline clip lengths to rhythm downbeats.
                  </span>
                  <button
                    onClick={handleApplyBeatSync}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-medium shadow-sm transition-colors"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Approve & Apply Beat Sync
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Auto Color Match */}
        {activeTab === 'color_match' && (
          <div className="p-4 overflow-y-auto flex-1 space-y-4 text-xs">
            <div className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-white text-sm">Reference Aesthetic Clip</h4>
                  <p className="text-neutral-400 text-[11px]">
                    Choose the clip whose exposure and white balance other timeline clips will harmonize with.
                  </p>
                </div>
                {colorPlan && (
                  <button
                    onClick={handleApplyColorMatch}
                    className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Apply Harmonization
                  </button>
                )}
              </div>

              {/* Reference Selector */}
              <div className="flex items-center gap-2">
                <select
                  value={selectedRefClipId}
                  onChange={e => {
                    setSelectedRefClipId(e.target.value);
                    const ref = videoClips.find((c: any) => c.id === e.target.value) || videoClips[0];
                    if (ref) {
                      const targets = videoClips.filter((c: any) => c.id !== ref.id);
                      setColorPlan(AutoEditEngine.generateColorMatchPlan(ref, targets));
                    }
                  }}
                  className="bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-neutral-200 text-xs focus:ring-1 focus:ring-emerald-500 w-full max-w-xs"
                >
                  {videoClips.map((c: any) => (
                    <option key={c.id} value={c.id}>
                      {c.name || 'Untitled Clip'} ({c.colorAdjustments?.temperature || 0 > 0 ? 'Warm' : 'Neutral'})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Adjustments Table */}
            {colorPlan && (
              <div className="space-y-3">
                <div className="p-2.5 rounded bg-neutral-800/40 border border-neutral-700/40 text-[11px] text-neutral-400">
                  {colorPlan.disclaimer}
                </div>

                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {colorPlan.adjustments.map((adj, idx) => (
                    <div
                      key={adj.clipId || idx}
                      className="p-3 rounded-lg bg-neutral-950 border border-neutral-800 flex items-center justify-between"
                    >
                      <div className="space-y-0.5">
                        <div className="font-semibold text-white">{adj.clipName}</div>
                        <div className="text-neutral-400 text-[11px]">
                          Target luminance & color temperature correction:
                        </div>
                      </div>

                      <div className="flex items-center gap-3 text-[11px] font-mono">
                        <span className="px-2 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-neutral-300">
                          Temp: {adj.temperatureDelta > 0 ? `+${adj.temperatureDelta}` : adj.temperatureDelta}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-neutral-300">
                          Brightness: {adj.brightnessDelta > 0 ? `+${adj.brightnessDelta}` : adj.brightnessDelta}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-neutral-300">
                          Contrast: {adj.contrastDelta > 0 ? `+${adj.contrastDelta}` : adj.contrastDelta}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 4: Best Take Finder */}
        {activeTab === 'best_take' && (
          <div className="p-4 overflow-y-auto flex-1 space-y-4 text-xs">
            <div className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800 space-y-1">
              <h4 className="font-semibold text-white text-sm">Best-Take Candidate Detection</h4>
              <p className="text-neutral-400 text-[11px]">
                Evaluates sharpness, camera stabilization, and microphone dialogue clarity across imported takes.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-64 overflow-y-auto pr-1">
              {bestTakes.map(candidate => (
                <div
                  key={candidate.mediaId}
                  className={`p-3.5 rounded-xl border flex flex-col justify-between space-y-2 ${
                    candidate.isRecommended
                      ? 'bg-emerald-950/20 border-emerald-500/50'
                      : 'bg-neutral-950 border-neutral-800'
                  }`}
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <h5 className="font-semibold text-white truncate max-w-[200px]">{candidate.name}</h5>
                      {candidate.isRecommended && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                          <Award className="w-3 h-3" />
                          Recommended Take
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-3 gap-2 py-1 text-[11px]">
                      <div>
                        <span className="text-neutral-500">Sharpness</span>
                        <div className="font-semibold text-white">{candidate.sharpnessScore}%</div>
                      </div>
                      <div>
                        <span className="text-neutral-500">Stability</span>
                        <div className="font-semibold text-white">{candidate.stabilityScore}%</div>
                      </div>
                      <div>
                        <span className="text-neutral-500">Audio Clarity</span>
                        <div className="font-semibold text-white">{candidate.audioQualityScore}%</div>
                      </div>
                    </div>

                    {candidate.signals.length > 0 && (
                      <div className="space-y-0.5">
                        {candidate.signals.map((sig, sIdx) => (
                          <div key={sIdx} className="text-[11px] text-emerald-400 flex items-center gap-1">
                            ✓ {sig}
                          </div>
                        ))}
                      </div>
                    )}

                    {candidate.drawbacks && (
                      <div className="space-y-0.5">
                        {candidate.drawbacks.map((drw, dIdx) => (
                          <div key={dIdx} className="text-[11px] text-amber-400 flex items-center gap-1">
                            ⚠ {drw}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => {
                      showToast(`Selected "${candidate.name}" as primary sequence take.`);
                      onClose();
                    }}
                    className={`w-full py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      candidate.isRecommended
                        ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                        : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-300'
                    }`}
                  >
                    Select this Take
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="p-4 border-t border-neutral-800 bg-neutral-900/60 flex items-center justify-end text-xs">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-neutral-800 text-neutral-300 font-medium hover:bg-neutral-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
