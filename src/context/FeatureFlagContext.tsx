import React, { createContext, useContext, useState, useEffect } from 'react';
import { INITIAL_FEATURE_FLAGS } from '../data/initialData';
import { GlobalFeatureFlags } from '../types';
import { useAuth } from './AuthContext';

interface FeatureFlagContextType {
  features: GlobalFeatureFlags;
  isFeatureEnabled: (key: keyof GlobalFeatureFlags) => boolean;
  toggleGlobalFeature: (key: keyof GlobalFeatureFlags) => void;
  setGlobalFeature: (key: keyof GlobalFeatureFlags, enabled: boolean) => void;
  resetAllFeatures: () => void;
}

const FeatureFlagContext = createContext<FeatureFlagContextType | undefined>(undefined);

const STORAGE_FEATURES_KEY = 'ai_creative_studio_flags_v1';

export const FeatureFlagProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isOwner } = useAuth();
  const [features, setFeatures] = useState<GlobalFeatureFlags>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_FEATURES_KEY);
      return saved ? JSON.parse(saved) : INITIAL_FEATURE_FLAGS;
    } catch {
      return INITIAL_FEATURE_FLAGS;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_FEATURES_KEY, JSON.stringify(features));
    } catch (e) {
      console.warn('Failed to save feature flags', e);
    }
  }, [features]);

  const isFeatureEnabled = (key: keyof GlobalFeatureFlags): boolean => {
    return Boolean(features[key]);
  };

  const toggleGlobalFeature = (key: keyof GlobalFeatureFlags) => {
    if (!isOwner) return; // Only owner can mutate global system features
    setFeatures(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const setGlobalFeature = (key: keyof GlobalFeatureFlags, enabled: boolean) => {
    if (!isOwner) return;
    setFeatures(prev => ({
      ...prev,
      [key]: enabled,
    }));
  };

  const resetAllFeatures = () => {
    if (!isOwner) return;
    setFeatures(INITIAL_FEATURE_FLAGS);
  };

  return (
    <FeatureFlagContext.Provider
      value={{
        features,
        isFeatureEnabled,
        toggleGlobalFeature,
        setGlobalFeature,
        resetAllFeatures,
      }}
    >
      {children}
    </FeatureFlagContext.Provider>
  );
};

export const useFeatureFlags = () => {
  const context = useContext(FeatureFlagContext);
  if (!context) throw new Error('useFeatureFlags must be used within a FeatureFlagProvider');
  return context;
};
