import { Asset } from "expo-asset";
import * as FileSystem from "expo-file-system";
import { unzip } from "react-native-zip-archive";

const firmwarePath = FileSystem.cacheDirectory + "firmware/";

export async function unzipDfuFiles(
  asset: Asset,
  opt?: { clearCache?: boolean }
): Promise<void> {
  // Delete cache directory
  if (opt?.clearCache) {
    await FileSystem.deleteAsync(firmwarePath, { idempotent: true });
  }

  // Unzip all assets
  if (asset.localUri) {
    await unzip(asset.localUri, firmwarePath);
  } else {
    console.warn(
      `unzipDfuFiles: Can't unzip non local asset named ${asset.name}`
    );
  }
}

export async function unzipDfuFilesFromAssets(
  dfuZipModuleIdOrIds: string | string[],
  opt?: { clearCache?: boolean }
): Promise<void> {
  const moduleIds = Array.isArray(dfuZipModuleIdOrIds)
    ? dfuZipModuleIdOrIds
    : [dfuZipModuleIdOrIds];

  // Load assets for our zip files
  let clearCache = opt?.clearCache;
  for (const id of moduleIds) {
    const assets = await Asset.loadAsync(id);
    if (!assets.length) {
      console.warn(`extractDfuFiles: No asset loaded from module id ${id} `);
    }
    // Unzip DFU files
    for (const asset of assets) {
      await unzipDfuFiles(asset, { clearCache });
      clearCache = false; // Clear cache once
    }
  }
}

export async function listUnzippedDfuFiles(): Promise<string[]> {
  // Get files list
  const files = await FileSystem.readDirectoryAsync(firmwarePath);
  return files.map((f) => firmwarePath + f);
}
