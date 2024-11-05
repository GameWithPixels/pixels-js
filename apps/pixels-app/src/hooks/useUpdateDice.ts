import { unsigned32ToHex } from "@systemic-games/pixels-core-utils";
import React from "react";

import { DfuFilesInfo } from "./useDfuFiles";
import { usePixelsCentral } from "./usePixelsCentral";

import { useAppStore } from "~/app/hooks";
import { updatePairedDieFirmwareTimestamp } from "~/features/store";
import { logError } from "~/features/utils";

export function useUpdateDice(): (
  pixelsIds: readonly number[],
  filesInfo: DfuFilesInfo,
  opt?: {
    maxAttempts?: number;
    stopRequested?: () => boolean;
  }
) => Promise<number[]> {
  const store = useAppStore();
  const central = usePixelsCentral();
  return React.useCallback(
    async (pixelsIds, filesInfo, opt) => {
      const failedIds: number[] = [];
      const idsToProcess = [...new Set(pixelsIds)];
      while (idsToProcess.length) {
        if (opt?.stopRequested?.()) {
          break;
        }
        const pixelId = idsToProcess[0];
        let updated = false;
        let attemptsCount = 0;
        while (true) {
          ++attemptsCount;
          try {
            updated = await central.tryUpdateFirmware(pixelId, filesInfo, {
              bootloader: store.getState().appSettings.updateBootloader,
            });
            break;
          } catch (e) {
            logError(`DFU error #${attemptsCount}: ${e}`);
            if (attemptsCount >= (opt?.maxAttempts ?? 3)) {
              failedIds.push(pixelId);
              break;
            }
          }
        }

        if (updated) {
          // Update stored timestamp
          store.dispatch(
            updatePairedDieFirmwareTimestamp({
              pixelId,
              timestamp: filesInfo.timestamp,
            })
          );
        }
        // Remove id
        idsToProcess.shift();
      }
      if (failedIds.length) {
        console.warn(
          "Failed updating dice: " + failedIds.map(unsigned32ToHex).join(", ")
        );
      }
      return failedIds;
    },
    [central, store]
  );
}
