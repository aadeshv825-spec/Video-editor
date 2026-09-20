import React, { useState } from 'react';
import {
  Sparkles,
  VolumeX,
  Mic,
  Activity,
  MessageSquare,
  Scissors,
  Globe,
  Radio,
  Zap,
  Music,
  Info,
  Cpu,
} from 'lucide-react';
import { useModelRouter } from '../../../context/ModelRouterContext';

export const AudioAiPrepPanel: React.FC = () => {
  const { selectedModel } = useModelRouter();
  const [activeAiTool, setActiveAiTool] = useState<string>('noise_removal');
  const [targetPrompt, setTargetPrompt] = useState('');

  const aiAudioPipelines = [
    {
      id: 'noise_removal',
      name: 'Noise Removal',
      icon: VolumeX,
      category: 'Restoration',
      description: 'Spectral subtraction and neural filtering to eliminate HVAC hum, street rumble, and background hiss without phase artifacts.',
      params: ['Noise print learning threshold', 'Spectral suppression depth (dB)', 'Transient preservation'],
    },
    {
      id: 'voice_isolation',
      name: 'Voice Isolation',
      icon: Mic,
      category: 'Stem Separation',
      description: 'Deep neural stem separator extracting studio-clean vocal dialogue from music, foley, and environmental sound beds.',
      params: ['Isolation strength', 'Vocal bleed reduction', 'Automatic gain compensation'],
    },
    {
      id: 'echo_reduction',
      name: 'Echo & Reverb Reduction',
      icon: Activity,
      category: 'Acoustic De-Verb',
      description: 'Attenuates room reflections and slap-back flutter echoes recorded in untreated rooms.',
      params: ['Reverb decay suppression', 'Direct-to-reverberant ratio', 'Room volume estimator'],
    },
    {
      id: 'dialogue_enhancement',
      name: 'Dialogue Enhancement',
      icon: MessageSquare,
      category: 'Intelligibility',
      description: 'Multiband dynamic EQ and neural formant boosting for clear, broadcast-grade speech intelligibility.',
      params: ['Proximity warmth booster', 'Consonant clarity boost', 'Sibilance de-esser threshold'],
    },
    {
      id: 'silence_removal',
      name: 'Smart Silence Removal',
      icon: Scissors,
      category: 'Automated Editing',
      description: 'Detects and truncates awkward pauses and dead air with adjustable crossfade padding.',
      params: ['Silence gate threshold (-dBFS)', 'Minimum silence duration (ms)', 'Crossfade lead-in/out padding'],
    },
    {
      id: 'ai_dubbing',
      name: 'AI Neural Dubbing',
      icon: Globe,
      category: 'Localization',
      description: 'Translates speech into 40+ target languages with voice cloning and automatic phoneme-to-lip cadence matching.',
      params: ['Target language', 'Original voice timbre preservation', 'Pacing time-compression'],
    },
    {
      id: 'text_to_speech',
      name: 'Text-to-Speech (TTS)',
      icon: Radio,
      category: 'Voice Generation',
      description: 'Generate high-fidelity conversational narration and studio voiceover directly onto a new audio track.',
      params: ['Script text', 'Voice persona (Warm / Cinematic / Neutral)', 'Speaking rate', 'Emotional inflection'],
    },
    {
      id: 'beat_detection',
      name: 'Beat & Transient Detection',
      icon: Zap,
      category: 'Rhythm Alignment',
      description: 'Calculates BPM tempo and plots beat markers across the timeline for rhythmic video cut syncing.',
      params: ['Sensitivity threshold', 'Downbeat grid snapping', 'Tempo drift tracker'],
    },
    {
      id: 'audio_sync',
      name: 'Audio Synchronization',
      icon: Activity,
      category: 'Multi-Cam / Multi-Mic',
      description: 'Aligns disparate microphone tracks and boom recorder stems using acoustic audio fingerprinting.',
      params: ['Master reference track', 'Phase alignment tolerance', 'Timecode drift correction'],
    },
    {
      id: 'ai_sfx',
      name: 'AI Sound Effects (Foley)',
      icon: Music,
      category: 'Generative Foley',
      description: 'Generates bespoke sound design effects (whooshes, impacts, ambiances) from natural language descriptions.',
      params: ['Sound effect description', 'Duration (seconds)', 'Reverb depth', 'Layer frequency range'],
    },
  ];

  const selectedPipeline = aiAudioPipelines.find(p => p.id === activeAiTool) || aiAudioPipelines[0];
  const PipelineIcon = selectedPipeline.icon;

  return (
    <div className="flex-1 bg-neutral-950 text-neutral-200 p-4 sm:p-6 overflow-y-auto select-none">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500" />
            <h2 className="text-sm font-semibold text-neutral-100 uppercase tracking-wider font-mono">
              AI Audio Neural Architecture Hub
            </h2>
          </div>
          <div className="flex items-center gap-1.5 font-mono text-xs text-neutral-400 bg-neutral-900 border border-neutral-800 px-2 py-1 rounded">
            <Cpu className="w-3.5 h-3.5 text-neutral-400" />
            <span>{selectedModel.name}</span>
          </div>
        </div>

        {/* Prepared Architecture Notice */}
        <div className="p-3.5 rounded-lg border border-amber-900/50 bg-amber-950/20 text-amber-300 space-y-1">
          <div className="flex items-center gap-2 font-semibold text-xs">
            <Info className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Prepared Audio DSP Endpoints (Ready for Neural Models)</span>
          </div>
          <p className="text-[11px] text-amber-400/80 leading-relaxed">
            These 10 audio processing hooks are cleanly modularized. When activated with model weights, results are returned as non-destructive audio clips and stems onto dedicated timeline tracks.
          </p>
        </div>

        {/* Pipeline Grid & Detail View */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Left Column: Pipeline Selector */}
          <div className="space-y-1 md:col-span-1 border border-neutral-800 rounded-xl p-2 bg-[#101318] max-h-[500px] overflow-y-auto">
            {aiAudioPipelines.map(pipe => {
              const Icon = pipe.icon;
              const isSelected = pipe.id === activeAiTool;

              return (
                <button
                  key={pipe.id}
                  onClick={() => setActiveAiTool(pipe.id)}
                  className={`w-full p-2 rounded-lg text-left flex items-center justify-between transition-all ${
                    isSelected
                      ? 'bg-neutral-800 text-white font-medium shadow-xs border border-neutral-700'
                      : 'hover:bg-neutral-900 text-neutral-400'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <Icon className={`w-4 h-4 shrink-0 ${isSelected ? 'text-amber-400' : 'text-neutral-500'}`} />
                    <span className="truncate text-xs">{pipe.name}</span>
                  </div>
                  <span className="text-[9px] px-1 py-0.2 rounded bg-neutral-800 text-neutral-400 font-mono">
                    Ready
                  </span>
                </button>
              );
            })}
          </div>

          {/* Right Columns: Active Pipeline Schema & Inspector */}
          <div className="md:col-span-2 bg-[#101318] border border-neutral-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center gap-2.5 pb-2 border-b border-neutral-800">
              <PipelineIcon className="w-5 h-5 text-amber-400" />
              <div>
                <h3 className="text-sm font-semibold text-neutral-100">{selectedPipeline.name}</h3>
                <span className="text-[10px] text-neutral-400 font-mono">{selectedPipeline.category}</span>
              </div>
            </div>

            <p className="text-xs text-neutral-300 leading-relaxed">
              {selectedPipeline.description}
            </p>

            {/* Parameter Contract Specification */}
            <div className="space-y-2 pt-2 border-t border-neutral-800/80">
              <span className="text-[10px] font-mono uppercase text-neutral-500">
                DSP Parameter Schema
              </span>
              <ul className="space-y-1.5 text-xs text-neutral-300">
                {selectedPipeline.params.map((param, idx) => (
                  <li key={idx} className="flex items-center gap-2 bg-neutral-900/60 px-2.5 py-1.5 rounded border border-neutral-800/50">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                    <span>{param}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Test prompt / Directive Input */}
            <div className="pt-2 space-y-2">
              <span className="text-[10px] font-mono text-neutral-400">
                Directive Input for {selectedPipeline.name}
              </span>
              <input
                type="text"
                value={targetPrompt}
                onChange={e => setTargetPrompt(e.target.value)}
                placeholder={`Set target parameters or prompt for ${selectedPipeline.name}...`}
                className="w-full px-3 py-2 rounded-lg border border-neutral-800 bg-neutral-900 text-xs text-neutral-200"
              />
              <button
                disabled
                className="w-full py-2 bg-neutral-800 text-neutral-500 font-medium rounded-lg text-xs cursor-not-allowed"
                title="Architecture ready: Model inference will connect in future turn"
              >
                Endpoint Configured (Awaiting Model Call)
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
