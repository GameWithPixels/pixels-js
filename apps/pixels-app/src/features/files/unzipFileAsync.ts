import * as FileSystem from "expo-file-system";
import { unzip } from "react-native-zip-archive";

import Pathname from "./Pathname";

export async function unzipFileAsync(
  localUri: string,
  outDirectory: string
): Promise<void> {
  // Copy zip in a temp directory so we don't have any issue unzipping it
  // (we're getting an access error on iOS when trying to unzip the original file)
  const tempZip = await Pathname.generateTempPathnameAsync({ postfix: ".zip" });
  try {
    await FileSystem.copyAsync({ from: localUri, to: tempZip });

    // Unzip all assets in output folder
    const toPath = (uri: string) =>
      uri.startsWith("file:///") ? uri.substring("file://".length) : uri;
    await unzip(toPath(tempZip), toPath(outDirectory));
  } finally {
    // Delete temporary file
    await FileSystem.deleteAsync(tempZip, { idempotent: true });
  }
}
