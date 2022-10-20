import { Asset } from "expo-asset";
import { useState, useEffect } from "react";
import { useErrorHandler } from "react-error-boundary";

import getDfuFileInfo, { DfuFileInfo } from "./getDfuFileInfo";
import unzipDfuFiles from "./unzipDfuFiles";

export default function (dfuFilesModuleId: string): [string, string] {
  const errorHandler = useErrorHandler();
  const [dfuFiles, setDfuFiles] = useState<[string, string]>(["", ""]);

  useEffect(() => {
    const getFiles = async () => {
      // Load asset with our zip of firmware files
      const assets = await Asset.loadAsync(dfuFilesModuleId);
      if (!assets.length) {
        throw new Error("Got no asset for firmware file(s)");
      }

      // Unzip firmware files
      const files = await unzipDfuFiles(assets[0]);

      // Get bootloader and firmware files
      const findIndex = (type: DfuFileInfo["type"]) => {
        const index = files.findIndex((f) => getDfuFileInfo(f).type === type);
        if (index < 0) {
          throw new Error(`Missing DFU file of type ${type}`);
        }
        return index;
      };
      setDfuFiles([
        files[findIndex("bootloader")],
        files[findIndex("firmware")],
      ]);
    };
    getFiles().catch(errorHandler);
  }, [dfuFilesModuleId, errorHandler]);

  return dfuFiles;
}
