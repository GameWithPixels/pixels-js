import { PixelInfo } from "@systemic-games/react-native-pixels-connect";

import { useAppDfuFiles } from "./useDfuFiles";

import { useAppSelector } from "~/app/hooks";
import {
  DfuAvailability,
  getDieDfuAvailability,
} from "~/features/dice/getDieDfuAvailability";

export function usePixelDfuAvailability(
  pixel: Pick<PixelInfo, "pixelId"> | number | undefined
): DfuAvailability {
  const { dfuFilesInfo } = useAppDfuFiles();
  const pixelId = typeof pixel === "number" ? pixel : pixel?.pixelId;
  const pixelTimestamp = useAppSelector(
    (state) =>
      state.pairedDice.paired.find((d) => d.pixelId === pixelId)
        ?.firmwareTimestamp
  );
  return getDieDfuAvailability(pixelTimestamp, dfuFilesInfo?.timestamp);
}

export function useHasFirmwareUpdate(
  pixel: Pick<PixelInfo, "pixelId"> | number
): boolean {
  return usePixelDfuAvailability(pixel) === "outdated";
}

export function useHasFirmwareUpdateCount(): number {
  const { dfuFilesInfo } = useAppDfuFiles();
  return useAppSelector((state) =>
    state.pairedDice.paired
      .map(
        (d) =>
          getDieDfuAvailability(
            d.firmwareTimestamp,
            dfuFilesInfo?.timestamp
          ) === "outdated"
      )
      .reduce((acc, val) => acc + (val ? 1 : 0), 0)
  );
}
