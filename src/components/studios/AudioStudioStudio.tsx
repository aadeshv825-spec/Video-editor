import React from 'react';
import { AudioEditorCore } from './audio/AudioEditorCore';

interface AudioStudioStudioProps {
  onBack: () => void;
  onOpenVersions: () => void;
  onOpenMedia: () => void;
  onOpenExport: () => void;
  onOpenModelRouter: () => void;
}

export const AudioStudioStudio: React.FC<AudioStudioStudioProps> = ({
  onBack,
  onOpenVersions,
  onOpenMedia,
  onOpenExport,
  onOpenModelRouter,
}) => {
  return (
    <AudioEditorCore
      onBack={onBack}
      onOpenVersions={onOpenVersions}
      onOpenMedia={onOpenMedia}
      onOpenExport={onOpenExport}
      onOpenModelRouter={onOpenModelRouter}
    />
  );
};
