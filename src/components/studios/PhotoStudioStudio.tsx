import React from 'react';
import { PhotoEditorCore } from './photo/PhotoEditorCore';

interface PhotoStudioStudioProps {
  onBack: () => void;
  onOpenVersions: () => void;
  onOpenMedia: () => void;
  onOpenExport: () => void;
  onOpenModelRouter: () => void;
}

export const PhotoStudioStudio: React.FC<PhotoStudioStudioProps> = ({
  onBack,
  onOpenVersions,
  onOpenMedia,
  onOpenExport,
  onOpenModelRouter,
}) => {
  return (
    <PhotoEditorCore
      onBack={onBack}
      onOpenVersions={onOpenVersions}
      onOpenMedia={onOpenMedia}
      onOpenExport={onOpenExport}
      onOpenModelRouter={onOpenModelRouter}
    />
  );
};
