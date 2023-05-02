import { StorageAccessFramework } from "expo-file-system";

export default async function (fileName: string): Promise<string> {
  const permissions =
    await StorageAccessFramework.requestDirectoryPermissionsAsync();
  if (!permissions.granted) {
    throw new Error("App doesn't have RequestDirectory permission");
  }
  return await StorageAccessFramework.createFileAsync(
    permissions.directoryUri,
    fileName,
    "application/csv"
  );
}
