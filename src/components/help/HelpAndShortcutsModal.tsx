import React, { useState } from 'react';
import { 
  X, 
  HelpCircle, 
  Keyboard, 
  Info, 
  BookOpen, 
  Video, 
  Camera, 
  Music, 
  Clapperboard, 
  Wand2, 
  FolderGit2, 
  Share2, 
  Crown, 
  ShieldCheck, 
  Mail, 
  Code,
  Sparkles,
  Layers,
  FileCheck
} from 'lucide-react';

interface HelpAndShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'guides' | 'shortcuts' | 'about';
}

export const HelpAndShortcutsModal: React.FC<HelpAndShortcutsModalProps> = ({
  isOpen,
  onClose,
  defaultTab = 'shortcuts',
}) => {
  const [activeTab, setActiveTab] = useState<'guides' | 'shortcuts' | 'about'>(defaultTab);

  if (!isOpen) return null;

  const shortcutsList = [
    { key: 'Ctrl + Z / ⌘Z', action: 'Undo last edit action', scope: 'Universal' },
    { key: 'Ctrl + Shift + Z / ⌘⇧Z', action: 'Redo previously undone action', scope: 'Universal' },
    { key: 'Ctrl + S / ⌘S', action: 'Save project & trigger cloud autosave', scope: 'Universal' },
    { key: 'Space', action: 'Toggle Play / Pause active timeline or preview', scope: 'Studios' },
    { key: 'S', action: 'Split active clip at playhead position', scope: 'Video / Audio' },
    { key: 'Delete / Backspace', action: 'Delete selected clip, layer, or stem', scope: 'Studios' },
    { key: 'Ctrl + C / ⌘C', action: 'Copy selected clip or adjustment', scope: 'Timeline' },
    { key: 'Ctrl + V / ⌘V', action: 'Paste copied item at playhead', scope: 'Timeline' },
    { key: '+ / -', action: 'Zoom timeline in or out', scope: 'Video / Audio' },
    { key: 'F', action: 'Toggle full-screen master preview', scope: 'Preview' },
    { key: '?', action: 'Open this Keyboard Shortcuts & Help modal', scope: 'Universal' },
    { key: 'Esc', action: 'Close open dialogs or dismiss modals', scope: 'Universal' },
  ];

  const studioGuides = [
    {
      title: 'Video Editor Studio',
      icon: Video,
      desc: 'Multi-track timeline with precision frame snapping. Drag clips into video and audio tracks, drag clip edges to trim, and select a clip to adjust speed, opacity, scale, and color filters.',
    },
    {
      title: 'Photo Studio',
      icon: Camera,
      desc: 'Non-destructive layer stack. Add adjustments (Exposure, Contrast, Hue, Saturation), run neural background removal, and use Generative Fill to seamlessly expand canvas borders.',
    },
    {
      title: 'Audio Studio',
      icon: Music,
      desc: 'AI stem separation isolates Vocals, Drums, and Bass into independent audio tracks with solo/mute controls, parametric EQ, and AI noise suppression.',
    },
    {
      title: 'AI Director',
      icon: Clapperboard,
      desc: 'Script-to-scene intelligence. Enter a creative prompt or treatment to generate multi-shot storyboard plans, camera motion styles (Dolly, Pan, Orbit), and automated narration.',
    },
    {
      title: 'AI Tools & Model Hub',
      icon: Wand2,
      desc: 'Route tasks across specialized AI models (Gemini 2.5 Flash, Pro, Imagen 3, Veo 2). Switch between High Quality, Balanced, and Ultra Fast execution profiles.',
    },
    {
      title: 'Export Center & Render Queue',
      icon: Share2,
      desc: 'Export presets tailored for YouTube, Instagram, TikTok, WhatsApp, and custom master renders in MP4 (H.264), ProRes 422, or WebM up to 4K UHD.',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-xs">
      <div 
        id="help-shortcuts-modal"
        className="w-full max-w-2xl bg-white dark:bg-studio-surface border border-neutral-200 dark:border-neutral-800 rounded-2xl p-4 sm:p-6 shadow-2xl space-y-4 sm:space-y-5 text-xs max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-neutral-100 dark:border-neutral-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 flex items-center justify-center font-bold text-xs shrink-0">
              ?
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-neutral-900 dark:text-neutral-100">
                Help, Shortcuts & Documentation
              </h3>
              <p className="text-neutral-500 text-[11px]">
                AI Creative Studio • Production Release Reference
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded min-h-[36px] min-w-[36px] sm:min-h-0 sm:min-w-0 flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1.5 sm:gap-2 border-b border-neutral-200 dark:border-neutral-800 pb-2 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveTab('shortcuts')}
            className={`px-3 py-1.5 rounded-lg font-medium flex items-center gap-1.5 transition-colors whitespace-nowrap ${
              activeTab === 'shortcuts'
                ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-950'
                : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100'
            }`}
          >
            <Keyboard className="w-3.5 h-3.5" />
            <span>Keyboard Shortcuts</span>
          </button>

          <button
            onClick={() => setActiveTab('guides')}
            className={`px-3 py-1.5 rounded-lg font-medium flex items-center gap-1.5 transition-colors whitespace-nowrap ${
              activeTab === 'guides'
                ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-950'
                : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Studio Guides</span>
          </button>

          <button
            onClick={() => setActiveTab('about')}
            className={`px-3 py-1.5 rounded-lg font-medium flex items-center gap-1.5 transition-colors whitespace-nowrap ${
              activeTab === 'about'
                ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-950'
                : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100'
            }`}
          >
            <Info className="w-3.5 h-3.5" />
            <span>About & Licenses</span>
          </button>
        </div>

        {/* Tab Content: Shortcuts */}
        {activeTab === 'shortcuts' && (
          <div className="space-y-3">
            <div className="text-neutral-500 text-[11px]">
              Use standard desktop modifier keys to speed up editing. Shortcuts work seamlessly without interrupting system functions.
            </div>

            <div className="divide-y divide-neutral-100 dark:divide-neutral-800/60 border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden">
              {shortcutsList.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-2.5 hover:bg-neutral-50 dark:hover:bg-neutral-900/40">
                  <div className="flex items-center gap-2">
                    <span className="text-neutral-800 dark:text-neutral-200 font-medium">
                      {item.action}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-500 font-mono">
                      {item.scope}
                    </span>
                  </div>
                  <kbd className="px-2 py-1 rounded bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 font-mono text-[10px] font-bold">
                    {item.key}
                  </kbd>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab Content: Guides */}
        {activeTab === 'guides' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {studioGuides.map((guide, idx) => {
              const Icon = guide.icon;
              return (
                <div key={idx} className="p-3.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#151820] space-y-1.5">
                  <div className="flex items-center gap-2 font-bold text-neutral-900 dark:text-neutral-100">
                    <Icon className="w-4 h-4 text-neutral-500" />
                    <span>{guide.title}</span>
                  </div>
                  <p className="text-neutral-500 text-[11px] leading-relaxed">
                    {guide.desc}
                  </p>
                </div>
              );
            })}
          </div>
        )}

        {/* Tab Content: About */}
        {activeTab === 'about' && (
          <div className="space-y-4 text-xs">
            <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/40 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-neutral-900 dark:text-neutral-100 text-sm">
                  AI Creative Studio (VYRO Edition)
                </span>
                <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-neutral-900 dark:bg-white text-white dark:text-neutral-950 font-bold">
                  v10.0.0 Production Release
                </span>
              </div>
              <p className="text-neutral-500 text-[11px] leading-relaxed">
                Built for professional creators, developers, and storytellers. Engineered with modern React 19, TypeScript, Tailwind CSS, WebCodecs, and Gemini Generative AI infrastructure.
              </p>
            </div>

            <div className="space-y-2">
              <span className="font-bold text-neutral-900 dark:text-neutral-100 font-mono text-[10px] uppercase">
                Changelog Highlights
              </span>
              <ul className="space-y-1 text-[11px] text-neutral-600 dark:text-neutral-400 list-disc pl-4">
                <li>Production release hardening with unified Export Center and Render Queue.</li>
                <li>Cloud Sync Engine with 3-way conflict resolution and automatic crash recovery.</li>
                <li>Non-destructive version snapshot tree with instant rollback.</li>
                <li>Multi-provider AI model router with live credit transaction ledger.</li>
                <li>Configurable Pro subscription architecture with 7-day free trial disclosures.</li>
                <li>Owner Control Center with live security audits and global feature switches.</li>
              </ul>
            </div>

            <div className="space-y-1.5 pt-2 border-t border-neutral-100 dark:border-neutral-800">
              <div className="flex items-center justify-between text-neutral-500 text-[11px]">
                <span>Open Source Licenses: MIT / Apache 2.0</span>
                <span>Privacy: Local-First • Zero Unsolicited Telemetry</span>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-950 font-bold text-xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
