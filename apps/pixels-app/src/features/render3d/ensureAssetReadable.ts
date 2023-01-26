import { Asset } from "expo-asset";
import * as FileSystem from "expo-file-system";
// eslint-disable-next-line import/namespace
import { Platform } from "react-native";

/**
 * This function returns on asset for the given virtual asset module.
 * For Android standalone, it will copy the contents of the asset to the cache
 * directory so ExpoTHREE.loadAsync() may read it successfully.
 *
 * See this expo issue https://github.com/expo/expo/issues/2693.
 * @remarks Inspired by https://github.com/expo/expo-three/issues/104#issuecomment-498989294
 *
 * @param virtualAssetModule The value of require('path/to/file') for the asset or
 *                           external network URL.
 * @param assetFilename The pathname for the local file that may be created in the cache directory
 *                      to copy the contents of the module.
 * @returns An asset always readable by ExpoTHREE.loadAsync()
 */
export default async function (
  virtualAssetModule: string | number,
  assetFilename: string
): Promise<Asset> {
  if (!assetFilename) {
    // Even though a name is necessary only on Android standalone, we make sure it's always there
    // so Android builds don't mysteriously fail
    throw new Error("ensureAssetReadable(): Empty asset filename");
  }
  const asset = Asset.fromModule(virtualAssetModule);
  // Check if we are running on Android and if the asset as a scheme
  if (
    Platform.OS !== "android" ||
    !asset.localUri ||
    asset.localUri.includes("://")
  ) {
    // Nothing special to do
    return asset;
  } else {
    // Have issues with sub-directories in cache on device (it works on simulator)
    // (file couldn't be opened despite being copied successfully)
    assetFilename = assetFilename.split("/").join("_");
    // Copy file to cache directory so ExpoTHREE.loadAsync() can read it
    const localUri = `${FileSystem.cacheDirectory}copiedFromResource_${assetFilename}`;
    const fileInfo = await FileSystem.getInfoAsync(localUri, { size: false });
    if (!fileInfo.exists) {
      if (!asset.localUri) {
        await asset.downloadAsync();
      }
      if (!asset.localUri) {
        throw new Error("Can't copy file to cache because it has no local URI");
      }
      await FileSystem.copyAsync({
        from: asset.localUri,
        to: localUri,
      });
    }
    // Return asset for the copied file
    const copiedAsset = Asset.fromURI(localUri);
    copiedAsset.localUri = localUri;
    return copiedAsset;
  }
}
