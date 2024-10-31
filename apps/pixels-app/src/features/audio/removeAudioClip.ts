import * as FileSystem from "expo-file-system";

import { getAudioClipPathname } from "./path";

import { AppStore } from "~/app/store";
import { LibraryAssets } from "~/features/store";
import { logError } from "~/features/utils";

export async function removeAudioClip(
  audioClipUuid: string,
  store: AppStore
): Promise<void> {
  const pathname = getAudioClipPathname(audioClipUuid);
  if (pathname) {
    try {
      store.dispatch(LibraryAssets.AudioClips.remove(audioClipUuid));
      await FileSystem.deleteAsync(pathname, { idempotent: true });
    } catch (e) {
      logError(`Error removing audio clip ${audioClipUuid}: ${e}`);
    }
  }
}
