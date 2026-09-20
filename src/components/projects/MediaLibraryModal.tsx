import React, { useState, useRef } from 'react';
import { X, Upload, Video, Music, Image as ImageIcon, Trash2, HardDrive, Check } from 'lucide-react';
import { useProjects } from '../../context/ProjectContext';

interface MediaLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MediaLibraryModal: React.FC<MediaLibraryModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { activeProject, addMediaToProject, removeMediaFromProject } = useProjects();
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen || !activeProject) return null;

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    Array.from(files).forEach(file => {
      let type: 'video' | 'audio' | 'image' = 'image';
      if (file.type.startsWith('video/')) type = 'video';
      else if (file.type.startsWith('audio/')) type = 'audio';

      addMediaToProject({
        name: file.name,
        type,
        sizeBytes: file.size,
        durationSec: type === 'video' ? 12.0 : type === 'audio' ? 45.0 : undefined,
        dimensions: type === 'video' ? '1920x1080' : type === 'image' ? '3840x2160' : undefined,
        url: '',
      });
    });
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => {
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-xs">
      <div 
        id="media-library-modal-card"
        className="w-full max-w-xl bg-white dark:bg-studio-surface border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 sm:p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-3">
          <div className="flex items-center gap-2">
            <HardDrive className="w-4 h-4 text-neutral-500" />
            <h2 className="font-semibold text-base text-neutral-900 dark:text-neutral-100">
              Project Media Library
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Drag & Drop or Click to Upload Area (supporting both drag and drop and click upload!) */}
        <div
          id="media-dropzone"
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
            isDragging
              ? 'border-neutral-900 dark:border-white bg-neutral-50 dark:bg-neutral-800/40'
              : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-400 dark:hover:border-neutral-600 bg-neutral-50/50 dark:bg-neutral-900/30'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="video/*,audio/*,image/*"
            className="hidden"
            onChange={e => handleFiles(e.target.files)}
          />
          <Upload className="w-8 h-8 mx-auto text-neutral-400 mb-2" />
          <p className="text-xs font-medium text-neutral-900 dark:text-neutral-100">
            Click to select or drag and drop media files
          </p>
          <p className="text-[11px] text-neutral-400 mt-0.5">
            Supports MP4, MOV, ProRes, WAV, MP3, PNG, JPG, EXR up to 4K
          </p>
        </div>

        {/* Media Assets List */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-neutral-400 font-mono">
            <span>IMPORTED ASSETS ({activeProject.mediaAssets.length})</span>
            <span>NON-DESTRUCTIVE POINTERS</span>
          </div>

          <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
            {activeProject.mediaAssets.length === 0 ? (
              <div className="p-6 text-center text-xs text-neutral-400">
                No media assets attached to this project.
              </div>
            ) : (
              activeProject.mediaAssets.map(asset => {
                const Icon =
                  asset.type === 'video' ? Video : asset.type === 'audio' ? Music : ImageIcon;
                return (
                  <div
                    key={asset.id}
                    className="p-3 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/40 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-3 truncate">
                      <div className="w-8 h-8 rounded-lg bg-neutral-200 dark:bg-neutral-800 flex items-center justify-center text-neutral-700 dark:text-neutral-300 shrink-0">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="truncate">
                        <div className="font-medium text-neutral-900 dark:text-neutral-100 truncate">
                          {asset.name}
                        </div>
                        <div className="text-[10px] text-neutral-400 font-mono">
                          {formatBytes(asset.sizeBytes)}
                          {asset.dimensions ? ` • ${asset.dimensions}` : ''}
                          {asset.durationSec ? ` • ${asset.durationSec}s` : ''}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => removeMediaFromProject(asset.id)}
                      className="p-1 text-neutral-400 hover:text-red-500 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors ml-2"
                      title="Remove asset pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-neutral-900 dark:bg-white text-white dark:text-neutral-950 font-medium rounded-lg text-xs"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
