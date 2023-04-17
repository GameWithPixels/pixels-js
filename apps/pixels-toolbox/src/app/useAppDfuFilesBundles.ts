import React from "react";

import {
  listUnzippedDfuFiles,
  unzipDfuFilesFromAssets,
} from "../features/dfu/unzip";

import factoryDfuFiles from "!/dfu/factory-dfu-files.zip";
import otherDfuFiles from "!/dfu/other-dfu-files.zip";
import { useAppDispatch, useAppSelector } from "~/app/hooks";
import DfuFilesBundle from "~/features/dfu/DfuFilesBundle";
import {
  setAvailableDfuBundles,
  setSelectedDfuBundle,
} from "~/features/store/dfuBundlesSlice";

async function extractAllDfuFiles() {
  // Factory files last so we're sure that its content isn't overwritten
  await unzipDfuFilesFromAssets([otherDfuFiles, factoryDfuFiles]);
  // Read the DFU files bundles
  return await DfuFilesBundle.makeBundles(await listUnzippedDfuFiles());
}

export default function (): [DfuFilesBundle, DfuFilesBundle[], Error?] {
  const { selected, available } = useAppSelector((state) => state.dfuBundles);
  const dispatch = useAppDispatch();
  const [error, setError] = React.useState<Error>();
  React.useEffect(() => {
    if (!available.length) {
      extractAllDfuFiles()
        .then((bundles) => {
          dispatch(
            setAvailableDfuBundles(
              bundles.map((b) => ({
                bootloader: b.bootloader?.pathname,
                firmware: b?.firmware?.pathname,
              }))
            )
          );
          dispatch(setSelectedDfuBundle(0));
        })
        .catch(setError);
    }
  }, [available, dispatch]);
  const availableDfuBundles = React.useMemo(
    () =>
      available
        .map((b) => DfuFilesBundle.create(b))
        .filter(Boolean) as DfuFilesBundle[],
    [available]
  );
  return [availableDfuBundles[selected], availableDfuBundles, error];
}
