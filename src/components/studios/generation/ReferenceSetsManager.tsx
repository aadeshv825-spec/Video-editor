import React, { useState } from 'react';
import { 
  FolderPlus, 
  Image as ImageIcon, 
  Layers, 
  Plus, 
  Sparkles, 
  Trash2, 
  X, 
  UserCheck, 
  Package, 
  Palette, 
  Tag, 
  Info,
  Check
} from 'lucide-react';
import { ReferenceSet } from '../../../types/aiGeneration';
import { GenerationEngine } from '../../../services/ai/generationEngine';

interface ReferenceSetsManagerProps {
  onSelectReferenceSet?: (refSet: ReferenceSet) => void;
  selectedSetId?: string;
}

export const ReferenceSetsManager: React.FC<ReferenceSetsManagerProps> = ({
  onSelectReferenceSet,
  selectedSetId,
}) => {
  const [sets, setSets] = useState<ReferenceSet[]>(() => GenerationEngine.getReferenceSets());
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Form state for creating new reference set
  const [newTitle, setNewTitle] = useState('');
  const [newPurpose, setNewPurpose] = useState<'character' | 'product' | 'brand' | 'style'>('character');
  const [newDesc, setNewDesc] = useState('');
  const [newKeyword, setNewKeyword] = useState('');
  const [newImageUrls, setNewImageUrls] = useState<string[]>([]);
  const [currentUrlInput, setCurrentUrlInput] = useState('');

  const handleAddImageUrl = () => {
    if (!currentUrlInput.trim()) return;
    setNewImageUrls(prev => [...prev, currentUrlInput.trim()]);
    setCurrentUrlInput('');
  };

  const handleRemoveImage = (index: number) => {
    setNewImageUrls(prev => prev.filter((_, i) => i !== index));
  };

  const handleCreateSet = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newSet: ReferenceSet = {
      id: `ref-set-${Date.now()}`,
      title: newTitle.trim(),
      purpose: newPurpose,
      description: newDesc.trim(),
      triggerKeyword: newKeyword.trim() || undefined,
      images: newImageUrls.length > 0 ? newImageUrls : [
        'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=800&auto=format&fit=crop&q=80'
      ],
      createdAt: new Date().toISOString(),
    };

    GenerationEngine.saveReferenceSet(newSet);
    setSets(GenerationEngine.getReferenceSets());
    setIsCreateModalOpen(false);

    // Reset form
    setNewTitle('');
    setNewDesc('');
    setNewKeyword('');
    setNewImageUrls([]);
  };

  const handleDeleteSet = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    GenerationEngine.deleteReferenceSet(id);
    setSets(GenerationEngine.getReferenceSets());
  };

  const getPurposeIcon = (purpose: string) => {
    switch (purpose) {
      case 'character': return UserCheck;
      case 'product': return Package;
      case 'brand': return Tag;
      default: return Palette;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-linear-to-r from-neutral-50 via-white to-neutral-50 dark:from-neutral-900/50 dark:via-neutral-900/20 dark:to-neutral-900/50">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold tracking-tight">Reference Sets Library</h2>
            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/20">
              Consistency Foundation
            </span>
          </div>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 max-w-2xl">
            Save reusable character features, product blueprints, and brand aesthetics. Connect them to any image or video generation to guide visual fidelity across multi-shot sequences.
          </p>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="px-3.5 py-1.5 rounded-lg bg-neutral-900 dark:bg-white text-white dark:text-neutral-950 text-xs font-medium hover:opacity-90 flex items-center gap-1.5 shrink-0 shadow-sm transition-all"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Create Reference Set</span>
        </button>
      </div>

      {/* Accuracy disclaimer banner */}
      <div className="flex items-start gap-2.5 p-3 rounded-lg bg-blue-500/5 dark:bg-blue-500/10 border border-blue-500/20 text-xs text-blue-900 dark:text-blue-200">
        <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
        <div className="leading-relaxed text-[11px]">
          <span className="font-semibold">Consistency Notice:</span> Generative consistency across multi-shot scenes depends on model architecture and reference weighting. The system structures multi-image latents and trigger keywords without claiming universal identity retention.
        </div>
      </div>

      {/* Sets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sets.map(set => {
          const Icon = getPurposeIcon(set.purpose);
          const isSelected = selectedSetId === set.id;
          return (
            <div
              key={set.id}
              onClick={() => onSelectReferenceSet?.(set)}
              className={`rounded-xl border p-4.5 flex flex-col justify-between cursor-pointer transition-all ${
                isSelected
                  ? 'border-purple-500 bg-purple-50/20 dark:bg-purple-950/10 ring-1 ring-purple-500'
                  : 'border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/40 hover:border-neutral-300 dark:hover:border-neutral-700'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-600 dark:text-neutral-400">
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 truncate">
                        {set.title}
                      </h3>
                      <span className="text-[10px] uppercase font-mono tracking-wider text-purple-600 dark:text-purple-400 font-medium">
                        {set.purpose} Reference
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={e => handleDeleteSet(set.id, e)}
                    className="p-1 rounded text-neutral-400 hover:text-red-500 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                    title="Delete Reference Set"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <p className="text-xs text-neutral-600 dark:text-neutral-300 line-clamp-2 leading-relaxed">
                  {set.description}
                </p>

                {/* Reference Images Carousel */}
                <div className="flex gap-2 overflow-x-auto py-1">
                  {set.images.map((img, idx) => (
                    <img
                      key={idx}
                      src={img}
                      alt={`${set.title} sample ${idx + 1}`}
                      className="w-16 h-16 rounded-md object-cover border border-neutral-200 dark:border-neutral-800 shrink-0"
                    />
                  ))}
                </div>

                {set.triggerKeyword && (
                  <div className="flex items-center gap-1.5 text-[11px] font-mono text-neutral-500 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-800/80 px-2 py-1 rounded">
                    <Tag className="w-3 h-3 text-purple-500" />
                    <span>Trigger: @{set.triggerKeyword}</span>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-neutral-100 dark:border-neutral-800/80 flex items-center justify-between text-xs">
                <span className="text-neutral-400 text-[11px]">{set.images.length} Reference Shots</span>
                <button
                  onClick={() => onSelectReferenceSet?.(set)}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium flex items-center gap-1 transition-colors ${
                    isSelected
                      ? 'bg-purple-600 text-white'
                      : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 hover:bg-neutral-200'
                  }`}
                >
                  {isSelected ? <Check className="w-3 h-3" /> : <Sparkles className="w-3 h-3" />}
                  <span>{isSelected ? 'Applied' : 'Use in Studio'}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Create Set Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-white dark:bg-[#12161f] border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-2xl overflow-hidden text-neutral-900 dark:text-neutral-100">
            <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-200 dark:border-neutral-800">
              <div className="flex items-center gap-2">
                <FolderPlus className="w-4 h-4 text-purple-600" />
                <h3 className="text-sm font-semibold">New Reference Set</h3>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 rounded text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSet} className="p-5 space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-medium text-neutral-700 dark:text-neutral-300">Set Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Kai Thorne (Lead Actor), Studio Glow Style..."
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-xs focus:ring-1 focus:ring-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="font-medium text-neutral-700 dark:text-neutral-300">Purpose</label>
                  <select
                    value={newPurpose}
                    onChange={e => setNewPurpose(e.target.value as any)}
                    className="w-full px-3 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-xs"
                  >
                    <option value="character">Character Reference</option>
                    <option value="product">Product Reference</option>
                    <option value="brand">Brand Reference</option>
                    <option value="style">Style / Lighting Reference</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="font-medium text-neutral-700 dark:text-neutral-300">Trigger Keyword</label>
                  <input
                    type="text"
                    placeholder="e.g. kai_lead"
                    value={newKeyword}
                    onChange={e => setNewKeyword(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-medium text-neutral-700 dark:text-neutral-300">Description & Visual Rules</label>
                <textarea
                  rows={2}
                  placeholder="Describe facial features, color tones, materials, framing angles..."
                  value={newDesc}
                  onChange={e => setNewDesc(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-xs focus:ring-1 focus:ring-purple-500"
                />
              </div>

              {/* Reference image URL inputs */}
              <div className="space-y-2">
                <label className="font-medium text-neutral-700 dark:text-neutral-300">Reference Images (URLs)</label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    placeholder="https://images.unsplash.com/..."
                    value={currentUrlInput}
                    onChange={e => setCurrentUrlInput(e.target.value)}
                    className="flex-1 px-3 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-xs"
                  />
                  <button
                    type="button"
                    onClick={handleAddImageUrl}
                    className="px-3 py-1.5 rounded-lg bg-neutral-200 dark:bg-neutral-800 hover:bg-neutral-300 dark:hover:bg-neutral-700 font-medium"
                  >
                    Add Image
                  </button>
                </div>

                {newImageUrls.length > 0 && (
                  <div className="flex gap-2 overflow-x-auto py-1">
                    {newImageUrls.map((url, i) => (
                      <div key={i} className="relative group w-14 h-14 shrink-0">
                        <img src={url} alt="Ref" className="w-full h-full rounded object-cover border" />
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(i)}
                          className="absolute -top-1 -right-1 bg-red-600 text-white rounded-full p-0.5"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-200 dark:border-neutral-800">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-lg border border-neutral-300 dark:border-neutral-700 text-xs font-medium hover:bg-neutral-100 dark:hover:bg-neutral-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-neutral-900 dark:bg-white text-white dark:text-neutral-950 text-xs font-medium hover:opacity-90"
                >
                  Save Reference Set
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
