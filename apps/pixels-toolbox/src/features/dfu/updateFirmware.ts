import { delay } from "@systemic-games/pixels-core-utils";
import {
  DfuDeviceDisconnectedError,
  DfuFirmwareVersionFailureError,
  DfuProgressEvent,
  DfuState,
  DfuStateEvent,
  DfuTargetId,
  getDfuTargetId,
  startDfu,
} from "@systemic-games/react-native-nordic-nrf5-dfu";
import { ScannedPixel } from "@systemic-games/react-native-pixels-connect";

function idToString(targetId: DfuTargetId): string {
  return typeof targetId === "number"
    ? targetId.toString(16).match(/.{2}/g)?.join(":") ?? ""
    : `{${targetId}}`;
}

export function isDfuDone(dfuState: DfuState): boolean {
  return (
    dfuState === "completed" || dfuState === "aborted" || dfuState === "errored"
  );
}

export type DfuTarget =
  | DfuTargetId
  | Pick<ScannedPixel, "systemId" | "address">;

export async function updateFirmware(
  target: DfuTarget,
  bootloaderPath?: string,
  firmwarePath?: string,
  setDfuState?: (state: DfuState) => void,
  setDfuProgress?: (progress: number) => void,
  isBootloaderMacAddress?: boolean
): Promise<void> {
  const hasFirmware = !!firmwarePath?.length;
  const hasBootloader = !!bootloaderPath?.length;
  let bootloaderSkipped = false;

  // Get target id
  const targetId = typeof target === "object" ? getDfuTargetId(target) : target;

  // Prepare DFU options
  const dfuCount = (hasBootloader ? 1 : 0) + (hasFirmware ? 1 : 0);
  let pendingDfuCount = dfuCount;
  let abort = false;
  const dfuOptions = {
    dfuStateListener: ({ state }: DfuStateEvent) => {
      const index = dfuCount - pendingDfuCount;
      console.log(`DFU state changed: ${state} (${index} of ${dfuCount})`);
      if (state === "aborted") {
        abort = true;
      }
      if (
        state !== "errored" && // Error state is set on catching the actual error
        (state !== "completed" || pendingDfuCount <= 0)
      ) {
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
      console.log(
        `Starting DFU for device ${idToString(
          targetId
        )} with bootloader ${bootloaderPath}`
      );
      pendingDfuCount -= 1;
      await startDfu(targetId, bootloaderPath, dfuOptions);
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
        console.log(`DFU error (bootloader): ${error}`);
        setDfuState?.("errored");
        throw error;
      }
    }
  }

  // Update firmware
  if (hasFirmware && !abort) {
    const update = async (canRetry = true) => {
      const startTime = Date.now();
      try {
        // After attempting to update the bootloader, device stays in bootloader mode
        // Bootloader address = firmware address + 1
        const fwTargetId =
          typeof targetId === "number"
            ? targetId + (hasBootloader && !isBootloaderMacAddress ? 1 : 0)
            : targetId;
        console.log(
          `Starting DFU for device ${idToString(
            fwTargetId
          )} with firmware ${firmwarePath}`
        );
        pendingDfuCount -= 1;
        await startDfu(fwTargetId, firmwarePath, dfuOptions);
      } catch (error) {
        if (
          canRetry &&
          bootloaderSkipped &&
          (error instanceof DfuFirmwareVersionFailureError ||
            error instanceof DfuDeviceDisconnectedError)
        ) {
          // We sometime get the "version failure" error, it looks like
          // a "left over" from the bootloader update attempt that was
          // performed just before
          // Also try again if the device got disconnected during the update
          console.log(`Trying again DFU after error: ${error}`);
          pendingDfuCount += 1;
          await delay(500); // Experimental, hopefully is delay is enough to not get the same error again
          await update(false);
        } else {
          console.log(`DFU error: ${error}`);
          setDfuState?.("errored");
          throw error;
        }
      } finally {
        // Log DFU duration
        console.log(`DFU duration: ${Date.now() - startTime} ms`);
      }
    };
    await update();
  }
}
