import React from "react";

import { unzipEmbeddedDfuFiles as unzipAppDfuFiles } from "../dfu/unzip";

import { useAppDispatch, useAppSelector } from "~/app/hooks";
import DfuFilesBundle from "~/features/dfu/DfuFilesBundle";
import getDfuFileInfo from "~/features/dfu/getDfuFileInfo";
import { resetEmbeddedDfuBundles } from "~/features/store/dfuBundlesSlice";

export class NoDfuFileLoadedError extends Error {
  constructor() {
    super("No DFU files loaded");
    this.name = "NoDfuFileLoadedError";
  }
}

export default function (): [
  DfuFilesBundle | undefined, // undefined until DFU bundles are loaded
  DfuFilesBundle[],
  Error?
] {
  const { selected, available } = useAppSelector((state) => state.dfuBundles);
  const dispatch = useAppDispatch();
  const [error, setError] = React.useState<Error>();
  React.useEffect(() => {
    // Check if we already have some embedded bundles in our list
    if (available.every((item) => item.kind === "imported")) {
      const task = async () => {
        // Unzip app DFU files
        const files = await unzipAppDfuFiles();
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
        // Store pathnames
        dispatch(
          resetEmbeddedDfuBundles({
            app: others.map((b) => b.items.map((i) => i.pathname)),
            factory: factory[0].items.map((i) => i.pathname),
          })
        );
      };
      setError(undefined);
      task().catch(setError);
    }
  }, [available, dispatch]);
  const availableDfuBundles = React.useMemo(
    () => available.map(DfuFilesBundle.create),
    [available]
  );
  return [availableDfuBundles[selected], availableDfuBundles, error];
}
