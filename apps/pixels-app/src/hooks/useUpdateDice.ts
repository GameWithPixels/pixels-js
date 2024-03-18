import React from "react";

import { useDfuNotifier } from "./useDfuNotifier";
import { usePixelsCentral } from "./usePixelsCentral";

import { useAppSelector } from "~/app/hooks";
import { DfuFilesInfo } from "~/features/dfu/DfuNotifier";

export function useUpdateDice(): (
  pixelsIds: readonly number[],
  filesInfo: DfuFilesInfo,
  stopRequested?: () => boolean
) => Promise<number[]> {
  const central = usePixelsCentral();
  const dfuNotifier = useDfuNotifier();
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
          if (pixel && dfuNotifier.getDfuAvailability(pixelId) === "outdated") {
            await central.updatePixelAsync({
              pixel,
              bootloaderPath: updateBootloader
                ? filesInfo.bootloaderPath
                : undefined,
              firmwarePath: filesInfo.firmwarePath,
            });
          }
        } catch {
          // Error logged in PixelsCentral and notified as an event
          failedPixelsIds.push(pixelId);
        }
      }
      return failedPixelsIds;
    },
    [central, dfuNotifier, updateBootloader]
  );
}
