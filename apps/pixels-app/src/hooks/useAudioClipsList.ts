import React from "react";

import { useAppSelector } from "~/app/hooks";
import { AudioClipAsset } from "~/features/store/libraryAssets";

export function useAudioClipsList(): AudioClipAsset[] {
  const audioClips = useAppSelector((state) => state.libraryAssets.audioClips);
  return React.useMemo(
    () => Object.values(audioClips.entities) as AudioClipAsset[],
    [audioClips]
  );
}
