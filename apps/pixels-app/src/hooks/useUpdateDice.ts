import React from "react";

import { DfuFilesInfo } from "./useDfuFiles";
import { usePixelsCentral } from "./usePixelsCentral";

import { useAppDispatch, useAppSelector } from "~/app/hooks";
import { getDieDfuAvailability } from "~/features/dice";
import { updatePairedDieFirmwareTimestamp } from "~/features/store";

export function useUpdateDice(): (
  pixelsIds: readonly number[],
  filesInfo: DfuFilesInfo,
  stopRequested?: () => boolean
) => Promise<number[]> {
  const appDispatch = useAppDispatch();
  const central = usePixelsCentral();
  const updateBootloader = useAppSelector(
    (state) => state.appSettings.updateBootloader
  );
  return React.useCallback(
    async (
      pixelsIds: readonly number[],
      filesInfo: DfuFilesInfo,
      stopRequested?: () => boolean
    ) => {
      const failedPixelsIds: number[] = [];
      for (const pixelId of pixelsIds) {
        if (stopRequested?.()) {
          break;
        }
        try {
          const pixel = central.getPixel(pixelId);
          if (
            pixel?.isReady &&
            getDieDfuAvailability(
              pixel.firmwareDate.getTime(),
              filesInfo.timestamp
            ) === "outdated"
          ) {
            const fwTimestamp = pixel.firmwareDate.getTime();
            await central.updatePixelAsync({
              pixelId: pixel.pixelId,
              bootloaderPath: updateBootloader
                ? filesInfo.bootloaderPath
                : undefined,
              firmwarePath: filesInfo.firmwarePath,
            });
            // Update stored timestamp
            appDispatch(
              updatePairedDieFirmwareTimestamp({
                pixelId,
                timestamp: filesInfo.timestamp,
              })
            );
            // Check if we need to reset die settings to reprogram the normals
            const FW_2024_02_06 = 1707254440000;
            if (fwTimestamp < FW_2024_02_06) {
              console.warn(`Resetting settings for die ${pixel.name}`);
              central.getScheduler(pixelId).schedule({
                type: "resetSettings",
              });
            }
          }
        } catch {
          // Error logged in PixelsCentral and notified as an event
          failedPixelsIds.push(pixelId);
        }
      }
      return failedPixelsIds;
    },
    [central, appDispatch, updateBootloader]
  );
}
