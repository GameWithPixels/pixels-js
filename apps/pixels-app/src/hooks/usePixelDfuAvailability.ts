import { useAppDfuFiles } from "./useDfuFiles";

import { PairedDie } from "~/app/PairedDie";
import { useAppSelector } from "~/app/hooks";
import {
  DfuAvailability,
  getDieDfuAvailability,
} from "~/features/dice/getDieDfuAvailability";

export function usePixelDfuAvailability(
  pairedDie: Pick<PairedDie, "pixelId"> | number
): DfuAvailability {
  const { dfuFilesInfo } = useAppDfuFiles();
  const pixelId =
    typeof pairedDie === "number" ? pairedDie : pairedDie?.pixelId;
  const pixelTimestamp = useAppSelector(
    (state) =>
      state.pairedDice.paired.find((d) => d.pixelId === pixelId)
        ?.firmwareTimestamp
  );
  return getDieDfuAvailability(pixelTimestamp, dfuFilesInfo?.timestamp);
}

export function useHasFirmwareUpdate(
  pairedDie: Pick<PairedDie, "pixelId"> | number
): boolean {
  return usePixelDfuAvailability(pairedDie) === "outdated";
}

export function useOutdatedPixelsCount(): number {
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
