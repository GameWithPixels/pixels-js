import { usePixelEvent } from "@systemic-games/react-native-pixels-connect";

import { PairedDieRenderer } from "./PairedDieRenderer";

import { PairedDie } from "~/app/PairedDie";
import { useWatchedPixel } from "~/hooks";

export function PairedDieRendererWithRoll({
  pairedDie,
  disabled,
}: {
  pairedDie: PairedDie;
  disabled: boolean;
}) {
  const pixel = useWatchedPixel(pairedDie);
  const [rollEv] = usePixelEvent(pixel, "roll");
  const rolling = rollEv?.state === "rolling" || rollEv?.state === "handling";
  return (
    <PairedDieRenderer
      pairedDie={pairedDie}
      speed={disabled ? 0 : rolling ? 10 : 1}
    />
  );
}
