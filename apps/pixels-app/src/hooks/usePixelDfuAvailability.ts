import { PairedDie } from "~/app/PairedDie";
import { useAppSelector } from "~/app/hooks";
import { pairedDiceSelectors } from "~/app/store";
import { DfuAvailability, getDieDfuAvailability } from "~/features/dice";

export function usePixelDfuAvailability(
  pairedDie?: Pick<PairedDie, "pixelId"> | number
): DfuAvailability {
  const dfuFilesStatus = useAppSelector(
    (state) => state.appTransient.dfuFilesStatus
  );
  const pixelId =
    typeof pairedDie === "number" ? pairedDie : pairedDie?.pixelId;
  const pixelTimestamp = useAppSelector((state) =>
    pairedDiceSelectors.selectByPixelId(state, pixelId ?? 0)
  )?.firmwareTimestamp;
  return pixelTimestamp !== undefined && typeof dfuFilesStatus === "object"
    ? getDieDfuAvailability(pixelTimestamp, dfuFilesStatus.timestamp)
    : "unknown";
}

export function useHasFirmwareUpdate(
  pairedDie: Pick<PairedDie, "pixelId"> | number
): boolean {
  return usePixelDfuAvailability(pairedDie) === "outdated";
}

export function useOutdatedPixelsCount(): number {
  const dfuFilesStatus = useAppSelector(
    (state) => state.appTransient.dfuFilesStatus
  );
  const count = useAppSelector((state) =>
    state.pairedDice.paired
      .map(
        (d) =>
          typeof dfuFilesStatus === "object" &&
          getDieDfuAvailability(
            d.firmwareTimestamp,
            dfuFilesStatus.timestamp
          ) === "outdated"
      )
      .reduce((acc, val) => acc + (val ? 1 : 0), 0)
  );
  return count;
}
