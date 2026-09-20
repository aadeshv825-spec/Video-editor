import React, { useState } from 'react';
import {
  Subtitles,
  Sparkles,
  Download,
  Plus,
  Trash2,
  Play,
  Layers,
  Type,
  Check,
  Globe,
  Sliders,
} from 'lucide-react';
import { SelectedMediaItem, AIToolResultPayload, SubtitleCaption } from '../../../../types/aiTools';
import { AIToolsProcessor } from '../../../../services/ai/aiToolsProcessor';
import { useProjects } from '../../../../context/ProjectContext';

interface VideoCaptionsRunnerProps {
  media: SelectedMediaItem;
  onPreviewReady: (result: AIToolResultPayload) => void;
  isProcessing: boolean;
}

export const VideoCaptionsRunner: React.FC<VideoCaptionsRunnerProps> = ({
  media,
  onPreviewReady,
  isProcessing,
}) => {
  const { activeProject, applyDirectStateUpdate } = useProjects();

  const [language, setLanguage] = useState<'en' | 'hi' | 'hinglish' | 'es' | 'fr'>('en');
  const [fontFamily, setFontFamily] = useState<'Inter' | 'Plus Jakarta Sans' | 'Impact' | 'Courier Prime'>('Plus Jakarta Sans');
  const [fontSize, setFontSize] = useState<number>(24);
  const [captionPosition, setCaptionPosition] = useState<'bottom' | 'center' | 'top'>('bottom');
  const [animationStyle, setAnimationStyle] = useState<'none' | 'pop' | 'fade' | 'karaoke'>('pop');
  const [bgStyle, setBgStyle] = useState<'pill' | 'box' | 'outline' | 'none'>('pill');

  const [captions, setCaptions] = useState<SubtitleCaption[]>([
    { id: '1', startSec: 0.5, endSec: 3.2, text: 'Welcome to next-generation creative editing.' },
    { id: '2', startSec: 3.6, endSec: 6.8, text: 'Every clip is processed non-destructively in real-time.' },
    { id: '3', startSec: 7.1, endSec: 10.4, text: 'Export directly with synchronized broadcast subtitles.' },
  ]);

  const [hasTranscribed, setHasTranscribed] = useState(true);
  const [appliedNotice, setAppliedNotice] = useState<string | null>(null);

  const handleTranscribe = () => {
    const res = AIToolsProcessor.processVideoCaptions(language);
    if (res.captions) {
      setCaptions(res.captions);
    }
    setHasTranscribed(true);
    onPreviewReady(res);
  };

  const handleUpdateLine = (id: string, text: string) => {
    setCaptions(prev => prev.map(c => (c.id === id ? { ...c, text } : c)));
  };

  const handleUpdateTime = (id: string, field: 'startSec' | 'endSec', val: number) => {
    setCaptions(prev => prev.map(c => (c.id === id ? { ...c, [field]: val } : c)));
  };

  const handleDeleteLine = (id: string) => {
    setCaptions(prev => prev.filter(c => c.id !== id));
  };

  const handleAddLine = () => {
    const last = captions[captions.length - 1];
    const newStart = last ? Number((last.endSec + 0.3).toFixed(1)) : 0;
    const newEnd = Number((newStart + 2.5).toFixed(1));
    setCaptions(prev => [
      ...prev,
      {
        id: `line-${Date.now()}`,
        startSec: newStart,
        endSec: newEnd,
        text: 'New subtitle dialogue line...',
      },
    ]);
  };

  const handleExportSRT = () => {
    const srt = AIToolsProcessor.exportCaptionsSRT(captions);
    const blob = new Blob([srt], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `captions-${media.name || 'video'}.srt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportVTT = () => {
    const vtt = AIToolsProcessor.exportCaptionsVTT(captions);
    const blob = new Blob([vtt], { type: 'text/vtt;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `captions-${media.name || 'video'}.vtt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleApplyToTimeline = () => {
    if (!activeProject) return;
    const currentVideoState = activeProject.stateData?.videoState || {};
    const existingCaptions = currentVideoState.captions || [];

    applyDirectStateUpdate({
      videoState: {
        ...currentVideoState,
        captions: [...existingCaptions, ...captions],
      },
    });

    setAppliedNotice('Captions applied to video timeline track!');
    setTimeout(() => setAppliedNotice(null), 3000);
  };

  return (
    <div className="space-y-4 text-xs">
      {/* Top controls: Language, Styling & Export */}
      <div className="p-3.5 rounded-lg bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 font-semibold text-neutral-900 dark:text-neutral-100">
            <Subtitles className="w-4 h-4 text-emerald-500" />
            <span>AI Transcription & Dynamic Subtitles</span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handleExportSRT}
              className="px-2.5 py-1 rounded border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center gap-1 text-[11px]"
            >
              <Download className="w-3 h-3" />
              <span>Export .SRT</span>
            </button>
            <button
              onClick={handleExportVTT}
              className="px-2.5 py-1 rounded border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center gap-1 text-[11px]"
            >
              <Download className="w-3 h-3" />
              <span>Export .VTT</span>
            </button>
          </div>
        </div>

        {/* Styling Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
          <div>
            <span className="text-[10px] text-neutral-500">Audio Language:</span>
            <select
              value={language}
              onChange={e => setLanguage(e.target.value as any)}
              className="w-full mt-0.5 px-2 py-1 rounded border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-800"
            >
              <option value="en">English (US/UK)</option>
              <option value="hi">Hindi (हिन्दी)</option>
              <option value="hinglish">Hinglish</option>
              <option value="es">Spanish (Español)</option>
              <option value="fr">French (Français)</option>
            </select>
          </div>

          <div>
            <span className="text-[10px] text-neutral-500">Font Family:</span>
            <select
              value={fontFamily}
              onChange={e => setFontFamily(e.target.value as any)}
              className="w-full mt-0.5 px-2 py-1 rounded border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-800"
            >
              <option value="Plus Jakarta Sans">Plus Jakarta Sans</option>
              <option value="Inter">Inter Clean</option>
              <option value="Impact">Impact Bold</option>
              <option value="Courier Prime">Courier Typewriter</option>
            </select>
          </div>

          <div>
            <span className="text-[10px] text-neutral-500">Animation Style:</span>
            <select
              value={animationStyle}
              onChange={e => setAnimationStyle(e.target.value as any)}
              className="w-full mt-0.5 px-2 py-1 rounded border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-800"
            >
              <option value="pop">Pop (Dynamic Bounce)</option>
              <option value="karaoke">Karaoke Word Highlight</option>
              <option value="fade">Subtle Smooth Fade</option>
              <option value="none">Static Standard</option>
            </select>
          </div>

          <div>
            <span className="text-[10px] text-neutral-500">Box Style & Position:</span>
            <select
              value={bgStyle}
              onChange={e => setBgStyle(e.target.value as any)}
              className="w-full mt-0.5 px-2 py-1 rounded border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-800"
            >
              <option value="pill">Translucent Pill</option>
              <option value="box">Solid Black Box</option>
              <option value="outline">High-Contrast Outline</option>
              <option value="none">Clean Sans Backdrop</option>
            </select>
          </div>
        </div>
      </div>

      {/* Interactive Transcript Editor */}
      <div className="p-3 rounded-lg bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-neutral-900 dark:text-neutral-100">
            Interactive Transcript Editor ({captions.length} Lines)
          </span>
          <button
            onClick={handleAddLine}
            className="px-2 py-1 rounded bg-neutral-200/80 dark:bg-neutral-800 hover:bg-neutral-300 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 flex items-center gap-1 text-[11px]"
          >
            <Plus className="w-3 h-3" />
            <span>Add Line</span>
          </button>
        </div>

        <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
          {captions.map((cap, idx) => (
            <div
              key={cap.id}
              className="p-2 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 flex flex-wrap sm:flex-nowrap items-center gap-2"
            >
              <span className="font-mono text-[10px] text-neutral-400 w-5 text-center shrink-0">
                #{idx + 1}
              </span>

              {/* Start and End inputs */}
              <div className="flex items-center gap-1 shrink-0 font-mono text-[11px]">
                <input
                  type="number"
                  step="0.1"
                  value={cap.startSec}
                  onChange={e => handleUpdateTime(cap.id, 'startSec', parseFloat(e.target.value))}
                  className="w-14 px-1.5 py-0.5 rounded border border-neutral-200 dark:border-neutral-800 text-center"
                />
                <span className="text-neutral-400">→</span>
                <input
                  type="number"
                  step="0.1"
                  value={cap.endSec}
                  onChange={e => handleUpdateTime(cap.id, 'endSec', parseFloat(e.target.value))}
                  className="w-14 px-1.5 py-0.5 rounded border border-neutral-200 dark:border-neutral-800 text-center"
                />
                <span className="text-[10px] text-neutral-400">s</span>
              </div>

              {/* Text line */}
              <input
                type="text"
                value={cap.text}
                onChange={e => handleUpdateLine(cap.id, e.target.value)}
                className="flex-1 px-2 py-1 rounded border border-neutral-200 dark:border-neutral-800 bg-transparent text-neutral-900 dark:text-white"
              />

              <button
                onClick={() => handleDeleteLine(cap.id)}
                className="p-1 text-neutral-400 hover:text-rose-500 rounded"
                title="Delete subtitle line"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {appliedNotice && (
        <div className="p-2 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1.5">
          <Check className="w-3.5 h-3.5" />
          <span>{appliedNotice}</span>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-1">
        <span className="text-[11px] text-neutral-500">
          Syncs word-by-word pacing directly into the master video preview track.
        </span>

        <div className="flex items-center gap-2">
          <button
            onClick={handleTranscribe}
            disabled={isProcessing}
            className="px-3 py-1.5 rounded-lg border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 font-medium flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Re-Transcribe Audio</span>
          </button>
          <button
            onClick={handleApplyToTimeline}
            className="px-4 py-1.5 rounded-lg bg-emerald-600 text-white font-medium hover:bg-emerald-700 flex items-center gap-1.5"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Apply Captions to Video</span>
          </button>
        </div>
      </div>
    </div>
  );
};
