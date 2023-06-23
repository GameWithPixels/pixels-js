import { delay } from "@systemic-games/pixels-core-utils";
import {
  DfuFirmwareVersionFailureError,
  DfuProgressEvent,
  DfuState,
  DfuStateEvent,
  startDfu,
} from "@systemic-games/react-native-nordic-nrf5-dfu";

export default async function (
  systemId: string,
  bootloaderPath?: string,
  firmwarePath?: string,
  setDfuState?: (state: DfuState) => void,
  setDfuProgress?: (progress: number) => void,
  isBootloaderMacAddress?: boolean
): Promise<void> {
  const hasFirmware = !!firmwarePath?.length;
  const hasBootloader = !!bootloaderPath?.length;
  let bootloaderSkipped = false;

  // Prepare DFU options
  const dfuCount = (hasBootloader ? 1 : 0) + (hasFirmware ? 1 : 0);
  let pendingDfuCount = dfuCount;
  const dfuOptions = {
    retries: 3,
    dfuStateListener: ({ state }: DfuStateEvent) => {
      const index = dfuCount - pendingDfuCount;
      console.log(`DFU state changed: ${state} (${index} of ${dfuCount})`);
      if (state !== "dfuCompleted" || pendingDfuCount <= 0) {
        setDfuState?.(state);
      }
    },
    dfuProgressListener: ({ percent }: DfuProgressEvent) => {
      const c = dfuCount - (bootloaderSkipped ? 1 : 0);
      const p =
        ((c - pendingDfuCount - 1) / c) * 100 + percent / (pendingDfuCount + 1);
      setDfuProgress?.(p);
    },
  };

  // Update bootloader
  if (hasBootloader) {
    try {
      const addrStr = systemId;
      console.log(
        `Starting DFU for device ${addrStr} with bootloader ${bootloaderPath}`
      );
      pendingDfuCount -= 1;
      await startDfu(systemId, bootloaderPath, dfuOptions);
    } catch (error: any) {
      if (error instanceof DfuFirmwareVersionFailureError) {
        // Bootloader already up-to-date
        console.log("Device bootloader is same version or more recent");
        if (hasFirmware) {
          // The BL DFU was skipped after all
          bootloaderSkipped = true;
          // Give DFU library a break, otherwise we risk getting the same FW version failure
          // on the firmware update below
          await delay(200); // Got the error once more with 100ms, increasing to 200ms
        }
      } else {
        console.log(`DFU bootloader error: ${error}`);
        throw error;
      }
    }
  }

  // Update firmware
  if (hasFirmware) {
    const update = async (allowRetry = true) => {
      try {
        // After attempting to update the bootloader, device stays in bootloader mode
        // Bootloader address = firmware address + 1
        const addr = systemId;
        const addrStr = systemId;
        console.log(
          `Starting DFU for device ${addrStr} with firmware ${firmwarePath}`
        );
        pendingDfuCount -= 1;
        await startDfu(addr, firmwarePath, dfuOptions);
      } catch (error) {
        if (
          allowRetry &&
          bootloaderSkipped &&
          error instanceof DfuFirmwareVersionFailureError
        ) {
          // We sometime get this error, it looks like "left over" from the
          // bootloader update attempt that was performed just before
          console.warn(`DFU firmware version error, trying a second time`);
          pendingDfuCount += 1;
          await delay(500); // Experimental
          await update(false);
        } else {
          console.log(`DFU firmware error: ${error}`);
          throw error;
        }
      }
    };
    await update();
  }
}
