import React from "react";

import { useAppSelector } from "~/app/hooks";
import { FileAsset } from "~/features/store/libraryAssets";

export function useAudioClipsList(): FileAsset[] {
  const audioClips = useAppSelector((state) => state.libraryAssets.audioClips);
  return React.useMemo(
    () => Object.values(audioClips.entities) as FileAsset[],
    [audioClips]
  );
}
