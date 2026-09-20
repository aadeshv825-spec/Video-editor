export type PhotoBlendMode =
  | 'normal'
  | 'multiply'
  | 'screen'
  | 'overlay'
  | 'darken'
  | 'lighten'
  | 'color-dodge'
  | 'color-burn'
  | 'hard-light'
  | 'soft-light'
  | 'difference'
  | 'exclusion';

export type PhotoLayerType = 'image' | 'draw' | 'text' | 'shape' | 'adjustment';

export type PhotoShapeType = 'rectangle' | 'ellipse' | 'polygon' | 'line' | 'arrow';

export type PhotoToolType =
  | 'select'
  | 'crop'
  | 'transform'
  | 'adjust'
  | 'brush'
  | 'eraser'
  | 'shape'
  | 'text'
  | 'marquee'
  | 'lasso'
  | 'ai_prep';

export interface PhotoAdjustments {
  exposure: number;     // -100 to 100
  brightness: number;   // -100 to 100
  contrast: number;     // -100 to 100
  saturation: number;   // -100 to 100
  temperature: number;  // -100 (cool/blue) to 100 (warm/amber)
  tint: number;         // -100 (green) to 100 (magenta)
  highlights: number;   // -100 to 100
  shadows: number;      // -100 to 100
  whites: number;       // -100 to 100
  blacks: number;       // -100 to 100
  sharpen: number;      // 0 to 100
  blur: number;         // 0 to 50
  vignette: number;     // 0 to 100
  grain: number;        // 0 to 100
}

export const DEFAULT_PHOTO_ADJUSTMENTS: PhotoAdjustments = {
  exposure: 0,
  brightness: 0,
  contrast: 0,
  saturation: 0,
  temperature: 0,
  tint: 0,
  highlights: 0,
  shadows: 0,
  whites: 0,
  blacks: 0,
  sharpen: 0,
  blur: 0,
  vignette: 0,
  grain: 0,
};

export interface CropRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export type AspectRatioPreset = 'free' | '1:1' | '4:5' | '16:9' | '9:16' | '3:2' | '2:3';

export interface PhotoTransform {
  crop: CropRect;
  cropPreset: AspectRatioPreset;
  rotation: number;        // degrees: 0, 90, 180, 270 or arbitrary
  flipHorizontal: boolean;
  flipVertical: boolean;
  straighten: number;      // -45 to 45 deg
  perspectiveX: number;    // -50 to 50 deg
  perspectiveY: number;    // -50 to 50 deg
  canvasWidth: number;
  canvasHeight: number;
}

export const DEFAULT_PHOTO_TRANSFORM: PhotoTransform = {
  crop: { x: 0, y: 0, width: 100, height: 100 },
  cropPreset: 'free',
  rotation: 0,
  flipHorizontal: false,
  flipVertical: false,
  straighten: 0,
  perspectiveX: 0,
  perspectiveY: 0,
  canvasWidth: 1200,
  canvasHeight: 1500,
};

export interface DrawPoint {
  x: number;
  y: number;
}

export interface DrawPath {
  id: string;
  points: DrawPoint[];
  color: string;
  strokeWidth: number;
  opacity: number;
  isEraser?: boolean;
}

export interface ShapeElement {
  id: string;
  type: PhotoShapeType;
  x: number;
  y: number;
  width: number;
  height: number;
  fillColor: string;
  strokeColor: string;
  strokeWidth: number;
  opacity: number;
  cornerRadius?: number;
  arrowEnd?: boolean;
}

export interface TextElement {
  id: string;
  text: string;
  x: number;
  y: number;
  fontSize: number;
  fontFamily: string;
  color: string;
  fontWeight: string;
  textAlign: 'left' | 'center' | 'right';
  opacity: number;
}

export interface SelectionRegion {
  type: 'marquee' | 'ellipse' | 'lasso' | 'none';
  x: number;
  y: number;
  width: number;
  height: number;
  points?: DrawPoint[];
  active: boolean;
}

export interface PhotoLayer {
  id: string;
  name: string;
  type: PhotoLayerType;
  visible: boolean;
  opacity: number; // 0 to 100
  blendMode: PhotoBlendMode;
  isMasked: boolean;
  maskInverted: boolean;
  imageUrl?: string;
  originalImageUrl?: string; // Always preserves original image untouched
  drawPaths?: DrawPath[];
  shapes?: ShapeElement[];
  texts?: TextElement[];
  adjustments?: Partial<PhotoAdjustments>;
  isLocked?: boolean;
}

export interface PhotoProjectState {
  layers: PhotoLayer[];
  activeLayerId: string;
  globalAdjustments: PhotoAdjustments;
  transform: PhotoTransform;
  zoom: number; // 25 to 400 percent
  selection: SelectionRegion;
  activeTool: PhotoToolType;
  brushConfig: {
    color: string;
    size: number;
    opacity: number;
  };
  shapeConfig: {
    type: PhotoShapeType;
    fillColor: string;
    strokeColor: string;
    strokeWidth: number;
  };
  textConfig: {
    fontSize: number;
    fontFamily: string;
    color: string;
    fontWeight: string;
  };
}
