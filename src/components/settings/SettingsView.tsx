import React, { useState } from 'react';
import { 
  Palette, 
  Shield, 
  Sparkles, 
  Film, 
  Music, 
  Share2, 
  Cloud, 
  Bell, 
  Eye, 
  Cpu, 
  Globe, 
  Crown, 
  Terminal, 
  Info, 
  ArrowLeft,
  Sun,
  Moon,
  Laptop,
  Check,
  Server
} from 'lucide-react';
import { useSettings } from '../../context/SettingsContext';
import { useAuth } from '../../context/AuthContext';
import { ThemeMode } from '../../types';
import { ModelHubView } from '../studios/generation/ModelHubView';
import { OwnerAIProviderManager } from '../owner/OwnerAIProviderManager';

interface SettingsViewProps {
  onBack: () => void;
  onOpenPro: () => void;
}

type SettingSection = 
  | 'appearance'
  | 'privacy'
  | 'ai'
  | 'provider_connections'
  | 'model_hub'
  | 'editing'
  | 'audio'
  | 'export'
  | 'backup'
  | 'notifications'
  | 'accessibility'
  | 'performance'
  | 'language'
  | 'pro'
  | 'advanced'
  | 'about';

export const SettingsView: React.FC<SettingsViewProps> = ({
  onBack,
  onOpenPro,
}) => {
  const { settings, updateSettings, theme, setTheme, resetCategoryToDefaults } = useSettings();
  const { currentUser, isPro, isOwner } = useAuth();
  const [activeSection, setActiveSection] = useState<SettingSection>('appearance');

  const baseNavItems: { id: SettingSection; label: string; icon: any }[] = [
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'privacy', label: 'Privacy & Security', icon: Shield },
    { id: 'ai', label: 'AI Configuration', icon: Sparkles },
    ...(isOwner ? [{ id: 'provider_connections' as SettingSection, label: 'AI Providers & Keys (Owner)', icon: Server }] : []),
    { id: 'model_hub', label: 'Model Hub & Registry', icon: Cpu },
    { id: 'editing', label: 'Editing', icon: Film },
    { id: 'audio', label: 'Audio', icon: Music },
    { id: 'export', label: 'Export Engine', icon: Share2 },
    { id: 'backup', label: 'Backup & Sync', icon: Cloud },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'accessibility', label: 'Accessibility', icon: Eye },
    { id: 'performance', label: 'Performance & Storage', icon: Cpu },
    { id: 'language', label: 'Language', icon: Globe },
    { id: 'pro', label: 'Pro & Subscriptions', icon: Crown },
    { id: 'advanced', label: 'Advanced Diagnostics', icon: Terminal },
    { id: 'about', label: 'About Studio', icon: Info },
  ];

  const navItems = baseNavItems;

  return (
    <div id="settings-view-root" className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-neutral-200 dark:border-neutral-800 pb-5">
        <button
          id="settings-back-btn"
          onClick={onBack}
          className="p-1.5 rounded-lg border border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">
            Studio Preferences & Settings
          </h1>
          <p className="text-xs text-neutral-500">
            Configure system parameters, neural inference routing, storage quotas & appearance.
          </p>
        </div>
      </div>

      {/* Main Settings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        {/* Navigation Sidebar (4 cols) */}
        <div className="md:col-span-4 border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-studio-surface rounded-2xl p-2.5 space-y-1 text-xs">
          {navItems.map(item => {
            const Icon = item.icon;
            const isSelected = activeSection === item.id;
            return (
              <button
                key={item.id}
                id={`settings-nav-${item.id}`}
                onClick={() => setActiveSection(item.id)}
                className={`w-full p-2.5 rounded-xl text-left flex items-center gap-3 transition-colors ${
                  isSelected
                    ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-950 font-medium'
                    : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800/60'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Setting Panel Content (8 cols) */}
        <div className="md:col-span-8 border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-studio-surface rounded-2xl p-4 sm:p-6 space-y-6 text-xs min-h-[480px]">
          {/* 1. APPEARANCE */}
          {activeSection === 'appearance' && (
            <div className="space-y-5">
              <div className="border-b border-neutral-100 dark:border-neutral-800 pb-3">
                <h3 className="font-semibold text-sm text-neutral-900 dark:text-neutral-100">
                  Appearance & Theme
                </h3>
                <p className="text-neutral-500 text-[11px] mt-0.5">
                  Select your interface theme or sync automatically with your operating system.
                </p>
              </div>

              <div>
                <label className="block text-neutral-500 font-medium mb-2">Color Theme</label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { mode: 'light' as ThemeMode, label: 'Light Mode', icon: Sun },
                    { mode: 'dark' as ThemeMode, label: 'Dark Mode', icon: Moon },
                    { mode: 'system' as ThemeMode, label: 'System Default', icon: Laptop },
                  ].map(t => {
                    const Icon = t.icon;
                    const isSelected = theme === t.mode;
                    return (
                      <button
                        key={t.mode}
                        id={`theme-opt-${t.mode}`}
                        onClick={() => setTheme(t.mode)}
                        className={`p-3.5 rounded-xl border text-center flex flex-col items-center gap-2 transition-all ${
                          isSelected
                            ? 'border-neutral-900 dark:border-white bg-neutral-50 dark:bg-neutral-800/60 font-semibold text-neutral-900 dark:text-white ring-1 ring-neutral-900 dark:ring-white'
                            : 'border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800/30'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                        <span>{t.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-neutral-500 font-medium mb-1">Layout Density</label>
                <select
                  value={settings.appearance.uiDensity}
                  onChange={e => updateSettings('appearance', { uiDensity: e.target.value as any })}
                  className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100"
                >
                  <option value="comfortable">Comfortable (Balanced padding)</option>
                  <option value="compact">Compact (High density for small screens)</option>
                </select>
              </div>

              <label className="flex items-center gap-2 text-neutral-700 dark:text-neutral-300 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={settings.appearance.reduceAnimations}
                  onChange={e => updateSettings('appearance', { reduceAnimations: e.target.checked })}
                  className="rounded"
                />
                <span>Reduce Interface Animations</span>
              </label>
            </div>
          )}

          {/* 2. PRIVACY & SECURITY */}
          {activeSection === 'privacy' && (
            <div className="space-y-5">
              <div className="border-b border-neutral-100 dark:border-neutral-800 pb-3">
                <h3 className="font-semibold text-sm text-neutral-900 dark:text-neutral-100">
                  Privacy & Data Retention
                </h3>
                <p className="text-neutral-500 text-[11px] mt-0.5">
                  Control training opt-outs, private zero-data retention pipelines, and telemetry.
                </p>
              </div>

              <div className="space-y-3">
                <label className="flex items-start gap-3 p-3 rounded-xl border border-neutral-200 dark:border-neutral-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.privacy.zeroDataRetentionMode}
                    onChange={e => updateSettings('privacy', { zeroDataRetentionMode: e.target.checked })}
                    className="rounded mt-0.5"
                  />
                  <div>
                    <span className="font-semibold text-neutral-900 dark:text-neutral-100 block">
                      Zero Data Retention (ZDR) Mode
                    </span>
                    <span className="text-neutral-500 text-[11px]">
                      Inferences are wiped from provider scratchpads immediately after generation.
                    </span>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-3 rounded-xl border border-neutral-200 dark:border-neutral-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.privacy.excludeFromModelTraining}
                    onChange={e => updateSettings('privacy', { excludeFromModelTraining: e.target.checked })}
                    className="rounded mt-0.5"
                  />
                  <div>
                    <span className="font-semibold text-neutral-900 dark:text-neutral-100 block">
                      Exclude Creative Assets from AI Training
                    </span>
                    <span className="text-neutral-500 text-[11px]">
                      Never allow your scripts, images, audio stems or videos to train foundation models.
                    </span>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-3 rounded-xl border border-neutral-200 dark:border-neutral-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.privacy.twoFactorAuthEnabled}
                    onChange={e => updateSettings('privacy', { twoFactorAuthEnabled: e.target.checked })}
                    className="rounded mt-0.5"
                  />
                  <div>
                    <span className="font-semibold text-neutral-900 dark:text-neutral-100 block">
                      Two-Factor Authentication (2FA)
                    </span>
                    <span className="text-neutral-500 text-[11px]">
                      Hardware token / authenticator app security for project export and deletion.
                    </span>
                  </div>
                </label>
              </div>
            </div>
          )}

          {/* 3. AI */}
          {activeSection === 'ai' && (
            <div className="space-y-4">
              <div className="border-b border-neutral-100 dark:border-neutral-800 pb-3">
                <h3 className="font-semibold text-sm text-neutral-900 dark:text-neutral-100">
                  AI Model Routing Defaults
                </h3>
              </div>
              <div>
                <label className="block text-neutral-500 mb-1">Preferred Model Provider</label>
                <select
                  value={settings.ai.defaultProvider}
                  onChange={e => updateSettings('ai', { defaultProvider: e.target.value as any })}
                  className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100"
                >
                  <option value="auto">Autonomous Router (Recommended)</option>
                  <option value="Google">Google DeepMind (Gemini 2.5)</option>
                  <option value="OpenAI">OpenAI (Sora / GPT)</option>
                  <option value="Runway">Runway (Gen-3 Alpha)</option>
                  <option value="Anthropic">Anthropic (Claude 3.7)</option>
                </select>
              </div>

              <div>
                <div className="flex justify-between text-neutral-500 mb-1">
                  <span>Creative Temperature</span>
                  <span className="font-mono">{settings.ai.creativeTemperature}</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="1.0"
                  step="0.05"
                  value={settings.ai.creativeTemperature}
                  onChange={e => updateSettings('ai', { creativeTemperature: Number(e.target.value) })}
                  className="w-full"
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={settings.ai.autoFallbackOnFailure}
                  onChange={e => updateSettings('ai', { autoFallbackOnFailure: e.target.checked })}
                  className="rounded"
                />
                <span>Auto-Fallback to Secondary Model on Provider Downtime</span>
              </label>
            </div>
          )}

          {/* AI PROVIDER CONNECTIONS (OWNER) */}
          {activeSection === 'provider_connections' && (
            <div className="space-y-4">
              <OwnerAIProviderManager />
            </div>
          )}

          {/* MODEL HUB & REGISTRY */}
          {activeSection === 'model_hub' && (
            <div className="space-y-4">
              <ModelHubView
                selectedModelId="veo-3.1-lite-generate-preview"
                onSelectModel={m => {
                  updateSettings('ai', { defaultProvider: m.provider as any });
                }}
                onOpenSettings={() => setActiveSection(isOwner ? 'provider_connections' : 'ai')}
                onOpenPro={onOpenPro}
              />
            </div>
          )}

          {/* 4. EDITING */}
          {activeSection === 'editing' && (
            <div className="space-y-4">
              <div className="border-b border-neutral-100 dark:border-neutral-800 pb-3">
                <h3 className="font-semibold text-sm text-neutral-900 dark:text-neutral-100">
                  Timeline & Editing Parameters
                </h3>
              </div>
              <div>
                <label className="block text-neutral-500 mb-1">Default Project Frame Rate</label>
                <select
                  value={settings.editing.defaultFps}
                  onChange={e => updateSettings('editing', { defaultFps: Number(e.target.value) as any })}
                  className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100"
                >
                  <option value={24}>24 fps (Cinematic Standard)</option>
                  <option value={30}>30 fps (Broadcast / Web)</option>
                  <option value={60}>60 fps (High Smoothness)</option>
                </select>
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.editing.timelineSnapping}
                  onChange={e => updateSettings('editing', { timelineSnapping: e.target.checked })}
                  className="rounded"
                />
                <span>Magnetic Timeline Snapping (Clips & Markers)</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.editing.rippleEditing}
                  onChange={e => updateSettings('editing', { rippleEditing: e.target.checked })}
                  className="rounded"
                />
                <span>Ripple Editing (Close gaps on clip deletion automatically)</span>
              </label>
            </div>
          )}

          {/* 5. AUDIO */}
          {activeSection === 'audio' && (
            <div className="space-y-4">
              <div className="border-b border-neutral-100 dark:border-neutral-800 pb-3">
                <h3 className="font-semibold text-sm text-neutral-900 dark:text-neutral-100">
                  Audio DSP Engine
                </h3>
              </div>
              <div>
                <label className="block text-neutral-500 mb-1">Master Sample Rate</label>
                <select
                  value={settings.audio.sampleRate}
                  onChange={e => updateSettings('audio', { sampleRate: Number(e.target.value) as any })}
                  className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100"
                >
                  <option value={48000}>48,000 Hz (Video Broadcast Standard)</option>
                  <option value={44100}>44,100 Hz (CD Audio Standard)</option>
                  <option value={96000}>96,000 Hz (High Resolution Master)</option>
                </select>
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.audio.peakMonitoring}
                  onChange={e => updateSettings('audio', { peakMonitoring: e.target.checked })}
                  className="rounded"
                />
                <span>Real-Time True Peak LUFS Metering</span>
              </label>
            </div>
          )}

          {/* 6. EXPORT */}
          {activeSection === 'export' && (
            <div className="space-y-4">
              <div className="border-b border-neutral-100 dark:border-neutral-800 pb-3">
                <h3 className="font-semibold text-sm text-neutral-900 dark:text-neutral-100">
                  Export Engine Defaults
                </h3>
              </div>
              <div>
                <label className="block text-neutral-500 mb-1">Default Master Codec</label>
                <select
                  value={settings.export.defaultCodec}
                  onChange={e => updateSettings('export', { defaultCodec: e.target.value as any })}
                  className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100"
                >
                  <option value="H.264">H.264 / AVC (Universal Web)</option>
                  <option value="ProRes 422">Apple ProRes 422 (Broadcast Master)</option>
                  <option value="AV1">AV1 (Next-Gen Efficiency)</option>
                </select>
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.export.hardwareAcceleration}
                  onChange={e => updateSettings('export', { hardwareAcceleration: e.target.checked })}
                  className="rounded"
                />
                <span>Hardware Accelerated GPU Encoding</span>
              </label>
            </div>
          )}

          {/* 7. BACKUP & SYNC */}
          {activeSection === 'backup' && (
            <div className="space-y-4">
              <div className="border-b border-neutral-100 dark:border-neutral-800 pb-3">
                <h3 className="font-semibold text-sm text-neutral-900 dark:text-neutral-100">
                  Autosave & Cloud Synchronization
                </h3>
              </div>
              <div>
                <label className="block text-neutral-500 mb-1">Autosave Interval Frequency</label>
                <select
                  value={settings.backup.autosaveIntervalSec}
                  onChange={e => updateSettings('backup', { autosaveIntervalSec: Number(e.target.value) as any })}
                  className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100"
                >
                  <option value={15}>Every 15 Seconds (Continuous)</option>
                  <option value={30}>Every 30 Seconds (Default)</option>
                  <option value={60}>Every 1 Minute</option>
                  <option value={120}>Every 2 Minutes</option>
                </select>
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.backup.autoCreateVersionOnExport}
                  onChange={e => updateSettings('backup', { autoCreateVersionOnExport: e.target.checked })}
                  className="rounded"
                />
                <span>Automatically snapshot new version checkpoint upon master export</span>
              </label>
            </div>
          )}

          {/* 8. NOTIFICATIONS */}
          {activeSection === 'notifications' && (
            <div className="space-y-4">
              <div className="border-b border-neutral-100 dark:border-neutral-800 pb-3">
                <h3 className="font-semibold text-sm text-neutral-900 dark:text-neutral-100">
                  System Notifications
                </h3>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.notifications.renderCompleted}
                  onChange={e => updateSettings('notifications', { renderCompleted: e.target.checked })}
                  className="rounded"
                />
                <span>Alert when background renders complete</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.notifications.creditThresholdAlert}
                  onChange={e => updateSettings('notifications', { creditThresholdAlert: e.target.checked })}
                  className="rounded"
                />
                <span>Notify when AI Credits drop below 200 CR</span>
              </label>
            </div>
          )}

          {/* 9. ACCESSIBILITY */}
          {activeSection === 'accessibility' && (
            <div className="space-y-4">
              <div className="border-b border-neutral-100 dark:border-neutral-800 pb-3">
                <h3 className="font-semibold text-sm text-neutral-900 dark:text-neutral-100">
                  Accessibility Preferences
                </h3>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.accessibility.screenReaderOptimized}
                  onChange={e => updateSettings('accessibility', { screenReaderOptimized: e.target.checked })}
                  className="rounded"
                />
                <span>Optimize DOM tree and ARIA roles for screen readers</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.accessibility.monochromeWaveforms}
                  onChange={e => updateSettings('accessibility', { monochromeWaveforms: e.target.checked })}
                  className="rounded"
                />
                <span>High-contrast monochrome timeline tracks and waveforms</span>
              </label>
            </div>
          )}

          {/* 10. PERFORMANCE & STORAGE */}
          {activeSection === 'performance' && (
            <div className="space-y-5">
              <div className="border-b border-neutral-100 dark:border-neutral-800 pb-3">
                <h3 className="font-semibold text-sm text-neutral-900 dark:text-neutral-100">
                  Storage, Cache & Engine Performance
                </h3>
                <p className="text-neutral-500 text-[11px] mt-0.5">
                  Inspect in-memory cache breakdown, proxy media files, and auto-cleanup policies.
                </p>
              </div>

              <div>
                <label className="block text-neutral-500 mb-1">Preview Proxy Resolution</label>
                <select
                  value={settings.performance.previewProxyResolution}
                  onChange={e => updateSettings('performance', { previewProxyResolution: e.target.value as any })}
                  className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 font-medium"
                >
                  <option value="half">Half Resolution (Recommended for responsive editing)</option>
                  <option value="full">Full Resolution (Pixel-accurate, higher GPU load)</option>
                  <option value="quarter">Quarter Resolution (Maximum performance for large timelines)</option>
                </select>
              </div>

              {/* Storage Breakdown */}
              <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/30 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-neutral-900 dark:text-neutral-100 font-mono text-[10px] uppercase">
                    Device Storage Breakdown (Safe to Clean)
                  </span>
                  <span className="text-[11px] font-mono text-neutral-500">
                    Total: ~1.16 GB
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px]">
                  <div className="p-2.5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#151820]">
                    <div className="text-neutral-500">Project States</div>
                    <div className="font-bold text-neutral-800 dark:text-neutral-200 font-mono mt-0.5">38.4 MB</div>
                    <div className="text-[9px] text-emerald-600 dark:text-emerald-400 mt-1">Protected</div>
                  </div>

                  <div className="p-2.5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#151820]">
                    <div className="text-neutral-500">Proxy Files</div>
                    <div className="font-bold text-neutral-800 dark:text-neutral-200 font-mono mt-0.5">480.0 MB</div>
                    <button 
                      onClick={() => {
                        updateSettings('performance', { ...settings.performance });
                      }}
                      className="text-[10px] text-blue-600 dark:text-blue-400 hover:underline mt-1 block"
                    >
                      Clear Proxies
                    </button>
                  </div>

                  <div className="p-2.5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#151820]">
                    <div className="text-neutral-500">Render Cache</div>
                    <div className="font-bold text-neutral-800 dark:text-neutral-200 font-mono mt-0.5">320.5 MB</div>
                    <button 
                      onClick={() => {
                        updateSettings('performance', { ...settings.performance });
                      }}
                      className="text-[10px] text-blue-600 dark:text-blue-400 hover:underline mt-1 block"
                    >
                      Purge Cache
                    </button>
                  </div>

                  <div className="p-2.5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#151820]">
                    <div className="text-neutral-500">AI Staging Files</div>
                    <div className="font-bold text-neutral-800 dark:text-neutral-200 font-mono mt-0.5">195.2 MB</div>
                    <button 
                      onClick={() => {
                        updateSettings('performance', { ...settings.performance });
                      }}
                      className="text-[10px] text-blue-600 dark:text-blue-400 hover:underline mt-1 block"
                    >
                      Purge Temp AI
                    </button>
                  </div>

                  <div className="p-2.5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#151820]">
                    <div className="text-neutral-500">Thumbnails</div>
                    <div className="font-bold text-neutral-800 dark:text-neutral-200 font-mono mt-0.5">24.8 MB</div>
                    <button 
                      onClick={() => {
                        updateSettings('performance', { ...settings.performance });
                      }}
                      className="text-[10px] text-blue-600 dark:text-blue-400 hover:underline mt-1 block"
                    >
                      Reset Thumbs
                    </button>
                  </div>

                  <div className="p-2.5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#151820]">
                    <div className="text-neutral-500">Cached Audio Stems</div>
                    <div className="font-bold text-neutral-800 dark:text-neutral-200 font-mono mt-0.5">102.1 MB</div>
                    <button 
                      onClick={() => {
                        updateSettings('performance', { ...settings.performance });
                      }}
                      className="text-[10px] text-blue-600 dark:text-blue-400 hover:underline mt-1 block"
                    >
                      Flush Stems
                    </button>
                  </div>
                </div>

                <div className="pt-2 text-[11px] text-neutral-500 leading-relaxed border-t border-neutral-200 dark:border-neutral-800">
                  Original media assets and project timelines are never deleted by cache purges. Clearing proxies or render caches only deletes derived scratch files that can be regenerated on demand.
                </div>
              </div>

              {/* Automatic Cleanup Policies */}
              <div className="space-y-2">
                <span className="font-bold text-neutral-900 dark:text-neutral-100 font-mono text-[10px] uppercase block">
                  Automatic Cleanup Policies
                </span>

                <label className="flex items-center gap-2 cursor-pointer text-[11px]">
                  <input
                    type="checkbox"
                    defaultChecked
                    className="rounded text-neutral-900 dark:text-white"
                  />
                  <span>Automatically purge render scratch cache older than 7 days</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-[11px]">
                  <input
                    type="checkbox"
                    defaultChecked
                    className="rounded text-neutral-900 dark:text-white"
                  />
                  <span>Automatically release GPU video texture buffers when tab is backgrounded</span>
                </label>
              </div>
            </div>
          )}

          {/* 11. LANGUAGE */}
          {activeSection === 'language' && (
            <div className="space-y-4">
              <div className="border-b border-neutral-100 dark:border-neutral-800 pb-3">
                <h3 className="font-semibold text-sm text-neutral-900 dark:text-neutral-100">
                  Language & Regional Formats
                </h3>
              </div>
              <div>
                <label className="block text-neutral-500 mb-1">Interface Language</label>
                <select
                  value={settings.language.currentLanguage}
                  onChange={e => updateSettings('language', { currentLanguage: e.target.value as any })}
                  className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100"
                >
                  <option value="en">English (US)</option>
                  <option value="hi">हिन्दी (Hindi)</option>
                  <option value="de">Deutsch</option>
                  <option value="fr">Français</option>
                  <option value="es">Español</option>
                  <option value="ja">日本語</option>
                  <option value="zh">中文</option>
                </select>
              </div>
            </div>
          )}

          {/* 12. PRO */}
          {activeSection === 'pro' && (
            <div className="space-y-4">
              <div className="border-b border-neutral-100 dark:border-neutral-800 pb-3">
                <h3 className="font-semibold text-sm text-neutral-900 dark:text-neutral-100">
                  Pro Subscription & Entitlements
                </h3>
              </div>

              <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/40 space-y-2">
                <div className="flex justify-between">
                  <span className="text-neutral-500">Tier Status:</span>
                  <span className="font-bold text-neutral-900 dark:text-neutral-100 font-mono">
                    {isPro ? 'PRO SUBSCRIPTION ACTIVE' : 'FREE STARTER TIER'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">Access Origin:</span>
                  <span className="font-mono text-neutral-700 dark:text-neutral-300">
                    {currentUser.proSource || 'None'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">Credits Remaining:</span>
                  <span className="font-bold text-neutral-900 dark:text-neutral-100 font-mono">
                    {currentUser.aiCredits.toLocaleString()} CR
                  </span>
                </div>
              </div>

              <button
                onClick={onOpenPro}
                className="w-full py-2 bg-neutral-900 dark:bg-white text-white dark:text-neutral-950 font-medium rounded-lg hover:opacity-90"
              >
                Manage Subscription Details
              </button>
            </div>
          )}

          {/* 13. ADVANCED */}
          {activeSection === 'advanced' && (
            <div className="space-y-4">
              <div className="border-b border-neutral-100 dark:border-neutral-800 pb-3">
                <h3 className="font-semibold text-sm text-neutral-900 dark:text-neutral-100">
                  Advanced Diagnostics & Developer Flags
                </h3>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.advanced.showDebugStats}
                  onChange={e => updateSettings('advanced', { showDebugStats: e.target.checked })}
                  className="rounded"
                />
                <span>Display Real-time Ingestion & WebAssembly Telemetry</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.advanced.developerLogsEnabled}
                  onChange={e => updateSettings('advanced', { developerLogsEnabled: e.target.checked })}
                  className="rounded"
                />
                <span>Verbose Console Logging for Multi-Model Bus</span>
              </label>
            </div>
          )}

          {/* 14. ABOUT */}
          {activeSection === 'about' && (
            <div className="space-y-4">
              <div className="border-b border-neutral-100 dark:border-neutral-800 pb-3">
                <h3 className="font-semibold text-sm text-neutral-900 dark:text-neutral-100">
                  About AI Creative Studio
                </h3>
              </div>
              <div className="space-y-2 text-neutral-600 dark:text-neutral-400 leading-relaxed">
                <p>
                  <strong className="text-neutral-900 dark:text-neutral-100">Core Principle:</strong> Extremely powerful inside, extremely simple outside.
                </p>
                <div className="font-mono text-[11px] p-3 rounded-lg bg-neutral-50 dark:bg-neutral-900/50 border border-neutral-200 dark:border-neutral-800 space-y-1">
                  <div>Version: {settings.about.version}</div>
                  <div>Build: {settings.about.buildNumber}</div>
                  <div>Engine: {settings.about.engineArchitecture}</div>
                  <div>Release Channel: {settings.about.releaseChannel}</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
