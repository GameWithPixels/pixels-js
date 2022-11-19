import { Asset } from "expo-asset";
import * as FileSystem from "expo-file-system";
import { unzip } from "react-native-zip-archive";

const firmwarePath = FileSystem.cacheDirectory + "firmware/";

export default async function (asset: Asset): Promise<string[]> {
  if (!asset.localUri?.length) {
    throw new Error(`Can't unzip non local asset named ${asset.name}`);
  }
  await FileSystem.deleteAsync(firmwarePath, { idempotent: true });
  await unzip(asset.localUri, firmwarePath);
  const files = await FileSystem.readDirectoryAsync(firmwarePath);
  return files.map((f) => firmwarePath + f);
}
