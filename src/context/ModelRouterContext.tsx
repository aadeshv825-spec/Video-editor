import React, { createContext, useContext, useState, useEffect } from 'react';
import { AIModel, ModelCapability, ModelRouteQuery } from '../types';
import { AI_MODEL_REGISTRY, ExtendedAIModel, ModelRegistryService } from '../services/ai/modelRegistry';
import { ProviderStatusService } from '../services/ai/providerStatusService';
import { useAuth } from './AuthContext';

interface ModelRouterContextType {
  models: ExtendedAIModel[];
  selectedModel: ExtendedAIModel;
  isAutoRouting: boolean;
  setIsAutoRouting: (auto: boolean) => void;
  selectModelManual: (modelId: string) => { success: boolean; fallbackAlternative?: ExtendedAIModel; message?: string };
  routeBestModel: (query: ModelRouteQuery) => ExtendedAIModel;
  filterModelsByCapability: (cap: ModelCapability) => ExtendedAIModel[];
  getModelById: (id: string) => ExtendedAIModel | undefined;
  getAvailableFallbackModel: (modelId: string) => ExtendedAIModel | undefined;
}

const ModelRouterContext = createContext<ModelRouterContextType | undefined>(undefined);

export const ModelRouterProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isPro, currentUser } = useAuth();
  const [models, setModels] = useState<ExtendedAIModel[]>(AI_MODEL_REGISTRY);
  const [isAutoRouting, setIsAutoRouting] = useState<boolean>(true);
  const [selectedModelId, setSelectedModelId] = useState<string>('veo-3.1-lite-generate-preview');
  const [, setStatusTick] = useState(0);

  // Subscribe to real-time server provider updates
  useEffect(() => {
    const unsub = ProviderStatusService.subscribe(() => {
      setStatusTick(prev => prev + 1);
    });
    return unsub;
  }, []);

  const selectedModel = models.find(m => m.id === selectedModelId) || models[0];

  const getModelById = (id: string): ExtendedAIModel | undefined => {
    return models.find(m => m.id === id);
  };

  const getAvailableFallbackModel = (modelId: string): ExtendedAIModel | undefined => {
    return ModelRegistryService.getSuggestedFallbackModel(modelId);
  };

  /**
   * Filter models matching a capability that are genuinely configured and ready
   */
  const filterModelsByCapability = (cap: ModelCapability): ExtendedAIModel[] => {
    return models.filter(m => {
      if (!m.capabilities.includes(cap)) return false;
      if (m.availability === 'maintenance') return false;

      // Verify provider readiness on server
      const pType = m.providerType || 'gemini';
      if (pType !== 'local' && pType !== 'gemini') {
        if (!ProviderStatusService.isProviderConfigured(pType)) {
          return false;
        }
      }
      return true;
    });
  };

  /**
   * Intelligent Dynamic Router:
   * Selects strictly among configured, operational, user-entitled, and compatible models.
   */
  const routeBestModel = (query: ModelRouteQuery): ExtendedAIModel => {
    // 1. Get truly available candidates
    let candidates = filterModelsByCapability(query.capability);

    // 2. Filter by user entitlement (Free user on Pro model)
    if (!isPro) {
      const freeCandidates = candidates.filter(m => !m.isProOnly);
      if (freeCandidates.length > 0) {
        candidates = freeCandidates;
      }
    }

    // 3. Filter by user credits budget
    const userCredits = currentUser?.aiCredits ?? 100;
    if (userCredits > 0) {
      const budgetCandidates = candidates.filter(m => m.costPerUnit <= userCredits);
      if (budgetCandidates.length > 0) {
        candidates = budgetCandidates;
      }
    }

    if (candidates.length === 0) {
      // Fallback to default reliable Google engine or local engine
      const safeDefault =
        models.find(m => m.id === 'veo-3.1-lite-generate-preview') ||
        models.find(m => m.id === 'gemini-3.1-flash-image') ||
        models.find(m => m.id === 'creative-director-local') ||
        models[0];
      if (isAutoRouting) {
        setSelectedModelId(safeDefault.id);
      }
      return safeDefault;
    }

    // 4. Score candidates
    const scored = candidates.map(model => {
      let score = 50;

      // Quality preference
      if (query.preferQuality) {
        if (model.quality === 'ultra') score += 40;
        else if (model.quality === 'high') score += 25;
        else if (model.quality === 'standard') score += 10;
      }

      // Speed preference
      if (query.preferSpeed) {
        if (model.speed === 'fast') score += 40;
        else if (model.speed === 'balanced') score += 20;
        else if (model.speed === 'quality') score += 5;
      }

      // Cost ceiling constraint
      if (query.maxCostCredits !== undefined) {
        if (model.costPerUnit <= query.maxCostCredits) {
          score += 20;
        } else {
          score -= 60; // Severe penalty for exceeding budget
        }
      }

      // Recommend badge boost
      if (model.badges.includes('Recommended')) score += 15;

      return { model, score };
    });

    scored.sort((a, b) => b.score - a.score);
    const chosen = scored[0].model;

    if (isAutoRouting) {
      setSelectedModelId(chosen.id);
    }
    return chosen;
  };

  /**
   * Manual model selection with safe availability checks
   */
  const selectModelManual = (
    modelId: string
  ): { success: boolean; fallbackAlternative?: ExtendedAIModel; message?: string } => {
    const target = getModelById(modelId);
    if (!target) {
      return { success: false, message: 'Model not found in registry.' };
    }

    const avail = ModelRegistryService.getModelAvailability(modelId, {
      isPro: Boolean(isPro),
      credits: currentUser?.aiCredits || 0,
      isOwner: currentUser?.role === 'owner',
    });

    if (!avail.isReadyToRun) {
      const fallback = getAvailableFallbackModel(modelId);
      return {
        success: false,
        fallbackAlternative: fallback,
        message: avail.userFacingMessage,
      };
    }

    setSelectedModelId(modelId);
    setIsAutoRouting(false);
    return { success: true };
  };

  return (
    <ModelRouterContext.Provider
      value={{
        models,
        selectedModel,
        isAutoRouting,
        setIsAutoRouting,
        selectModelManual,
        routeBestModel,
        filterModelsByCapability,
        getModelById,
        getAvailableFallbackModel,
      }}
    >
      {children}
    </ModelRouterContext.Provider>
  );
};

export const useModelRouter = () => {
  const context = useContext(ModelRouterContext);
  if (!context) throw new Error('useModelRouter must be used within a ModelRouterProvider');
  return context;
};
