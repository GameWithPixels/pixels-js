import React from "react";

import { useAppDispatch, useAppSelector } from "~/app/hooks";
import DfuFilesBundle from "~/features/dfu/DfuFilesBundle";
import { getDfuFileInfo } from "~/features/dfu/getDfuFileInfo";
import { unzipEmbeddedDfuFilesAsync } from "~/features/dfu/unzip";
import { resetEmbeddedDfuFiles } from "~/features/store/dfuFilesSlice";

export class NoDfuFileLoadedError extends Error {
  constructor() {
    super("No DFU files loaded");
    this.name = "NoDfuFileLoadedError";
  }
}

export function useAppDfuFilesBundles(): [
  DfuFilesBundle | undefined, // undefined until DFU bundles are loaded
  DfuFilesBundle[],
  Error?,
] {
  const { selected, available } = useAppSelector((state) => state.dfuFiles);
  const dispatch = useAppDispatch();
  const [error, setError] = React.useState<Error>();
  React.useEffect(() => {
    // Check if we already have some embedded bundles in our list
    if (available.every((item) => item.kind === "imported")) {
      const unzipAll = async () => {
        // Unzip app DFU files
        const files = await unzipEmbeddedDfuFilesAsync();
        // Group them in DFU bundles
        const factory = await DfuFilesBundle.createMany(
          files.factory.map((p) => getDfuFileInfo(p))
        );
        const others = await DfuFilesBundle.createMany(
          files.others.map((p) => getDfuFileInfo(p))
        );
        if (!factory.length && !others.length) {
          throw new NoDfuFileLoadedError();
        }
        // Store pathnames and selection
        const allBundles = factory.concat(others);
        const getTime = (b: DfuFilesBundle) =>
          b.date.getTime() +
          // Make sdk17 FW top choice
          (b.firmware?.comment !== "sdk17" ? -Date.now() : 0);
        const selected = allBundles.indexOf(
          allBundles.reduce((a, b) => (getTime(a) >= getTime(b) ? a : b))
        );
        dispatch(
          resetEmbeddedDfuFiles({
            selected,
            bundles: factory.concat(others).map((b) => ({
              pathnames: b.items.map((i) => i.pathname),
              kind: factory.includes(b) ? "factory" : "app",
            })),
          })
        );
      };
      setError(undefined);
      unzipAll().catch(setError);
    }
  }, [available, dispatch]);
  const availableDfuBundles = React.useMemo(
    () => available.map(DfuFilesBundle.create),
    [available]
  );
  return [availableDfuBundles[selected], availableDfuBundles, error];
}
