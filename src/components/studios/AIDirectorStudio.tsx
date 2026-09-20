import React, { useState } from 'react';
import {
  Clapperboard,
  Sparkles,
  Video,
  Camera,
  Music,
  Sliders,
  Play,
  Undo2,
  Redo2,
  Bookmark,
  History,
  ArrowLeft,
  ChevronDown,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  HelpCircle,
  Mic,
  FileCode,
  Layers,
  Activity,
  Paperclip,
  Check,
  X,
  RotateCcw,
  ExternalLink,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { useProjects } from '../../context/ProjectContext';
import { useModelRouter } from '../../context/ModelRouterContext';
import { useAuth } from '../../context/AuthContext';
import { useAIJobs } from '../../context/AIJobContext';
import {
  ReferenceMediaInfo,
  StructuredEditPlan,
  TargetMediaType,
} from '../../types/aiDirector';
import { LocalCreativeDirectorProvider } from '../../services/ai/providers';
import { CommandValidator } from '../../services/ai/commandValidator';
import { DirectorExecutor } from '../../services/ai/directorExecutor';
import { MediaAnalyzerService } from '../../services/ai/mediaAnalyzer';
import { VoiceCommandModal } from './director/VoiceCommandModal';
import { ReferenceMediaModal } from './director/ReferenceMediaModal';
import { MediaInspectorModal } from './director/MediaInspectorModal';
import { AIHistoryModal } from './director/AIHistoryModal';

interface SceneBeat {
  id: string;
  shotNumber: string;
  title: string;
  cameraAngle: string;
  lens: string;
  lighting: string;
  dialoguePrompt: string;
  status: 'planned' | 'drafted' | 'ready';
}

interface AIDirectorStudioProps {
  onBack: () => void;
  onOpenVersions: () => void;
  onOpenMedia: () => void;
  onOpenExport: () => void;
  onOpenModelRouter: () => void;
}

export const AIDirectorStudio: React.FC<AIDirectorStudioProps> = ({
  onBack,
  onOpenVersions,
  onOpenMedia,
  onOpenExport,
  onOpenModelRouter,
}) => {
  const {
    activeProject,
    projects,
    openProject,
    recordEditAction,
    undoEdit,
    redoEdit,
    canUndo,
    canRedo,
    createVersionSnapshot,
    applyDirectStateUpdate,
  } = useProjects();

  const { selectedModel } = useModelRouter();
  const { user, isPro, deductCredits } = useAuth();
  const { createJob, updateJobStatus, attachPlanToJob } = useAIJobs();

  // Mode switcher: "command" (AI Director Core) vs "beats" (Cinematic Screenplay)
  const [activeTab, setActiveTab] = useState<'command' | 'beats'>('command');

  // Command Workspace State
  const [commandPrompt, setCommandPrompt] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [generatedPlan, setGeneratedPlan] = useState<StructuredEditPlan | null>(null);
  const [selectedReference, setSelectedReference] = useState<ReferenceMediaInfo | null>(null);
  const [selectedTargetScope, setSelectedTargetScope] = useState<TargetMediaType>('entire_timeline');
  const [showJsonInspector, setShowJsonInspector] = useState(false);
  const [executionResultBanner, setExecutionResultBanner] = useState<{
    title: string;
    versionTitle: string;
  } | null>(null);

  // Modals
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [isRefModalOpen, setIsRefModalOpen] = useState(false);
  const [isTelemetryModalOpen, setIsTelemetryModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

  // Companion Screenplay Beats State (Phase 1 preservation)
  const [beats, setBeats] = useState<SceneBeat[]>([
    {
      id: 'beat-1',
      shotNumber: '1.1',
      title: 'Opening Panorama: Neon Skyscraper',
      cameraAngle: 'Wide Extreme High-Angle Crane Down',
      lens: '24mm Anamorphic T2.0',
      lighting: 'Atmospheric Blue Fog with Amber Sodium Backlight',
      dialoguePrompt: 'Silence except for deep industrial rumble and rain falling on glass.',
      status: 'ready',
    },
    {
      id: 'beat-2',
      shotNumber: '1.2',
      title: 'Protagonist Reveal at Rain-streaked Window',
      cameraAngle: 'Medium Close-up Dutch Tilt',
      lens: '50mm Prime f/1.4',
      lighting: 'Cyan rim-light with reflective neon speculars',
      dialoguePrompt: 'Elena: "If the telemetry holds, we have forty seconds before the grid resets."',
      status: 'drafted',
    },
  ]);
  const [activeBeatId, setActiveBeatId] = useState<string>('beat-1');

  // Project fallback if none active
  const currentProject = activeProject || projects[0];
  const telemetryData = currentProject ? MediaAnalyzerService.analyzeProjectMedia(currentProject) : null;

  // Quick Suggestion Prompts
  const quickSuggestions = [
    'Trim the first 2 seconds',
    'Make this clip brighter',
    'Make this photo warmer',
    'Add a smooth fade between clips',
    'Make the audio louder (+4 dB)',
    'Reduce the background noise',
    'Crop this image to 9:16 (Reels/TikTok)',
    'Match the brightness of this clip with the reference',
  ];

  // Analyze natural language command
  const handleAnalyzeCommand = async (customPrompt?: string) => {
    const textToAnalyze = (customPrompt || commandPrompt).trim();
    if (!textToAnalyze || !currentProject) return;

    setIsAnalyzing(true);
    setExecutionResultBanner(null);

    // 1. Create tracking job
    const job = createJob({
      projectId: currentProject.id,
      projectTitle: currentProject.title,
      command: textToAnalyze,
      modelId: selectedModel.id,
      modelName: selectedModel.name,
      provider: selectedModel.provider,
    });

    // 2. Generate structured plan via Provider
    const provider = new LocalCreativeDirectorProvider();
    try {
      const plan = await provider.analyzeAndPlan(textToAnalyze, {
        project: currentProject,
        selectedTargetType: selectedTargetScope,
        referenceMedia: selectedReference || undefined,
        isProUser: isPro,
        userCredits: user?.aiCredits ?? 0,
      });

      // 3. Validate plan
      const validatedPlan = {
        ...plan,
        validation: CommandValidator.validatePlan(plan, currentProject, user),
      };

      setGeneratedPlan(validatedPlan);
      attachPlanToJob(job.id, validatedPlan);
      updateJobStatus(job.id, 'WAITING_FOR_APPROVAL', { progressPercent: 70 });
    } catch (e: any) {
      updateJobStatus(job.id, 'FAILED', { errorInformation: e.message });
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Approve & Execute workflow
  const handleApproveAndExecute = () => {
    if (!generatedPlan || !currentProject || !generatedPlan.validation.canExecute) return;

    const result = DirectorExecutor.executePlan(
      generatedPlan,
      currentProject,
      createVersionSnapshot,
      recordEditAction
    );

    if (result.success) {
      // Deduct AI credits safely
      deductCredits(generatedPlan.estimated_cost_credits);

      // Update state in project context
      applyDirectStateUpdate(result.updatedProject.stateData);

      // Mark plan executed
      const updatedPlan: StructuredEditPlan = {
        ...generatedPlan,
        status: 'executed',
        executedAt: new Date().toISOString(),
      };
      setGeneratedPlan(updatedPlan);

      // Show banner
      setExecutionResultBanner({
        title: result.message,
        versionTitle: result.snapshotVersionTitle,
      });
    }
  };

  const handleCancelPlan = () => {
    setGeneratedPlan(null);
  };

  const handleClarificationPick = (optionText: string) => {
    setCommandPrompt(optionText);
    handleAnalyzeCommand(optionText);
  };

  return (
    <div className="flex-1 flex flex-col bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 min-h-[calc(100vh-3.5rem)]">
      {/* AI Director Top Bar */}
      <div className="h-14 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 px-4 flex items-center justify-between shrink-0">
        <div className="flex items-center space-x-3">
          <button
            onClick={onBack}
            className="p-1.5 text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            title="Return to Dashboard"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600/20 text-blue-500 dark:text-blue-400 flex items-center justify-center font-bold">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                  AI Director Workspace
                </h1>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                  Phase 4 Foundation
                </span>
              </div>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400 hidden sm:block">
                Natural-language command orchestration & verified execution
              </p>
            </div>
          </div>
        </div>

        {/* Center: Mode Tabs */}
        <div className="flex items-center p-0.5 sm:p-1 bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl space-x-1 shrink-0 overflow-x-auto">
          <button
            onClick={() => setActiveTab('command')}
            className={`px-2.5 sm:px-3 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center space-x-1.5 whitespace-nowrap min-h-[36px] sm:min-h-0 ${
              activeTab === 'command'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Command Center</span>
          </button>
          <button
            onClick={() => setActiveTab('beats')}
            className={`px-2.5 sm:px-3 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center space-x-1.5 whitespace-nowrap min-h-[36px] sm:min-h-0 ${
              activeTab === 'beats'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
            }`}
          >
            <Clapperboard className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Cinematic </span><span>Beats</span>
          </button>
        </div>

        {/* Right Controls */}
        <div className="flex items-center space-x-2">
          {/* Active Model Pill */}
          <button
            onClick={onOpenModelRouter}
            className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 text-xs text-neutral-700 dark:text-neutral-300 transition-colors"
            title="Configure Active Model"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="max-w-[120px] truncate">{selectedModel.name.split('(')[0]}</span>
            <ChevronDown className="w-3 h-3 text-neutral-500" />
          </button>

          {/* Credits Counter */}
          <div className="hidden sm:flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-xs text-neutral-700 dark:text-neutral-300">
            <span className="text-amber-500">⚡</span>
            <span className="font-semibold">{user?.aiCredits ?? 0}</span>
            <span className="text-neutral-500 text-[11px]">Credits</span>
          </div>

          {/* Undo/Redo */}
          <button
            onClick={undoEdit}
            disabled={!canUndo}
            className="p-1.5 text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100 disabled:opacity-30 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            title="Undo Edit"
          >
            <Undo2 className="w-4 h-4" />
          </button>
          <button
            onClick={redoEdit}
            disabled={!canRedo}
            className="p-1.5 text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100 disabled:opacity-30 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            title="Redo Edit"
          >
            <Redo2 className="w-4 h-4" />
          </button>

          {/* Activity Log */}
          <button
            onClick={() => setIsHistoryModalOpen(true)}
            className="p-1.5 text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            title="AI Activity History"
          >
            <History className="w-4 h-4" />
          </button>

          {/* Versions */}
          <button
            onClick={onOpenVersions}
            className="p-1.5 text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            title="Project Version Snapshots"
          >
            <Bookmark className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Tab 1: AI Command Center */}
      {activeTab === 'command' && (
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 max-w-6xl w-full mx-auto space-y-6">
          {/* Target Media & Context Bar */}
          <div className="bg-white dark:bg-neutral-950/80 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm dark:shadow-none">
            <div className="flex items-center space-x-3.5">
              <div className="p-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300">
                {currentProject?.type === 'video' ? (
                  <Video className="w-5 h-5 text-blue-500 dark:text-blue-400" />
                ) : currentProject?.type === 'photo' ? (
                  <Camera className="w-5 h-5 text-purple-500 dark:text-purple-400" />
                ) : (
                  <Music className="w-5 h-5 text-emerald-500 dark:text-emerald-400" />
                )}
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs uppercase font-bold tracking-wider text-neutral-500 dark:text-neutral-400">
                    Active Target:
                  </span>
                  <select
                    value={currentProject?.id || ''}
                    onChange={e => openProject(e.target.value)}
                    className="bg-neutral-50 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-lg px-2.5 py-1 text-xs text-neutral-900 dark:text-neutral-100 font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.title} ({p.type.toUpperCase()})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center space-x-3 text-[11px] text-neutral-500 dark:text-neutral-400 mt-1">
                  <span>Type: <strong className="text-neutral-800 dark:text-neutral-200 uppercase">{currentProject?.type}</strong></span>
                  <span>• Aspect: {currentProject?.aspectRatio}</span>
                  <span>• Resolution: {currentProject?.resolution}</span>
                </div>
              </div>
            </div>

            {/* Target Scope & Reference Selectors */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Media Telemetry Inspector Button */}
              {telemetryData && (
                <button
                  onClick={() => setIsTelemetryModalOpen(true)}
                  className="px-2.5 py-1.5 rounded-xl bg-neutral-100 dark:bg-neutral-900 hover:bg-neutral-200 dark:hover:bg-neutral-800 border border-neutral-200 dark:border-neutral-800 text-xs text-neutral-700 dark:text-neutral-300 flex items-center space-x-1.5 transition-colors"
                >
                  <Activity className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400" />
                  <span>Media Telemetry</span>
                </button>
              )}

              {/* Reference Attachment Button */}
              <button
                onClick={() => setIsRefModalOpen(true)}
                className={`px-3 py-1.5 rounded-xl text-xs flex items-center space-x-1.5 transition-colors border ${
                  selectedReference
                    ? 'bg-purple-500/10 border-purple-500/30 text-purple-600 dark:text-purple-300'
                    : 'bg-neutral-100 dark:bg-neutral-900 hover:bg-neutral-200 dark:hover:bg-neutral-800 border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300'
                }`}
              >
                <Paperclip className="w-3.5 h-3.5" />
                <span>
                  {selectedReference ? `Ref: ${selectedReference.name}` : 'Attach Reference'}
                </span>
                {selectedReference && (
                  <span
                    onClick={e => {
                      e.stopPropagation();
                      setSelectedReference(null);
                    }}
                    className="ml-1 hover:text-neutral-900 dark:hover:text-white"
                  >
                    ×
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Workflow Stage Visualizer */}
          <div className="px-1 py-1">
            <div className="flex items-center justify-between text-[11px] font-semibold text-neutral-500 uppercase tracking-wider overflow-x-auto pb-1">
              <span className="flex items-center space-x-1 text-blue-500 dark:text-blue-400">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 dark:bg-blue-400" />
                <span>1. Natural Input</span>
              </span>
              <span className="text-neutral-400 dark:text-neutral-700">→</span>
              <span className={`flex items-center space-x-1 ${isAnalyzing ? 'text-amber-500 dark:text-amber-400 animate-pulse' : 'text-neutral-500'}`}>
                <span className="w-1.5 h-1.5 rounded-full bg-neutral-400 dark:bg-neutral-600" />
                <span>2. AI Analysis</span>
              </span>
              <span className="text-neutral-400 dark:text-neutral-700">→</span>
              <span className={`flex items-center space-x-1 ${generatedPlan ? 'text-purple-500 dark:text-purple-400' : 'text-neutral-500'}`}>
                <span className="w-1.5 h-1.5 rounded-full bg-neutral-400 dark:bg-neutral-600" />
                <span>3. Structured Plan</span>
              </span>
              <span className="text-neutral-400 dark:text-neutral-700">→</span>
              <span className="flex items-center space-x-1 text-neutral-500">
                <span className="w-1.5 h-1.5 rounded-full bg-neutral-400 dark:bg-neutral-600" />
                <span>4. User Review</span>
              </span>
              <span className="text-neutral-400 dark:text-neutral-700">→</span>
              <span className={`flex items-center space-x-1 ${generatedPlan?.status === 'executed' ? 'text-emerald-500 dark:text-emerald-400' : 'text-neutral-500'}`}>
                <span className="w-1.5 h-1.5 rounded-full bg-neutral-400 dark:bg-neutral-600" />
                <span>5. Safe Execution</span>
              </span>
            </div>
          </div>

          {/* Command Input Box */}
          <div className="bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-4 shadow-md dark:shadow-xl space-y-3">
            <div className="relative">
              <textarea
                value={commandPrompt}
                onChange={e => setCommandPrompt(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleAnalyzeCommand();
                  }
                }}
                placeholder={`Describe your edit for ${currentProject?.title || 'the project'} (e.g., "Trim the first 2 seconds", "Make this clip brighter", "Make this photo warmer", "Crop to 9:16 Reels")...`}
                rows={3}
                className="w-full bg-neutral-50 dark:bg-neutral-900/80 border border-neutral-200 dark:border-neutral-800 rounded-xl p-3.5 pr-28 text-sm text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none transition-all"
              />

              <div className="absolute right-3 bottom-3 flex items-center space-x-2">
                {/* Voice Input Button */}
                <button
                  onClick={() => setIsVoiceModalOpen(true)}
                  className="p-2 text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                  title="Voice command (Speech Recognition)"
                >
                  <Mic className="w-4 h-4" />
                </button>

                {/* Submit / Analyze Button */}
                <button
                  onClick={() => handleAnalyzeCommand()}
                  disabled={!commandPrompt.trim() || isAnalyzing}
                  className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-semibold flex items-center space-x-1.5 shadow-sm transition-colors"
                >
                  {isAnalyzing ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                      <span>Analyzing...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Generate Plan</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Quick Suggestion Pills */}
            <div className="pt-1">
              <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider block mb-2">
                Quick Director Commands:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {quickSuggestions.map(prompt => (
                  <button
                    key={prompt}
                    onClick={() => {
                      setCommandPrompt(prompt);
                      handleAnalyzeCommand(prompt);
                    }}
                    className="px-2.5 py-1 rounded-lg text-xs bg-neutral-100 dark:bg-neutral-900 hover:bg-neutral-200 dark:hover:bg-neutral-800 border border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200 transition-colors text-left"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Post-Execution Success Notification Banner */}
          {executionResultBanner && (
            <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 flex items-start justify-between animate-in fade-in duration-200">
              <div className="flex items-start space-x-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 mt-0.5 shrink-0" />
                <div>
                  <h4 className="text-sm font-semibold text-emerald-300">
                    {executionResultBanner.title}
                  </h4>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    Automatic checkpoint created: <strong className="text-neutral-200">{executionResultBanner.versionTitle}</strong>.
                    Original media assets remain preserved.
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={undoEdit}
                  disabled={!canUndo}
                  className="px-3 py-1.5 rounded-lg bg-neutral-900 border border-neutral-700 hover:bg-neutral-800 text-xs text-neutral-200 flex items-center space-x-1"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Undo / Rollback</span>
                </button>
                <button
                  onClick={onOpenVersions}
                  className="px-3 py-1.5 rounded-lg bg-neutral-900 border border-neutral-700 hover:bg-neutral-800 text-xs text-neutral-200 flex items-center space-x-1"
                >
                  <Bookmark className="w-3.5 h-3.5" />
                  <span>View Versions</span>
                </button>
              </div>
            </div>
          )}

          {/* Generated Structured Edit Plan Card */}
          {generatedPlan && (
            <div className="bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-2xl overflow-hidden shadow-lg dark:shadow-2xl animate-in fade-in duration-200">
              {/* Plan Header */}
              <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/60 flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <div className={`p-2 rounded-xl ${
                    generatedPlan.intent === 'clarification_needed'
                      ? 'bg-amber-500/10 text-amber-500 dark:text-amber-400'
                      : generatedPlan.intent === 'unsupported'
                      ? 'bg-red-500/10 text-red-500 dark:text-red-400'
                      : 'bg-purple-500/10 text-purple-600 dark:text-purple-400'
                  }`}>
                    {generatedPlan.intent === 'clarification_needed' ? (
                      <HelpCircle className="w-5 h-5" />
                    ) : generatedPlan.intent === 'unsupported' ? (
                      <AlertTriangle className="w-5 h-5" />
                    ) : (
                      <FileCode className="w-5 h-5" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                        {generatedPlan.intent === 'clarification_needed'
                          ? 'Clarification Needed'
                          : generatedPlan.intent === 'unsupported'
                          ? 'Capability Not Available'
                          : 'Proposed Edit Plan (Awaiting Approval)'}
                      </h3>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                        generatedPlan.status === 'executed'
                          ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                          : generatedPlan.validation.canExecute
                          ? 'bg-blue-500/20 text-blue-600 dark:text-blue-400'
                          : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400'
                      }`}>
                        {generatedPlan.status}
                      </span>
                    </div>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">
                      Target: {generatedPlan.target.title} ({generatedPlan.target.type})
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setShowJsonInspector(prev => !prev)}
                    className="px-2.5 py-1 text-xs rounded-lg bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200 transition-colors flex items-center space-x-1"
                  >
                    <FileCode className="w-3.5 h-3.5" />
                    <span>{showJsonInspector ? 'Hide Schema' : 'Inspect JSON Schema'}</span>
                  </button>
                </div>
              </div>

              {/* Plan Body */}
              <div className="p-5 space-y-4">
                {/* Explanation text */}
                <div className="p-3.5 rounded-xl bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200 dark:border-neutral-800/80 text-xs text-neutral-700 dark:text-neutral-300">
                  <span className="font-semibold text-neutral-900 dark:text-neutral-200 block mb-0.5">
                    Director Reasoning & Strategy:
                  </span>
                  {generatedPlan.explanation}
                </div>

                {/* Clarification state with quick picks */}
                {generatedPlan.intent === 'clarification_needed' && (
                  <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 space-y-3">
                    <p className="text-xs font-semibold text-amber-600 dark:text-amber-300">
                      {generatedPlan.clarification_question}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => handleClarificationPick('Make this clip brighter')}
                        className="px-3 py-1.5 rounded-lg bg-neutral-100 dark:bg-neutral-900 hover:bg-neutral-200 dark:hover:bg-neutral-800 text-xs text-neutral-800 dark:text-neutral-200 border border-neutral-300 dark:border-neutral-700"
                      >
                        Adjust Brightness (+15%)
                      </button>
                      <button
                        onClick={() => handleClarificationPick('Make this photo warmer')}
                        className="px-3 py-1.5 rounded-lg bg-neutral-100 dark:bg-neutral-900 hover:bg-neutral-200 dark:hover:bg-neutral-800 text-xs text-neutral-800 dark:text-neutral-200 border border-neutral-300 dark:border-neutral-700"
                      >
                        Enhance Warmth (Golden Tone)
                      </button>
                      <button
                        onClick={() => handleClarificationPick('Make the audio louder (+4 dB)')}
                        className="px-3 py-1.5 rounded-lg bg-neutral-100 dark:bg-neutral-900 hover:bg-neutral-200 dark:hover:bg-neutral-800 text-xs text-neutral-800 dark:text-neutral-200 border border-neutral-300 dark:border-neutral-700"
                      >
                        Boost Audio (+4 dB)
                      </button>
                      <button
                        onClick={() => handleClarificationPick('Trim the first 2 seconds')}
                        className="px-3 py-1.5 rounded-lg bg-neutral-100 dark:bg-neutral-900 hover:bg-neutral-200 dark:hover:bg-neutral-800 text-xs text-neutral-800 dark:text-neutral-200 border border-neutral-300 dark:border-neutral-700"
                      >
                        Trim First 2 Seconds
                      </button>
                    </div>
                  </div>
                )}

                {/* Changes Checklist */}
                {generatedPlan.operations.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                      Operations Checklist ({generatedPlan.operations.length} Step{generatedPlan.operations.length === 1 ? '' : 's'}):
                    </h4>
                    <div className="space-y-1.5">
                      {generatedPlan.operations.map((op, idx) => (
                        <div
                          key={op.id || idx}
                          className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-900/50 border border-neutral-200 dark:border-neutral-800 flex items-center justify-between text-xs"
                        >
                          <div className="flex items-center space-x-2.5">
                            <div className="w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 flex items-center justify-center">
                              <Check className="w-3.5 h-3.5" />
                            </div>
                            <div>
                              <span className="font-semibold text-neutral-900 dark:text-neutral-200">
                                {op.description}
                              </span>
                              <span className="text-[11px] text-neutral-500 block">
                                Target: {op.targetTitle || generatedPlan.target.title} ({op.targetScope})
                              </span>
                            </div>
                          </div>
                          <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-400">
                            {op.type}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Validation Checks */}
                <div className="pt-2 border-t border-neutral-200 dark:border-neutral-800">
                  <h4 className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-2">
                    Safety & Permission Validation:
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {generatedPlan.validation.checks.map((chk, idx) => (
                      <div
                        key={idx}
                        className={`p-2.5 rounded-xl border flex items-center space-x-2 ${
                          chk.passed
                            ? 'bg-neutral-50 dark:bg-neutral-900/40 border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300'
                            : 'bg-red-500/10 border-red-500/20 text-red-500 dark:text-red-400'
                        }`}
                      >
                        {chk.passed ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 dark:text-emerald-400 shrink-0" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-red-500 dark:text-red-400 shrink-0" />
                        )}
                        <span className="text-xs">{chk.label}</span>
                      </div>
                    ))}
                  </div>

                  {generatedPlan.validation.warnings.length > 0 && (
                    <div className="mt-2 text-xs text-amber-500 dark:text-amber-400 flex items-center space-x-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                      <span>{generatedPlan.validation.warnings.join(' ')}</span>
                    </div>
                  )}
                </div>

                {/* JSON Inspector View */}
                {showJsonInspector && (
                  <div className="mt-3 p-3.5 rounded-xl bg-neutral-900 text-emerald-400 border border-neutral-700 font-mono text-[11px] overflow-x-auto max-h-64">
                    <pre>{JSON.stringify(generatedPlan, null, 2)}</pre>
                  </div>
                )}
              </div>

              {/* Action Buttons Footer */}
              <div className="p-4 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/60 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center space-x-2 text-xs text-neutral-500 dark:text-neutral-400">
                  <ShieldCheck className="w-4 h-4 text-blue-500 dark:text-blue-400" />
                  <span>
                    Cost: <strong>{generatedPlan.estimated_cost_credits} AI Credit</strong> • Automatic project snapshot will be saved.
                  </span>
                </div>

                <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
                  <button
                    onClick={handleCancelPlan}
                    className="px-4 py-2 text-xs font-semibold text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-200/60 dark:hover:bg-neutral-800 rounded-xl transition-colors"
                  >
                    Cancel
                  </button>

                  <button
                    onClick={handleApproveAndExecute}
                    disabled={!generatedPlan.validation.canExecute || generatedPlan.status === 'executed'}
                    className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl shadow-lg shadow-blue-600/20 flex items-center space-x-2 transition-all"
                  >
                    <Check className="w-4 h-4" />
                    <span>
                      {generatedPlan.status === 'executed'
                        ? 'Changes Executed'
                        : 'Approve & Execute Changes'}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Main Tab 2: Cinematic Screenplay & Beats (Phase 1 preservation) */}
      {activeTab === 'beats' && (
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          {/* Left: Shot List Sidebar */}
          <div className="w-full lg:w-80 border-r border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 p-4 overflow-y-auto space-y-3 shrink-0">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-200 dark:border-neutral-800">
              <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                Cinematic Shot Beats
              </h3>
              <button
                onClick={() => {
                  const nextNum = `1.${beats.length + 1}`;
                  const newBeat: SceneBeat = {
                    id: `beat-${Date.now()}`,
                    shotNumber: nextNum,
                    title: `Shot ${nextNum}: Scene Extension`,
                    cameraAngle: 'Eye-level Medium Shot',
                    lens: '35mm Spherical',
                    lighting: 'Natural Contrast Fill',
                    dialoguePrompt: 'Character pauses and looks up.',
                    status: 'planned',
                  };
                  setBeats(prev => [...prev, newBeat]);
                  setActiveBeatId(newBeat.id);
                  recordEditAction('ADD_BEAT', `Added shot beat ${nextNum}`);
                }}
                className="px-2 py-1 text-xs bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-semibold"
              >
                + Add Shot
              </button>
            </div>

            <div className="space-y-2">
              {beats.map(b => (
                <div
                  key={b.id}
                  onClick={() => setActiveBeatId(b.id)}
                  className={`p-3 rounded-xl border cursor-pointer transition-all ${
                    activeBeatId === b.id
                      ? 'border-blue-500 bg-blue-500/10'
                      : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 bg-neutral-50 dark:bg-neutral-900/40'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400">
                      Shot {b.shotNumber}
                    </span>
                    <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-400">
                      {b.status}
                    </span>
                  </div>
                  <h4 className="text-xs font-semibold text-neutral-900 dark:text-neutral-200 line-clamp-1">
                    {b.title}
                  </h4>
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1 line-clamp-2">
                    {b.cameraAngle} • {b.lens}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Active Shot Inspector */}
          <div className="flex-1 p-6 overflow-y-auto bg-neutral-50 dark:bg-neutral-900 space-y-4">
            {beats.find(b => b.id === activeBeatId) ? (
              (() => {
                const beat = beats.find(b => b.id === activeBeatId)!;
                return (
                  <div className="max-w-3xl space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-neutral-200 dark:border-neutral-800">
                      <div>
                        <span className="font-mono text-xs text-blue-600 dark:text-blue-400 font-bold">
                          SHOT {beat.shotNumber}
                        </span>
                        <h2 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">{beat.title}</h2>
                      </div>
                      <span className="text-xs px-2.5 py-1 rounded-lg bg-neutral-200 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-neutral-800 dark:text-neutral-300 uppercase font-semibold">
                        {beat.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      <div className="p-3.5 bg-white dark:bg-neutral-950 rounded-xl border border-neutral-200 dark:border-neutral-800 space-y-1">
                        <span className="text-neutral-500 font-semibold block">Camera Angle</span>
                        <span className="text-neutral-800 dark:text-neutral-200 font-medium">{beat.cameraAngle}</span>
                      </div>
                      <div className="p-3.5 bg-white dark:bg-neutral-950 rounded-xl border border-neutral-200 dark:border-neutral-800 space-y-1">
                        <span className="text-neutral-500 font-semibold block">Optical Lens</span>
                        <span className="text-neutral-800 dark:text-neutral-200 font-medium">{beat.lens}</span>
                      </div>
                      <div className="p-3.5 bg-white dark:bg-neutral-950 rounded-xl border border-neutral-200 dark:border-neutral-800 space-y-1">
                        <span className="text-neutral-500 font-semibold block">Lighting Setup</span>
                        <span className="text-neutral-800 dark:text-neutral-200 font-medium">{beat.lighting}</span>
                      </div>
                      <div className="p-3.5 bg-white dark:bg-neutral-950 rounded-xl border border-neutral-200 dark:border-neutral-800 space-y-1">
                        <span className="text-neutral-500 font-semibold block">Scene Dialogue</span>
                        <span className="text-neutral-800 dark:text-neutral-200 font-medium">{beat.dialoguePrompt}</span>
                      </div>
                    </div>
                  </div>
                );
              })()
            ) : (
              <div className="text-center py-20 text-neutral-500 text-xs">
                Select a shot beat from the sidebar to inspect its cinematic parameters.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Global Modals */}
      <VoiceCommandModal
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
        onSubmitTranscript={text => {
          setCommandPrompt(text);
          handleAnalyzeCommand(text);
        }}
      />

      <ReferenceMediaModal
        isOpen={isRefModalOpen}
        onClose={() => setIsRefModalOpen(false)}
        selectedReference={selectedReference}
        onSelectReference={ref => setSelectedReference(ref)}
      />

      {telemetryData && (
        <MediaInspectorModal
          isOpen={isTelemetryModalOpen}
          onClose={() => setIsTelemetryModalOpen(false)}
          analysis={telemetryData}
        />
      )}

      {currentProject && (
        <AIHistoryModal
          isOpen={isHistoryModalOpen}
          onClose={() => setIsHistoryModalOpen(false)}
          project={currentProject}
          onReplayCommand={cmd => {
            setCommandPrompt(cmd);
            handleAnalyzeCommand(cmd);
          }}
        />
      )}
    </div>
  );
};
