import React, { useState } from 'react';
import {
  Sparkles,
  Scissors,
  Eraser,
  RefreshCw,
  Maximize2,
  Expand,
  SunMedium,
  Wand2,
  ImageIcon,
  Cpu,
  Info,
} from 'lucide-react';
import { useModelRouter } from '../../../context/ModelRouterContext';

export const PhotoAiPrepPanel: React.FC = () => {
  const { selectedModel } = useModelRouter();
  const [activeAiTool, setActiveAiTool] = useState<string>('bg_removal');
  const [promptText, setPromptText] = useState('');

  const aiModules = [
    {
      id: 'bg_removal',
      name: 'AI Background Removal',
      icon: Scissors,
      category: 'Segmentation',
      description: 'Isolate subjects with high-precision alpha edge feathering and non-destructive mask generation.',
      params: ['Edge refinement radius', 'Hair matting mode', 'Transparent PNG output'],
    },
    {
      id: 'object_removal',
      name: 'Object Removal',
      icon: Eraser,
      category: 'Inpainting',
      description: 'Remove unwanted elements seamlessly using context-aware texture synthesis.',
      params: ['Mask brush radius', 'Edge blend feather', 'Surrounding context radius'],
    },
    {
      id: 'object_replacement',
      name: 'Object Replacement',
      icon: RefreshCw,
      category: 'Generative Inpaint',
      description: 'Select an object and replace it with any generative description while matching scene lighting.',
      params: ['Target prompt', 'Prompt adherence weight', 'Color temperature lock'],
    },
    {
      id: 'generative_fill',
      name: 'Generative Fill',
      icon: Wand2,
      category: 'Synthesis',
      description: 'Synthesize photorealistic elements within active marquee or lasso selections.',
      params: ['Generation prompt', 'Creativity guidance scale', 'Style preset match'],
    },
    {
      id: 'generative_expand',
      name: 'Generative Expand',
      icon: Expand,
      category: 'Outpainting',
      description: 'Expand the canvas aspect ratio outwards while continuing background scene context.',
      params: ['Canvas padding direction', 'Seamless seam blending', 'Scene continuation prompt'],
    },
    {
      id: 'ai_relighting',
      name: 'AI Relighting',
      icon: SunMedium,
      category: 'Neural Lighting',
      description: 'Re-illuminate the scene with 3D key lights, rim highlights, and ambient bounce shadows.',
      params: ['Light elevation & azimuth', 'Color temperature (Kelvin)', 'Falloff softness'],
    },
    {
      id: 'ai_upscale',
      name: 'AI Super-Resolution',
      icon: Maximize2,
      category: 'Enhancement',
      description: 'Upscale low-resolution photos 2x or 4x with generative hallucination of fine micro-textures.',
      params: ['Scale factor (2x / 4x / 8x)', 'Face recovery enhance', 'Noise suppression factor'],
    },
    {
      id: 'restoration',
      name: 'Photo Restoration',
      icon: Sparkles,
      category: 'Restoration',
      description: 'Repair scratches, dust artifacts, sensor noise, and vintage black-and-white colorization.',
      params: ['Scratch healer threshold', 'Grain reduction factor', 'Neural colorization'],
    },
    {
      id: 'image_gen',
      name: 'Image Generation',
      icon: ImageIcon,
      category: 'Text-to-Image',
      description: 'Generate brand new image assets as fresh base layers directly inside the studio.',
      params: ['Master prompt', 'Negative prompt', 'Aspect ratio lock', 'Seed number'],
    },
  ];

  const selectedModule = aiModules.find(m => m.id === activeAiTool) || aiModules[0];
  const Icon = selectedModule.icon;

  return (
    <div className="w-full sm:w-85 h-full border-l border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#111318] flex flex-col text-xs overflow-y-auto shrink-0 select-none">
      {/* Header */}
      <div className="p-3.5 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between sticky top-0 bg-white/95 dark:bg-[#111318]/95 backdrop-blur-xs z-10">
        <div className="flex items-center gap-1.5 font-semibold text-neutral-900 dark:text-neutral-100">
          <Sparkles className="w-4 h-4 text-amber-500" />
          <span>AI Neural Engine Hub</span>
        </div>
        <div className="flex items-center gap-1 font-mono text-[10px] text-neutral-500 bg-neutral-100 dark:bg-neutral-800 px-1.5 py-0.5 rounded">
          <Cpu className="w-3 h-3" />
          <span>{selectedModel.name}</span>
        </div>
      </div>

      <div className="p-4 space-y-5">
        {/* Architecture Preparedness Notice */}
        <div className="p-3 rounded-lg border border-amber-200 dark:border-amber-900/50 bg-amber-50/50 dark:bg-amber-950/20 text-amber-900 dark:text-amber-300 space-y-1">
          <div className="flex items-center gap-1.5 font-semibold text-[11px]">
            <Info className="w-3.5 h-3.5 text-amber-500" />
            <span>Modular AI Architecture Ready</span>
          </div>
          <p className="text-[10px] text-amber-700 dark:text-amber-400 leading-relaxed">
            These endpoints are pre-wired into the studio layer composite system. When connected to live inference models, outputs will automatically attach as reversible non-destructive adjustment layers.
          </p>
        </div>

        {/* AI Modules Grid Selection */}
        <div className="space-y-1.5">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400 font-mono">
            Available AI Pipelines (9)
          </span>

          <div className="grid grid-cols-1 gap-1">
            {aiModules.map(module => {
              const ModIcon = module.icon;
              const isSelected = module.id === activeAiTool;

              return (
                <button
                  key={module.id}
                  onClick={() => setActiveAiTool(module.id)}
                  className={`p-2 rounded-lg border text-left flex items-center justify-between transition-all ${
                    isSelected
                      ? 'border-neutral-900 dark:border-white bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white font-medium shadow-xs'
                      : 'border-neutral-200/80 dark:border-neutral-800/80 hover:bg-neutral-50 dark:hover:bg-neutral-800/40 text-neutral-600 dark:text-neutral-400'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <ModIcon className={`w-4 h-4 shrink-0 ${isSelected ? 'text-amber-500' : 'text-neutral-400'}`} />
                    <div className="truncate">
                      <div className="truncate font-semibold">{module.name}</div>
                      <div className="text-[10px] opacity-70">{module.category}</div>
                    </div>
                  </div>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-neutral-200 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300 font-mono shrink-0">
                    Ready
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Active Pipeline Configuration Hook */}
        <div className="p-3.5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/60 space-y-3">
          <div className="flex items-center gap-2">
            <Icon className="w-4 h-4 text-amber-500" />
            <span className="font-semibold text-neutral-900 dark:text-neutral-100">
              {selectedModule.name}
            </span>
          </div>

          <p className="text-[11px] text-neutral-600 dark:text-neutral-400 leading-relaxed">
            {selectedModule.description}
          </p>

          <div className="space-y-1.5 pt-2 border-t border-neutral-200 dark:border-neutral-800">
            <span className="text-[10px] text-neutral-500 uppercase font-mono">Hook Parameters</span>
            <ul className="space-y-1 text-[11px] text-neutral-700 dark:text-neutral-300">
              {selectedModule.params.map((p, idx) => (
                <li key={idx} className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                  <span>{p}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="pt-2">
            <input
              type="text"
              value={promptText}
              onChange={e => setPromptText(e.target.value)}
              placeholder={`Config directive for ${selectedModule.name}...`}
              className="w-full px-2.5 py-1.5 rounded border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-xs mb-2"
            />
            <button
              disabled
              className="w-full py-2 bg-neutral-200 dark:bg-neutral-800 text-neutral-500 font-medium rounded-lg text-center cursor-not-allowed opacity-80"
              title="Architecture is prepared; advanced live inference will connect in future turn"
            >
              Pipeline Configured (Ready for Model Link)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
