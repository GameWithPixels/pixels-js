import * as FileSystem from "expo-file-system";

import { FileAsset } from "~/features/store/libraryAssets";

export function getAssetDirectory(type: "audio" | "image"): string | undefined {
  const dir = FileSystem.documentDirectory;
  return dir
    ? `${dir}${type === "audio" ? "audioClips" : "images"}/`
    : undefined;
}

export function getAssetPathname(
  asset: FileAsset,
  type: "audio" | "image"
): string | undefined {
  const dir = getAssetDirectory(type);
  return dir ? dir + asset.uuid + "." + asset.type : undefined;
}
