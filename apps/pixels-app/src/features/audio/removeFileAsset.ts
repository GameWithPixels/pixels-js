import * as FileSystem from "expo-file-system";

import { getAssetPathname } from "./path";

import { AppStore } from "~/app/store";
import { LibraryAssets } from "~/features/store";
import { logError } from "~/features/utils";

export async function removeFileAsset(
  store: AppStore,
  assetUuid: string,
  type: "audio" | "image"
): Promise<void> {
  const { audioClips, images } = store.getState().libraryAssets;
  const asset = (type === "audio" ? audioClips : images).entities[assetUuid];
  const pathname = asset && getAssetPathname(asset, type);
  if (pathname) {
    try {
      const remove =
        type === "audio"
          ? LibraryAssets.AudioClips.remove
          : LibraryAssets.Images.remove;
      store.dispatch(remove(assetUuid));
      await FileSystem.deleteAsync(pathname, { idempotent: true });
    } catch (e) {
      logError(`Error deleting asset file ${assetUuid} of type ${type}: ${e}`);
    }
  }
}
