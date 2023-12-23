import React from "react";

import { useAppSelector } from "~/app/hooks";
import { store } from "~/app/store";
import DfuFilesBundle from "~/features/dfu/DfuFilesBundle";
import { getDfuFileInfo } from "~/features/dfu/getDfuFileInfo";
import { unzipEmbeddedDfuFilesAsync } from "~/features/dfu/unzip";
import {
  DfuPathnamesBundle,
  setDfuFileError,
  setDfuFilesBundle,
} from "~/features/store/appDfuFilesSlice";

function prepareDfuBundle() {
  const task = async () => {
    // Unzip app DFU files
    const files = await unzipEmbeddedDfuFilesAsync();
    // Group them in DFU bundles
    const bundles = await DfuFilesBundle.createMany(
      files.map((p) => getDfuFileInfo(p))
    );
    // Keep most recent bundle
    const bundle = bundles.reduce((a, b) => (a.date >= b.date ? a : b));
    // Store result
    store.dispatch(
      bundle?.firmware
        ? setDfuFilesBundle({
            timestamp: bundle.date.getTime(),
            bootloader: bundle.bootloader?.pathname,
            firmware: bundle.firmware.pathname,
          })
        : setDfuFileError("No firmware file found")
    );
  };
  task().catch((error) => {
    store.dispatch(setDfuFileError(String(error)));
  });
}

let prepareDfuBundleCalled = false;

export function useDfuBundle(): [
  DfuPathnamesBundle | undefined,
  string | undefined,
] {
  React.useEffect(() => {
    if (!prepareDfuBundleCalled) {
      prepareDfuBundleCalled = true;
      prepareDfuBundle();
    }
  }, []);
  const { latest } = useAppSelector((state) => state.dfuFiles);
  return [latest.bundle, latest.error];
}
