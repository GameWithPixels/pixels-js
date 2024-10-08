import { useDebugMode } from "./useDebugMode";
import { useAppDfuFiles } from "./useDfuFiles";

import { PairedDie } from "~/app/PairedDie";
import { useAppSelector } from "~/app/hooks";
import { pairedDiceSelectors } from "~/app/store";
import { DfuAvailability, getDieDfuAvailability } from "~/features/dice";

export function usePixelDfuAvailability(
  pairedDie?: Pick<PairedDie, "pixelId"> | number
): DfuAvailability {
  const { dfuFilesInfo } = useAppDfuFiles();
  const pixelId =
    typeof pairedDie === "number" ? pairedDie : pairedDie?.pixelId;
  const pixelTimestamp = useAppSelector((state) =>
    pairedDiceSelectors.selectByPixelId(state, pixelId ?? 0)
  )?.firmwareTimestamp;
  return pixelTimestamp !== undefined
    ? getDieDfuAvailability(pixelTimestamp, dfuFilesInfo?.timestamp)
    : "unknown";
}

export function useHasFirmwareUpdate(
  pairedDie: Pick<PairedDie, "pixelId"> | number
): boolean {
  return usePixelDfuAvailability(pairedDie) === "outdated";
}

export function useOutdatedPixelsCount(): number {
  const { dfuFilesInfo } = useAppDfuFiles();
  const debugMode = useDebugMode();
  const forceUpdate = useAppSelector(
    (state) => state.appSettings.forceUpdateFirmware
  );
  const count = useAppSelector((state) =>
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
  return debugMode && forceUpdate ? 1 : count;
}
