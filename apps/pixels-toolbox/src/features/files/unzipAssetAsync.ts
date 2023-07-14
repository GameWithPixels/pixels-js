import { Asset } from "expo-asset";
import * as FileSystem from "expo-file-system";
import { unzip } from "react-native-zip-archive";

import Pathname from "./Pathname";

export async function unzipAssetAsync(
  asset: Asset,
  outDirectory: string
): Promise<void> {
  if (!asset.localUri?.length) {
    throw new Error(
      `unzipAsync: Can't unzip non local asset named ${asset.name}`
    );
  }
  const info = await FileSystem.getInfoAsync(asset.localUri);
  if (!info.exists) {
    throw new Error(
      `unzipAsync: Asset ${asset.name} doesn't exist in file system`
    );
  }
  if (info.isDirectory) {
    throw new Error(`unzipAsync: Asset ${asset.name} is a directory`);
  }

  // Copy zip in a temp directory so we don't have any issue unzipping it
  // (we're getting an access error on iOS when trying to unzip the original file)
  const tempZip = await Pathname.generateTempPathnameAsync(".zip");
  try {
    await FileSystem.copyAsync({ from: asset.localUri, to: tempZip });

    // Unzip all assets in output folder
    const toPath = (uri: string) =>
      uri.startsWith("file:///") ? uri.substring("file://".length) : uri;
    await unzip(toPath(tempZip), toPath(outDirectory));
  } finally {
    // Delete temporary file
    await FileSystem.deleteAsync(tempZip, { idempotent: true });
  }
}
