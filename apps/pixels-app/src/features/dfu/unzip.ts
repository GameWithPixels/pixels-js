import * as FileSystem from "expo-file-system";

import dfuFiles from "#/dfu-files.zip";
import Pathname from "~/features/files/Pathname";
import { loadFileFromModuleAsync } from "~/features/files/loadFileFromModuleAsync";
import { unzipFileAsync } from "~/features/files/unzipFileAsync";

export const cacheDirectory = FileSystem.cacheDirectory + "unzippedDfuFiles/";

export async function unzipDfuFilesAsync(
  localUri: string,
  opt?: { clearCache?: boolean }
): Promise<string[]> {
  // Delete cache directory
  if (opt?.clearCache) {
    await FileSystem.deleteAsync(cacheDirectory, { idempotent: true });
  }
  if (
    !!opt?.clearCache ||
    !(await FileSystem.getInfoAsync(cacheDirectory)).exists
  ) {
    // (Re)Create cache directory
    await FileSystem.makeDirectoryAsync(cacheDirectory);
  }

  // Unzip in temp folder so we can list the unzipped files
  const tempDir = await Pathname.generateTempPathnameAsync({ postfix: "/" });
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
  return await unzipDfuFilesAsync(info.uri, opt);
}

export async function unzipEmbeddedDfuFilesAsync(): Promise<string[]> {
  // Clear existing files
  return await unzipDfuFilesFromAssetsAsync(dfuFiles, {
    clearCache: true,
  });
}
