import React, { useState } from 'react';
import { X, History, Plus, RotateCcw, BookmarkCheck, Clock, Layers } from 'lucide-react';
import { useProjects } from '../../context/ProjectContext';

interface ProjectVersionsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProjectVersionsModal: React.FC<ProjectVersionsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { activeProject, createVersionSnapshot, restoreVersionSnapshot } = useProjects();
  const [newTitle, setNewTitle] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);

  if (!isOpen || !activeProject) return null;

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createVersionSnapshot(newTitle, newNotes);
    setNewTitle('');
    setNewNotes('');
    setShowCreateForm(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-xs">
      <div 
        id="project-versions-modal"
        className="w-full max-w-lg bg-white dark:bg-studio-surface border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 sm:p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-3">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-neutral-500" />
            <h2 className="font-semibold text-base text-neutral-900 dark:text-neutral-100">
              Project Versions & Snapshots
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center justify-between text-xs">
          <span className="text-neutral-500 font-mono">
            {activeProject.versions.length} Version Checkpoint{activeProject.versions.length === 1 ? '' : 's'}
          </span>
          {!showCreateForm && (
            <button
              onClick={() => setShowCreateForm(true)}
              className="flex items-center gap-1.5 px-2.5 py-1 bg-neutral-900 dark:bg-white text-white dark:text-neutral-950 font-medium rounded-lg hover:opacity-90"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Snapshot Current State</span>
            </button>
          )}
        </div>

        {/* Create new version form */}
        {showCreateForm && (
          <form onSubmit={handleCreate} className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/60 space-y-3 text-xs">
            <div className="font-semibold text-neutral-900 dark:text-neutral-100">
              New Version Checkpoint
            </div>
            <div>
              <label className="block text-neutral-500 mb-1">Version Title</label>
              <input
                type="text"
                required
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                placeholder="e.g. Color Grade Approved / Cut 2"
                className="w-full px-3 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-studio-surface text-neutral-900 dark:text-neutral-100"
              />
            </div>
            <div>
              <label className="block text-neutral-500 mb-1">Commit Notes (Non-destructive)</label>
              <textarea
                rows={2}
                value={newNotes}
                onChange={e => setNewNotes(e.target.value)}
                placeholder="Details of adjustments made..."
                className="w-full px-3 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-studio-surface text-neutral-900 dark:text-neutral-100 resize-none font-mono"
              />
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="px-3 py-1 rounded border border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-3 py-1 bg-neutral-900 dark:bg-white text-white dark:text-neutral-950 font-medium rounded hover:opacity-90"
              >
                Save Snapshot
              </button>
            </div>
          </form>
        )}

        {/* Versions List */}
        <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
          {activeProject.versions.map((ver, idx) => (
            <div
              key={ver.id}
              className="p-3.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-studio-surface flex items-center justify-between text-xs"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-neutral-900 dark:text-neutral-100">
                    v{ver.versionNumber}.0
                  </span>
                  <span className="font-medium text-neutral-800 dark:text-neutral-200">
                    {ver.title}
                  </span>
                  {idx === 0 && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-mono">
                      Current
                    </span>
                  )}
                </div>
                <p className="text-neutral-500 text-[11px] leading-relaxed">
                  {ver.notes}
                </p>
                <div className="text-[10px] text-neutral-400 font-mono">
                  Created {new Date(ver.createdAt).toLocaleString()} • {ver.actionCount} actions recorded
                </div>
              </div>

              {idx !== 0 && (
                <button
                  onClick={() => {
                    restoreVersionSnapshot(ver.id);
                    onClose();
                  }}
                  className="ml-3 px-2.5 py-1 rounded border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 flex items-center gap-1 font-medium shrink-0"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Restore</span>
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
