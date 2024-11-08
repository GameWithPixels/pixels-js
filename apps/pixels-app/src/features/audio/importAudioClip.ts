import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";

import { getAudioClipsDirectory } from "./path";

import { AppStore } from "~/app/store";
import { LibraryAssets } from "~/features/store";
import { generateUuid, logError } from "~/features/utils";

export async function importAudioClip(store: AppStore): Promise<void> {
  const audioDir = getAudioClipsDirectory();
  if (!audioDir) {
    logError("Failed to import audio clip: audio clips directory not valid");
    return;
  }
  try {
    const files = await DocumentPicker.getDocumentAsync({
      type: "audio/*",
      copyToCacheDirectory: true,
      multiple: true,
    });

    for (const file of files.assets ?? []) {
      let uuid = generateUuid();
      while (store.getState().libraryAssets.audioClips.entities[uuid]) {
        uuid = generateUuid();
      }
      const lastDot = file.name.lastIndexOf(".");
      const type = lastDot >= 0 ? file.name.slice(lastDot + 1) : "";
      const name = lastDot >= 0 ? file.name.slice(0, lastDot) : file.name;
      const pathname = audioDir + uuid + "." + type;
      if ((await FileSystem.getInfoAsync(audioDir)).exists) {
        await FileSystem.deleteAsync(pathname, { idempotent: true });
      } else {
        await FileSystem.makeDirectoryAsync(audioDir);
      }
      await FileSystem.moveAsync({
        from: file.uri,
        to: pathname,
      });
      store.dispatch(LibraryAssets.AudioClips.add({ uuid, name, type }));
    }
  } catch (e: any) {
    logError(`Failed to import audio clip: ${e}`);
  }
}
