import {
  PixelInfoNotifier,
  usePixelInfoProp,
} from "@systemic-games/react-native-pixels-connect";

import { getRollStateLabel } from "~/features/profiles";

export function useRollStateLabel(
  pixel: PixelInfoNotifier
): string | undefined {
  const face = usePixelInfoProp(pixel, "currentFace");
  const rollState = usePixelInfoProp(pixel, "rollState");
  return face !== undefined && rollState && rollState !== "unknown"
    ? rollState === "onFace"
      ? `Face ${face}`
      : rollState === "rolling" || rollState === "handling"
        ? "Rolling..."
        : getRollStateLabel(rollState)
    : undefined;
}
