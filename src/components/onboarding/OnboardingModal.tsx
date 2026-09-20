import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Clapperboard, 
  Video, 
  Camera, 
  Music, 
  Wand2, 
  FolderGit2, 
  Crown, 
  Check, 
  ChevronRight, 
  ChevronLeft, 
  Sun, 
  Moon, 
  Laptop,
  X,
  ShieldCheck
} from 'lucide-react';
import { useSettings } from '../../context/SettingsContext';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenPro?: () => void;
}

export const ONBOARDING_STORAGE_KEY = 'vyro_onboarding_completed_v1';

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  isOpen,
  onClose,
  onOpenPro,
}) => {
  const { theme, setTheme, resolvedTheme } = useSettings();
  const [currentStep, setCurrentStep] = useState(0);
  const [doNotShowAgain, setDoNotShowAgain] = useState(true);

  useEffect(() => {
    if (isOpen) {
      setCurrentStep(0);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleFinish = () => {
    if (doNotShowAgain) {
      try {
        localStorage.setItem(ONBOARDING_STORAGE_KEY, 'true');
      } catch {
        // ignore
      }
    }
    onClose();
  };

  const steps = [
    {
      title: 'Welcome to AI Creative Studio',
      subtitle: 'The unified production suite for video, photo, audio, and generative AI.',
      content: (
        <div className="space-y-4">
          <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50 space-y-3">
            <span className="text-xs font-bold text-neutral-900 dark:text-neutral-100 uppercase tracking-wider font-mono">
              Choose Workspace Theme
            </span>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setTheme('light')}
                className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all text-xs ${
                  theme === 'light'
                    ? 'border-neutral-900 dark:border-white bg-white dark:bg-neutral-800 text-neutral-950 dark:text-white font-bold shadow-xs'
                    : 'border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:border-neutral-400'
                }`}
              >
                <Sun className="w-5 h-5 text-amber-500" />
                <span>Light</span>
              </button>

              <button
                type="button"
                onClick={() => setTheme('dark')}
                className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all text-xs ${
                  theme === 'dark'
                    ? 'border-neutral-900 dark:border-white bg-white dark:bg-neutral-800 text-neutral-950 dark:text-white font-bold shadow-xs'
                    : 'border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:border-neutral-400'
                }`}
              >
                <Moon className="w-5 h-5 text-indigo-400" />
                <span>Dark</span>
              </button>

              <button
                type="button"
                onClick={() => setTheme('system')}
                className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all text-xs ${
                  theme === 'system'
                    ? 'border-neutral-900 dark:border-white bg-white dark:bg-neutral-800 text-neutral-950 dark:text-white font-bold shadow-xs'
                    : 'border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:border-neutral-400'
                }`}
              >
                <Laptop className="w-5 h-5 text-neutral-400" />
                <span>System</span>
              </button>
            </div>
          </div>

          <div className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
            Everything in AI Creative Studio is built local-first with non-destructive version checkpoints, so your timeline edits, stems, and photo adjustments are always safe.
          </div>
        </div>
      ),
    },
    {
      title: 'Four Dedicated Creative Suites',
      subtitle: 'Switch seamlessly between editing domains without switching tools.',
      content: (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/50 space-y-1">
            <div className="flex items-center gap-2 font-bold text-neutral-900 dark:text-neutral-100">
              <Clapperboard className="w-4 h-4 text-purple-500" />
              <span>AI Director</span>
            </div>
            <p className="text-neutral-500 text-[11px]">
              Turn text treatments into cinematic multi-shot scenes with camera choreography & storyboard generation.
            </p>
          </div>

          <div className="p-3.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/50 space-y-1">
            <div className="flex items-center gap-2 font-bold text-neutral-900 dark:text-neutral-100">
              <Video className="w-4 h-4 text-blue-500" />
              <span>Video Editor</span>
            </div>
            <p className="text-neutral-500 text-[11px]">
              Multi-track timeline, keyframing, speed ramping, auto-cut, text overlays, and multi-format rendering.
            </p>
          </div>

          <div className="p-3.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/50 space-y-1">
            <div className="flex items-center gap-2 font-bold text-neutral-900 dark:text-neutral-100">
              <Camera className="w-4 h-4 text-emerald-500" />
              <span>Photo Studio</span>
            </div>
            <p className="text-neutral-500 text-[11px]">
              Layer stack editor, AI object removal, neural relighting, generative expand, and color grading.
            </p>
          </div>

          <div className="p-3.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/50 space-y-1">
            <div className="flex items-center gap-2 font-bold text-neutral-900 dark:text-neutral-100">
              <Music className="w-4 h-4 text-amber-500" />
              <span>Audio Studio</span>
            </div>
            <p className="text-neutral-500 text-[11px]">
              Stem isolation (vocals, bass, drums), AI noise reduction, dynamic EQ, and multi-track mixing.
            </p>
          </div>
        </div>
      ),
    },
    {
      title: 'AI Intelligence & Media Tools',
      subtitle: 'Next-gen tools powered by multi-provider model routing.',
      content: (
        <div className="space-y-3 text-xs">
          <div className="p-3.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/40 space-y-2">
            <div className="flex items-center gap-2 font-bold text-neutral-900 dark:text-neutral-100">
              <Wand2 className="w-4 h-4 text-blue-500" />
              <span>AI Tools & Generation Studio</span>
            </div>
            <p className="text-neutral-500 text-[11px] leading-relaxed">
              Explore 20+ specialized neural utilities: Video Enhancer, Background Remover, Voice Isolator, Inpainting, Auto Subtitles, and Prompt-to-Video generation.
            </p>
          </div>

          <div className="p-3.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/40 space-y-2">
            <div className="flex items-center gap-2 font-bold text-neutral-900 dark:text-neutral-100">
              <FolderGit2 className="w-4 h-4 text-emerald-500" />
              <span>Non-Destructive Project Integrity</span>
            </div>
            <p className="text-neutral-500 text-[11px] leading-relaxed">
              Every edit generates continuous undo/redo history, named version snapshots, crash recovery states, and multi-device cloud synchronization.
            </p>
          </div>
        </div>
      ),
    },
    {
      title: 'Transparent Free vs Pro',
      subtitle: 'Professional creative power with zero dark patterns or hidden traps.',
      content: (
        <div className="space-y-3 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/50 space-y-2">
              <span className="font-bold text-neutral-900 dark:text-neutral-100 text-sm">Free Tier</span>
              <ul className="space-y-1.5 text-[11px] text-neutral-600 dark:text-neutral-400">
                <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" /> Full Studio Access</li>
                <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" /> 1080p Master Exports</li>
                <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" /> Unlimited Local Projects</li>
                <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" /> 50 Free AI Starter Credits</li>
              </ul>
            </div>

            <div className="p-3.5 rounded-xl border border-amber-500/30 bg-amber-500/5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-amber-700 dark:text-amber-400 text-sm flex items-center gap-1">
                  <Crown className="w-3.5 h-3.5 text-amber-500" /> Pro Tier
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-800 dark:text-amber-300 font-bold">
                  7-Day Trial
                </span>
              </div>
              <ul className="space-y-1.5 text-[11px] text-neutral-700 dark:text-neutral-300">
                <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-amber-500 shrink-0" /> 4K UHD & ProRes 422 Master</li>
                <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-amber-500 shrink-0" /> Priority Cloud Vault Sync</li>
                <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-amber-500 shrink-0" /> +5,000 AI Credits / month</li>
                <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-amber-500 shrink-0" /> Fast-Track Render Queue</li>
              </ul>
            </div>
          </div>

          <div className="p-3 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50 flex items-center gap-2 text-neutral-500 text-[11px]">
            <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>Cancel anytime in your profile settings with 1 click. No surprise charges.</span>
          </div>
        </div>
      ),
    },
  ];

  const activeStep = steps[currentStep];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
      <div 
        id="onboarding-guide-modal"
        className="w-full max-w-xl bg-white dark:bg-[#12151c] border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 shadow-2xl space-y-6 text-xs animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-neutral-100 dark:border-neutral-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 flex items-center justify-center font-bold text-xs">
              AI
            </div>
            <div>
              <h3 className="font-bold text-base text-neutral-900 dark:text-neutral-100">
                {activeStep.title}
              </h3>
              <p className="text-neutral-500 text-[11px]">
                {activeStep.subtitle}
              </p>
            </div>
          </div>
          <button
            onClick={handleFinish}
            className="p-1 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded"
            title="Close guide"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Dynamic Content */}
        <div className="min-h-[220px]">
          {activeStep.content}
        </div>

        {/* Progress & Navigation */}
        <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
            {/* Step indicator dots */}
            <div className="flex items-center gap-1.5">
              {steps.map((_, idx) => (
                <div
                  key={idx}
                  className={`h-1.5 rounded-full transition-all ${
                    idx === currentStep
                      ? 'w-6 bg-neutral-900 dark:bg-white'
                      : 'w-1.5 bg-neutral-300 dark:bg-neutral-700'
                  }`}
                />
              ))}
            </div>

            <label className="flex items-center gap-1.5 text-[11px] text-neutral-500 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={doNotShowAgain}
                onChange={e => setDoNotShowAgain(e.target.checked)}
                className="rounded text-neutral-900 dark:text-white"
              />
              <span>Don't show on start</span>
            </label>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={handleFinish}
              className="px-3 py-1.5 rounded-lg text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 font-medium"
            >
              Skip
            </button>

            {currentStep > 0 && (
              <button
                onClick={() => setCurrentStep(prev => prev - 1)}
                className="px-3 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center gap-1"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
            )}

            {currentStep < steps.length - 1 ? (
              <button
                onClick={() => setCurrentStep(prev => prev + 1)}
                className="px-4 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-200 text-white dark:text-neutral-950 font-bold flex items-center gap-1 shadow-xs"
              >
                <span>Next</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                onClick={handleFinish}
                className="px-5 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-200 text-white dark:text-neutral-950 font-bold flex items-center gap-1 shadow-xs"
              >
                <span>Get Started</span>
                <Check className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
