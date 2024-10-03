import { usePixelStatus } from "@systemic-games/react-native-pixels-connect";

import { PairedDieRenderer } from "./PairedDieRenderer";

import { PairedDie } from "~/app/PairedDie";
import { useIsPixelRolling, useRegisteredPixel } from "~/hooks";

export function PairedDieRendererWithRoll({
  pairedDie,
  disabled,
}: {
  pairedDie: Pick<PairedDie, "pixelId" | "dieType" | "colorway">;
  disabled: boolean;
}) {
  const pixel = useRegisteredPixel(pairedDie);
  const status = usePixelStatus(pixel);
  const rolling = useIsPixelRolling(pixel, status);
  return (
    <PairedDieRenderer
      pairedDie={pairedDie}
      speed={disabled ? 0 : rolling ? 10 : 1}
    />
  );
}
