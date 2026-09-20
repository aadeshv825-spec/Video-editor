/**
 * Browser & Device Hardware Capability Detection Service
 * Evaluates real client hardware constraints (WebGL, WebGPU, Canvas, WebCodecs)
 * to ensure models never fail due to unhandled browser limitations.
 */

export interface HardwareCapabilities {
  hasCanvas2D: boolean;
  hasWebGL: boolean;
  hasWebGL2: boolean;
  hasWebGPU: boolean;
  hasWebCodecs: boolean;
  hasAudioContext: boolean;
  deviceMemoryTier: 'low' | 'medium' | 'high';
  hardwareConcurrency: number;
}

let cachedCapabilities: HardwareCapabilities | null = null;

export function detectHardwareCapabilities(): HardwareCapabilities {
  if (cachedCapabilities) return cachedCapabilities;

  const isBrowser = typeof window !== 'undefined';
  if (!isBrowser) {
    return {
      hasCanvas2D: true,
      hasWebGL: true,
      hasWebGL2: true,
      hasWebGPU: false,
      hasWebCodecs: false,
      hasAudioContext: true,
      deviceMemoryTier: 'high',
      hardwareConcurrency: 8,
    };
  }

  // 1. Canvas 2D
  let hasCanvas2D = false;
  try {
    const canvas = document.createElement('canvas');
    hasCanvas2D = Boolean(canvas.getContext('2d'));
  } catch {
    hasCanvas2D = false;
  }

  // 2. WebGL & WebGL2
  let hasWebGL = false;
  let hasWebGL2 = false;
  try {
    const canvas = document.createElement('canvas');
    hasWebGL = Boolean(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
    hasWebGL2 = Boolean(canvas.getContext('webgl2'));
  } catch {
    hasWebGL = false;
    hasWebGL2 = false;
  }

  // 3. WebGPU
  const hasWebGPU = Boolean((navigator as any).gpu);

  // 4. WebCodecs (VideoDecoder)
  const hasWebCodecs = typeof (window as any).VideoDecoder !== 'undefined';

  // 5. AudioContext
  const hasAudioContext = typeof window.AudioContext !== 'undefined' || typeof (window as any).webkitAudioContext !== 'undefined';

  // 6. Device Memory
  const navMemory = (navigator as any).deviceMemory || 4;
  const deviceMemoryTier: 'low' | 'medium' | 'high' =
    navMemory >= 8 ? 'high' : navMemory >= 4 ? 'medium' : 'low';

  const hardwareConcurrency = navigator.hardwareConcurrency || 4;

  cachedCapabilities = {
    hasCanvas2D,
    hasWebGL,
    hasWebGL2,
    hasWebGPU,
    hasWebCodecs,
    hasAudioContext,
    deviceMemoryTier,
    hardwareConcurrency,
  };

  return cachedCapabilities;
}

export function checkHardwareSupportForTask(taskType: string): {
  supported: boolean;
  reason?: string;
  suggestedAction?: string;
} {
  const caps = detectHardwareCapabilities();

  if (!caps.hasCanvas2D) {
    return {
      supported: false,
      reason: 'Browser Canvas 2D rendering pipeline is unavailable.',
      suggestedAction: 'Please update your browser or enable hardware acceleration.',
    };
  }

  if (taskType.includes('video') && !caps.hasWebGL && !caps.hasWebGL2) {
    return {
      supported: false,
      reason: 'Hardware WebGL acceleration is disabled or unsupported.',
      suggestedAction: 'Enable hardware acceleration in browser flags or use cloud rendering.',
    };
  }

  return { supported: true };
}
