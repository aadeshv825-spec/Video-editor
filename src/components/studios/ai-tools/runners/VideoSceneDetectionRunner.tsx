import React, { useState } from 'react';
import {
  Film,
  Sparkles,
  Bookmark,
  Scissors,
  Check,
  Play,
  Clock,
  Layers,
} from 'lucide-react';
import { SelectedMediaItem, AIToolResultPayload, SceneBoundary } from '../../../../types/aiTools';
import { AIToolsProcessor } from '../../../../services/ai/aiToolsProcessor';
import { useProjects } from '../../../../context/ProjectContext';

interface VideoSceneDetectionRunnerProps {
  media: SelectedMediaItem;
  onPreviewReady: (result: AIToolResultPayload) => void;
  isProcessing: boolean;
}

export const VideoSceneDetectionRunner: React.FC<VideoSceneDetectionRunnerProps> = ({
  media,
  onPreviewReady,
  isProcessing,
}) => {
  const { activeProject, applyDirectStateUpdate } = useProjects();
  const [detectedScenes, setDetectedScenes] = useState<SceneBoundary[]>([]);
  const [hasRun, setHasRun] = useState(false);
  const [appliedNotice, setAppliedNotice] = useState<string | null>(null);

  const handleRunDetection = () => {
    const res = AIToolsProcessor.processVideoSceneDetection(media.durationSec || 36);
    setDetectedScenes(res.scenes || []);
    setHasRun(true);
    onPreviewReady(res);
  };

  const handleAddTimelineMarkers = () => {
    if (!activeProject || detectedScenes.length === 0) return;

    // Non-destructively add markers to project video state
    const currentVideoState = activeProject.stateData?.videoState || {};
    const existingMarkers = currentVideoState.markers || [];
    const newMarkers = detectedScenes.map(s => ({
      id: `marker-${s.id}`,
      time: s.timestampSec,
      label: s.label || s.formattedTime,
      color: '#10b981',
    }));

    applyDirectStateUpdate({
      videoState: {
        ...currentVideoState,
        markers: [...existingMarkers, ...newMarkers],
      },
    });

    setAppliedNotice(`Added ${newMarkers.length} scene markers to video timeline!`);
    setTimeout(() => setAppliedNotice(null), 3000);
  };

  return (
    <div className="space-y-4 text-xs">
      {/* Overview header */}
      <div className="p-3.5 rounded-lg bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 font-semibold text-neutral-900 dark:text-neutral-100">
            <Film className="w-4 h-4 text-amber-500" />
            <span>Temporal Shot & Scene Boundary Detection</span>
          </div>

          <span className="font-mono text-[11px] text-neutral-500">
            Input: {media.name} ({media.durationSec || 30}s)
          </span>
        </div>

        <p className="text-[11px] text-neutral-600 dark:text-neutral-400">
          Analyzes frame-to-frame color histogram flux to discover hard cuts and transitions without rearranging or deleting your media.
        </p>
      </div>

      {/* Detected Scenes List */}
      {hasRun ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-neutral-900 dark:text-neutral-100">
              Discovered Scene Transitions ({detectedScenes.length})
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={handleAddTimelineMarkers}
                className="px-3 py-1 rounded-lg bg-emerald-600 text-white font-medium hover:bg-emerald-700 flex items-center gap-1.5 transition-colors"
              >
                <Bookmark className="w-3.5 h-3.5" />
                <span>Add Markers to Timeline</span>
              </button>
            </div>
          </div>

          {appliedNotice && (
            <div className="p-2 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5" />
              <span>{appliedNotice}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
            {detectedScenes.map((scene, idx) => (
              <div
                key={scene.id}
                className="p-3 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 space-y-1.5 shadow-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-xs text-neutral-900 dark:text-white">
                    {scene.formattedTime}
                  </span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400">
                    {scene.confidence}% Match
                  </span>
                </div>
                <div className="text-[11px] text-neutral-600 dark:text-neutral-300 font-medium">
                  {scene.label}
                </div>
                <div className="flex items-center gap-1 text-[10px] text-neutral-500 font-mono">
                  <Clock className="w-3 h-3" />
                  <span>Timecode: {scene.timestampSec}s</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="p-8 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-950 flex flex-col items-center justify-center text-center space-y-2 text-neutral-400 min-h-[220px]">
          <Film className="w-8 h-8 opacity-40 text-amber-400" />
          <p>Click below to analyze video stream and discover shot boundaries.</p>
        </div>
      )}

      {/* Action footer */}
      <div className="flex items-center justify-between pt-1">
        <span className="text-[11px] text-neutral-500 font-mono">
          Estimated AI usage: 1 Credit • Local Fast Detector
        </span>

        <button
          onClick={handleRunDetection}
          disabled={isProcessing}
          className="px-4 py-2 rounded-lg bg-neutral-900 dark:bg-white text-white dark:text-neutral-950 font-medium hover:opacity-90 disabled:opacity-50 flex items-center gap-1.5 transition-opacity"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>{hasRun ? 'Re-Analyze Boundaries' : 'Detect Scene Cuts'}</span>
        </button>
      </div>
    </div>
  );
};
