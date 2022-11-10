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

  // Update bootloader
  if (bootloaderPath?.length) {
    console.log(
      `Starting DFU for device ${addrStr} with bootloader ${bootloaderPath}`
    );
    try {
      await startDfu(pixelAddress, bootloaderPath, dfuOptions);
    } catch (error: any) {
      if (error.message === "FW version failure") {
        // Bootloader already up-to-date
        console.log("Bootloader is same or more recent");
      } else {
        throw error;
      }
    }
  }

  // Update firmware
  if (firmwarePath?.length) {
    console.log(
      `Starting DFU for device ${addrStr} with firmware ${firmwarePath}`
    );
    await startDfu(pixelAddress + 1, firmwarePath, dfuOptions);
  }
}
