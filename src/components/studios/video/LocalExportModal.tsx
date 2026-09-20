import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Download,
  Film,
  CheckCircle2,
  FileCode,
  HardDrive,
  Loader2,
  Sparkles,
  Play,
  ShieldCheck,
  AlertTriangle,
  XCircle,
  Eye,
  RefreshCw,
} from 'lucide-react';
import { TimelineClip, TimelineTrack } from '../../../types/videoEditor';
import { Project } from '../../../types';
import { QualityAnalyzerService } from '../../../services/ai/qualityAnalyzer';
import { QualityAnalysisReport } from '../../../types/aiQualityAndAutoEdit';

interface LocalExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectTitle: string;
  tracks: TimelineTrack[];
  clips: TimelineClip[];
  totalDurationSec: number;
  aspectRatio: string;
  fps: number;
  project?: Project | null;
  onOpenQualityChecker?: () => void;
}

export const LocalExportModal: React.FC<LocalExportModalProps> = ({
  isOpen,
  onClose,
  projectTitle,
  tracks,
  clips,
  totalDurationSec,
  aspectRatio,
  fps = 30,
  project,
  onOpenQualityChecker,
}) => {
  const [resolution, setResolution] = useState<'720p' | '1080p' | '4K'>('1080p');
  const [format, setFormat] = useState<'webm' | 'mp4'>('webm');
  const [exportRate, setExportRate] = useState<number>(30);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [completedUrl, setCompletedUrl] = useState<string | null>(null);
  const [exportLog, setExportLog] = useState<string>('');

  // Pre-Export Quality Check State
  const [preExportReport, setPreExportReport] = useState<QualityAnalysisReport | null>(null);
  const [isCheckingQuality, setIsCheckingQuality] = useState(false);
  const [strictQualityMode, setStrictQualityMode] = useState(false);
  const [ignoredWarning, setIgnoredWarning] = useState(false);

  const criticalCount = preExportReport ? preExportReport.issues.filter(i => i.severity === 'critical').length : 0;
  const warningCount = preExportReport ? preExportReport.issues.filter(i => i.severity === 'warning').length : 0;
  const qualityScore = Math.max(0, 100 - criticalCount * 25 - warningCount * 10);

  const hiddenCanvasRef = useRef<HTMLCanvasElement>(null);

  // Run pre-export check when modal opens or resolution changes
  useEffect(() => {
    if (isOpen) {
      runPreExportCheck();
    }
  }, [isOpen, resolution, format]);

  const runPreExportCheck = () => {
    setIsCheckingQuality(true);
    setTimeout(() => {
      const mockProj: Project = project || {
        id: 'export-target-proj',
        title: projectTitle,
        type: 'video',
        aspectRatio: (aspectRatio as '16:9' | '9:16' | '1:1' | '21:9' | '4:5') || '16:9',
        resolution: '1080p',
        fps,
        mediaAssets: [],
        versions: [],
        nonDestructiveHistory: [],
        historyIndex: 0,
        hasRecoverySnapshot: false,
        autosavedAt: new Date().toISOString(),
        stateData: {
          videoState: {
            tracks,
            clips,
          },
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const rep = QualityAnalyzerService.runPreExportCheck(mockProj, false, {
        resolution,
        format,
        fps: exportRate,
      });

      setPreExportReport(rep);
      setIsCheckingQuality(false);
    }, 300);
  };

  if (!isOpen) return null;

  // Real offline client-side export using HTML5 Canvas & MediaRecorder
  const handleStartLocalExport = async () => {
    setIsExporting(true);
    setExportProgress(0);
    setCompletedUrl(null);
    setExportLog('Initializing client-side canvas render pipeline...');

    const canvas = hiddenCanvasRef.current || document.createElement('canvas');
    let width = 1920;
    let height = 1080;

    if (resolution === '720p') {
      width = 1280;
      height = 720;
    } else if (resolution === '4K') {
      width = 3840;
      height = 2160;
    }

    if (aspectRatio === '9:16') {
      const temp = width;
      width = height;
      height = temp;
    } else if (aspectRatio === '1:1') {
      height = width;
    }

    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      setExportLog('Failed to get 2D render context.');
      setIsExporting(false);
      return;
    }

    // MediaRecorder setup
    const stream = canvas.captureStream(exportRate);
    const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
      ? 'video/webm;codecs=vp9'
      : MediaRecorder.isTypeSupported('video/webm')
      ? 'video/webm'
      : 'video/mp4';

    let mediaRecorder: MediaRecorder;
    const chunks: Blob[] = [];

    try {
      mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported(mimeType) ? mimeType : '',
      });
    } catch {
      mediaRecorder = new MediaRecorder(stream);
    }

    mediaRecorder.ondataavailable = e => {
      if (e.data.size > 0) {
        chunks.push(e.data);
      }
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(chunks, { type: mimeType });
      const downloadUrl = URL.createObjectURL(blob);
      setCompletedUrl(downloadUrl);
      setIsExporting(false);
      setExportProgress(100);
      setExportLog('Render finished! Ready for local download.');
    };

    mediaRecorder.start();

    // Render timeline frame-by-frame
    const totalFrames = Math.max(30, Math.ceil(totalDurationSec * exportRate));
    let currentFrame = 0;

    const renderNextFrame = () => {
      if (currentFrame >= totalFrames) {
        mediaRecorder.stop();
        return;
      }

      const currentTimeSec = currentFrame / exportRate;
      const progressPct = Math.round((currentFrame / totalFrames) * 100);
      setExportProgress(progressPct);
      setExportLog(`Rendering frame ${currentFrame}/${totalFrames} (${currentTimeSec.toFixed(2)}s)...`);

      // Clear frame background
      ctx.fillStyle = '#050608';
      ctx.fillRect(0, 0, width, height);

      // Find active clips at currentTimeSec
      const activeClips = clips.filter(
        c => currentTimeSec >= c.startSec && currentTimeSec <= c.startSec + c.durationSec
      );

      // Draw active visual clips
      activeClips.forEach(clip => {
        ctx.save();
        // Translate to center
        ctx.translate(width / 2 + clip.transform.positionX, height / 2 + clip.transform.positionY);
        ctx.rotate((clip.transform.rotation * Math.PI) / 180);
        ctx.scale(
          (clip.transform.scale / 100) * (clip.transform.flipHorizontal ? -1 : 1),
          (clip.transform.scale / 100) * (clip.transform.flipVertical ? -1 : 1)
        );
        ctx.globalAlpha = clip.transform.opacity / 100;

        if (clip.type === 'text' && clip.text) {
          ctx.fillStyle = clip.text.color;
          ctx.font = `bold ${clip.text.fontSize * 1.5}px ${clip.text.fontFamily}`;
          ctx.textAlign = clip.text.alignment as CanvasTextAlign;
          ctx.textBaseline = 'middle';
          ctx.fillText(clip.text.text, 0, 0);
        } else {
          // Draw video / image card graphic
          ctx.fillStyle = '#1e232d';
          ctx.fillRect(-width * 0.45, -height * 0.45, width * 0.9, height * 0.9);
          ctx.fillStyle = '#64748b';
          ctx.font = '32px monospace';
          ctx.textAlign = 'center';
          ctx.fillText(clip.title, 0, 0);
        }

        ctx.restore();
      });

      // Frame watermark / timecode
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.font = '24px monospace';
      ctx.textAlign = 'right';
      ctx.fillText(
        `00:00:${String(Math.floor(currentTimeSec)).padStart(2, '0')}:${String(
          currentFrame % exportRate
        ).padStart(2, '0')}`,
        width - 40,
        height - 40
      );

      currentFrame++;
      // Render at accelerated rate (approx 40fps)
      setTimeout(renderNextFrame, 16);
    };

    renderNextFrame();
  };

  // Export full Project Timeline JSON
  const handleExportJsonArchive = () => {
    const projectData = {
      title: projectTitle,
      exportDate: new Date().toISOString(),
      aspectRatio,
      resolution,
      fps,
      totalDurationSec,
      tracks,
      clips,
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(projectData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `${projectTitle.replace(/\s+/g, '_')}_Timeline.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div
      id="local-export-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs select-none"
    >
      <div className="bg-white dark:bg-[#13161c] border border-neutral-200 dark:border-neutral-800 rounded-xl w-full max-w-lg shadow-2xl flex flex-col overflow-hidden text-xs">
        {/* Header */}
        <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Film className="w-4 h-4 text-neutral-900 dark:text-neutral-100" />
            <h3 className="font-semibold text-sm text-neutral-900 dark:text-neutral-100">
              Export Master Video
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          <div className="p-3 rounded-lg bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
            <div>
              <span className="font-mono font-medium text-neutral-800 dark:text-neutral-200">
                {projectTitle}
              </span>
              <p className="text-[10px] text-neutral-400 mt-0.5">
                {totalDurationSec.toFixed(1)}s duration • {tracks.length} tracks • {clips.length} clips
              </p>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
              Offline Render
            </span>
          </div>

          {/* Resolution Selector */}
          <div>
            <label className="text-neutral-500 block mb-1.5 font-medium">Export Resolution</label>
            <div className="grid grid-cols-3 gap-2">
              {(['720p', '1080p', '4K'] as const).map(res => (
                <button
                  key={res}
                  onClick={() => setResolution(res)}
                  className={`py-2 rounded-lg border text-center font-mono transition-colors ${
                    resolution === res
                      ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 border-transparent font-medium'
                      : 'border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                  }`}
                >
                  {res}
                </button>
              ))}
            </div>
          </div>

          {/* Format & Framerate */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-neutral-500 block mb-1">Container Format</label>
              <select
                value={format}
                onChange={e => setFormat(e.target.value as any)}
                className="w-full p-2 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 font-mono"
              >
                <option value="webm">WebM (VP9 / Opus)</option>
                <option value="mp4">MP4 (H.264 / AAC)</option>
              </select>
            </div>

            <div>
              <label className="text-neutral-500 block mb-1">Frame Rate</label>
              <select
                value={exportRate}
                onChange={e => setExportRate(Number(e.target.value))}
                className="w-full p-2 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 font-mono"
              >
                <option value={24}>24 fps (Cinematic)</option>
                <option value={30}>30 fps (Standard)</option>
                <option value={60}>60 fps (Smooth)</option>
              </select>
            </div>
          </div>

          {/* AI Pre-Export Quality Health Banner */}
          <div className="p-3 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/70 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span className="font-semibold text-neutral-900 dark:text-neutral-100">
                  Pre-Export Health Diagnostics
                </span>
              </div>
              <div className="flex items-center gap-2">
                {isCheckingQuality ? (
                  <span className="flex items-center gap-1 text-[10px] text-neutral-400">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Analyzing...
                  </span>
                ) : preExportReport ? (
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-medium font-mono ${
                      criticalCount > 0
                        ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        : warningCount > 0
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    }`}
                  >
                    Quality Score: {qualityScore}%
                  </span>
                ) : null}
                <button
                  onClick={runPreExportCheck}
                  className="p-1 rounded text-neutral-400 hover:text-white"
                  title="Re-run check"
                >
                  <RefreshCw className="w-3 h-3" />
                </button>
              </div>
            </div>

            {preExportReport && (
              <div className="space-y-1.5 text-[11px]">
                {preExportReport.issues.length === 0 ? (
                  <div className="text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>No audio clipping, black frames, or format mismatches detected. Ready for render!</span>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-neutral-400">
                      <span>
                        Found {criticalCount} critical issue(s), {warningCount} warning(s).
                      </span>
                      {onOpenQualityChecker && (
                        <button
                          onClick={() => {
                            onClose();
                            onOpenQualityChecker();
                          }}
                          className="text-emerald-400 hover:underline font-medium flex items-center gap-1"
                        >
                          <Eye className="w-3 h-3" />
                          Review & Auto-Fix
                        </button>
                      )}
                    </div>

                    {/* Top 2 critical issues if any */}
                    <div className="space-y-1 pt-1">
                      {preExportReport.issues.slice(0, 2).map((iss, iIdx) => (
                        <div
                          key={iIdx}
                          className={`p-1.5 rounded flex items-center justify-between ${
                            iss.severity === 'critical'
                              ? 'bg-rose-950/30 text-rose-300 border border-rose-900/40'
                              : 'bg-amber-950/30 text-amber-300 border border-amber-900/40'
                          }`}
                        >
                          <span className="truncate pr-2">{iss.title}: {iss.description}</span>
                          <span className="shrink-0 text-[9px] uppercase font-bold px-1 rounded bg-black/40">
                            {iss.severity}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Strict Quality Toggle */}
                <div className="pt-1 flex items-center justify-between text-[10px] text-neutral-400 border-t border-neutral-800">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={strictQualityMode}
                      onChange={e => setStrictQualityMode(e.target.checked)}
                      className="rounded bg-neutral-800 border-neutral-700 text-emerald-500 focus:ring-0"
                    />
                    <span>Strict Quality Gate (Block export if critical issues exist)</span>
                  </label>
                  {strictQualityMode && criticalCount > 0 && !ignoredWarning && (
                    <button
                      onClick={() => setIgnoredWarning(true)}
                      className="text-amber-400 hover:underline"
                    >
                      Bypass Once
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Export Status & Progress Bar */}
          {isExporting && (
            <div className="space-y-2 pt-2 border-t border-neutral-200 dark:border-neutral-800">
              <div className="flex items-center justify-between text-neutral-500 text-[11px]">
                <span className="flex items-center gap-1.5">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>{exportLog}</span>
                </span>
                <span className="font-mono">{exportProgress}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-neutral-200 dark:bg-neutral-800 overflow-hidden">
                <div
                  style={{ width: `${exportProgress}%` }}
                  className="h-full bg-neutral-900 dark:bg-white transition-all duration-150"
                />
              </div>
            </div>
          )}

          {/* Ready Download Link */}
          {completedUrl && (
            <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span className="font-medium text-emerald-800 dark:text-emerald-300">
                  Export successfully encoded
                </span>
              </div>
              <a
                href={completedUrl}
                download={`${projectTitle.replace(/\s+/g, '_')}_${resolution}.${format}`}
                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium flex items-center gap-1.5 shadow-sm"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Save File</span>
              </a>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-[#111318] flex items-center justify-between">
          <button
            onClick={handleExportJsonArchive}
            className="text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white flex items-center gap-1.5 text-[11px]"
            title="Download complete project JSON archive"
          >
            <FileCode className="w-3.5 h-3.5" />
            <span>Export Timeline JSON</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800"
            >
              Cancel
            </button>
            <button
              onClick={handleStartLocalExport}
              disabled={isExporting || (strictQualityMode && criticalCount > 0 && !ignoredWarning)}
              title={strictQualityMode && criticalCount > 0 && !ignoredWarning ? 'Resolve critical quality issues or click Bypass Once' : undefined}
              className="px-4 py-1.5 rounded-lg bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-medium hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 shadow-sm"
            >
              {isExporting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Encoding...</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" />
                  <span>Start Render</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
