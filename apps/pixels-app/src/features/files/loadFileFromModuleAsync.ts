import { Asset } from "expo-asset";
import * as FileSystem from "expo-file-system";
import { FileInfo } from "expo-file-system";

export async function loadFileFromModuleAsync(
  moduleId: number | string,
  errorTag?: string
): Promise<FileInfo> {
  const tag = errorTag ?? "loadFileFromModuleAsync";
  const asset = (await Asset.loadAsync(moduleId))[0];
  if (!asset) {
    throw new Error(`${tag}: No asset loaded for module ${moduleId}`);
  }
  if (!asset.localUri?.length) {
    throw new Error(`${tag}: Got non local asset named ${asset.name}`);
  }
  const info = await FileSystem.getInfoAsync(asset.localUri);
  if (!info.exists) {
    throw new Error(`${tag}: Asset ${asset.name} doesn't exist in file system`);
  }
  if (info.isDirectory) {
    throw new Error(`${tag}: Asset ${asset.name} is a directory`);
  }
  return info;
}
