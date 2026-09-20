import React, { createContext, useContext, useState, useEffect } from 'react';
import { INITIAL_SETTINGS } from '../data/initialData';
import { AppSettings, ThemeMode } from '../types';

interface SettingsContextType {
  settings: AppSettings;
  theme: ThemeMode;
  resolvedTheme: 'light' | 'dark';
  updateSettings: <K extends keyof AppSettings>(category: K, updates: Partial<AppSettings[K]>) => void;
  setTheme: (mode: ThemeMode) => void;
  resetCategoryToDefaults: (category: keyof AppSettings) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

const STORAGE_SETTINGS_KEY = 'ai_creative_studio_settings_v1';

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_SETTINGS_KEY);
      return saved ? JSON.parse(saved) : INITIAL_SETTINGS;
    } catch {
      return INITIAL_SETTINGS;
    }
  });

  const [systemPrefersDark, setSystemPrefersDark] = useState<boolean>(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return true;
  });

  // Watch system color scheme changes
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => setSystemPrefersDark(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  const theme = settings.appearance.theme;
  const resolvedTheme: 'light' | 'dark' =
    theme === 'system' ? (systemPrefersDark ? 'dark' : 'light') : theme;

  // Apply dark class to document root element
  useEffect(() => {
    const root = document.documentElement;
    if (resolvedTheme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
      root.style.colorScheme = 'dark';
    } else {
      root.classList.remove('dark');
      root.classList.add('light');
      root.style.colorScheme = 'light';
    }
  }, [resolvedTheme]);

  // Persist settings
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_SETTINGS_KEY, JSON.stringify(settings));
    } catch (e) {
      console.warn('Failed to persist settings', e);
    }
  }, [settings]);

  const updateSettings = <K extends keyof AppSettings>(
    category: K,
    updates: Partial<AppSettings[K]>
  ) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        ...updates,
      },
    }));
  };

  const setTheme = (mode: ThemeMode) => {
    updateSettings('appearance', { theme: mode });
  };

  const resetCategoryToDefaults = (category: keyof AppSettings) => {
    setSettings(prev => ({
      ...prev,
      [category]: INITIAL_SETTINGS[category],
    }));
  };

  return (
    <SettingsContext.Provider
      value={{
        settings,
        theme,
        resolvedTheme,
        updateSettings,
        setTheme,
        resetCategoryToDefaults,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) throw new Error('useSettings must be used within a SettingsProvider');
  return context;
};
