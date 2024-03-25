import { Pixel } from "@systemic-games/react-native-pixels-connect";
import React from "react";

import DfuFilesBundle from "~/features/dfu/DfuFilesBundle";
import { DfuFilesInfo, DfuNotifier } from "~/features/dfu/DfuNotifier";
import { getDfuFileInfo } from "~/features/dfu/getDfuFileInfo";
import { unzipEmbeddedDfuFilesAsync } from "~/features/dfu/unzip";
import {
  DfuFilesAndLoadError,
  DfuFilesContext,
  DfuNotifierContext,
  usePixelsCentral,
} from "~/hooks";

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
    const bundle = bundles.reduce((a, b) => (a.date >= b.date ? a : b));
    if (bundle?.firmware) {
      return {
        timestamp: bundle.date.getTime(),
        bootloaderPath: bundle.bootloader?.pathname,
        firmwarePath: bundle.firmware.pathname,
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
  const dfuNotifier = React.useMemo(() => new DfuNotifier(), []);
  const [dfuFiles, setDfuFiles] = React.useState<DfuFilesAndLoadError>({});

  // Load DFU files
  React.useEffect(() => {
    // Load DFU files (not interrupted if a fast refresh happens)
    loadDfuFiles().then((result) => {
      setDfuFiles((dfuInfo) => {
        const dfuFilesInfo = result instanceof Error ? undefined : result;
        const dfuFilesError = result instanceof Error ? result : undefined;
        dfuNotifier.updateFirmwareTimestamp(dfuFilesInfo?.timestamp ?? 0);
        return {
          ...dfuInfo,
          dfuFilesInfo,
          dfuFilesError,
        };
      });
    });
  }, [dfuNotifier]);

  // Listen for die status changes
  const central = usePixelsCentral();
  React.useEffect(() => {
    for (const pixel of central.pixels) {
      dfuNotifier.watch(pixel);
    }
    const onPixelFound = ({ pixel }: { pixel: Pixel }) => {
      dfuNotifier.watch(pixel);
    };
    const onPixelRemoved = ({ pixel }: { pixel: Pixel }) => {
      dfuNotifier.unwatch(pixel.pixelId);
    };
    central.addEventListener("pixelFound", onPixelFound);
    central.addEventListener("pixelRemoved", onPixelRemoved);
    return () => {
      central.removeEventListener("pixelFound", onPixelFound);
      central.removeEventListener("pixelRemoved", onPixelRemoved);
      dfuNotifier.unwatchAll();
    };
  }, [central, dfuNotifier]);

  return (
    <DfuFilesContext.Provider value={dfuFiles}>
      <DfuNotifierContext.Provider value={dfuNotifier}>
        {children}
      </DfuNotifierContext.Provider>
    </DfuFilesContext.Provider>
  );
}
