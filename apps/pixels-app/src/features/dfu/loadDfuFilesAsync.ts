import DfuFilesBundle from "./DfuFilesBundle";
import { getDfuFileInfo } from "./getDfuFileInfo";

import {
  unzipEmbeddedDfuBetaFilesAsync,
  unzipEmbeddedDfuFilesAsync,
} from "~/features/dfu/unzip";

export type DfuFilesInfo = Readonly<{
  timestamp: number;
  firmwarePath: string;
  bootloaderPath?: string;
}>;

// Never throws
export async function loadDfuFilesAsync(opt?: {
  betaFirmware?: boolean;
  timestampOverride?: number;
}): Promise<DfuFilesInfo | Error> {
  try {
    // Unzip app DFU files
    const files = opt?.betaFirmware
      ? await unzipEmbeddedDfuBetaFilesAsync()
      : await unzipEmbeddedDfuFilesAsync();
    // Group them in DFU bundles
    const bundles = await DfuFilesBundle.createMany(
      files.map((p) => getDfuFileInfo(p))
    );
    // Keep most recent bundle
    const getTime = (b: DfuFilesBundle) =>
      // Make sdk17 FW top choice
      b.date.getTime() + (b.firmware?.comment !== "sdk17" ? -Date.now() : 0);
    const selected = bundles.length
      ? bundles.reduce((a, b) => (getTime(a) >= getTime(b) ? a : b))
      : undefined;
    if (selected?.firmware) {
      return {
        timestamp: opt?.timestampOverride ?? selected.date.getTime(),
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
