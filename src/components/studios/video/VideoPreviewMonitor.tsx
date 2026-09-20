import React, { useRef, useState, useEffect } from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  RotateCcw,
  Maximize2,
  Minimize2,
  Grid,
  Volume2,
  VolumeX,
  Gauge,
  Sparkles,
  Columns,
  Cpu,
  Layers,
} from 'lucide-react';
import { TimelineClip, TimelineTrack } from '../../../types/videoEditor';

interface VideoPreviewMonitorProps {
  tracks: TimelineTrack[];
  clips: TimelineClip[];
  playheadSec: number;
  totalDurationSec: number;
  isPlaying: boolean;
  fps?: number;
  aspectRatio?: '16:9' | '9:16' | '1:1' | '21:9' | '4:5';
  resolution?: string;
  selectedClipId: string | null;
  onTogglePlay: () => void;
  onSeek: (timeSec: number) => void;
  onOpenRenderQueue?: () => void;
  activeJobsCount?: number;
}

export const VideoPreviewMonitor: React.FC<VideoPreviewMonitorProps> = ({
  tracks,
  clips,
  playheadSec,
  totalDurationSec,
  isPlaying,
  fps = 30,
  aspectRatio = '16:9',
  resolution = '1080p',
  selectedClipId,
  onTogglePlay,
  onSeek,
  onOpenRenderQueue,
  activeJobsCount = 0,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSafeZones, setShowSafeZones] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [isLooping, setIsLooping] = useState(false);
  const [showSplitCompare, setShowSplitCompare] = useState(false);
  const [proxyResolution, setProxyResolution] = useState<'full' | 'half' | 'quarter'>('half');

  // Format SMPTE timecode 00:00:00:00
  const formatTimecode = (sec: number) => {
    const s = Math.max(0, sec);
    const m = Math.floor(s / 60);
    const remainingSec = Math.floor(s % 60);
    const frame = Math.floor((s % 1) * fps);
    return `00:${String(m).padStart(2, '0')}:${String(remainingSec).padStart(2, '0')}:${String(frame).padStart(2, '0')}`;
  };

  // Find all clips active at current playhead position
  const activeClips = clips.filter(clip => {
    if (clip.disabled) return false;
    const track = tracks.find(t => t.id === clip.trackId);
    if (track?.hidden) return false;
    return playheadSec >= clip.startSec && playheadSec <= clip.startSec + clip.durationSec;
  });

  // Track hierarchy sort
  const trackOrder: Record<string, number> = {
    v1: 10,
    v2: 20,
    v3: 30,
    v4: 35,
    t1: 40,
    t2: 50,
  };

  // Check for active adjustment layers
  const activeAdjustmentClips = activeClips.filter(c => c.type === 'adjustment');
  const hasAdjustment = activeAdjustmentClips.length > 0;
  const topAdjustment = activeAdjustmentClips[activeAdjustmentClips.length - 1];

  const visualClips = activeClips
    .filter(c => c.type === 'video' || c.type === 'image' || c.type === 'text' || c.type === 'compound')
    .sort((a, b) => (trackOrder[a.trackId] || 0) - (trackOrder[b.trackId] || 0));

  // Determine aspect ratio class
  const getAspectRatioClass = () => {
    switch (aspectRatio) {
      case '9:16':
        return 'aspect-[9/16] max-w-[280px]';
      case '1:1':
        return 'aspect-square max-w-[420px]';
      case '21:9':
        return 'aspect-[21/9] max-w-[760px]';
      case '4:5':
        return 'aspect-[4/5] max-w-[360px]';
      case '16:9':
      default:
        return 'aspect-video max-w-[640px]';
    }
  };

  // Step frame by frame
  const handleStepFrame = (direction: -1 | 1) => {
    const frameDuration = 1 / fps;
    const newTime = Math.max(0, Math.min(totalDurationSec, playheadSec + direction * frameDuration));
    onSeek(newTime);
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  return (
    <div
      ref={containerRef}
      id="video-preview-monitor"
      className="flex-1 flex flex-col bg-[#08090b] relative select-none overflow-hidden"
    >
      {/* Top Monitor Status Header */}
      <div className="h-8 px-4 border-b border-neutral-800/80 bg-neutral-950/80 flex items-center justify-between text-xs text-neutral-400 shrink-0">
        <div className="flex items-center gap-2">
          {/* Timecode readout */}
          <div className="font-mono text-emerald-400 font-semibold tracking-wider text-[11px] bg-emerald-950/30 px-2 py-0.5 rounded border border-emerald-800/40">
            {formatTimecode(playheadSec)}
          </div>

          <span className="text-[10px] text-neutral-500 font-mono">
            / {formatTimecode(totalDurationSec)}
          </span>

          <span className="text-[10px] text-neutral-600">|</span>

          {/* Resolution & FPS badge */}
          <span className="text-[10px] font-mono text-neutral-400 hidden sm:inline">
            {resolution} @ {fps}fps
          </span>

          {/* Proxy Media Status */}
          <button
            onClick={() =>
              setProxyResolution(p => (p === 'full' ? 'half' : p === 'half' ? 'quarter' : 'full'))
            }
            className={`hidden sm:inline-block px-1.5 py-0.2 rounded font-mono text-[9px] border transition-colors ${
              proxyResolution === 'full'
                ? 'border-neutral-700 text-neutral-400'
                : 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400 font-medium'
            }`}
            title="Toggle Proxy Playback Performance Mode"
          >
            Proxy: {proxyResolution.toUpperCase()}
          </button>
        </div>

        {/* Right tools: A/B Split, Safe Zones, Render Queue */}
        <div className="flex items-center gap-1.5">
          {/* Render Queue shortcut */}
          {onOpenRenderQueue && (
            <button
              onClick={onOpenRenderQueue}
              className="hidden sm:flex px-2 py-0.5 rounded border border-neutral-700 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 text-[10px] font-mono items-center gap-1 transition-colors"
              title="Open Background Render Queue"
            >
              <Cpu className="w-3 h-3 text-purple-400" />
              <span>Render Queue</span>
              {activeJobsCount > 0 && (
                <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse" />
              )}
            </button>
          )}

          {/* Split Screen A/B Comparison */}
          <button
            onClick={() => setShowSplitCompare(s => !s)}
            className={`hidden sm:inline-block p-1.5 rounded hover:bg-neutral-800 transition-colors ${
              showSplitCompare ? 'text-purple-400 bg-purple-950/40' : 'text-neutral-400'
            }`}
            title="Toggle Split-Screen A/B Color & VFX Comparison"
          >
            <Columns className="w-3.5 h-3.5" />
          </button>

          {/* Safe Zones */}
          <button
            onClick={() => setShowSafeZones(s => !s)}
            className={`hidden sm:inline-block p-1.5 rounded hover:bg-neutral-800 transition-colors ${
              showSafeZones ? 'text-amber-400 bg-amber-950/40' : 'text-neutral-400'
            }`}
            title="Toggle Broadcast Title/Action Safe Zones"
          >
            <Grid className="w-3.5 h-3.5" />
          </button>

          {/* Fullscreen */}
          <button
            onClick={toggleFullscreen}
            className="p-1.5 rounded hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors"
            title="Toggle Fullscreen Monitor"
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Main Video Viewport Canvas */}
      <div className="flex-1 flex items-center justify-center p-4 relative overflow-hidden bg-radial from-neutral-900/50 to-[#050608]">
        <div
          id="preview-viewport-frame"
          className={`w-full relative shadow-2xl rounded-sm overflow-hidden bg-black border border-neutral-800/80 ${getAspectRatioClass()}`}
        >
          {visualClips.length === 0 ? (
            <div className="w-full h-full flex flex-col items-center justify-center text-neutral-600 font-mono text-xs p-4 text-center">
              <p>Black Frame (No media at playhead)</p>
              <p className="text-[10px] text-neutral-700 mt-1">
                Drag clips onto video tracks to composite
              </p>
            </div>
          ) : (
            visualClips.map(clip => {
              const { transform, colorAdjustments, text, transitionIn, transitionOut } = clip;
              const clipRemaining = clip.startSec + clip.durationSec - playheadSec;
              const clipElapsed = playheadSec - clip.startSec;

              // Transitions opacity
              let transitionOpacity = 1;
              if (
                transitionIn &&
                transitionIn.type !== 'none' &&
                clipElapsed < transitionIn.durationSec
              ) {
                const ratio = Math.max(0, clipElapsed / transitionIn.durationSec);
                if (transitionIn.type === 'crossfade' || transitionIn.type === 'dip-black') {
                  transitionOpacity = ratio;
                }
              } else if (
                transitionOut &&
                transitionOut.type !== 'none' &&
                clipRemaining < transitionOut.durationSec
              ) {
                const ratio = Math.max(0, clipRemaining / transitionOut.durationSec);
                if (transitionOut.type === 'crossfade' || transitionOut.type === 'dip-black') {
                  transitionOpacity *= ratio;
                }
              }

              // Transform CSS
              const transformString = `
                translate(${transform.positionX}px, ${transform.positionY}px)
                scale(${transform.scale / 100})
                rotate(${transform.rotation}deg)
                scaleX(${transform.flipHorizontal ? -1 : 1})
                scaleY(${transform.flipVertical ? -1 : 1})
              `;

              // Color adjustments CSS filters
              // If split comparison active, suppress color grades on left side
              const effectiveBrightness = 100 + colorAdjustments.brightness + colorAdjustments.exposure * 0.5;
              const effectiveContrast = 100 + colorAdjustments.contrast;
              const effectiveSaturation = colorAdjustments.saturation;
              const effectiveBlur = colorAdjustments.blur;
              const effectiveHue = colorAdjustments.tint * 0.8;

              const filterString = showSplitCompare
                ? 'none'
                : `
                brightness(${effectiveBrightness}%)
                contrast(${effectiveContrast}%)
                saturate(${effectiveSaturation}%)
                hue-rotate(${effectiveHue}deg)
                blur(${effectiveBlur}px)
              `;

              // Crop clip-path
              let clipPath = `inset(${transform.cropTop}% ${transform.cropRight}% ${transform.cropBottom}% ${transform.cropLeft}%)`;

              // Mask support
              if (clip.masks && clip.masks.length > 0 && clip.masks[0].enabled) {
                const m = clip.masks[0];
                if (m.type === 'rectangle') {
                  clipPath = `inset(${m.rectY || 20}% ${100 - ((m.rectX || 20) + (m.rectWidth || 60))}% ${100 - ((m.rectY || 20) + (m.rectHeight || 60))}% ${m.rectX || 20}%)`;
                } else if (m.type === 'ellipse') {
                  clipPath = 'ellipse(35% 35% at 50% 50%)';
                }
              }

              // Temperature overlay tint
              const tempOverlayOpacity = Math.abs(colorAdjustments.temperature) / 200;
              const tempOverlayColor =
                colorAdjustments.temperature > 0
                  ? `rgba(255, 140, 0, ${tempOverlayOpacity})`
                  : `rgba(0, 150, 255, ${tempOverlayOpacity})`;

              const isSelected = clip.id === selectedClipId;
              const blendMode = (transform.blendMode as any) || 'normal';

              // Chroma Key Matte Preview Mode
              const isChromaMatte = clip.chromaKey?.enabled && clip.chromaKey.mattePreview === 'matte';

              return (
                <div
                  key={clip.id}
                  className={`absolute inset-0 flex items-center justify-center pointer-events-none ${
                    isSelected ? 'ring-1 ring-white/30' : ''
                  }`}
                  style={{
                    opacity: (transform.opacity / 100) * transitionOpacity,
                    clipPath,
                    mixBlendMode: blendMode,
                  }}
                >
                  {/* Layer content */}
                  {clip.type === 'video' || clip.type === 'image' || clip.type === 'compound' ? (
                    <div
                      className={`w-full h-full relative flex items-center justify-center ${
                        isChromaMatte ? 'grayscale contrast-200 brightness-150' : ''
                      }`}
                      style={{
                        transform: transformString,
                        filter: filterString,
                        transformOrigin: 'center center',
                      }}
                    >
                      {clip.url ? (
                        <img
                          src={clip.url}
                          alt={clip.title}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-tr from-neutral-900 to-neutral-800 flex items-center justify-center text-neutral-400 font-mono text-sm">
                          {clip.title}
                        </div>
                      )}

                      {/* Temperature Overlay Filter */}
                      {!showSplitCompare && colorAdjustments.temperature !== 0 && (
                        <div
                          className="absolute inset-0 pointer-events-none mix-blend-color"
                          style={{ backgroundColor: tempOverlayColor }}
                        />
                      )}
                    </div>
                  ) : clip.type === 'text' && text ? (
                    <div
                      className="w-full h-full flex items-center justify-center p-6 text-center"
                      style={{
                        transform: transformString,
                        transformOrigin: 'center center',
                      }}
                    >
                      <div
                        style={{
                          fontFamily: text.fontFamily,
                          fontSize: `${text.fontSize}px`,
                          color: text.color,
                          textAlign: text.alignment,
                          opacity: text.opacity / 100,
                          textShadow: '0 2px 10px rgba(0,0,0,0.85)',
                          lineHeight: 1.2,
                        }}
                        className={`font-semibold tracking-wider ${
                          text.animation === 'fade' ? 'animate-fade' : ''
                        }`}
                      >
                        {text.text}
                      </div>
                    </div>
                  ) : null}
                </div>
              );
            })
          )}

          {/* Active Adjustment Layer Filter Composited on Top of Scene */}
          {hasAdjustment && topAdjustment && (
            <div
              className="absolute inset-0 pointer-events-none z-20 mix-blend-overlay"
              style={{
                opacity: (topAdjustment.transform.opacity || 100) / 100,
                backdropFilter: `contrast(${100 + (topAdjustment.colorAdjustments?.contrast || 0)}%) saturate(${topAdjustment.colorAdjustments?.saturation || 100}%)`,
              }}
            />
          )}

          {/* Split Screen Before / After Comparison Guide */}
          {showSplitCompare && (
            <div className="absolute inset-0 pointer-events-none z-30 flex">
              <div className="w-1/2 h-full border-r border-white/80 relative flex items-start justify-start p-2">
                <span className="font-mono text-[9px] bg-black/80 text-white px-1.5 py-0.5 rounded">
                  RAW (BEFORE)
                </span>
              </div>
              <div className="w-1/2 h-full relative flex items-start justify-end p-2">
                <span className="font-mono text-[9px] bg-purple-950/80 text-purple-300 px-1.5 py-0.5 rounded border border-purple-800/40">
                  GRADED (AFTER)
                </span>
              </div>
            </div>
          )}

          {/* Action & Title Safe Zones Overlay */}
          {showSafeZones && (
            <div className="absolute inset-0 pointer-events-none z-30">
              {/* Action Safe (93%) */}
              <div className="absolute inset-[3.5%] border border-dashed border-amber-400/40 rounded-xs" />
              {/* Title Safe (90%) */}
              <div className="absolute inset-[5%] border border-cyan-400/50 rounded-xs">
                <span className="absolute top-1 left-1 font-mono text-[8px] text-cyan-400/70">
                  TITLE SAFE (90%)
                </span>
              </div>
              {/* Center Crosshair */}
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none flex items-center justify-center text-white/50">
                <div className="w-full h-[1px] bg-white/40 absolute" />
                <div className="h-full w-[1px] bg-white/40 absolute" />
              </div>
            </div>
          )}

          {/* Active Audio Indicator Bar */}
          <div className="absolute bottom-2 left-2 flex items-center gap-1.5 px-2 py-1 rounded bg-black/70 backdrop-blur-xs text-[10px] font-mono text-neutral-300 z-20">
            <Volume2 className="w-3 h-3 text-emerald-400" />
            <span>32-BIT MASTER</span>
            <div className="flex items-center gap-0.5 ml-1">
              <span className="w-1 h-2 bg-emerald-500 rounded-xs" />
              <span className="w-1 h-3 bg-emerald-500 rounded-xs" />
              <span className="w-1 h-2.5 bg-emerald-400 rounded-xs" />
              <span className="w-1 h-1.5 bg-neutral-600 rounded-xs" />
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Transport Controls Bar */}
      <div className="h-12 px-6 border-t border-neutral-800/80 bg-neutral-950/90 flex items-center justify-between text-xs text-neutral-300 shrink-0">
        {/* Left: Rewind / Step */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onSeek(0)}
            className="p-1.5 rounded hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors"
            title="Return to start (00:00:00:00)"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            onClick={() => handleStepFrame(-1)}
            className="p-1.5 rounded hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors"
            title="Step backward 1 frame (Left Arrow)"
          >
            <SkipBack className="w-4 h-4" />
          </button>
        </div>

        {/* Center: Play/Pause Transport */}
        <div className="flex items-center gap-3">
          <button
            id="play-pause-button"
            onClick={onTogglePlay}
            className="w-9 h-9 rounded-full bg-white text-black hover:bg-neutral-200 flex items-center justify-center shadow-lg transition-transform active:scale-95"
            title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
          >
            {isPlaying ? <Pause className="w-4 h-4 fill-black" /> : <Play className="w-4 h-4 fill-black ml-0.5" />}
          </button>

          <button
            onClick={() => handleStepFrame(1)}
            className="p-1.5 rounded hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors"
            title="Step forward 1 frame (Right Arrow)"
          >
            <SkipForward className="w-4 h-4" />
          </button>
        </div>

        {/* Right: Playback Speed & Looping */}
        <div className="flex items-center gap-2">
          <button
            onClick={() =>
              setPlaybackSpeed(s => (s === 1.0 ? 1.5 : s === 1.5 ? 2.0 : s === 2.0 ? 0.5 : 1.0))
            }
            className="font-mono text-[10px] px-2 py-0.5 rounded border border-neutral-800 bg-neutral-900 text-neutral-400 hover:text-white"
            title="Playback Speed Multiplier"
          >
            {playbackSpeed}x
          </button>

          <button
            onClick={() => setIsLooping(l => !l)}
            className={`p-1.5 rounded transition-colors ${
              isLooping ? 'text-emerald-400 bg-emerald-950/40' : 'text-neutral-500 hover:text-white'
            }`}
            title="Loop Timeline Playback"
          >
            <Gauge className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
