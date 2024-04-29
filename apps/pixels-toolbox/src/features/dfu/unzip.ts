import * as FileSystem from "expo-file-system";

import factoryDfuFiles from "!/dfu/factory-dfu-files.zip";
import otherDfuFiles from "!/dfu/other-dfu-files.zip";
import Pathname from "~/features/files/Pathname";
import { loadFileFromModuleAsync } from "~/features/files/loadFileFromModuleAsync";
import { unzipFileAsync } from "~/features/files/unzipFileAsync";

export const cacheDirectory = FileSystem.cacheDirectory + "unzippedDfuFiles/";

export async function unzipDfuFilesAsync(
  localUri: string,
  opt?: { clearCache?: boolean }
): Promise<string[]> {
  // Delete cache directory
  const clearCache = !!opt?.clearCache;
  if (clearCache) {
    await FileSystem.deleteAsync(cacheDirectory, { idempotent: true });
  }
  if (clearCache || !(await FileSystem.getInfoAsync(cacheDirectory)).exists) {
    // (Re)Create cache directory
    await FileSystem.makeDirectoryAsync(cacheDirectory);
  }

  // Unzip in temp folder so we can list the unzipped files
  const tempDir = await Pathname.generateTempPathnameAsync("/");
  try {
    await unzipFileAsync(localUri, tempDir);

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

async function unzipDfuFilesFromAssetsAsync(
  moduleId: string,
  opt?: { clearCache?: boolean }
): Promise<string[]> {
  // Get file from module
  const info = await loadFileFromModuleAsync(
    moduleId,
    "unzipDfuFilesFromAssets"
  );

  // Unzip DFU files
  return await unzipDfuFilesAsync(info.uri, { clearCache: opt?.clearCache });
}

export async function unzipEmbeddedDfuFilesAsync(): Promise<{
  factory: string[];
  others: string[];
}> {
  // Clear existing files
  const others = await unzipDfuFilesFromAssetsAsync(otherDfuFiles, {
    clearCache: true,
  });
  // Factory files last so we're sure that its content isn't overwritten
  const factory = await unzipDfuFilesFromAssetsAsync(factoryDfuFiles);
  return { factory, others };
}
