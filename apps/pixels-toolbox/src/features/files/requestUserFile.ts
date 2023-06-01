import { assert } from "@systemic-games/pixels-core-utils";
import { StorageAccessFramework } from "expo-file-system";

import Pathname from "./Pathname";

export default async function (pathname: string): Promise<string> {
  assert(pathname.length > 0, "requestUserFile: empty filename");
  const extension = Pathname.getExtension(pathname) ?? "txt";
  const permissions =
    await StorageAccessFramework.requestDirectoryPermissionsAsync();
  if (!permissions.granted) {
    throw new Error("App doesn't have RequestDirectory permission");
  }
  return await StorageAccessFramework.createFileAsync(
    permissions.directoryUri,
    pathname,
    `application/${extension}`
  );
}
