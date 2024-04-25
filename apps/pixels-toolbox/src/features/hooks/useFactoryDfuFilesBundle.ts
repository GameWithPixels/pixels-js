import { assert } from "@systemic-games/pixels-core-utils";
import React from "react";

import DfuFilesBundle from "../dfu/DfuFilesBundle";
import { DfuFileInfo, getDfuFileInfo } from "../dfu/getDfuFileInfo";
import { unzipFactoryDfuFilesAsync } from "../dfu/unzip";
import { toLocaleDateTimeString } from "../toLocaleDateTimeString";

export interface FactoryDfuBundleFiles {
  readonly bootloader: DfuFileInfo;
  readonly firmware: DfuFileInfo;
  readonly reconfigFirmware: DfuFileInfo;
  readonly date: Date;
}

export function useFactoryDfuFilesBundle(): [
  FactoryDfuBundleFiles | undefined,
  Error | undefined
] {
  const [dfuBundle, setDfuBundle] = React.useState<FactoryDfuBundleFiles>();
  const [error, setError] = React.useState<Error>();
  React.useEffect(() => {
    const task = async () => {
      setError(undefined);
      // Get the DFU files bundles from the zip file
      const bundles = await DfuFilesBundle.createMany(
        (await unzipFactoryDfuFilesAsync()).map((p) => getDfuFileInfo(p))
      );
      const dfuBundle = bundles.find((b) => b.bootloader);
      if (!dfuBundle?.bootloader) {
        throw new Error("Validation DFU bootloader file not found");
      }
      if (dfuBundle.firmware?.comment !== "sdk17") {
        throw new Error("Validation DFU firmware file not found");
      }
      const reconfigDfuBundle = bundles.find((b) =>
        b.firmware?.comment?.includes("reconfigure")
      );
      if (!reconfigDfuBundle?.firmware) {
        throw new Error(
          "Validation DFU firmware file for reconfiguration not found"
        );
      }
      assert(
        reconfigDfuBundle !== dfuBundle,
        "Reconfig DFU bundle is the same as main one"
      );
      console.log(
        "Validation DFU files loaded, firmware/bootloader build date is",
        toLocaleDateTimeString(dfuBundle.date)
      );
      setDfuBundle({
        bootloader: dfuBundle.bootloader,
        firmware: dfuBundle.firmware,
        reconfigFirmware: reconfigDfuBundle.firmware,
        date: dfuBundle.date,
      });
    };
    task().catch(setError);
  }, []);

  return [dfuBundle, error];
}
