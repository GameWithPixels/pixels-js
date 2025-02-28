import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";

import { getAssetDirectory } from "./path";
import { FileAsset, generateAssetUuid } from "../store/libraryAssets";
import { getNameAndExtension } from "../utils/path";

import { AppStore } from "~/app/store";
import { LibraryAssets } from "~/features/store";
import { logError } from "~/features/utils";

export async function importFileAsset(
  store: AppStore,
  type: "audio" | "image",
  opt?: {
    multiple: boolean;
  }
): Promise<FileAsset[]> {
  const assetDir = getAssetDirectory(type);
  if (!assetDir) {
    logError(`Failed to import asset of type ${type}: directory not valid`);
    return [];
  }
  const assets: FileAsset[] = [];
  try {
    const files = await DocumentPicker.getDocumentAsync({
      type: type + "/*",
      copyToCacheDirectory: true,
      multiple: opt?.multiple,
    });

    for (const file of files.assets ?? []) {
      const uuid = generateAssetUuid(store.getState().libraryAssets);
      const { name, extension: type } = getNameAndExtension(file.name);
      const pathname = assetDir + uuid + "." + type;
      if ((await FileSystem.getInfoAsync(assetDir)).exists) {
        await FileSystem.deleteAsync(pathname, { idempotent: true });
      } else {
        await FileSystem.makeDirectoryAsync(assetDir);
      }
      await FileSystem.moveAsync({
        from: file.uri,
        to: pathname,
      });
      const add =
        type === "audio"
          ? LibraryAssets.AudioClips.add
          : LibraryAssets.Images.add;
      const asset = { uuid, name, type } as const;
      store.dispatch(add(asset));
      assets.push(asset);
    }
  } catch (e: any) {
    logError(`Failed to import asset of type ${type}: ${e}`);
  }
  return assets;
}
