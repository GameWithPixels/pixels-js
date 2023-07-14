import { Asset } from "expo-asset";
import * as FileSystem from "expo-file-system";

import factoryDfuFiles from "!/dfu/factory-dfu-files.zip";
import otherDfuFiles from "!/dfu/other-dfu-files.zip";
import Pathname from "~/features/files/Pathname";
import { unzipAssetAsync } from "~/features/files/unzipAssetAsync";

export const cacheDirectory = FileSystem.cacheDirectory + "unzippedDfuFiles/";

export async function unzipDfuFiles(
  asset: Asset,
  opt?: { clearCache?: boolean }
): Promise<string[]> {
  // Delete cache directory
  if (opt?.clearCache) {
    await FileSystem.deleteAsync(cacheDirectory, { idempotent: true });
  }
  if (
    opt?.clearCache ||
    !(await FileSystem.getInfoAsync(cacheDirectory)).exists
  ) {
    // (Re)Create cache directory
    await FileSystem.makeDirectoryAsync(cacheDirectory);
  }

  // Unzip in temp folder so we can list the unzipped files
  const tempDir = await Pathname.generateTempPathnameAsync("/");
  try {
    await unzipAssetAsync(asset, tempDir);

    // Get files pathnames and move them to final directory
    const files = await FileSystem.readDirectoryAsync(tempDir);
    const dstFiles: string[] = [];
    for (const filename of files) {
      if (filename.endsWith(".zip")) {
        const from = tempDir + filename;
        const to = cacheDirectory + filename;
        await FileSystem.moveAsync({ from, to });
        dstFiles.push(to);
      }
    }
    return dstFiles;
  } finally {
    await FileSystem.deleteAsync(tempDir, { idempotent: true });
  }
}

export async function unzipDfuFilesFromAssets(
  moduleId: string,
  opt?: { clearCache?: boolean }
): Promise<string[]> {
  // Load assets for our zip files
  const assets = await Asset.loadAsync(moduleId);
  if (!assets.length) {
    console.warn(
      `unzipDfuFilesFromAssets: No asset loaded from module id ${moduleId} `
    );
  }

  // Unzip DFU files
  const pathnames: string[] = [];
  const clearCache = opt?.clearCache;
  for (const asset of assets) {
    const files = await unzipDfuFiles(asset, { clearCache });
    // Update files list
    files.forEach((f) => {
      if (pathnames.indexOf(f) < 0) {
        pathnames.push(f);
      }
    });
  }
  return pathnames;
}

export async function unzipEmbeddedDfuFiles(): Promise<{
  factory: string[];
  others: string[];
}> {
  // Factory files last so we're sure that its content isn't overwritten
  const others = await unzipDfuFilesFromAssets(otherDfuFiles, {
    clearCache: true,
  });
  const factory = await unzipDfuFilesFromAssets(factoryDfuFiles);
  return { factory, others };
}
