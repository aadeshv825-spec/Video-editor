import React from 'react';
import {
  Scissors,
  Volume2,
  Type,
  Sparkles,
  Palette,
  Gauge,
  Move,
  Wand2,
  Plus,
  Trash2,
  Copy,
} from 'lucide-react';
import { MobileToolSheetType } from './MobileVideoToolSheet';

interface MobileVideoToolTrayProps {
  hasSelectedClip: boolean;
  onOpenSheet: (type: MobileToolSheetType) => void;
  onSplitAtPlayhead: () => void;
  onDeleteSelected: () => void;
  onDuplicateSelected: () => void;
  activeSheet: MobileToolSheetType | null;
}

export const MobileVideoToolTray: React.FC<MobileVideoToolTrayProps> = ({
  hasSelectedClip,
  onOpenSheet,
  onSplitAtPlayhead,
  onDeleteSelected,
  onDuplicateSelected,
  activeSheet,
}) => {
  const tools = [
    {
      id: 'split',
      label: 'Split',
      icon: Scissors,
      onClick: onSplitAtPlayhead,
      disabled: !hasSelectedClip,
      highlight: false,
    },
    {
      id: 'media',
      label: 'Add Media',
      icon: Plus,
      onClick: () => onOpenSheet('media'),
      disabled: false,
      highlight: true,
    },
    {
      id: 'audio',
      label: 'Audio',
      icon: Volume2,
      onClick: () => onOpenSheet('audio'),
      disabled: !hasSelectedClip,
      highlight: activeSheet === 'audio',
    },
    {
      id: 'text',
      label: 'Text',
      icon: Type,
      onClick: () => onOpenSheet('text'),
      disabled: false,
      highlight: activeSheet === 'text',
    },
    {
      id: 'effects',
      label: 'Effects',
      icon: Sparkles,
      onClick: () => onOpenSheet('vfx'),
      disabled: !hasSelectedClip,
      highlight: activeSheet === 'vfx',
    },
    {
      id: 'filters',
      label: 'Filters',
      icon: Palette,
      onClick: () => onOpenSheet('color'),
      disabled: !hasSelectedClip,
      highlight: activeSheet === 'color',
    },
    {
      id: 'speed',
      label: 'Speed',
      icon: Gauge,
      onClick: () => onOpenSheet('speed'),
      disabled: !hasSelectedClip,
      highlight: activeSheet === 'speed',
    },
    {
      id: 'crop',
      label: 'Transform',
      icon: Move,
      onClick: () => onOpenSheet('transform'),
      disabled: !hasSelectedClip,
      highlight: activeSheet === 'transform',
    },
    {
      id: 'ai',
      label: 'AI Magic',
      icon: Wand2,
      onClick: () => onOpenSheet('ai'),
      disabled: false,
      highlight: activeSheet === 'ai',
    },
    {
      id: 'duplicate',
      label: 'Duplicate',
      icon: Copy,
      onClick: onDuplicateSelected,
      disabled: !hasSelectedClip,
      highlight: false,
    },
    {
      id: 'delete',
      label: 'Delete',
      icon: Trash2,
      onClick: onDeleteSelected,
      disabled: !hasSelectedClip,
      highlight: false,
    },
  ];

  return (
    <div
      id="mobile-video-tool-tray"
      className="md:hidden border-t border-neutral-200 dark:border-neutral-800 bg-white dark:bg-studio-surface shrink-0 z-30"
    >
      <div className="flex items-center gap-1 px-3 py-2 overflow-x-auto no-scrollbar touch-pan-x">
        {tools.map(tool => {
          const Icon = tool.icon;
          return (
            <button
              key={tool.id}
              type="button"
              disabled={tool.disabled}
              onClick={tool.onClick}
              className={`flex flex-col items-center justify-center min-w-[56px] py-1 px-1.5 rounded-xl transition-all active:scale-95 disabled:opacity-30 disabled:pointer-events-none ${
                tool.highlight
                  ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-950 font-bold'
                  : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800/80'
              }`}
            >
              <Icon className="w-5 h-5 mb-1" />
              <span className="text-[10px] tracking-tight leading-none whitespace-nowrap">
                {tool.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
export default MobileVideoToolTray;
