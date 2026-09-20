import React from 'react';
import { VideoEditorCore } from './video/VideoEditorCore';

interface VideoEditorStudioProps {
  onBack: () => void;
  onOpenVersions: () => void;
  onOpenMedia: () => void;
  onOpenExport: () => void;
  onOpenModelRouter: () => void;
}

export const VideoEditorStudio: React.FC<VideoEditorStudioProps> = ({
  onBack,
  onOpenVersions,
  onOpenMedia,
  onOpenExport,
  onOpenModelRouter,
}) => {
  return (
    <VideoEditorCore
      onBack={onBack}
      onOpenVersions={onOpenVersions}
      onOpenMedia={onOpenMedia}
      onOpenExport={onOpenExport}
      onOpenModelRouter={onOpenModelRouter}
    />
  );
};

