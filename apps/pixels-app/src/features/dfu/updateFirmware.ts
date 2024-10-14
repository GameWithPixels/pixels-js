import { delay, unsigned32ToHex } from "@systemic-games/pixels-core-utils";
import {
  DfuFirmwareVersionFailureError,
  DfuProgressEvent,
  DfuState,
  DfuStateEvent,
  DfuTargetId,
  getDfuTargetId,
  startDfu,
} from "@systemic-games/react-native-nordic-nrf5-dfu";
import { getBootloaderAdvertisedName } from "@systemic-games/react-native-pixels-connect";

function idToString(targetId: DfuTargetId): string {
  return typeof targetId === "number"
    ? targetId.toString(16).match(/.{2}/g)?.join(":") ?? ""
    : `${targetId}`;
}

export function isDfuDone(dfuState: DfuState): boolean {
  return (
    dfuState === "completed" || dfuState === "aborted" || dfuState === "errored"
  );
}

export async function updateFirmware({
  systemId,
  pixelId,
  bootloaderPath,
  firmwarePath,
  dfuStateCallback,
  dfuProgressCallback,
  isBootloaderMacAddress,
  recoverFromUploadError,
}: {
  systemId: string;
  pixelId?: number; // iOS only
  bootloaderPath?: string;
  firmwarePath?: string;
  dfuStateCallback?: (state: DfuState) => void;
  dfuProgressCallback?: (progress: number) => void;
  isBootloaderMacAddress?: boolean;
  recoverFromUploadError?: boolean;
}): Promise<void> {
  const hasFirmware = !!firmwarePath?.length;
  const hasBootloader = !!bootloaderPath?.length;
  let bootloaderSkipped = false;

  // Get target id
  const targetId = getDfuTargetId({ systemId });

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
        dfuStateCallback?.(state);
      }
    },
    dfuProgressListener: ({ percent }: DfuProgressEvent) => {
      const c = dfuCount - (bootloaderSkipped ? 1 : 0);
      const p =
        ((c - pendingDfuCount - 1) / c) * 100 + percent / (pendingDfuCount + 1);
      dfuProgressCallback?.(p);
    },
    alternativeAdvertisingName:
      // Name advertised by Bootloader
      pixelId ? getBootloaderAdvertisedName(pixelId) : undefined,
  };

  const pixelIdStr =
    pixelId !== undefined ? ` (${unsigned32ToHex(pixelId)})` : "";

  // Update bootloader
  if (hasBootloader) {
    try {
      console.log(
        `Starting DFU for device ${idToString(
          targetId
        )}${pixelIdStr} with bootloader ${bootloaderPath}`
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
        console.log(`DFU bootloader error: ${error}`);
        dfuStateCallback?.("errored");
        throw error;
      }
    }
  }

  // Update firmware
  if (hasFirmware && !abort) {
    const update = async (retryOnVersionError = true) => {
      const startTime = Date.now();
      try {
        // After attempting to update the bootloader, device stays in bootloader mode
        // Bootloader address = firmware address + 1 on Android
        const useBlAddress =
          (hasBootloader || recoverFromUploadError) && !isBootloaderMacAddress;
        const fwTargetId =
          typeof targetId === "number"
            ? targetId + (useBlAddress ? 1 : 0)
            : targetId;
        console.log(
          `Starting DFU for device ${idToString(
            fwTargetId
          )}${pixelIdStr} with firmware ${firmwarePath}${
            useBlAddress ? " (using Bootloader address)" : ""
          }`
        );
        pendingDfuCount -= 1;
        await startDfu(fwTargetId, firmwarePath, dfuOptions);
      } catch (error) {
        if (
          retryOnVersionError &&
          error instanceof DfuFirmwareVersionFailureError
        ) {
          // We sometime get this error, it looks like "left over" from the
          // bootloader update attempt that was performed just before
          console.warn(`DFU firmware version error, trying a second time`);
          pendingDfuCount += 1;
          // Experimental, hopefully this delay is long enough to not get the
          // same error again
          await delay(500);
          await update(false);
        } else {
          console.log(`DFU firmware error: ${error}`);
          dfuStateCallback?.("errored");
          throw error;
        }
      } finally {
        // Log DFU duration
        console.log(`DFU duration: ${Date.now() - startTime} ms`);
      }
    };
    await update(bootloaderSkipped);
  }
}
