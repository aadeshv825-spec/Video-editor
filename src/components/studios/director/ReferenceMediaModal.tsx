import React, { useState } from 'react';
import { Image, Video, Music, Check, X, Upload, Sparkles } from 'lucide-react';
import { ReferenceMediaInfo } from '../../../types/aiDirector';
import { ReferenceAnalyzerService } from '../../../services/ai/referenceAnalyzer';

interface ReferenceMediaModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedReference: ReferenceMediaInfo | null;
  onSelectReference: (ref: ReferenceMediaInfo | null) => void;
}

export const ReferenceMediaModal: React.FC<ReferenceMediaModalProps> = ({
  isOpen,
  onClose,
  selectedReference,
  onSelectReference,
}) => {
  const [activeTab, setActiveTab] = useState<'samples' | 'upload'>('samples');
  const samples = ReferenceAnalyzerService.getSampleReferences();

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    let type: 'image' | 'video' | 'audio' = 'image';
    if (file.type.startsWith('video/')) type = 'video';
    else if (file.type.startsWith('audio/')) type = 'audio';

    const url = URL.createObjectURL(file);
    const analyzed = ReferenceAnalyzerService.analyzeReference({
      name: file.name,
      type,
      url,
    });
    onSelectReference(analyzed);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden p-6">
        <div className="flex items-center justify-between pb-4 border-b border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
                Reference Style Media
              </h3>
              <p className="text-xs text-neutral-500">
                Attach an anchor asset for style-matching, color grading, or pacing analysis
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

        {/* Tab Selector */}
        <div className="flex items-center space-x-2 my-4 border-b border-neutral-200 dark:border-neutral-800 pb-2">
          <button
            onClick={() => setActiveTab('samples')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              activeTab === 'samples'
                ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900'
                : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100'
            }`}
          >
            Curated Style References
          </button>
          <button
            onClick={() => setActiveTab('upload')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              activeTab === 'upload'
                ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900'
                : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100'
            }`}
          >
            Upload Custom File
          </button>
        </div>

        {activeTab === 'samples' && (
          <div className="space-y-2.5 my-4">
            {samples.map(sample => {
              const isSelected = selectedReference?.id === sample.id;
              return (
                <div
                  key={sample.id}
                  onClick={() => {
                    onSelectReference(isSelected ? null : sample);
                  }}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                    isSelected
                      ? 'border-purple-500 bg-purple-500/5 dark:bg-purple-500/10'
                      : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300">
                      {sample.type === 'video' ? (
                        <Video className="w-4 h-4" />
                      ) : sample.type === 'audio' ? (
                        <Music className="w-4 h-4" />
                      ) : (
                        <Image className="w-4 h-4" />
                      )}
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">
                        {sample.name}
                      </h4>
                      <div className="flex items-center space-x-2 text-[11px] text-neutral-500 mt-0.5">
                        <span>Format: {sample.aspectRatio || 'Native'}</span>
                        {sample.extractedStyle?.brightness && (
                          <span>• Brightness: +{sample.extractedStyle.brightness}%</span>
                        )}
                        {sample.extractedStyle?.warmth && (
                          <span>• Warmth: +{sample.extractedStyle.warmth}pts</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                    isSelected
                      ? 'border-purple-600 bg-purple-600 text-white'
                      : 'border-neutral-300 dark:border-neutral-700'
                  }`}>
                    {isSelected && <Check className="w-3.5 h-3.5" />}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {activeTab === 'upload' && (
          <div className="my-6">
            <label className="border-2 border-dashed border-neutral-300 dark:border-neutral-700 hover:border-purple-500 dark:hover:border-purple-500 rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer transition-colors bg-neutral-50 dark:bg-neutral-800/40">
              <Upload className="w-8 h-8 text-neutral-400 mb-2" />
              <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                Click to browse image, video, or audio file
              </span>
              <span className="text-[11px] text-neutral-400 mt-1">
                Supports JPG, PNG, MP4, WebM, MP3, WAV
              </span>
              <input
                type="file"
                accept="image/*,video/*,audio/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>
        )}

        <div className="flex items-center justify-between pt-4 border-t border-neutral-200 dark:border-neutral-800">
          {selectedReference ? (
            <button
              onClick={() => onSelectReference(null)}
              className="text-xs text-red-500 hover:underline"
            >
              Detach Reference
            </button>
          ) : (
            <span className="text-xs text-neutral-400">No reference attached</span>
          )}
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-white bg-neutral-900 dark:bg-neutral-100 dark:text-neutral-900 rounded-lg"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
