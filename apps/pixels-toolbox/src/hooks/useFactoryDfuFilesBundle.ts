import React from "react";

import DfuFilesBundle from "../features/dfu/DfuFilesBundle";
import { DfuFileInfo } from "../features/dfu/getDfuFileInfo";
import { unzipFactoryDfuFilesAsync } from "../features/dfu/unzip";
import { toLocaleDateTimeString } from "../features/toLocaleDateTimeString";

import { useAppSelector } from "~/app/hooks";

export interface FactoryDfuBundleFiles {
  readonly bootloader?: DfuFileInfo;
  readonly firmware: DfuFileInfo;
  readonly date: Date;
}

export function useFactoryDfuFilesBundle(): [
  FactoryDfuBundleFiles | undefined,
  Error | undefined
] {
  const dfuBundles = useAppSelector((state) => state.dfuBundles);
  const [dfuBundle, setDfuBundle] = React.useState<FactoryDfuBundleFiles>();
  const [error, setError] = React.useState<Error>();
  React.useEffect(() => {
    const task = async () => {
      setError(undefined);
      // Get the DFU files bundles from the zip file
      const dfuBundle = DfuFilesBundle.create({
        pathnames: await unzipFactoryDfuFilesAsync(),
      });
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
  }, [dfuBundles]);

  return [dfuBundle, error];
}
