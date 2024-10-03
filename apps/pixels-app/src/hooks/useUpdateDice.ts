import React from "react";

import { DfuFilesInfo } from "./useDfuFiles";
import { usePixelsCentral } from "./usePixelsCentral";

import { useAppDispatch, useAppSelector } from "~/app/hooks";
import { updatePairedDieFirmwareTimestamp } from "~/features/store";

export function useUpdateDice(): (
  pixelsIds: readonly number[],
  filesInfo: DfuFilesInfo,
  stopRequested?: () => boolean
) => Promise<number[]> {
  const appDispatch = useAppDispatch();
  const central = usePixelsCentral();
  const bootloader = useAppSelector(
    (state) => state.appSettings.updateBootloader
  );
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
            if (
              await central.tryUpdateFirmware(pixelId, filesInfo, {
                bootloader,
                force: true,
              })
            ) {
              // Update stored timestamp
              appDispatch(
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
      console.warn(
        "Finished updating dice, failed: " + failedPixelsIds.join(", ")
      );
      return failedPixelsIds;
    },
    [central, appDispatch, bootloader]
  );
}
