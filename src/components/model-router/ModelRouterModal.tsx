import React, { useState } from 'react';
import { X, Sparkles, Cpu, Check, Sliders, Zap, Shield, HelpCircle, ArrowRight, Lock, AlertCircle, RefreshCw } from 'lucide-react';
import { useModelRouter } from '../../context/ModelRouterContext';
import { ModelCapability, ModelQuality, ModelSpeed } from '../../types';
import { ModelRegistryService } from '../../services/ai/modelRegistry';
import { useAuth } from '../../context/AuthContext';

interface ModelRouterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenPro?: () => void;
}

export const ModelRouterModal: React.FC<ModelRouterModalProps> = ({
  isOpen,
  onClose,
  onOpenPro,
}) => {
  const { currentUser, isPro, isOwner } = useAuth();
  const {
    models,
    selectedModel,
    isAutoRouting,
    setIsAutoRouting,
    selectModelManual,
    routeBestModel,
    getAvailableFallbackModel,
  } = useModelRouter();
  const [filterCap, setFilterCap] = useState<string>('all');

  // Simulation test query
  const [testCap, setTestCap] = useState<ModelCapability>('video');
  const [testQuality, setTestQuality] = useState(true);
  const [testSpeed, setTestSpeed] = useState(false);
  const [routingExplanation, setRoutingExplanation] = useState<string | null>(null);
  const [selectionWarning, setSelectionWarning] = useState<string | null>(null);

  if (!isOpen) return null;

  const filtered = models.filter(m =>
    filterCap === 'all' ? true : m.capabilities.includes(filterCap as ModelCapability)
  );

  const handleTestAutoRoute = () => {
    const chosen = routeBestModel({
      capability: testCap,
      preferQuality: testQuality,
      preferSpeed: testSpeed,
    });
    setRoutingExplanation(
      `Router analyzed task [${testCap.toUpperCase()}] with ${testQuality ? 'Quality Focus' : 'Standard'} and ${testSpeed ? 'Low Latency' : 'Normal Speed'}. Optimal candidate selected: ${chosen.name} (${chosen.provider}) at ${chosen.costPerUnit} CR.`
    );
  };

  const handleSelectModel = (modelId: string) => {
    const res = selectModelManual(modelId);
    if (!res.success) {
      setSelectionWarning(
        res.message || 'This model cannot be selected right now.' +
        (res.fallbackAlternative ? ` Suggested alternative: ${res.fallbackAlternative.name}.` : '')
      );
    } else {
      setSelectionWarning(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-xs">
      <div 
        id="model-router-modal-card"
        className="w-full max-w-3xl bg-white dark:bg-studio-surface border border-neutral-200 dark:border-neutral-800 rounded-2xl p-4 sm:p-6 shadow-2xl space-y-4 sm:space-y-5 max-h-[90vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-3">
          <div className="flex items-center gap-2.5">
            <Cpu className="w-5 h-5 text-neutral-500" />
            <div>
              <h2 className="font-semibold text-base text-neutral-900 dark:text-neutral-100">
                AI Model Router & Multi-Provider Registry
              </h2>
              <p className="text-xs text-neutral-400">
                Extensible neural routing supporting DeepMind, Black Forest, Runway, ElevenLabs & Anthropic.
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

        {/* Mode Switch: Auto Router vs Manual Lock */}
        <div className="p-3.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <span className="font-medium text-neutral-900 dark:text-neutral-100">Routing Policy:</span>
            <div className="flex items-center gap-1 border border-neutral-200 dark:border-neutral-800 rounded-lg p-0.5 bg-white dark:bg-studio-surface">
              <button
                onClick={() => {
                  setIsAutoRouting(true);
                  setSelectionWarning(null);
                }}
                className={`px-3 py-1 rounded-md transition-all ${
                  isAutoRouting
                    ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-950 font-medium'
                    : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                }`}
              >
                Auto-Intelligent Router
              </button>
              <button
                onClick={() => setIsAutoRouting(false)}
                className={`px-3 py-1 rounded-md transition-all ${
                  !isAutoRouting
                    ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-950 font-medium'
                    : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                }`}
              >
                Manual Model Lock
              </button>
            </div>
          </div>

          <div className="text-[11px] font-mono text-neutral-400">
            Selected: <span className="font-bold text-neutral-800 dark:text-neutral-200">{selectedModel.name}</span>
          </div>
        </div>

        {/* Selection Warning Notice */}
        {selectionWarning && (
          <div className="p-3 rounded-xl border border-amber-500/30 bg-amber-500/10 text-xs flex items-center justify-between gap-2 text-amber-800 dark:text-amber-200">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>{selectionWarning}</span>
            </div>
            <button
              onClick={() => setSelectionWarning(null)}
              className="text-amber-700 dark:text-amber-300 hover:underline shrink-0 text-[11px]"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Auto Router Rule Sandbox / Tester */}
        <div className="p-3.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/30 text-xs space-y-2">
          <div className="font-semibold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-neutral-500" />
            <span>Autonomous Routing Rule Test</span>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="text-neutral-500">Task:</span>
              <select
                value={testCap}
                onChange={e => setTestCap(e.target.value as ModelCapability)}
                className="px-2 py-1 rounded border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-studio-surface text-xs font-mono"
              >
                <option value="video">Video Generation</option>
                <option value="image">Photoreal Canvas</option>
                <option value="audio">Voice / Foley Audio</option>
                <option value="scripting">Screenplay & Beats</option>
                <option value="upscaling">Upscale 4K</option>
                <option value="vfx">VFX Tracking</option>
              </select>
            </div>

            <label className="flex items-center gap-1.5 cursor-pointer text-neutral-600 dark:text-neutral-300">
              <input
                type="checkbox"
                checked={testQuality}
                onChange={e => setTestQuality(e.target.checked)}
                className="rounded"
              />
              <span>Prioritize Quality (Ultra/High)</span>
            </label>

            <label className="flex items-center gap-1.5 cursor-pointer text-neutral-600 dark:text-neutral-300">
              <input
                type="checkbox"
                checked={testSpeed}
                onChange={e => setTestSpeed(e.target.checked)}
                className="rounded"
              />
              <span>Prioritize Speed / Low Latency</span>
            </label>

            <button
              onClick={handleTestAutoRoute}
              className="ml-auto px-3 py-1 bg-neutral-900 dark:bg-white text-white dark:text-neutral-950 font-medium rounded hover:opacity-90 transition-opacity"
            >
              Simulate Route
            </button>
          </div>

          {routingExplanation && (
            <div className="p-2.5 rounded bg-white dark:bg-studio-surface border border-neutral-200 dark:border-neutral-800 text-[11px] font-mono text-neutral-700 dark:text-neutral-300">
              ✓ {routingExplanation}
            </div>
          )}
        </div>

        {/* Filter by Capability Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs shrink-0">
          {(['all', 'video', 'image', 'audio', 'scripting', 'upscaling', 'vfx'] as const).map(c => (
            <button
              key={c}
              onClick={() => setFilterCap(c)}
              className={`px-3 py-1 rounded-lg border capitalize whitespace-nowrap ${
                filterCap === c
                  ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-950 font-medium'
                  : 'border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        {/* Registered Models List */}
        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
          {filtered.map(model => {
            const isSelected = model.id === selectedModel.id;
            const avail = ModelRegistryService.getModelAvailability(model.id, {
              isPro: Boolean(isPro),
              credits: currentUser?.aiCredits || 0,
              isOwner: Boolean(isOwner),
            });

            return (
              <div
                key={model.id}
                onClick={() => handleSelectModel(model.id)}
                className={`p-4 rounded-xl border cursor-pointer transition-all text-xs ${
                  isSelected
                    ? 'border-neutral-900 dark:border-white bg-neutral-50 dark:bg-neutral-800/40 ring-1 ring-neutral-900 dark:ring-white'
                    : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 bg-white dark:bg-studio-surface'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-neutral-900 dark:text-neutral-100">
                      {model.name}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
                      {model.provider}
                    </span>

                    {/* Real Availability Badge */}
                    {avail.state === 'AVAILABLE' ? (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold">
                        AVAILABLE
                      </span>
                    ) : avail.state === 'CONFIGURATION_REQUIRED' ? (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 font-semibold">
                        SETUP REQUIRED
                      </span>
                    ) : avail.state === 'USER_NOT_ENTITLED' ? (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/10 text-purple-600 dark:text-purple-400 font-semibold flex items-center gap-1">
                        <Lock className="w-2.5 h-2.5" /> PRO
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-neutral-500/10 text-neutral-500 font-semibold">
                        LIMITED
                      </span>
                    )}

                    {isSelected && (
                      <span className="flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-neutral-900 dark:bg-white text-white dark:text-neutral-950 font-semibold">
                        <Check className="w-3 h-3" /> Selected
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="font-mono text-neutral-500">
                      {model.costPerUnit} CR / {model.costUnitLabel}
                    </span>
                  </div>
                </div>

                <p className="text-neutral-500 dark:text-neutral-400 text-xs mb-3">
                  {model.description}
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-neutral-100 dark:border-neutral-800 text-[11px] font-mono text-neutral-500">
                  <div>Quality: <span className="text-neutral-800 dark:text-neutral-200 capitalize">{model.quality}</span></div>
                  <div>Latency: <span className="text-neutral-800 dark:text-neutral-200 capitalize">{model.speed}</span></div>
                  <div>Max Res: <span className="text-neutral-800 dark:text-neutral-200">{model.resolutionMax}</span></div>
                  <div>Max Duration: <span className="text-neutral-800 dark:text-neutral-200">{model.supportedMaxDurationSec || model.durationLimitSec || 'N/A'}s</span></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
