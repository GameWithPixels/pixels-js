import React from "react";

import DfuFilesBundle from "../dfu/DfuFilesBundle";
import { DfuFileInfo } from "../dfu/getDfuFileInfo";
import { unzipFactoryDfuFilesAsync } from "../dfu/unzip";
import { toLocaleDateTimeString } from "../toLocaleDateTimeString";

import { useAppSelector } from "~/app/hooks";

export interface FactoryDfuBundleFiles {
  readonly bootloader: DfuFileInfo;
  readonly firmware: DfuFileInfo;
  readonly date: Date;
}

export function useFactoryDfuFilesBundle(): [
  FactoryDfuBundleFiles | undefined,
  Error | undefined
] {
  const useSelectedFirmware = useAppSelector(
    (state) => state.validationSettings.useSelectedFirmware
  );
  const dfuBundles = useAppSelector((state) => state.dfuBundles);
  const [dfuBundle, setDfuBundle] = React.useState<FactoryDfuBundleFiles>();
  const [error, setError] = React.useState<Error>();
  React.useEffect(() => {
    const task = async () => {
      setError(undefined);
      const getFiles = () => {
        if (!dfuBundles.available[dfuBundles.selected]) {
          throw new Error("No DFU files bundle selected");
        }
        return dfuBundles.available[dfuBundles.selected];
      };
      // Get the DFU files bundles from the zip file
      const dfuBundle = DfuFilesBundle.create(
        useSelectedFirmware
          ? getFiles()
          : { pathnames: await unzipFactoryDfuFilesAsync() }
      );
      if (!dfuBundle.bootloader) {
        throw new Error(
          "Validation DFU bootloader file not found or problematic"
        );
      }
      if (!dfuBundle.firmware) {
        throw new Error(
          "Validation DFU firmware file not found or problematic"
        );
      }
      console.log(
        "Validation DFU files loaded, firmware/bootloader build date is",
        toLocaleDateTimeString(dfuBundle.date)
      );
      setDfuBundle({
        bootloader: dfuBundle.bootloader,
        firmware: dfuBundle.firmware,
        date: dfuBundle.date,
      });
    };
    task().catch(setError);
  }, [dfuBundles, useSelectedFirmware]);

  return [dfuBundle, error];
}
