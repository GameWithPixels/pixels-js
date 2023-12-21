import React from "react";

import DfuFilesBundle from "~/features/dfu/DfuFilesBundle";
import { getDfuFileInfo } from "~/features/dfu/getDfuFileInfo";
import { unzipEmbeddedDfuFilesAsync } from "~/features/dfu/unzip";

export function useDfuBundle(): [
  DfuFilesBundle | undefined,
  Error | undefined,
] {
  const [dfuBundle, setDfuBundle] = React.useState<DfuFilesBundle>();
  const [error, setError] = React.useState<Error>();
  React.useEffect(() => {
    const task = async () => {
      setError(undefined);
      // Unzip app DFU files
      const files = await unzipEmbeddedDfuFilesAsync();
      // Group them in DFU bundles
      const bundles = await DfuFilesBundle.createMany(
        files.map((p) => getDfuFileInfo(p))
      );
      // Use most recent bundle
      setDfuBundle(bundles.reduce((a, b) => (a.date >= b.date ? a : b)));
    };
    task().catch(setError);
  }, []);
  return [dfuBundle, error];
}
