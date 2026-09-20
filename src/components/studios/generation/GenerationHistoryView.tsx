import React, { useState, useMemo } from 'react';
import { 
  Film, 
  Image as ImageIcon, 
  Music, 
  Search, 
  Trash2, 
  ExternalLink, 
  RotateCw, 
  SlidersHorizontal, 
  Plus, 
  Check, 
  Clock, 
  Coins, 
  FolderKanban,
  CheckCircle2,
  XCircle,
  AlertTriangle
} from 'lucide-react';
import { GenerationRecord } from '../../../types/aiGeneration';
import { GenerationEngine } from '../../../services/ai/generationEngine';

interface GenerationHistoryViewProps {
  onOpenPreview: (record: GenerationRecord) => void;
  onRegenerate: (record: GenerationRecord) => void;
  onCreateVariation: (record: GenerationRecord) => void;
  onAddToProject: (record: GenerationRecord) => void;
}

export const GenerationHistoryView: React.FC<GenerationHistoryViewProps> = ({
  onOpenPreview,
  onRegenerate,
  onCreateVariation,
  onAddToProject,
}) => {
  const [history, setHistory] = useState<GenerationRecord[]>(() => GenerationEngine.getHistory());
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'video' | 'image' | 'audio'>('all');

  const filteredHistory = useMemo(() => {
    return history.filter(item => {
      if (filterType !== 'all' && item.outputType !== filterType) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          item.prompt.toLowerCase().includes(q) ||
          item.modelName.toLowerCase().includes(q) ||
          item.provider.toLowerCase().includes(q) ||
          (item.projectTitle && item.projectTitle.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [history, filterType, searchQuery]);

  const [isConfirmingClear, setIsConfirmingClear] = useState(false);

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    GenerationEngine.deleteRecord(id);
    setHistory(GenerationEngine.getHistory());
  };

  const handleClearAll = () => {
    if (!isConfirmingClear) {
      setIsConfirmingClear(true);
      return;
    }
    GenerationEngine.clearHistory();
    setHistory([]);
    setIsConfirmingClear(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-linear-to-r from-neutral-50 via-white to-neutral-50 dark:from-neutral-900/50 dark:via-neutral-900/20 dark:to-neutral-900/50">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold tracking-tight">Generation History</h2>
            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400">
              {history.length} Records
            </span>
          </div>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 max-w-2xl">
            Inspect past generations, audit credit expenditure, replay preview outputs, and re-import assets to active timelines or photo canvases.
          </p>
        </div>

        {history.length > 0 && (
          <div className="flex items-center gap-2">
            {isConfirmingClear ? (
              <>
                <button
                  onClick={handleClearAll}
                  className="px-3 py-1.5 rounded-lg bg-red-600 text-white text-xs font-semibold hover:bg-red-500 flex items-center gap-1.5 shrink-0 transition-colors shadow-xs animate-in fade-in"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Confirm Delete All</span>
                </button>
                <button
                  onClick={() => setIsConfirmingClear(false)}
                  className="px-2.5 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 text-xs hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                >
                  Cancel
                </button>
              </>
            ) : (
              <button
                onClick={handleClearAll}
                className="px-3 py-1.5 rounded-lg border border-red-500/30 text-red-600 dark:text-red-400 text-xs font-medium hover:bg-red-500/10 flex items-center gap-1.5 shrink-0 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear History</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5">
          {(['all', 'video', 'image', 'audio'] as const).map(type => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${
                filterType === type
                  ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-950 shadow-xs'
                  : 'border border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
              }`}
            >
              {type}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search prompts, models..."
            className="w-full pl-8.5 pr-3 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-xs focus:ring-1 focus:ring-purple-500"
          />
        </div>
      </div>

      {/* History List */}
      {filteredHistory.length === 0 ? (
        <div className="p-12 text-center rounded-xl border border-dashed border-neutral-300 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/20">
          <Clock className="w-8 h-8 mx-auto text-neutral-400 mb-2 opacity-60" />
          <div className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">No Generation Records Found</div>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 max-w-sm mx-auto">
            Your generation runs, prompts, and output media assets will appear here after executing prompts in the studios.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredHistory.map(item => {
            return (
              <div
                key={item.id}
                onClick={() => onOpenPreview(item)}
                className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/40 p-4 flex flex-col justify-between hover:border-neutral-300 dark:hover:border-neutral-700 cursor-pointer transition-all shadow-xs group"
              >
                <div className="space-y-3">
                  {/* Thumbnail / Media Preview */}
                  <div className="relative rounded-lg overflow-hidden bg-neutral-950 aspect-video flex items-center justify-center border border-neutral-200 dark:border-neutral-800/80">
                    {item.outputType === 'image' && item.outputUrl && (
                      <img src={item.outputUrl} alt={item.prompt} className="w-full h-full object-cover" />
                    )}
                    {item.outputType === 'video' && item.outputUrl && (
                      <video src={item.outputUrl} className="w-full h-full object-cover" muted />
                    )}
                    {item.outputType === 'audio' && (
                      <div className="flex flex-col items-center gap-2 text-purple-400">
                        <Music className="w-8 h-8" />
                        <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-400">
                          {item.durationSec}s Audio Master
                        </span>
                      </div>
                    )}

                    {/* Type Badge */}
                    <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-black/60 backdrop-blur-xs text-white text-[10px] font-medium flex items-center gap-1 uppercase">
                      {item.outputType === 'video' ? (
                        <Film className="w-3 h-3 text-purple-400" />
                      ) : item.outputType === 'image' ? (
                        <ImageIcon className="w-3 h-3 text-blue-400" />
                      ) : (
                        <Music className="w-3 h-3 text-amber-400" />
                      )}
                      <span>{item.outputType}</span>
                    </div>

                    {/* Status Badge */}
                    <div className="absolute top-2 right-2">
                      {item.status === 'completed' ? (
                        <span className="p-1 rounded-full bg-emerald-500/80 text-white flex items-center justify-center">
                          <CheckCircle2 className="w-3 h-3" />
                        </span>
                      ) : item.status === 'failed' ? (
                        <span className="p-1 rounded-full bg-red-500/80 text-white flex items-center justify-center">
                          <XCircle className="w-3 h-3" />
                        </span>
                      ) : (
                        <span className="p-1 rounded-full bg-amber-500/80 text-white flex items-center justify-center">
                          <Clock className="w-3 h-3" />
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Prompt & Details */}
                  <div>
                    <h3 className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 line-clamp-2 leading-relaxed">
                      “{item.prompt}”
                    </h3>
                    <div className="flex items-center gap-2 text-[11px] text-neutral-400 font-mono mt-1">
                      <span>{item.modelName.split(' ')[0]}</span>
                      <span>•</span>
                      <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                      <span>•</span>
                      <span className="text-purple-600 dark:text-purple-400 font-semibold">{item.creditsDeducted} CR</span>
                    </div>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="mt-4 pt-3 border-t border-neutral-100 dark:border-neutral-800/80 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        onRegenerate(item);
                      }}
                      className="p-1.5 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors"
                      title="Regenerate"
                    >
                      <RotateCw className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        onCreateVariation(item);
                      }}
                      className="p-1.5 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors"
                      title="Create Variation"
                    >
                      <SlidersHorizontal className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={e => handleDelete(item.id, e)}
                      className="p-1.5 rounded hover:bg-red-500/10 text-neutral-400 hover:text-red-500 transition-colors"
                      title="Delete Record"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <button
                    onClick={e => {
                      e.stopPropagation();
                      onAddToProject(item);
                    }}
                    className="px-2.5 py-1 rounded bg-neutral-900 dark:bg-white text-white dark:text-neutral-950 font-medium hover:opacity-90 flex items-center gap-1 shadow-xs transition-opacity"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add to Media</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
