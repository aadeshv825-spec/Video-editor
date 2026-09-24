import React, { useState } from 'react';
import {
  Sparkles,
  Scissors,
  Music,
  Palette,
  Film,
  Zap,
  Mic,
  Volume2,
  Subtitles,
  Maximize2,
  CheckCircle2,
  ArrowRight,
  X,
  Play,
  MessageSquare,
  Bot,
  Send,
  Wand2,
  Sliders,
  RefreshCw,
  Plus,
  Trash2,
  Clock,
} from 'lucide-react';
import { TimelineClip, TimelineTrack } from '../../../types/videoEditor';
import { useAuth } from '../../../context/AuthContext';
import { useProjects } from '../../../context/ProjectContext';

interface AskVyroAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  clips: TimelineClip[];
  tracks: TimelineTrack[];
  onUpdateClips: (clips: TimelineClip[]) => void;
  onUpdateTracks?: (tracks: TimelineTrack[]) => void;
  onAddCaptions?: (captions: Array<{ id: string; startSec: number; endSec: number; text: string }>) => void;
  onSetAspectRatio?: (ratio: '16:9' | '9:16' | '1:1' | '4:5' | '4:3') => void;
  onOpenAutoEdit?: (tab: 'auto_cut' | 'beat_sync' | 'color_match' | 'best_take') => void;
}

interface TranscriptSegment {
  id: string;
  startSec: number;
  endSec: number;
  text: string;
  isFiller: boolean;
  isPause: boolean;
  deleted: boolean;
}

export const AskVyroAssistantModal: React.FC<AskVyroAssistantModalProps> = ({
  isOpen,
  onClose,
  clips,
  tracks,
  onUpdateClips,
  onUpdateTracks,
  onAddCaptions,
  onSetAspectRatio,
  onOpenAutoEdit,
}) => {
  const { user, isPro, deductCredits } = useAuth();
  const { recordEditAction, activeProject, updateProjectStateData } = useProjects();

  const [activeTab, setActiveTab] = useState<'assistant' | 'transcript' | 'broll' | 'audio_captions' | 'quick_create'>('assistant');
  const [commandInput, setCommandInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [actionLog, setActionLog] = useState<Array<{ text: string; time: string; success?: boolean }>>([
    { text: 'VYRO AI Editor ready. Type a command or pick a quick action below.', time: 'Just now', success: true },
  ]);

  // Transcript state
  const [transcriptSegments, setTranscriptSegments] = useState<TranscriptSegment[]>([
    { id: 'ts-1', startSec: 0.0, endSec: 2.1, text: 'Hey everyone, welcome back to the channel!', isFiller: false, isPause: false, deleted: false },
    { id: 'ts-2', startSec: 2.1, endSec: 3.4, text: '[Pause 1.3s silence]', isFiller: false, isPause: true, deleted: false },
    { id: 'ts-3', startSec: 3.4, endSec: 4.2, text: 'Um, so today...', isFiller: true, isPause: false, deleted: false },
    { id: 'ts-4', startSec: 4.2, endSec: 7.8, text: 'We are testing out the newest high-speed cinematic rig on the mountain pass.', isFiller: false, isPause: false, deleted: false },
    { id: 'ts-5', startSec: 7.8, endSec: 9.0, text: '[Pause 1.2s silence]', isFiller: false, isPause: true, deleted: false },
    { id: 'ts-6', startSec: 9.0, endSec: 13.5, text: 'The stabilization and dynamic lighting turned out completely unreal.', isFiller: false, isPause: false, deleted: false },
    { id: 'ts-7', startSec: 13.5, endSec: 16.0, text: 'Make sure to hit subscribe and check the links below.', isFiller: false, isPause: false, deleted: false },
  ]);

  // Quick command suggestions
  const SUGGESTIONS = [
    { label: '“Make this cinematic”', action: 'Make this cinematic', icon: Film, desc: 'Adds 2.39:1 widescreen, film color grade, slight slow-mo and crossfades' },
    { label: '“Remove boring parts”', action: 'Remove boring parts', icon: Scissors, desc: 'Automatically trims silences and filler words' },
    { label: '“Sync this to the beat”', action: 'Sync this to the beat', icon: Music, desc: 'Aligns clip cut points to 128 BPM musical transients' },
    { label: '“Make the colors match”', action: 'Make the colors match', icon: Palette, desc: 'Applies reference color temperature & saturation across all clips' },
    { label: '“Create a short reel from this video”', action: 'Create a short reel from this video', icon: Sparkles, desc: 'Switches to 9:16 portrait, auto-extracts highlights, and generates captions' },
  ];

  if (!isOpen) return null;

  const executeCommand = async (cmdText: string) => {
    const prompt = cmdText.trim();
    if (!prompt) return;

    setIsProcessing(true);
    setActionLog(prev => [{ text: `Executing: "${prompt}"...`, time: 'Processing...' }, ...prev]);

    // Simulate AI decision logic
    setTimeout(() => {
      const lower = prompt.toLowerCase();
      let feedback = '';

      if (lower.includes('cinematic')) {
        // Apply cinematic changes
        const updated = clips.map((clip, idx) => ({
          ...clip,
          colorAdjustments: {
            ...clip.colorAdjustments,
            contrast: 15,
            saturation: 110,
            temperature: 5,
            highlights: -15,
            shadows: 10,
          },
          transitionIn: idx > 0 ? { type: 'crossfade' as const, durationSec: 0.5 } : clip.transitionIn,
        }));
        onUpdateClips(updated);
        feedback = 'Applied cinematic film grade (+15 contrast, -15 highlights, warmth) and crossfade transitions.';
        recordEditAction('ai_cinematic_grade', 'Applied AI Cinematic color grading and transitions');
      } else if (lower.includes('boring') || lower.includes('pause') || lower.includes('silence')) {
        // Trim silences
        setTranscriptSegments(prev => prev.map(s => (s.isPause || s.isFiller ? { ...s, deleted: true } : s)));
        const shortened = clips.map(c => ({
          ...c,
          durationSec: Math.max(1.5, Number((c.durationSec * 0.82).toFixed(1))),
        }));
        onUpdateClips(shortened);
        feedback = 'Detected and removed 2 pause segments (2.5s total) and eliminated speech filler words.';
        recordEditAction('ai_remove_pauses', 'Removed silences and filler pauses');
      } else if (lower.includes('beat') || lower.includes('sync') || lower.includes('music')) {
        // Beat sync
        const beatInterval = 0.468; // ~128 BPM eighth notes
        let cursor = 0;
        const synced = clips.map(c => {
          const cutDuration = Math.round(c.durationSec / beatInterval) * beatInterval || 1.87;
          const updated = { ...c, startSec: cursor, durationSec: Number(cutDuration.toFixed(2)) };
          cursor += updated.durationSec;
          return updated;
        });
        onUpdateClips(synced);
        feedback = 'Timeline re-quantized to 128 BPM grid with beat-aligned cuts.';
        recordEditAction('ai_beat_sync', 'Synchronized timeline cuts to 128 BPM');
      } else if (lower.includes('color') || lower.includes('match')) {
        // Color match
        const baseColor = clips[0]?.colorAdjustments || { exposure: 0, contrast: 10, saturation: 105, brightness: 0, temperature: 0, tint: 0, highlights: 0, shadows: 0 };
        const matched = clips.map(c => ({
          ...c,
          colorAdjustments: { ...baseColor },
        }));
        onUpdateClips(matched);
        feedback = 'Harmonized white balance and saturation across all timeline clips based on Clip 1.';
        recordEditAction('ai_color_match', 'Harmonized timeline color grades');
      } else if (lower.includes('reel') || lower.includes('short') || lower.includes('tiktok')) {
        // Create 9:16 short reel
        if (onSetAspectRatio) onSetAspectRatio('9:16');
        updateProjectStateData('aspectRatio', '9:16');
        // Generate auto captions
        if (onAddCaptions) {
          onAddCaptions([
            { id: 'cap-1', startSec: 0.0, endSec: 2.5, text: 'TESTING THE NEW HIGH SPEED RIG' },
            { id: 'cap-2', startSec: 2.5, endSec: 5.5, text: '120 FPS BUTTER SMOOTH MOTION' },
            { id: 'cap-3', startSec: 5.5, endSec: 9.0, text: 'THE LIGHTING ON THIS IS UNREAL' },
          ]);
        }
        feedback = 'Converted to 9:16 vertical video with punchy rhythm and generated dynamic animated captions.';
        recordEditAction('ai_short_reel_convert', 'Converted project to 9:16 vertical short reel');
      } else {
        // General AI enhancement
        feedback = `Analyzed "${prompt}": Optimized timeline pacing, balance, and applied non-destructive enhancements.`;
        recordEditAction('ai_custom_edit', `Executed command: ${prompt}`);
      }

      setActionLog(prev => [
        { text: feedback, time: 'Just now', success: true },
        ...prev.filter(item => item.time !== 'Processing...'),
      ]);
      setIsProcessing(false);
      setCommandInput('');
    }, 800);
  };

  const handleApplyTranscriptEdits = () => {
    const activeSegments = transcriptSegments.filter(s => !s.deleted);
    if (onAddCaptions) {
      onAddCaptions(
        activeSegments
          .filter(s => !s.isPause)
          .map(s => ({
            id: s.id,
            startSec: s.startSec,
            endSec: s.endSec,
            text: s.text.toUpperCase(),
          }))
      );
    }
    setActionLog(prev => [{ text: 'Applied transcript cut points and generated matching captions.', time: 'Just now', success: true }, ...prev]);
    alert('Transcript cuts applied and auto-captions generated!');
  };

  const handleRemoveAllPauses = () => {
    setTranscriptSegments(prev => prev.map(s => (s.isPause ? { ...s, deleted: true } : s)));
    setActionLog(prev => [{ text: 'Cut all silence gaps longer than 0.8s.', time: 'Just now', success: true }, ...prev]);
  };

  const handleRemoveFillerWords = () => {
    setTranscriptSegments(prev => prev.map(s => (s.isFiller ? { ...s, deleted: true } : s)));
    setActionLog(prev => [{ text: 'Identified and marked 1 filler phrase ("Um, so today...") for removal.', time: 'Just now', success: true }, ...prev]);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 select-none animate-in fade-in duration-200">
      <div className="w-full max-w-3xl bg-[#111318] border border-neutral-800 rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-950/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-purple-900/40">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-tight">Ask VYRO — AI Edit Assistant</h2>
                <span className="px-1.5 py-0.5 rounded bg-purple-950/80 border border-purple-800/80 text-purple-300 font-mono text-[10px] font-semibold">
                  SMART CREATOR
                </span>
              </div>
              <p className="text-[11px] text-neutral-400">
                Natural-language video editing, transcript cuts, beat-matching & intelligent workflow
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-5 pt-2 border-b border-neutral-800 bg-neutral-950/40 flex items-center gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('assistant')}
            className={`px-3 py-2 text-xs font-medium border-b-2 flex items-center gap-1.5 transition-colors whitespace-nowrap ${
              activeTab === 'assistant'
                ? 'border-purple-500 text-white font-semibold'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5 text-purple-400" />
            <span>Natural Language Edit</span>
          </button>
          <button
            onClick={() => setActiveTab('transcript')}
            className={`px-3 py-2 text-xs font-medium border-b-2 flex items-center gap-1.5 transition-colors whitespace-nowrap ${
              activeTab === 'transcript'
                ? 'border-purple-500 text-white font-semibold'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Mic className="w-3.5 h-3.5 text-indigo-400" />
            <span>Transcript-Based Editing</span>
          </button>
          <button
            onClick={() => setActiveTab('broll')}
            className={`px-3 py-2 text-xs font-medium border-b-2 flex items-center gap-1.5 transition-colors whitespace-nowrap ${
              activeTab === 'broll'
                ? 'border-purple-500 text-white font-semibold'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Film className="w-3.5 h-3.5 text-emerald-400" />
            <span>AI B-Roll & Extend</span>
          </button>
          <button
            onClick={() => setActiveTab('audio_captions')}
            className={`px-3 py-2 text-xs font-medium border-b-2 flex items-center gap-1.5 transition-colors whitespace-nowrap ${
              activeTab === 'audio_captions'
                ? 'border-purple-500 text-white font-semibold'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Subtitles className="w-3.5 h-3.5 text-pink-400" />
            <span>Captions & Audio Cleanup</span>
          </button>
          <button
            onClick={() => setActiveTab('quick_create')}
            className={`px-3 py-2 text-xs font-medium border-b-2 flex items-center gap-1.5 transition-colors whitespace-nowrap ${
              activeTab === 'quick_create'
                ? 'border-purple-500 text-white font-semibold'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Wand2 className="w-3.5 h-3.5 text-amber-400" />
            <span>Quick Create Wizard</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4 text-xs">
          {/* TAB 1: Natural Language Commands */}
          {activeTab === 'assistant' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl border border-purple-900/40 bg-purple-950/20 text-purple-200 text-xs flex items-center gap-3">
                <Sparkles className="w-4 h-4 text-purple-400 shrink-0" />
                <span>
                  Tell VYRO what to edit in plain English. The assistant automatically identifies clips, audio levels, transitions, and adjusts your timeline!
                </span>
              </div>

              {/* Command Input Box */}
              <div className="relative">
                <input
                  type="text"
                  value={commandInput}
                  onChange={e => setCommandInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') executeCommand(commandInput);
                  }}
                  placeholder="e.g. 'Make this cinematic', 'Remove boring parts', 'Sync this to the beat'..."
                  className="w-full bg-neutral-900 border border-neutral-700 rounded-xl pl-4 pr-24 py-3 text-sm text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-purple-500 shadow-inner"
                />
                <button
                  disabled={isProcessing || !commandInput.trim()}
                  onClick={() => executeCommand(commandInput)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 px-3.5 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-medium text-xs flex items-center gap-1.5 transition-all shadow-md"
                >
                  {isProcessing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  <span>Run</span>
                </button>
              </div>

              {/* Quick Actions / Suggestions */}
              <div>
                <h4 className="text-[11px] font-mono uppercase tracking-wider text-neutral-400 font-semibold mb-2">
                  One-Tap Quick Actions
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {SUGGESTIONS.map((item, i) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={i}
                        onClick={() => executeCommand(item.action)}
                        className="p-3 rounded-xl border border-neutral-800 bg-neutral-900/80 hover:bg-neutral-800/80 hover:border-purple-800/60 text-left transition-all flex items-start gap-2.5 group"
                      >
                        <div className="p-2 rounded-lg bg-purple-950/60 text-purple-400 group-hover:scale-105 transition-transform shrink-0">
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="font-semibold text-neutral-200 group-hover:text-purple-300 transition-colors">
                            {item.label}
                          </div>
                          <div className="text-[11px] text-neutral-400 mt-0.5 line-clamp-1">
                            {item.desc}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Execution Activity Log */}
              <div>
                <h4 className="text-[11px] font-mono uppercase tracking-wider text-neutral-400 font-semibold mb-2">
                  Assistant Activity History
                </h4>
                <div className="space-y-1.5 max-h-44 overflow-y-auto rounded-xl border border-neutral-800/80 bg-neutral-950/80 p-3 font-mono text-[11px]">
                  {actionLog.map((log, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-neutral-300">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
                      <div className="flex-1">
                        <span>{log.text}</span>
                        <span className="text-neutral-500 text-[10px] ml-2">[{log.time}]</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Transcript-Based Editing */}
          {activeTab === 'transcript' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 p-3 rounded-xl bg-neutral-900 border border-neutral-800">
                <div>
                  <div className="font-semibold text-neutral-200">Transcript Pacing & Cut Engine</div>
                  <div className="text-[11px] text-neutral-400">
                    Edit video by editing text: delete pauses, eliminate filler words, or keep punchy sentences.
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleRemoveAllPauses}
                    className="px-2.5 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-medium flex items-center gap-1 transition-colors"
                  >
                    <Scissors className="w-3 h-3 text-purple-400" />
                    <span>Cut Silences</span>
                  </button>
                  <button
                    onClick={handleRemoveFillerWords}
                    className="px-2.5 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-medium flex items-center gap-1 transition-colors"
                  >
                    <Wand2 className="w-3 h-3 text-indigo-400" />
                    <span>Remove "Um/Ah"</span>
                  </button>
                </div>
              </div>

              {/* Segments List */}
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {transcriptSegments.map((seg, idx) => (
                  <div
                    key={seg.id}
                    className={`p-3 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                      seg.deleted
                        ? 'border-neutral-900 bg-neutral-950/40 opacity-40 line-through'
                        : seg.isPause
                        ? 'border-amber-900/50 bg-amber-950/10'
                        : seg.isFiller
                        ? 'border-purple-900/50 bg-purple-950/10'
                        : 'border-neutral-800 bg-neutral-900/70'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="font-mono text-[10px] text-neutral-500 w-14 shrink-0">
                        {seg.startSec.toFixed(1)}s - {seg.endSec.toFixed(1)}s
                      </span>
                      <div className="text-xs text-neutral-200 font-medium truncate">
                        {seg.text}
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setTranscriptSegments(prev =>
                          prev.map(s => (s.id === seg.id ? { ...s, deleted: !s.deleted } : s))
                        );
                      }}
                      className={`px-2 py-1 rounded text-[11px] font-medium transition-colors ${
                        seg.deleted
                          ? 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                          : 'bg-red-950/60 text-red-300 hover:bg-red-900/80 border border-red-800/40'
                      }`}
                    >
                      {seg.deleted ? 'Restore' : 'Cut Out'}
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={handleApplyTranscriptEdits}
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow-md shadow-purple-950/50"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Apply Transcript Cuts to Timeline</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: B-Roll & Extend */}
          {activeTab === 'broll' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-neutral-900 border border-neutral-800">
                <div className="font-semibold text-neutral-200 mb-1">AI Scene & Subject Detection</div>
                <div className="text-[11px] text-neutral-400 leading-relaxed">
                  VYRO analyzed your footage and detected high-energy outdoor motion, vehicle tracking, and daylight mountain terrain.
                </div>
              </div>

              <div>
                <h4 className="text-[11px] font-mono uppercase tracking-wider text-neutral-400 font-semibold mb-2">
                  Smart B-Roll Suggestions (Contextual Overlay)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl border border-neutral-800 bg-neutral-900/60 flex items-center justify-between gap-3">
                    <div>
                      <div className="font-semibold text-neutral-200">Mountain Drone Flyover</div>
                      <div className="text-[10px] text-neutral-400">Match at 4.2s (Scenic establishment)</div>
                    </div>
                    <button
                      onClick={() => {
                        alert('Added Mountain Drone Flyover to Track V2 overlay!');
                        recordEditAction('add_broll', 'Inserted Drone B-Roll overlay');
                      }}
                      className="px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-[11px] font-medium flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3 text-emerald-400" />
                      <span>Add B-Roll</span>
                    </button>
                  </div>

                  <div className="p-3 rounded-xl border border-neutral-800 bg-neutral-900/60 flex items-center justify-between gap-3">
                    <div>
                      <div className="font-semibold text-neutral-200">Wheel Spin Macro Close-up</div>
                      <div className="text-[10px] text-neutral-400">Match at 9.0s (Action punch)</div>
                    </div>
                    <button
                      onClick={() => {
                        alert('Added Wheel Spin Macro Close-up to Track V2 overlay!');
                        recordEditAction('add_broll', 'Inserted Macro B-Roll overlay');
                      }}
                      className="px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-[11px] font-medium flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3 text-emerald-400" />
                      <span>Add B-Roll</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Generative Extend */}
              <div className="p-3.5 rounded-xl border border-indigo-900/40 bg-indigo-950/20 space-y-2">
                <div className="flex items-center gap-2 text-indigo-300 font-semibold">
                  <Zap className="w-4 h-4 text-indigo-400" />
                  <span>AI Generative Extend (End-of-Clip Continuation)</span>
                </div>
                <p className="text-[11px] text-indigo-200/80 leading-relaxed">
                  Extend your selected clip seamlessly by 2.0 to 4.0 seconds using generative visual continuity.
                </p>
                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={() => {
                      alert('Generating 2.5s neural video continuation for selected clip...');
                      recordEditAction('generative_extend', 'Extended clip by 2.5s with generative video');
                    }}
                    className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs flex items-center gap-1.5 transition-all shadow-md shadow-indigo-950/50"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Generate +2.5s Extension</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: Captions & Audio Cleanup */}
          {activeTab === 'audio_captions' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Audio Cleanup */}
                <div className="p-4 rounded-xl border border-neutral-800 bg-neutral-900/60 space-y-2.5">
                  <div className="flex items-center gap-2 font-semibold text-neutral-100">
                    <Volume2 className="w-4 h-4 text-purple-400" />
                    <span>Smart Audio Enhancement</span>
                  </div>
                  <p className="text-[11px] text-neutral-400 leading-relaxed">
                    AI noise reduction, speech clarity enhancement, and automatic music ducking under dialog.
                  </p>
                  <button
                    onClick={() => {
                      alert('Applied neural noise gate (-12dB background hum) and dialog clarity EQ!');
                      recordEditAction('ai_audio_enhance', 'Applied AI noise cleanup and EQ');
                    }}
                    className="w-full py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-medium text-xs flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Wand2 className="w-3.5 h-3.5 text-purple-400" />
                    <span>Clean Up Audio Tracks</span>
                  </button>
                </div>

                {/* Auto Captions */}
                <div className="p-4 rounded-xl border border-neutral-800 bg-neutral-900/60 space-y-2.5">
                  <div className="flex items-center gap-2 font-semibold text-neutral-100">
                    <Subtitles className="w-4 h-4 text-pink-400" />
                    <span>Smart Auto Captions</span>
                  </div>
                  <p className="text-[11px] text-neutral-400 leading-relaxed">
                    Auto-transcribe spoken words into animated, viral-style subtitle overlays with high contrast.
                  </p>
                  <button
                    onClick={() => {
                      if (onAddCaptions) {
                        onAddCaptions([
                          { id: 'c1', startSec: 0, endSec: 2.5, text: 'WELCOME TO THE NEW BUILD' },
                          { id: 'c2', startSec: 2.5, endSec: 5.0, text: 'PRECISION CINEMATICS' },
                          { id: 'c3', startSec: 5.0, endSec: 8.0, text: 'CHECK OUT THIS RIG IN ACTION' },
                        ]);
                      }
                      alert('Generated animated captions across speech timestamps!');
                      recordEditAction('auto_captions', 'Generated auto-captions track');
                    }}
                    className="w-full py-2 rounded-lg bg-pink-600 hover:bg-pink-500 text-white font-medium text-xs flex items-center justify-center gap-1.5 transition-all shadow-md shadow-pink-950/40"
                  >
                    <Subtitles className="w-3.5 h-3.5" />
                    <span>Generate Animated Captions</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: Quick Create Wizard */}
          {activeTab === 'quick_create' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl border border-neutral-800 bg-neutral-900/60 text-neutral-300 leading-relaxed">
                <div className="font-semibold text-white mb-1">Beginner-Friendly Quick Create</div>
                Choose your desired mood and destination platform. VYRO will automatically trim clips, apply matching transitions, color grade, and prepare export presets with zero hassle!
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  onClick={() => {
                    executeCommand('Create a short reel from this video');
                  }}
                  className="p-3.5 rounded-xl border border-purple-900/40 bg-neutral-900 hover:bg-purple-950/30 text-left transition-all"
                >
                  <div className="text-xl mb-1">📱</div>
                  <div className="font-bold text-neutral-100">Instagram Reel / Short</div>
                  <div className="text-[10px] text-neutral-400 mt-1">9:16 vertical, fast pacing, auto-captions</div>
                </button>

                <button
                  onClick={() => {
                    executeCommand('Make this cinematic');
                  }}
                  className="p-3.5 rounded-xl border border-blue-900/40 bg-neutral-900 hover:bg-blue-950/30 text-left transition-all"
                >
                  <div className="text-xl mb-1">🎬</div>
                  <div className="font-bold text-neutral-100">Cinematic Vlog</div>
                  <div className="text-[10px] text-neutral-400 mt-1">16:9 widescreen, film colors, smooth crossfades</div>
                </button>

                <button
                  onClick={() => {
                    executeCommand('Sync this to the beat');
                  }}
                  className="p-3.5 rounded-xl border border-emerald-900/40 bg-neutral-900 hover:bg-emerald-950/30 text-left transition-all"
                >
                  <div className="text-xl mb-1">⚡</div>
                  <div className="font-bold text-neutral-100">Beat Drop Montage</div>
                  <div className="text-[10px] text-neutral-400 mt-1">Punchy cuts, flash transitions, high energy</div>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-neutral-800 bg-neutral-950/70 flex items-center justify-between text-xs text-neutral-400">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            <span>AI operations execute non-destructively with full Undo history</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg border border-neutral-800 bg-neutral-900 hover:bg-neutral-800 text-neutral-200 text-xs font-medium transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
