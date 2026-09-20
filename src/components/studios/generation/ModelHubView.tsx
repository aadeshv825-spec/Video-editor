import React, { useState, useMemo } from 'react';
import {
  AlertCircle,
  Check,
  Cpu,
  Film,
  Image as ImageIcon,
  Mic,
  Music,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Wand2,
  Lock,
  Coins,
  AlertTriangle,
  Layers,
} from 'lucide-react';
import { ModelHubCategory, ModelBadgeLabel } from '../../../types/aiGeneration';
import { AI_MODEL_REGISTRY, ExtendedAIModel, ModelRegistryService } from '../../../services/ai/modelRegistry';
import { useAuth } from '../../../context/AuthContext';
import { ProviderStatusService, ModelRealAvailabilityState } from '../../../services/ai/providerStatusService';

interface ModelHubViewProps {
  selectedModelId: string;
  onSelectModel: (model: ExtendedAIModel) => void;
  onOpenSettings?: () => void;
  onOpenPro?: () => void;
}

export const ModelHubView: React.FC<ModelHubViewProps> = ({
  selectedModelId,
  onSelectModel,
  onOpenSettings,
  onOpenPro,
}) => {
  const { currentUser, isPro, isOwner } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState<ModelHubCategory | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterBadge, setFilterBadge] = useState<ModelBadgeLabel | 'ALL'>('ALL');

  const categories: { id: ModelHubCategory | 'ALL'; label: string; icon: any }[] = [
    { id: 'ALL', label: 'All Models', icon: Sparkles },
    { id: 'VIDEO', label: 'Video', icon: Film },
    { id: 'IMAGE', label: 'Image', icon: ImageIcon },
    { id: 'AUDIO', label: 'Audio & Music', icon: Music },
    { id: 'SPEECH', label: 'Speech & TTS', icon: Mic },
    { id: 'ENHANCEMENT', label: 'Enhancement', icon: Wand2 },
    { id: 'ANALYSIS', label: 'Analysis & Script', icon: Cpu },
  ];

  const filteredModels = useMemo(() => {
    return AI_MODEL_REGISTRY.filter(m => {
      if (selectedCategory !== 'ALL' && m.category !== selectedCategory) return false;
      if (filterBadge !== 'ALL' && !m.badges.includes(filterBadge)) return false;
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        return (
          m.name.toLowerCase().includes(query) ||
          m.provider.toLowerCase().includes(query) ||
          m.description.toLowerCase().includes(query) ||
          (m.features && m.features.some(f => f.toLowerCase().includes(query)))
        );
      }
      return true;
    });
  }, [selectedCategory, filterBadge, searchQuery]);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Banner & Multi-Provider Architecture Overview */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-linear-to-r from-neutral-50 via-white to-neutral-50 dark:from-neutral-900/50 dark:via-neutral-900/20 dark:to-neutral-900/50">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold tracking-tight">AI Model Hub & Multi-Provider Registry</h2>
            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-neutral-900 text-white dark:bg-white dark:text-neutral-950">
              Verified Pipeline
            </span>
          </div>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 max-w-2xl">
            Real availability states evaluated dynamically based on server-side provider status, user entitlement, hardware tiers, and compute quota. Models run non-destructively without simulated proxies.
          </p>
        </div>

        {isOwner && onOpenSettings && (
          <button
            onClick={onOpenSettings}
            className="px-3.5 py-1.5 rounded-lg border border-neutral-300 dark:border-neutral-700 text-xs font-medium hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center gap-1.5 shrink-0 transition-colors"
          >
            <Settings className="w-3.5 h-3.5 text-neutral-500" />
            <span>Owner Provider Settings</span>
          </button>
        )}
      </div>

      {/* Category Tabs & Search */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Category Pills */}
          <div className="flex gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            {categories.map(cat => {
              const Icon = cat.icon;
              const isActive = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 whitespace-nowrap transition-colors ${
                    isActive
                      ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-950 shadow-xs'
                      : 'border border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search model, feature..."
              className="w-full pl-8.5 pr-3 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-xs focus:outline-hidden focus:ring-1 focus:ring-neutral-400"
            />
          </div>
        </div>

        {/* Badge Filters: Recommended, Fast, Quality, Experimental */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-neutral-400 text-[11px]">Filter by Label:</span>
          {(['ALL', 'Recommended', 'Fast', 'Quality', 'Experimental'] as const).map(badge => (
            <button
              key={badge}
              onClick={() => setFilterBadge(badge)}
              className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                filterBadge === badge
                  ? 'bg-neutral-200 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 font-semibold'
                  : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
              }`}
            >
              {badge}
            </button>
          ))}
        </div>
      </div>

      {/* Models Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredModels.map(model => {
          const isSelected = selectedModelId === model.id;
          
          // Evaluate real availability dynamically
          const availabilityCheck = ModelRegistryService.getModelAvailability(model.id, {
            isPro: Boolean(isPro),
            credits: currentUser?.aiCredits || 0,
            isOwner: Boolean(isOwner),
          });

          const isAvailable = availabilityCheck.state === 'AVAILABLE';
          const isSetupRequired = availabilityCheck.state === 'CONFIGURATION_REQUIRED';
          const isProRequired = availabilityCheck.state === 'USER_NOT_ENTITLED';
          const isCreditsRequired = availabilityCheck.state === 'CREDITS_REQUIRED';
          const isDeviceLimited = availabilityCheck.state === 'BROWSER_HARDWARE_LIMITED';

          return (
            <div
              key={model.id}
              className={`rounded-xl border p-4.5 flex flex-col justify-between transition-all relative ${
                isSelected
                  ? 'border-purple-500/80 bg-purple-50/20 dark:bg-purple-950/10 ring-1 ring-purple-500/50 shadow-sm'
                  : 'border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/40 hover:border-neutral-300 dark:hover:border-neutral-700'
              }`}
            >
              {/* Header */}
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-400">
                      {model.provider}
                    </span>
                    <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 leading-snug">
                      {model.name}
                    </h3>
                  </div>

                  <div className="flex flex-col items-end gap-1 shrink-0">
                    {/* Real Availability Indicator */}
                    {isAvailable ? (
                      <span className="flex items-center gap-1 text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        Available
                      </span>
                    ) : isSetupRequired ? (
                      <span className="flex items-center gap-1 text-[10px] font-medium text-amber-600 dark:text-amber-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                        Setup Required
                      </span>
                    ) : isProRequired ? (
                      <span className="flex items-center gap-1 text-[10px] font-medium text-purple-600 dark:text-purple-400">
                        <Lock className="w-2.5 h-2.5" />
                        PRO Only
                      </span>
                    ) : isDeviceLimited ? (
                      <span className="flex items-center gap-1 text-[10px] font-medium text-neutral-500">
                        <Cpu className="w-2.5 h-2.5" />
                        Device Limited
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-[10px] font-medium text-red-500">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                        Unavailable
                      </span>
                    )}

                    {model.isProOnly && (
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-neutral-900 text-white dark:bg-white dark:text-neutral-950">
                        PRO
                      </span>
                    )}
                  </div>
                </div>

                {/* Badges */}
                <div className="flex flex-wrap gap-1">
                  {model.badges.map(b => (
                    <span
                      key={b}
                      className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                        b === 'Recommended'
                          ? 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/20'
                          : b === 'Fast'
                          ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20'
                          : b === 'Quality'
                          ? 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20'
                          : 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20'
                      }`}
                    >
                      {b}
                    </span>
                  ))}
                </div>

                {/* Description */}
                <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed line-clamp-3">
                  {model.description}
                </p>

                {/* Features chips */}
                {model.features && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {model.features.map(f => (
                      <span
                        key={f}
                        className="px-1.5 py-0.5 rounded text-[10px] bg-neutral-100 dark:bg-neutral-800/60 text-neutral-600 dark:text-neutral-400"
                      >
                        {f}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Technical Specifications */}
              <div className="mt-4 pt-3 border-t border-neutral-100 dark:border-neutral-800/80 space-y-2.5">
                <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                  <div>
                    <span className="text-neutral-400">Max Res:</span>{' '}
                    <span className="text-neutral-800 dark:text-neutral-200">{model.resolutionMax}</span>
                  </div>
                  <div>
                    <span className="text-neutral-400">Max Duration:</span>{' '}
                    <span className="text-neutral-800 dark:text-neutral-200">
                      {model.supportedMaxDurationSec ? `${model.supportedMaxDurationSec}s` : 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="text-neutral-400">Speed:</span>{' '}
                    <span className="capitalize text-neutral-800 dark:text-neutral-200">{model.speed}</span>
                  </div>
                  <div>
                    <span className="text-neutral-400">Quality:</span>{' '}
                    <span className="capitalize text-neutral-800 dark:text-neutral-200">{model.quality}</span>
                  </div>
                </div>

                {/* Status Notice (Never leaks environment variable names to normal users) */}
                {!isAvailable && (
                  <div className="flex items-center gap-1.5 p-2 rounded bg-neutral-100 dark:bg-neutral-800/70 border border-neutral-200 dark:border-neutral-700 text-[11px] text-neutral-700 dark:text-neutral-300">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0 text-amber-500" />
                    <span className="truncate">{availabilityCheck.userFacingMessage}</span>
                  </div>
                )}

                {/* Action button & cost */}
                <div className="flex items-center justify-between pt-1">
                  <div className="text-xs font-mono">
                    <span className="font-bold text-purple-600 dark:text-purple-400">{model.costPerUnit} CR</span>{' '}
                    <span className="text-[10px] text-neutral-400">({model.costUnitLabel})</span>
                  </div>

                  {isAvailable ? (
                    <button
                      onClick={() => onSelectModel(model)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                        isSelected
                          ? 'bg-purple-600 text-white shadow-xs'
                          : 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-950 hover:opacity-90'
                      }`}
                    >
                      {isSelected ? <Check className="w-3.5 h-3.5" /> : <Sparkles className="w-3.5 h-3.5" />}
                      <span>{isSelected ? 'Active Model' : 'Select Model'}</span>
                    </button>
                  ) : isProRequired ? (
                    <button
                      onClick={() => onOpenPro?.()}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium bg-neutral-900 dark:bg-white text-white dark:text-neutral-950 hover:opacity-90 transition-all flex items-center gap-1.5"
                    >
                      <Lock className="w-3.5 h-3.5" />
                      <span>Upgrade to PRO</span>
                    </button>
                  ) : isSetupRequired ? (
                    <button
                      disabled={!isOwner}
                      onClick={() => isOwner && onOpenSettings?.()}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                        isOwner
                          ? 'border-purple-500/40 text-purple-600 dark:text-purple-400 hover:bg-purple-500/10 cursor-pointer'
                          : 'border-neutral-300 dark:border-neutral-700 text-neutral-500 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-800/40 cursor-not-allowed'
                      }`}
                    >
                      <span>{isOwner ? 'Configure Provider' : 'Setup Required'}</span>
                    </button>
                  ) : (
                    <button
                      disabled
                      className="px-3 py-1.5 rounded-lg text-xs font-medium border border-neutral-200 dark:border-neutral-800 text-neutral-400 dark:text-neutral-600 cursor-not-allowed"
                    >
                      <span>{availabilityCheck.buttonLabel}</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
