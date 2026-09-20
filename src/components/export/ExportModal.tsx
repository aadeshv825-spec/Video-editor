import React, { useState } from 'react';
import { 
  X, 
  Share2, 
  Download, 
  Check, 
  Film, 
  HardDrive, 
  Cpu, 
  AlertCircle, 
  Play, 
  Pause, 
  RotateCw, 
  Trash2, 
  ListOrdered, 
  Settings2,
  Crown,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { useProjects } from '../../context/ProjectContext';
import { useRenderQueue } from '../../context/RenderQueueContext';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenPro?: () => void;
}

export type ExportPresetId = 
  | 'youtube' 
  | 'youtube_shorts' 
  | 'instagram_reels' 
  | 'instagram_post' 
  | 'whatsapp_status' 
  | 'snapchat' 
  | 'tiktok' 
  | 'x_twitter' 
  | 'custom';

interface ExportPreset {
  id: ExportPresetId;
  name: string;
  platform: string;
  aspectRatio: '16:9' | '9:16' | '1:1' | '4:5';
  resolution: '720p' | '1080p' | '2K' | '4K';
  fps: 24 | 30 | 60;
  codec: 'H.264' | 'ProRes 422' | 'AV1' | 'VP9';
  bitrateMbps: number;
}

const EXPORT_PRESETS: ExportPreset[] = [
  { id: 'youtube', name: 'YouTube Video', platform: 'YouTube', aspectRatio: '16:9', resolution: '1080p', fps: 60, codec: 'H.264', bitrateMbps: 20 },
  { id: 'youtube_shorts', name: 'YouTube Shorts', platform: 'YouTube', aspectRatio: '9:16', resolution: '1080p', fps: 60, codec: 'H.264', bitrateMbps: 18 },
  { id: 'instagram_reels', name: 'Instagram Reels', platform: 'Instagram', aspectRatio: '9:16', resolution: '1080p', fps: 30, codec: 'H.264', bitrateMbps: 15 },
  { id: 'instagram_post', name: 'Instagram Post', platform: 'Instagram', aspectRatio: '1:1', resolution: '1080p', fps: 30, codec: 'H.264', bitrateMbps: 14 },
  { id: 'whatsapp_status', name: 'WhatsApp Status', platform: 'WhatsApp', aspectRatio: '9:16', resolution: '720p', fps: 30, codec: 'H.264', bitrateMbps: 8 },
  { id: 'snapchat', name: 'Snapchat Spotlight', platform: 'Snapchat', aspectRatio: '9:16', resolution: '1080p', fps: 30, codec: 'H.264', bitrateMbps: 16 },
  { id: 'tiktok', name: 'TikTok High-Res', platform: 'TikTok', aspectRatio: '9:16', resolution: '1080p', fps: 60, codec: 'H.264', bitrateMbps: 18 },
  { id: 'x_twitter', name: 'X / Twitter Post', platform: 'X', aspectRatio: '16:9', resolution: '1080p', fps: 30, codec: 'H.264', bitrateMbps: 12 },
  { id: 'custom', name: 'Custom Production Master', platform: 'Custom', aspectRatio: '16:9', resolution: '1080p', fps: 30, codec: 'H.264', bitrateMbps: 25 },
];

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  onOpenPro,
}) => {
  const { activeProject, recordEditAction } = useProjects();
  const { isPro, isOwner } = useAuth();
  const { jobs, addJob, cancelJob, retryJob, removeJob, clearCompletedJobs } = useRenderQueue();
  const { addNotification } = useNotifications();

  const [activeTab, setActiveTab] = useState<'compiler' | 'queue'>('compiler');
  const [selectedPresetId, setSelectedPresetId] = useState<ExportPresetId>('youtube');
  
  // Custom or override settings
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16' | '1:1' | '4:5'>('16:9');
  const [codec, setCodec] = useState<'H.264' | 'ProRes 422' | 'AV1' | 'VP9'>('H.264');
  const [resolution, setResolution] = useState<'720p' | '1080p' | '2K' | '4K'>('1080p');
  const [fps, setFps] = useState<24 | 30 | 60>(30);
  const [quality, setQuality] = useState<'draft' | 'balanced' | 'production' | 'master'>('production');
  const [isExporting, setIsExporting] = useState(false);

  // Hardware capability check for 4K
  const is4KHardwareSupported = typeof window !== 'undefined' && (() => {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl');
      if (!gl) return false;
      const maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE);
      return maxTextureSize >= 3840;
    } catch {
      return false;
    }
  })();

  if (!isOpen || !activeProject) return null;

  const handleApplyPreset = (preset: ExportPreset) => {
    setSelectedPresetId(preset.id);
    if (preset.id !== 'custom') {
      setAspectRatio(preset.aspectRatio);
      setResolution(preset.resolution);
      setFps(preset.fps);
      setCodec(preset.codec);
    }
  };

  // Estimate file size based on duration and bitrate
  const estimatedDurationSec = 60; // baseline 60s
  const bitrateMultiplier = quality === 'draft' ? 0.6 : quality === 'balanced' ? 0.8 : quality === 'production' ? 1.0 : 1.4;
  const resolutionMultiplier = resolution === '720p' ? 0.5 : resolution === '1080p' ? 1.0 : resolution === '2K' ? 1.8 : 3.5;
  const estimatedSizeMb = Math.round((estimatedDurationSec * 15 * bitrateMultiplier * resolutionMultiplier) / 8);

  const handleStartExport = () => {
    // Check 4K Pro access
    if (resolution === '4K' && !isPro && !isOwner) {
      if (onOpenPro) {
        onOpenPro();
      }
      return;
    }

    setIsExporting(true);

    const newJobId = addJob({
      title: `${resolution} ${codec} Render (${selectedPresetId.replace('_', ' ').toUpperCase()})`,
      projectTitle: activeProject.title,
      type: 'export',
      metadata: {
        resolution,
        codec,
        fps,
        aspectRatio,
        quality,
        estimatedSizeMb: `${estimatedSizeMb} MB`,
        timestamp: new Date().toISOString(),
      },
    });

    recordEditAction(
      'EXPORT_QUEUED',
      `Queued master export: ${activeProject.title} at ${resolution} (${codec})`,
      { jobId: newJobId, resolution, codec }
    );

    addNotification({
      category: 'render',
      title: 'Master Render Queued',
      message: `Export job for "${activeProject.title}" has been placed into the compiler queue.`,
    });

    setTimeout(() => {
      setIsExporting(false);
      setActiveTab('queue');
    }, 400);
  };

  const handleSaveResult = (job: any) => {
    // Generate a dummy or real blob download trigger
    const link = document.createElement('a');
    link.href = job.outputUrl || 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=1200&q=80';
    link.download = `${activeProject.title.toLowerCase().replace(/\s+/g, '_')}_master_${resolution.toLowerCase()}.${codec === 'ProRes 422' ? 'mov' : 'mp4'}`;
    link.target = '_blank';
    link.rel = 'noreferrer';
    link.click();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
      <div 
        id="export-center-modal"
        className="w-full max-w-3xl bg-white dark:bg-[#12151c] border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 shadow-2xl space-y-5 text-xs max-h-[92vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-neutral-100 dark:border-neutral-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 flex items-center justify-center shadow-xs">
              <Share2 className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-neutral-900 dark:text-neutral-100">
                  Export Center & Render Queue
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 font-mono text-[10px]">
                  {activeProject.title}
                </span>
              </div>
              <p className="text-neutral-500 text-[11px]">
                High-performance multi-threaded video encoding, presets, and background queue manager.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-2">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('compiler')}
              className={`px-3 py-1.5 rounded-lg font-medium flex items-center gap-1.5 transition-colors ${
                activeTab === 'compiler'
                  ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-950'
                  : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100'
              }`}
            >
              <Settings2 className="w-3.5 h-3.5" />
              <span>Export Compiler</span>
            </button>

            <button
              onClick={() => setActiveTab('queue')}
              className={`px-3 py-1.5 rounded-lg font-medium flex items-center gap-1.5 transition-colors ${
                activeTab === 'queue'
                  ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-950'
                  : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100'
              }`}
            >
              <ListOrdered className="w-3.5 h-3.5" />
              <span>Render Queue</span>
              {jobs.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-neutral-200 dark:bg-neutral-700 text-[10px] font-mono">
                  {jobs.length}
                </span>
              )}
            </button>
          </div>

          <div className="text-neutral-400 font-mono text-[11px]">
            Target: {resolution} • {codec} • {fps} fps
          </div>
        </div>

        {/* TAB 1: EXPORT COMPILER */}
        {activeTab === 'compiler' && (
          <div className="space-y-5">
            {/* Presets Matrix */}
            <div>
              <span className="font-semibold text-neutral-900 dark:text-neutral-100 font-mono text-[10px] uppercase block mb-2">
                Select Platform Preset
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {EXPORT_PRESETS.map(preset => {
                  const isSelected = selectedPresetId === preset.id;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => handleApplyPreset(preset)}
                      className={`p-2.5 rounded-xl border text-left transition-all ${
                        isSelected
                          ? 'border-neutral-900 dark:border-white bg-neutral-900/5 dark:bg-white/5 ring-1 ring-neutral-900 dark:ring-white'
                          : 'border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#151820] hover:border-neutral-400'
                      }`}
                    >
                      <div className="font-bold text-neutral-900 dark:text-neutral-100 text-[11px]">
                        {preset.name}
                      </div>
                      <div className="text-[10px] text-neutral-500 font-mono mt-0.5">
                        {preset.aspectRatio} • {preset.resolution} • {preset.fps}fps
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Granular Parameters */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/30">
              {/* Resolution */}
              <div>
                <label className="block text-neutral-500 font-mono text-[10px] uppercase mb-1">
                  Resolution
                </label>
                <select
                  value={resolution}
                  onChange={e => setResolution(e.target.value as any)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#151820] text-neutral-900 dark:text-neutral-100 font-medium"
                >
                  <option value="720p">720p HD (1280x720)</option>
                  <option value="1080p">1080p Full HD (1920x1080)</option>
                  <option value="2K">2K Quad HD (2560x1440)</option>
                  <option value="4K">4K Ultra HD (3840x2160) {isPro ? '👑' : '🔒 Pro'}</option>
                </select>
                {resolution === '4K' && !isPro && (
                  <div className="mt-1 text-[10px] text-amber-600 dark:text-amber-400 flex items-center gap-1">
                    <Crown className="w-3 h-3" /> Pro Tier membership required
                  </div>
                )}
                {resolution === '4K' && !is4KHardwareSupported && (
                  <div className="mt-1 text-[10px] text-rose-500 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> Device GPU canvas limits may cause frame throttling
                  </div>
                )}
              </div>

              {/* Codec */}
              <div>
                <label className="block text-neutral-500 font-mono text-[10px] uppercase mb-1">
                  Codec & Container
                </label>
                <select
                  value={codec}
                  onChange={e => setCodec(e.target.value as any)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#151820] text-neutral-900 dark:text-neutral-100 font-medium"
                >
                  <option value="H.264">MP4 (H.264 / AVC) - Universal</option>
                  <option value="ProRes 422">ProRes 422 HQ (Broadcast)</option>
                  <option value="AV1">WebM (AV1) - High Efficiency</option>
                  <option value="VP9">WebM (VP9) - Web Native</option>
                </select>
              </div>

              {/* FPS */}
              <div>
                <label className="block text-neutral-500 font-mono text-[10px] uppercase mb-1">
                  Framerate (FPS)
                </label>
                <select
                  value={fps}
                  onChange={e => setFps(Number(e.target.value) as any)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#151820] text-neutral-900 dark:text-neutral-100 font-medium"
                >
                  <option value={24}>24 fps (Cinematic Film)</option>
                  <option value={30}>30 fps (Broadcast Standard)</option>
                  <option value={60}>60 fps (Smooth Motion)</option>
                </select>
              </div>
            </div>

            {/* Quality & Aspect Ratio */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-neutral-500 font-mono text-[10px] uppercase mb-1">
                  Aspect Ratio
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {(['16:9', '9:16', '1:1', '4:5'] as const).map(ar => (
                    <button
                      key={ar}
                      type="button"
                      onClick={() => setAspectRatio(ar)}
                      className={`py-1.5 rounded-lg border text-center font-mono text-[11px] ${
                        aspectRatio === ar
                          ? 'border-neutral-900 dark:border-white bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 font-bold'
                          : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-400'
                      }`}
                    >
                      {ar}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-neutral-500 font-mono text-[10px] uppercase mb-1">
                  Bitrate Profile
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {(['draft', 'balanced', 'production', 'master'] as const).map(q => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => setQuality(q)}
                      className={`py-1.5 rounded-lg border text-center capitalize font-mono text-[10px] ${
                        quality === q
                          ? 'border-neutral-900 dark:border-white bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 font-bold'
                          : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-400'
                      }`}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Output Metrics Bar */}
            <div className="p-3.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-4 text-neutral-600 dark:text-neutral-400 font-mono text-[11px]">
                <div className="flex items-center gap-1.5">
                  <HardDrive className="w-3.5 h-3.5 text-neutral-500" />
                  <span>Est. Size: ~{estimatedSizeMb} MB</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-neutral-500" />
                  <span>Engine: Hardware WebCodecs</span>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3.5 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 font-medium"
                >
                  Cancel
                </button>
                <button
                  id="export-submit-master-btn"
                  type="button"
                  onClick={handleStartExport}
                  disabled={isExporting}
                  className="px-5 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-200 text-white dark:text-neutral-950 font-bold flex items-center gap-1.5 shadow-xs disabled:opacity-50"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>{isExporting ? 'Queueing...' : 'Queue Master Export'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: RENDER QUEUE */}
        {activeTab === 'queue' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-neutral-500 text-[11px]">
                Background jobs compile concurrently while you continue editing in any studio.
              </div>
              {jobs.some(j => j.status === 'completed') && (
                <button
                  onClick={clearCompletedJobs}
                  className="text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 font-mono text-[11px] flex items-center gap-1"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Clear Completed</span>
                </button>
              )}
            </div>

            {jobs.length === 0 ? (
              <div className="p-8 text-center border border-dashed border-neutral-200 dark:border-neutral-800 rounded-xl space-y-2">
                <ListOrdered className="w-8 h-8 text-neutral-400 mx-auto" />
                <div className="font-bold text-neutral-700 dark:text-neutral-300">No Active Render Jobs</div>
                <p className="text-neutral-400 text-[11px]">Configure an export in the compiler tab to dispatch a background encoding job.</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {jobs.map(job => {
                  const isRunning = job.status === 'running';
                  const isCompleted = job.status === 'completed';
                  const isFailed = job.status === 'failed' || job.status === 'paused';

                  return (
                    <div
                      key={job.id}
                      className="p-3.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#151820] space-y-2 shadow-xs"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="font-bold text-neutral-900 dark:text-neutral-100 text-xs flex items-center gap-2">
                            <span>{job.title}</span>
                            <span
                              className={`px-1.5 py-0.2 rounded font-mono text-[9px] uppercase font-bold ${
                                isCompleted
                                  ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-400'
                                  : isRunning
                                  ? 'bg-blue-500/20 text-blue-700 dark:text-blue-400'
                                  : 'bg-amber-500/20 text-amber-700 dark:text-amber-400'
                              }`}
                            >
                              {job.status}
                            </span>
                          </div>
                          <div className="text-neutral-500 text-[10px] font-mono mt-0.5">
                            {job.projectTitle} • Queued {new Date(job.createdAt).toLocaleTimeString()} • {job.elapsedSec}s elapsed
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                          {isRunning && (
                            <button
                              onClick={() => cancelJob(job.id)}
                              className="px-2 py-1 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 text-[10px] font-mono"
                              title="Pause / cancel render"
                            >
                              Pause
                            </button>
                          )}

                          {isFailed && (
                            <button
                              onClick={() => retryJob(job.id)}
                              className="px-2 py-1 rounded bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 text-[10px] font-mono flex items-center gap-1"
                              title="Retry render"
                            >
                              <RotateCw className="w-3 h-3" />
                              <span>Retry</span>
                            </button>
                          )}

                          {isCompleted && (
                            <button
                              onClick={() => handleSaveResult(job)}
                              className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] font-mono flex items-center gap-1 shadow-xs"
                              title="Download master output"
                            >
                              <Download className="w-3 h-3" />
                              <span>Save Master</span>
                            </button>
                          )}

                          <button
                            onClick={() => removeJob(job.id)}
                            className="p-1 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded"
                            title="Remove from queue"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] font-mono text-neutral-400">
                          <span>
                            {isCompleted ? 'Compiler Finished' : isRunning ? `Encoding... (${job.progress}%)` : 'Standby in queue'}
                          </span>
                          <span>{job.progress}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                          <div
                            style={{ width: `${job.progress}%` }}
                            className={`h-full rounded-full transition-all duration-300 ${
                              isCompleted
                                ? 'bg-emerald-500'
                                : isRunning
                                ? 'bg-neutral-900 dark:bg-white'
                                : 'bg-amber-500'
                            }`}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
