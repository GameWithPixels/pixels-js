import {
  PixelInfoNotifier,
  usePixelInfoProp,
} from "@systemic-games/react-native-pixels-connect";

import { getRollStateAndFaceLabel } from "~/features/dice";

export function useRollStateLabel(
  pixel: PixelInfoNotifier
): string | undefined {
  const face = usePixelInfoProp(pixel, "currentFace");
  const rollState = usePixelInfoProp(pixel, "rollState");
  return getRollStateAndFaceLabel(rollState, face);
}
