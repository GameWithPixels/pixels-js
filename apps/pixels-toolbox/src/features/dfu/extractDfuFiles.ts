import { Asset } from "expo-asset";

import getDfuFileInfo, { DfuFileInfo } from "./getDfuFileInfo";
import unzipDfuFiles from "./unzipDfuFiles";

export default async function (
  dfuFilesModuleId: string
): Promise<[string, string]> {
  // Load asset with our zip of firmware files
  const assets = await Asset.loadAsync(dfuFilesModuleId);
  if (!assets.length) {
    throw new Error("Got no asset for DFU files archive");
  }

  // Unzip firmware files
  const files = await unzipDfuFiles(assets[0]);

  // Get bootloader and firmware files
  const findFileType = (type: DfuFileInfo["type"]) =>
    files.find((f) => getDfuFileInfo(f).type === type);

  const bootloader = findFileType("bootloader");
  const firmware = findFileType("firmware");
  if (!bootloader || !firmware) {
    throw new Error("Missing DFU files");
  }

  return [bootloader, firmware];
}
