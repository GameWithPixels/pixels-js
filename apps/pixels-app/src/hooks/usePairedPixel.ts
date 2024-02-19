import { Pixel, getPixel } from "@systemic-games/react-native-pixels-connect";

import { PairedDie } from "~/app/PairedDie";
import { useAppSelector } from "~/app/hooks";
import { logError, unsigned32ToHex } from "~/features/utils";

export function usePairedPixel(
  pixelOrPixelId: Pick<PairedDie, "pixelId"> | number
): Pixel | undefined {
  const pairedDice = useAppSelector((state) => state.pairedDice.paired);
  const pixelId =
    typeof pixelOrPixelId === "number"
      ? pixelOrPixelId
      : pixelOrPixelId.pixelId;
  if (!pairedDice.some((d) => d.pixelId === pixelId)) {
    logError(`Pixel ${unsigned32ToHex(pixelId)} not paired`);
  }
  return getPixel(pixelId);
}
