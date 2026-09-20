import React from 'react';
import { Layers, Activity, FileText, CheckCircle2, X } from 'lucide-react';
import { MediaAnalysisData } from '../../../types/aiDirector';

interface MediaInspectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  analysis: MediaAnalysisData;
}

export const MediaInspectorModal: React.FC<MediaInspectorModalProps> = ({
  isOpen,
  onClose,
  analysis,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden p-6">
        <div className="flex items-center justify-between pb-4 border-b border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
                Media Technical Telemetry
              </h3>
              <p className="text-xs text-neutral-500">
                Live inspector data collected for {analysis.mediaName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Technical Properties Grid */}
        <div className="my-5">
          <h4 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2.5">
            Technical Properties (Verified)
          </h4>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {analysis.technical.durationSec !== undefined && (
              <div className="p-2.5 bg-neutral-50 dark:bg-neutral-800/60 rounded-xl border border-neutral-200/80 dark:border-neutral-700/60">
                <span className="text-neutral-500 block text-[11px]">Duration</span>
                <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                  {analysis.technical.durationSec}s
                </span>
              </div>
            )}
            {analysis.technical.resolution && (
              <div className="p-2.5 bg-neutral-50 dark:bg-neutral-800/60 rounded-xl border border-neutral-200/80 dark:border-neutral-700/60">
                <span className="text-neutral-500 block text-[11px]">Resolution</span>
                <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                  {analysis.technical.resolution}
                </span>
              </div>
            )}
            {analysis.technical.aspectRatio && (
              <div className="p-2.5 bg-neutral-50 dark:bg-neutral-800/60 rounded-xl border border-neutral-200/80 dark:border-neutral-700/60">
                <span className="text-neutral-500 block text-[11px]">Aspect Ratio</span>
                <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                  {analysis.technical.aspectRatio} ({analysis.technical.orientation})
                </span>
              </div>
            )}
            {analysis.technical.fps && (
              <div className="p-2.5 bg-neutral-50 dark:bg-neutral-800/60 rounded-xl border border-neutral-200/80 dark:border-neutral-700/60">
                <span className="text-neutral-500 block text-[11px]">Frame Rate</span>
                <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                  {analysis.technical.fps} FPS
                </span>
              </div>
            )}
            {analysis.technical.sampleRateHz && (
              <div className="p-2.5 bg-neutral-50 dark:bg-neutral-800/60 rounded-xl border border-neutral-200/80 dark:border-neutral-700/60">
                <span className="text-neutral-500 block text-[11px]">Sample Rate</span>
                <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                  {analysis.technical.sampleRateHz} Hz (Stereo)
                </span>
              </div>
            )}
            {analysis.technical.format && (
              <div className="p-2.5 bg-neutral-50 dark:bg-neutral-800/60 rounded-xl border border-neutral-200/80 dark:border-neutral-700/60">
                <span className="text-neutral-500 block text-[11px]">Format Architecture</span>
                <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                  {analysis.technical.format}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Semantic Foundation Architecture */}
        <div className="p-3.5 rounded-xl border border-blue-500/20 bg-blue-500/5 dark:bg-blue-500/10 mb-5">
          <div className="flex items-center space-x-2 text-xs font-semibold text-blue-600 dark:text-blue-400 mb-1">
            <CheckCircle2 className="w-4 h-4" />
            <span>Semantic Ingestion Layer</span>
          </div>
          <p className="text-xs text-neutral-600 dark:text-neutral-300">
            {analysis.semanticFoundation.notes}
          </p>
          <div className="mt-2 text-[11px] text-neutral-500 flex flex-wrap gap-2">
            <span className="px-2 py-0.5 rounded-md bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700">
              Scene Classification: Ready
            </span>
            <span className="px-2 py-0.5 rounded-md bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700">
              Face/Object Anchor: Modular Schema
            </span>
            <span className="px-2 py-0.5 rounded-md bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700">
              Audio Waveform: Ingested
            </span>
          </div>
        </div>

        <div className="flex justify-end pt-3 border-t border-neutral-200 dark:border-neutral-800">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-white bg-neutral-900 dark:bg-neutral-100 dark:text-neutral-900 rounded-lg"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
};
