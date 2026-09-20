import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  AlertTriangle,
  XCircle,
  CheckCircle2,
  HelpCircle,
  Sparkles,
  Play,
  RotateCcw,
  Eye,
  Sliders,
  Settings,
  ChevronRight,
  ChevronDown,
  ExternalLink,
  Film,
  Image as ImageIcon,
  Volume2,
  FileText,
  Crop,
  Sun,
  Trash2,
  Lock,
  RefreshCw,
} from 'lucide-react';
import { Project, MediaAsset } from '../../../types';
import {
  QualityAnalysisReport,
  QualityCategory,
  QualityIssue,
  QualityStatus,
  SuggestedFix,
} from '../../../types/aiQualityAndAutoEdit';
import { QualityAnalyzerService } from '../../../services/ai/qualityAnalyzer';
import { AnalysisCacheService, AIAnalysisPrivacySettings } from '../../../services/ai/analysisCache';
import { DirectorExecutor } from '../../../services/ai/directorExecutor';
import { useProjects } from '../../../context/ProjectContext';
import { useAuth } from '../../../context/AuthContext';

interface QualityCheckerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenAIDirector?: (prompt: string) => void;
  targetMedia?: MediaAsset | null;
  initialTargetMedia?: MediaAsset | null;
}

export const QualityCheckerModal: React.FC<QualityCheckerModalProps> = ({
  isOpen,
  onClose,
  onOpenAIDirector,
  targetMedia: directTargetMedia,
  initialTargetMedia,
}) => {
  const targetMedia = directTargetMedia || initialTargetMedia;
  const {
    activeProject,
    createVersionSnapshot,
    recordEditAction,
    applyDirectStateUpdate,
  } = useProjects();
  const { isPro, deductCredits } = useAuth();

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [report, setReport] = useState<QualityAnalysisReport | null>(null);
  const [activeCategoryTab, setActiveCategoryTab] = useState<QualityCategory | 'all'>('all');
  const [previewFixIssue, setPreviewFixIssue] = useState<QualityIssue | null>(null);
  const [showPrivacySettings, setShowPrivacySettings] = useState(false);
  const [privacySettings, setPrivacySettings] = useState<AIAnalysisPrivacySettings>(
    AnalysisCacheService.getPrivacySettings()
  );
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [ignoredIssueIds, setIgnoredIssueIds] = useState<Set<string>>(new Set());

  // Run analysis when modal opens or target changes
  useEffect(() => {
    if (isOpen && activeProject) {
      runAnalysis(false);
    }
  }, [isOpen, activeProject?.id, targetMedia?.id]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const runAnalysis = (fullCheck: boolean) => {
    if (!activeProject) return;
    setIsAnalyzing(true);

    setTimeout(() => {
      let rep: QualityAnalysisReport;
      if (targetMedia) {
        rep = QualityAnalyzerService.analyzeSingleMedia(targetMedia);
      } else {
        rep = QualityAnalyzerService.analyzeProject(activeProject, fullCheck);
      }
      setReport(rep);
      setIsAnalyzing(false);
    }, 450);
  };

  const handleApplyFix = (issue: QualityIssue) => {
    if (!activeProject || !issue.suggestedFix) return;

    if (issue.suggestedFix.requiresExternalAi && !isPro) {
      showToast('AI Super-Resolution requires a Pro subscription.');
      return;
    }

    if (issue.suggestedFix.estimatedCredits > 0) {
      const success = deductCredits(issue.suggestedFix.estimatedCredits);
      if (!success) {
        showToast('Insufficient AI credits for this fix.');
        return;
      }
    }

    const result = DirectorExecutor.executeQualityFix(
      issue,
      activeProject,
      createVersionSnapshot,
      recordEditAction
    );

    if (result.success) {
      applyDirectStateUpdate(result.updatedProject.stateData);
      showToast(`Applied: ${issue.suggestedFix.title}`);
      setPreviewFixIssue(null);
      // Automatically re-check
      setTimeout(() => runAnalysis(true), 300);
    } else {
      showToast('Could not apply fix: ' + (result.message || 'Unknown error'));
    }
  };

  const handleIgnoreIssue = (issueId: string) => {
    setIgnoredIssueIds(prev => new Set(prev).add(issueId));
    showToast('Issue marked as ignored.');
  };

  const handleSendToAIDirector = () => {
    if (!report || !onOpenAIDirector) return;
    const issueDescriptions = report.issues
      .filter(i => !ignoredIssueIds.has(i.id))
      .map(i => `${i.title}: ${i.description}`)
      .slice(0, 3)
      .join('; ');

    const prompt = `Review quality issues: ${issueDescriptions}. Propose non-destructive adjustments to align framing, exposure, and audio levels.`;
    onClose();
    onOpenAIDirector(prompt);
  };

  const handleUpdatePrivacy = (updated: Partial<AIAnalysisPrivacySettings>) => {
    const saved = AnalysisCacheService.updatePrivacySettings(updated);
    setPrivacySettings(saved);
    showToast('Privacy preferences updated.');
  };

  const handleClearData = () => {
    AnalysisCacheService.clearAllAnalysisData();
    setReport(null);
    showToast('All cached AI quality reports and metadata cleared.');
  };

  if (!isOpen || !activeProject) return null;

  const visibleIssues = (report?.issues || []).filter(
    issue =>
      !ignoredIssueIds.has(issue.id) &&
      (activeCategoryTab === 'all' || issue.category === activeCategoryTab)
  );

  const getStatusBadge = (status?: QualityStatus) => {
    switch (status) {
      case 'good':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            Good
          </span>
        );
      case 'needs_attention':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <AlertTriangle className="w-3 h-3 text-amber-400" />
            Needs Attention
          </span>
        );
      case 'problem_detected':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <XCircle className="w-3 h-3 text-rose-400" />
            Problem Detected
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-neutral-800 text-neutral-400 border border-neutral-700">
            <HelpCircle className="w-3 h-3 text-neutral-400" />
            Not Checked
          </span>
        );
    }
  };

  const categories: { key: QualityCategory; label: string; icon: any }[] = [
    { key: 'video', label: 'Video', icon: Film },
    { key: 'audio', label: 'Audio', icon: Volume2 },
    { key: 'photo', label: 'Photo', icon: ImageIcon },
    { key: 'framing', label: 'Framing', icon: Crop },
    { key: 'exposure', label: 'Exposure', icon: Sun },
    { key: 'captions', label: 'Captions', icon: FileText },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div
        id="quality-checker-modal"
        className="w-full max-w-4xl bg-neutral-900 border border-neutral-800 rounded-xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden text-neutral-200"
      >
        {/* Header */}
        <div className="p-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-900/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold text-white">AI Quality Checker</h2>
                <span className="text-xs px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-400 border border-neutral-700">
                  {targetMedia ? `Media: ${targetMedia.name}` : `Project: ${activeProject.title}`}
                </span>
              </div>
              <p className="text-xs text-neutral-400">
                Categorized technical validation without synthetic scoring. Evidence-backed diagnostics.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="qc-privacy-toggle-btn"
              onClick={() => setShowPrivacySettings(!showPrivacySettings)}
              className="p-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition-colors"
              title="AI Privacy Controls"
            >
              <Settings className="w-4 h-4" />
            </button>
            <button
              id="qc-recheck-btn"
              onClick={() => runAnalysis(true)}
              disabled={isAnalyzing}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-xs font-medium text-white transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isAnalyzing ? 'animate-spin text-emerald-400' : ''}`} />
              Re-Analyze
            </button>
            <button
              id="qc-close-btn"
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Toast alert */}
        {toastMessage && (
          <div className="bg-emerald-600 text-white text-xs py-2 px-4 flex items-center justify-between font-medium">
            <span>{toastMessage}</span>
            <button onClick={() => setToastMessage(null)} className="text-white/80 hover:text-white">✕</button>
          </div>
        )}

        {/* Privacy Panel Drawer */}
        {showPrivacySettings && (
          <div className="p-4 bg-neutral-950 border-b border-neutral-800 text-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-medium text-white">
                <Lock className="w-4 h-4 text-emerald-400" />
                AI Quality & Privacy Preferences
              </div>
              <button
                onClick={handleClearData}
                className="flex items-center gap-1 px-2.5 py-1 rounded bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20"
              >
                <Trash2 className="w-3 h-3" />
                Delete All AI Analysis Data
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <label className="flex items-center gap-2 cursor-pointer text-neutral-300">
                <input
                  type="checkbox"
                  checked={privacySettings.analyzeProjectAllowed}
                  onChange={e => handleUpdatePrivacy({ analyzeProjectAllowed: e.target.checked })}
                  className="rounded bg-neutral-800 border-neutral-700 text-emerald-500 focus:ring-0"
                />
                Analyze Entire Project
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-neutral-300">
                <input
                  type="checkbox"
                  checked={privacySettings.storeTranscripts}
                  onChange={e => handleUpdatePrivacy({ storeTranscripts: e.target.checked })}
                  className="rounded bg-neutral-800 border-neutral-700 text-emerald-500 focus:ring-0"
                />
                Store Speech Transcripts
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-neutral-300">
                <input
                  type="checkbox"
                  checked={privacySettings.storeSemanticMetadata}
                  onChange={e => handleUpdatePrivacy({ storeSemanticMetadata: e.target.checked })}
                  className="rounded bg-neutral-800 border-neutral-700 text-emerald-500 focus:ring-0"
                />
                Store Semantic Tags & Scenes
              </label>
            </div>
          </div>
        )}

        {/* Categorized Status Overview Bar */}
        <div className="p-4 bg-neutral-900 border-b border-neutral-800">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            {categories.map(cat => {
              const Icon = cat.icon;
              const status = report?.categorizedStatus[cat.key];
              return (
                <button
                  key={cat.key}
                  onClick={() => setActiveCategoryTab(activeCategoryTab === cat.key ? 'all' : cat.key)}
                  className={`p-2.5 rounded-lg border text-left transition-all flex flex-col justify-between ${
                    activeCategoryTab === cat.key
                      ? 'bg-neutral-800 border-emerald-500/50 shadow-sm'
                      : 'bg-neutral-950/50 border-neutral-800 hover:border-neutral-700'
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <span className="text-xs font-medium text-neutral-300 flex items-center gap-1.5">
                      <Icon className="w-3.5 h-3.5 text-neutral-400" />
                      {cat.label}
                    </span>
                  </div>
                  {getStatusBadge(status)}
                </button>
              );
            })}
          </div>

          {/* High level diagnostic summary */}
          {report && (
            <div className="mt-3 px-3 py-2 rounded-lg bg-neutral-950 border border-neutral-800 text-xs flex items-center justify-between text-neutral-400">
              <span className="text-neutral-300">{report.summary}</span>
              <span className="text-neutral-500 shrink-0 ml-2">
                Engine: {report.modelUsed}
              </span>
            </div>
          )}
        </div>

        {/* Content Area */}
        <div className="p-4 overflow-y-auto flex-1 space-y-4">
          {/* Category Filter Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
            <button
              onClick={() => setActiveCategoryTab('all')}
              className={`px-3 py-1 rounded-full font-medium transition-colors ${
                activeCategoryTab === 'all'
                  ? 'bg-white text-neutral-900'
                  : 'bg-neutral-800 text-neutral-400 hover:text-white'
              }`}
            >
              All Issues ({visibleIssues.length})
            </button>
            {categories.map(cat => {
              const count = (report?.issues || []).filter(
                i => i.category === cat.key && !ignoredIssueIds.has(i.id)
              ).length;
              if (count === 0 && activeCategoryTab !== cat.key) return null;
              return (
                <button
                  key={cat.key}
                  onClick={() => setActiveCategoryTab(cat.key)}
                  className={`px-3 py-1 rounded-full font-medium transition-colors flex items-center gap-1.5 ${
                    activeCategoryTab === cat.key
                      ? 'bg-white text-neutral-900'
                      : 'bg-neutral-800 text-neutral-400 hover:text-white'
                  }`}
                >
                  {cat.label} ({count})
                </button>
              );
            })}
          </div>

          {/* Loading Indicator */}
          {isAnalyzing && (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
              <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin" />
              <p className="text-sm text-neutral-300 font-medium">Running Non-Destructive Quality Diagnostic...</p>
              <p className="text-xs text-neutral-500">Checking aspect ratio, exposure clipping, audio peaks, subtitle safe areas...</p>
            </div>
          )}

          {/* Zero Issues State */}
          {!isAnalyzing && visibleIssues.length === 0 && (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-3 bg-neutral-950/40 rounded-xl border border-neutral-800/80">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">No Issues in this Category</h3>
                <p className="text-xs text-neutral-400 mt-1">
                  All checked technical metrics adhere to standard broadcast & streaming guidelines.
                </p>
              </div>
            </div>
          )}

          {/* Issues List */}
          {!isAnalyzing && visibleIssues.length > 0 && (
            <div className="space-y-3">
              {visibleIssues.map(issue => {
                const isCritical = issue.severity === 'critical';
                const isWarning = issue.severity === 'warning';

                return (
                  <div
                    key={issue.id}
                    className={`p-4 rounded-xl border text-xs transition-all ${
                      isCritical
                        ? 'bg-rose-950/10 border-rose-500/30'
                        : isWarning
                        ? 'bg-amber-950/10 border-amber-500/30'
                        : 'bg-neutral-950/60 border-neutral-800'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div
                          className={`p-2 rounded-lg mt-0.5 shrink-0 ${
                            isCritical
                              ? 'bg-rose-500/10 text-rose-400'
                              : isWarning
                              ? 'bg-amber-500/10 text-amber-400'
                              : 'bg-blue-500/10 text-blue-400'
                          }`}
                        >
                          {isCritical ? (
                            <XCircle className="w-4 h-4" />
                          ) : isWarning ? (
                            <AlertTriangle className="w-4 h-4" />
                          ) : (
                            <HelpCircle className="w-4 h-4" />
                          )}
                        </div>

                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-semibold text-white text-sm">{issue.title}</h4>
                            <span className="px-2 py-0.5 rounded text-[10px] font-medium uppercase tracking-wider bg-neutral-800 text-neutral-400">
                              {issue.category}
                            </span>
                            {issue.targetName && (
                              <span className="text-[10px] text-neutral-400 bg-neutral-900 px-1.5 py-0.5 rounded border border-neutral-800">
                                Target: {issue.targetName}
                              </span>
                            )}
                          </div>

                          <p className="text-neutral-300 leading-relaxed">{issue.description}</p>

                          {/* Technical Evidence Tag */}
                          <div className="px-2.5 py-1 rounded bg-neutral-900 border border-neutral-800 text-neutral-400 text-[11px] font-mono">
                            <span className="text-neutral-500 font-semibold mr-1">Evidence:</span>
                            {issue.evidence}
                          </div>

                          {/* Suggested Fix Section */}
                          {issue.suggestedFix && (
                            <div className="mt-3 p-3 rounded-lg bg-neutral-900/80 border border-neutral-800 space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="font-medium text-white flex items-center gap-1.5">
                                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                                  Suggested Fix: {issue.suggestedFix.title}
                                </span>
                                {issue.suggestedFix.estimatedCredits > 0 && (
                                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                    {issue.suggestedFix.estimatedCredits} Credits
                                  </span>
                                )}
                              </div>
                              <p className="text-neutral-400">{issue.suggestedFix.description}</p>

                              <div className="flex items-center gap-2 pt-1">
                                <button
                                  onClick={() => setPreviewFixIssue(issue)}
                                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 transition-colors font-medium"
                                >
                                  <Eye className="w-3 h-3" />
                                  Preview Fix
                                </button>
                                <button
                                  onClick={() => handleApplyFix(issue)}
                                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-colors font-medium shadow-sm"
                                >
                                  <CheckCircle2 className="w-3 h-3" />
                                  Apply Fix
                                </button>
                                <button
                                  onClick={() => handleIgnoreIssue(issue.id)}
                                  className="px-2.5 py-1.5 rounded-lg text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800 transition-colors"
                                >
                                  Ignore
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-neutral-800 bg-neutral-900/60 flex items-center justify-between text-xs">
          <div className="text-neutral-400">
            {report && (
              <span>
                Diagnostic report saved locally. Non-destructive version checkpoints created automatically before any fix is applied.
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {onOpenAIDirector && (
              <button
                onClick={handleSendToAIDirector}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white font-medium transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Send Issues to AI Director
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-white text-neutral-900 font-medium hover:bg-neutral-100 transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      </div>

      {/* Inline Before/After Preview Modal */}
      {previewFixIssue && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
          <div className="w-full max-w-lg bg-neutral-900 border border-neutral-800 rounded-xl p-5 text-neutral-200 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <h3 className="font-semibold text-white text-sm flex items-center gap-2">
                <Eye className="w-4 h-4 text-emerald-400" />
                Before / After Fix Preview
              </h3>
              <button onClick={() => setPreviewFixIssue(null)} className="text-neutral-400 hover:text-white">✕</button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-lg bg-neutral-950 border border-neutral-800">
                <div className="font-semibold text-neutral-400 mb-1">Issue Identified:</div>
                <p className="text-neutral-200">{previewFixIssue.title}</p>
                <div className="text-neutral-500 font-mono mt-1 text-[11px]">{previewFixIssue.evidence}</div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-rose-950/20 border border-rose-500/30">
                  <div className="font-semibold text-rose-400 mb-1">Current State</div>
                  <p className="text-neutral-300 text-[11px]">{previewFixIssue.description}</p>
                </div>
                <div className="p-3 rounded-lg bg-emerald-950/20 border border-emerald-500/30">
                  <div className="font-semibold text-emerald-400 mb-1">After Fix</div>
                  <p className="text-neutral-300 text-[11px]">{previewFixIssue.suggestedFix?.description}</p>
                </div>
              </div>

              <div className="p-2.5 rounded bg-neutral-800/60 border border-neutral-700/50 text-[11px] text-neutral-400">
                Safety Guarantee: A version snapshot will be saved automatically prior to applying this adjustment. You can undo anytime.
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-800">
              <button
                onClick={() => setPreviewFixIssue(null)}
                className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => handleApplyFix(previewFixIssue)}
                className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium shadow-sm"
              >
                Confirm & Apply Fix
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
