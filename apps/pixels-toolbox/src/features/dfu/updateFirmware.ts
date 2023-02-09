import { delay } from "@systemic-games/pixels-core-utils";
import {
  DfuProgressEvent,
  DfuState,
  DfuStateEvent,
  startDfu,
} from "@systemic-games/react-native-nordic-nrf5-dfu";

export default async function (
  pixelAddress: number,
  bootloaderPath?: string,
  firmwarePath?: string,
  setDfuState?: (state: DfuState) => void,
  setDfuProgress?: (progress: number) => void
): Promise<void> {
  // Prepare DFU options
  const dfuOptions = {
    retries: 3,
    dfuStateListener: ({ state }: DfuStateEvent) => {
      console.log(`DFU state: ${state}`);
      setDfuState?.(state);
    },
    dfuProgressListener: ({ percent }: DfuProgressEvent) => {
      setDfuProgress?.(percent);
    },
  };

  const addrStr = pixelAddress.toString(16);
  const hasFirmware = !!firmwarePath?.length;
  const hasBootloader = !!bootloaderPath?.length;

  // Update bootloader
  if (hasBootloader) {
    console.log(
      `Starting DFU for device ${addrStr} with bootloader ${bootloaderPath}`
    );
    try {
      await startDfu(pixelAddress, bootloaderPath, dfuOptions);
    } catch (error: any) {
      if (error.message === "FW version failure") {
        // Bootloader already up-to-date
        console.log("Bootloader is same version or more recent");
        if (hasFirmware) {
          // Give DFU library a break, otherwise we risk getting the FW version failure again
          // on the firmware update
          await delay(100);
        }
      } else {
        throw error;
      }
    }
  }

  // Update firmware
  if (hasFirmware) {
    console.log(
      `Starting DFU for device ${addrStr} with firmware ${firmwarePath}`
    );
    const addr = pixelAddress + (hasBootloader ? 1 : 0);
    await startDfu(addr, firmwarePath, dfuOptions);
  }
}
