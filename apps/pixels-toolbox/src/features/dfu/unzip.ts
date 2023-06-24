import { Asset } from "expo-asset";
import * as FileSystem from "expo-file-system";
import { unzip } from "react-native-zip-archive";

import factoryDfuFiles from "!/dfu/factory-dfu-files.zip";
import otherDfuFiles from "!/dfu/other-dfu-files.zip";

export const cacheDirectory = FileSystem.cacheDirectory + "unzippedDfuFiles/";

export async function unzipDfuFiles(
  asset: Asset,
  opt?: { clearCache?: boolean }
): Promise<string[]> {
  if (!asset.localUri?.length) {
    throw new Error(
      `unzipDfuFiles: Can't unzip non local asset named ${asset.name}`
    );
  }
  const info = await FileSystem.getInfoAsync(asset.localUri);
  if (!info.exists) {
    throw new Error(
      `unzipDfuFiles: Asset ${asset.name} doesn't exist in file system`
    );
  }
  if (info.isDirectory) {
    throw new Error(`unzipDfuFiles: Asset ${asset.name} is a directory`);
  }

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

  // Unzip all assets in a temp folder so we can list the files
  const tempDir = cacheDirectory + "Temp";
  await FileSystem.deleteAsync(tempDir, { idempotent: true });
  const toPath = (uri: string) =>
    uri.startsWith("file:///") ? uri.substring("file://".length) : uri;
  await unzip(toPath(asset.localUri), toPath(tempDir));

  // Get files pathnames and move them to final directory
  const files = await FileSystem.readDirectoryAsync(tempDir);
  const dstFiles: string[] = [];
  for (const filename of files) {
    if (filename.endsWith(".zip")) {
      const from = tempDir + "/" + filename;
      const to = cacheDirectory + "/" + filename;
      await FileSystem.moveAsync({ from, to });
      dstFiles.push(to);
    }
  }
  return dstFiles;
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
