import { unsigned32ToHex } from "@systemic-games/pixels-core-utils";
import React from "react";

import { DfuFilesInfo } from "./useDfuFiles";
import { usePixelsCentral } from "./usePixelsCentral";

import { useAppStore } from "~/app/hooks";
import { updatePairedDieFirmwareTimestamp } from "~/features/store";

export function useUpdateDice(): (
  pixelsIds: readonly number[],
  filesInfo: DfuFilesInfo,
  stopRequested?: () => boolean
) => Promise<number[]> {
  const store = useAppStore();
  const central = usePixelsCentral();
  return React.useCallback(
    async (
      pixelsIds: readonly number[],
      filesInfo: DfuFilesInfo,
      stopRequested?: () => boolean
    ) => {
      const failedPixelsIds: number[] = [];
      const idsToProcess = [...new Set(pixelsIds)];
      // First try to update connected Pixels
      let stopScan: (() => void) | undefined;
      try {
        while (idsToProcess.length) {
          if (stopRequested?.()) {
            break;
          }
          const pixelId = idsToProcess[0];
          try {
            const { updateBootloader, forceUpdateFirmware } =
              store.getState().appSettings;
            if (
              await central.tryUpdateFirmware(pixelId, filesInfo, {
                bootloader: updateBootloader,
                force: forceUpdateFirmware,
              })
            ) {
              // Update stored timestamp
              store.dispatch(
                updatePairedDieFirmwareTimestamp({
                  pixelId,
                  timestamp: filesInfo.timestamp,
                })
              );
            }
          } catch (error) {
            failedPixelsIds.push(pixelId);
          }
          // Remove id
          idsToProcess.shift();
        }
      } finally {
        stopScan?.();
      }
      if (failedPixelsIds.length) {
        console.warn(
          "Failed updating dice: " +
            failedPixelsIds.map(unsigned32ToHex).join(", ")
        );
      }
      return failedPixelsIds;
    },
    [central, store]
  );
}
