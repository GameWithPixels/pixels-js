import React from "react";

import DfuFilesBundle from "~/features/dfu/DfuFilesBundle";
import { getDfuFileInfo } from "~/features/dfu/getDfuFileInfo";
import { unzipEmbeddedDfuFilesAsync } from "~/features/dfu/unzip";
import { DfuFilesStatus, DfuFilesContext, DfuFilesInfo } from "~/hooks";

// Never throws
async function loadDfuFiles(): Promise<DfuFilesInfo | Error> {
  try {
    // Unzip app DFU files
    const files = await unzipEmbeddedDfuFilesAsync();
    // Group them in DFU bundles
    const bundles = await DfuFilesBundle.createMany(
      files.map((p) => getDfuFileInfo(p))
    );
    // Keep most recent bundle
    const getTime = (b: DfuFilesBundle) =>
      // Make sdk17 FW top choice
      b.date.getTime() + (b.firmware?.comment !== "sdk17" ? -Date.now() : 0);
    const selected = bundles.reduce((a, b) =>
      getTime(a) >= getTime(b) ? a : b
    );
    if (selected?.firmware) {
      return {
        timestamp: selected.date.getTime(),
        bootloaderPath: selected.bootloader?.pathname,
        firmwarePath: selected.firmware.pathname,
      };
    } else {
      return new Error("No firmware file found");
    }
  } catch (error) {
    return error instanceof Error ? error : new Error(String(error));
  }
}

export function AppDfuFiles({ children }: React.PropsWithChildren) {
  // const dfuNotifier = React.useState(() => new DfuNotifier())[0];
  const [dfuFiles, setDfuFiles] = React.useState<DfuFilesStatus>({});

  // Load DFU files
  React.useEffect(() => {
    // Load DFU files (not interrupted if a fast refresh happens)
    loadDfuFiles().then((result) => {
      setDfuFiles((dfuInfo) => {
        const dfuFilesInfo = result instanceof Error ? undefined : result;
        const dfuFilesError = result instanceof Error ? result : undefined;
        return {
          ...dfuInfo,
          dfuFilesInfo,
          dfuFilesError,
        };
      });
    });
  }, []);

  return (
    <DfuFilesContext.Provider value={dfuFiles}>
      {children}
    </DfuFilesContext.Provider>
  );
}
