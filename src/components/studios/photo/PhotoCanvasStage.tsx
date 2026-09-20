import React, { useRef, useEffect, useState } from 'react';
import {
  PhotoLayer,
  PhotoAdjustments,
  PhotoTransform,
  DrawPath,
  ShapeElement,
  TextElement,
  SelectionRegion,
  PhotoToolType,
} from '../../../types/photoEditor';

interface PhotoCanvasStageProps {
  layers: PhotoLayer[];
  activeLayerId: string;
  adjustments: PhotoAdjustments;
  transform: PhotoTransform;
  zoom: number;
  activeTool: PhotoToolType;
  selection: SelectionRegion;
  brushConfig: {
    color: string;
    size: number;
    opacity: number;
  };
  shapeConfig: {
    type: string;
    fillColor: string;
    strokeColor: string;
    strokeWidth: number;
  };
  onUpdateLayerPaths?: (layerId: string, paths: DrawPath[]) => void;
  onUpdateLayerShapes?: (layerId: string, shapes: ShapeElement[]) => void;
  onUpdateLayerTexts?: (layerId: string, texts: TextElement[]) => void;
  onSelectText?: (textId: string) => void;
  onUpdateCrop?: (crop: { x: number; y: number; width: number; height: number }) => void;
}

export const PhotoCanvasStage: React.FC<PhotoCanvasStageProps> = ({
  layers,
  activeLayerId,
  adjustments,
  transform,
  zoom,
  activeTool,
  selection,
  brushConfig,
  shapeConfig,
  onUpdateLayerPaths,
  onUpdateLayerShapes,
  onUpdateLayerTexts,
  onUpdateCrop,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPath, setCurrentPath] = useState<{ x: number; y: number }[]>([]);
  const [isCropping, setIsCropping] = useState(false);
  const [cropDragStart, setCropDragStart] = useState<{ x: number; y: number } | null>(null);

  // Active layer
  const activeLayer = layers.find(l => l.id === activeLayerId);

  // Generate CSS filter string from adjustments
  const getCssFilter = (adj: PhotoAdjustments) => {
    // exposure maps to brightness multiplier (-100..100 -> 0..2)
    const exposureVal = 1 + adj.exposure / 100;
    const brightnessVal = 1 + adj.brightness / 100;
    const contrastVal = 1 + adj.contrast / 100;
    const saturationVal = 1 + adj.saturation / 100;
    const blurPx = (adj.blur / 50) * 10;

    return `brightness(${exposureVal * brightnessVal}) contrast(${contrastVal}) saturate(${saturationVal}) blur(${blurPx}px)`;
  };

  // Straighten + Rotation + Flips + Perspective transform style
  const getTransformStyle = () => {
    const totalRotation = transform.rotation + transform.straighten;
    const scaleX = transform.flipHorizontal ? -1 : 1;
    const scaleY = transform.flipVertical ? -1 : 1;
    const pX = transform.perspectiveX;
    const pY = transform.perspectiveY;

    return {
      transform: `perspective(1000px) rotateX(${pY}deg) rotateY(${pX}deg) rotate(${totalRotation}deg) scale(${scaleX}, ${scaleY})`,
      transformOrigin: 'center center',
      transition: 'transform 0.15s ease-out',
    };
  };

  // Handle Brush drawing on Canvas
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (activeTool !== 'brush' && activeTool !== 'eraser') return;
    const stage = containerRef.current?.getBoundingClientRect();
    if (!stage) return;

    const x = ((e.clientX - stage.left) / stage.width) * 100;
    const y = ((e.clientY - stage.top) / stage.height) * 100;

    setIsDrawing(true);
    setCurrentPath([{ x, y }]);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDrawing) return;
    const stage = containerRef.current?.getBoundingClientRect();
    if (!stage) return;

    const x = ((e.clientX - stage.left) / stage.width) * 100;
    const y = ((e.clientY - stage.top) / stage.height) * 100;

    setCurrentPath(prev => [...prev, { x, y }]);
  };

  const handlePointerUp = () => {
    if (isDrawing && currentPath.length > 0 && activeLayer) {
      const newPath: DrawPath = {
        id: `path-${Date.now()}`,
        points: currentPath,
        color: activeTool === 'eraser' ? '#000000' : brushConfig.color,
        strokeWidth: brushConfig.size,
        opacity: activeTool === 'eraser' ? 1 : brushConfig.opacity,
        isEraser: activeTool === 'eraser',
      };

      const existingPaths = activeLayer.drawPaths || [];
      onUpdateLayerPaths?.(activeLayer.id, [...existingPaths, newPath]);
    }
    setIsDrawing(false);
    setCurrentPath([]);
  };

  return (
    <div
      id="photo-canvas-stage-wrapper"
      className="flex-1 w-full h-full bg-neutral-100 dark:bg-[#08090b] flex items-center justify-center p-4 sm:p-8 relative overflow-hidden select-none"
      onPointerUp={handlePointerUp}
    >
      {/* Background checkered pattern for transparency */}
      <div className="absolute inset-0 bg-[radial-gradient(#71717a22_1px,transparent_1px)] dark:bg-[radial-gradient(#ffffff0d_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />

      {/* Main Canvas Viewport Container with zoom */}
      <div
        style={{
          transform: `scale(${zoom / 100})`,
          transformOrigin: 'center center',
          transition: 'transform 0.1s ease-out',
        }}
        className="relative shadow-2xl flex items-center justify-center"
      >
        {/* Canvas Frame */}
        <div
          ref={containerRef}
          id="photo-canvas-artboard"
          style={{
            width: `${transform.canvasWidth}px`,
            height: `${transform.canvasHeight}px`,
            maxWidth: '85vw',
            maxHeight: '75vh',
            ...getTransformStyle(),
          }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          className="relative bg-white dark:bg-neutral-950 overflow-hidden border border-neutral-300 dark:border-neutral-800 rounded-sm shadow-2xl cursor-crosshair"
        >
          {/* Layer Compositor Stack */}
          {layers
            .filter(l => l.visible)
            .map((layer, index) => {
              const layerFilter = getCssFilter({
                ...adjustments,
                ...(layer.adjustments || {}),
              });

              return (
                <div
                  key={layer.id}
                  id={`photo-layer-${layer.id}`}
                  style={{
                    opacity: layer.opacity / 100,
                    mixBlendMode: layer.blendMode as any,
                    zIndex: index + 1,
                  }}
                  className="absolute inset-0 w-full h-full pointer-events-none"
                >
                  {/* Layer Image Rendering */}
                  {layer.imageUrl && (
                    <img
                      src={layer.imageUrl}
                      alt={layer.name}
                      style={{ filter: layerFilter }}
                      className="w-full h-full object-cover select-none"
                      crossOrigin="anonymous"
                    />
                  )}

                  {/* Layer Vector Shapes */}
                  {layer.shapes && layer.shapes.length > 0 && (
                    <svg className="absolute inset-0 w-full h-full pointer-events-none">
                      {layer.shapes.map(shape => {
                        if (shape.type === 'rectangle') {
                          return (
                            <rect
                              key={shape.id}
                              x={`${shape.x}%`}
                              y={`${shape.y}%`}
                              width={`${shape.width}%`}
                              height={`${shape.height}%`}
                              fill={shape.fillColor}
                              stroke={shape.strokeColor}
                              strokeWidth={shape.strokeWidth}
                              rx={shape.cornerRadius || 0}
                              opacity={shape.opacity}
                            />
                          );
                        }
                        if (shape.type === 'ellipse') {
                          return (
                            <ellipse
                              key={shape.id}
                              cx={`${shape.x + shape.width / 2}%`}
                              cy={`${shape.y + shape.height / 2}%`}
                              rx={`${shape.width / 2}%`}
                              ry={`${shape.height / 2}%`}
                              fill={shape.fillColor}
                              stroke={shape.strokeColor}
                              strokeWidth={shape.strokeWidth}
                              opacity={shape.opacity}
                            />
                          );
                        }
                        if (shape.type === 'line' || shape.type === 'arrow') {
                          return (
                            <line
                              key={shape.id}
                              x1={`${shape.x}%`}
                              y1={`${shape.y}%`}
                              x2={`${shape.x + shape.width}%`}
                              y2={`${shape.y + shape.height}%`}
                              stroke={shape.strokeColor}
                              strokeWidth={shape.strokeWidth}
                              opacity={shape.opacity}
                              markerEnd={shape.type === 'arrow' ? 'url(#arrowhead)' : undefined}
                            />
                          );
                        }
                        return null;
                      })}
                    </svg>
                  )}

                  {/* Layer Drawing Strokes (Brush & Eraser) */}
                  {layer.drawPaths && layer.drawPaths.length > 0 && (
                    <svg className="absolute inset-0 w-full h-full pointer-events-none">
                      {layer.drawPaths.map(path => {
                        if (path.points.length < 2) return null;
                        const d = path.points.reduce(
                          (acc, pt, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${pt.x}% ${pt.y}%`,
                          ''
                        );
                        return (
                          <path
                            key={path.id}
                            d={d}
                            fill="none"
                            stroke={path.isEraser ? '#000000' : path.color}
                            strokeWidth={path.strokeWidth}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            opacity={path.opacity}
                            style={path.isEraser ? ({ mixBlendMode: 'difference' } as React.CSSProperties) : undefined}
                          />
                        );
                      })}
                    </svg>
                  )}

                  {/* Layer Text Elements */}
                  {layer.texts && layer.texts.map(text => (
                    <div
                      key={text.id}
                      style={{
                        position: 'absolute',
                        left: `${text.x}%`,
                        top: `${text.y}%`,
                        fontSize: `${text.fontSize}px`,
                        fontFamily: text.fontFamily,
                        color: text.color,
                        fontWeight: text.fontWeight,
                        textAlign: text.textAlign,
                        opacity: text.opacity,
                        transform: 'translate(-50%, -50%)',
                      }}
                      className="pointer-events-auto cursor-pointer select-none drop-shadow-md px-1"
                    >
                      {text.text}
                    </div>
                  ))}
                </div>
              );
            })}

          {/* Real-time active drawing stroke preview */}
          {isDrawing && currentPath.length > 1 && (
            <svg className="absolute inset-0 w-full h-full pointer-events-none z-50">
              <path
                d={currentPath.reduce(
                  (acc, pt, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${pt.x}% ${pt.y}%`,
                  ''
                )}
                fill="none"
                stroke={activeTool === 'eraser' ? '#ffffff' : brushConfig.color}
                strokeWidth={brushConfig.size}
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity={activeTool === 'eraser' ? 0.7 : brushConfig.opacity}
              />
            </svg>
          )}

          {/* Non-destructive Color Temperature & Tint Optical Overlay */}
          {(adjustments.temperature !== 0 || adjustments.tint !== 0) && (
            <div
              style={{
                backgroundColor:
                  adjustments.temperature > 0
                    ? `rgba(255, 170, 0, ${Math.abs(adjustments.temperature) / 400})`
                    : `rgba(0, 140, 255, ${Math.abs(adjustments.temperature) / 400})`,
                mixBlendMode: 'color',
              }}
              className="absolute inset-0 w-full h-full pointer-events-none z-30"
            />
          )}

          {/* Non-destructive Vignette Effect Overlay */}
          {adjustments.vignette > 0 && (
            <div
              style={{
                background: `radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,${(adjustments.vignette / 100) * 0.85}) 100%)`,
              }}
              className="absolute inset-0 w-full h-full pointer-events-none z-40"
            />
          )}

          {/* Non-destructive Film Grain Effect Overlay */}
          {adjustments.grain > 0 && (
            <div
              style={{
                opacity: (adjustments.grain / 100) * 0.35,
                backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
              }}
              className="absolute inset-0 w-full h-full pointer-events-none z-40 mix-blend-overlay"
            />
          )}

          {/* Crop Overlay Guidelines when in Crop mode */}
          {activeTool === 'crop' && (
            <div
              id="photo-crop-overlay"
              style={{
                left: `${transform.crop.x}%`,
                top: `${transform.crop.y}%`,
                width: `${transform.crop.width}%`,
                height: `${transform.crop.height}%`,
              }}
              className="absolute border-2 border-white/90 shadow-[0_0_0_9999px_rgba(0,0,0,0.6)] z-50 pointer-events-auto cursor-move"
            >
              {/* Rule of thirds grid lines */}
              <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none">
                <div className="border-r border-b border-white/30" />
                <div className="border-r border-b border-white/30" />
                <div className="border-b border-white/30" />
                <div className="border-r border-b border-white/30" />
                <div className="border-r border-b border-white/30" />
                <div className="border-b border-white/30" />
                <div className="border-r border-white/30" />
                <div className="border-r border-white/30" />
                <div />
              </div>
              {/* Corner handles */}
              <div className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-white border border-neutral-900 rounded-xs" />
              <div className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-white border border-neutral-900 rounded-xs" />
              <div className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-white border border-neutral-900 rounded-xs" />
              <div className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-white border border-neutral-900 rounded-xs" />
            </div>
          )}

          {/* Selection Marquee Overlay */}
          {selection.active && selection.type === 'marquee' && (
            <div
              style={{
                left: `${selection.x}%`,
                top: `${selection.y}%`,
                width: `${selection.width}%`,
                height: `${selection.height}%`,
              }}
              className="absolute border border-dashed border-cyan-400 bg-cyan-400/15 z-50 pointer-events-none animate-pulse"
            />
          )}
        </div>
      </div>
    </div>
  );
};
