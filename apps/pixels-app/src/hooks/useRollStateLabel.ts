import { PixelInfoNotifier } from "@systemic-games/react-native-pixels-connect";
import React from "react";

import { getRollStateLabel } from "~/features/profiles";

export function useRollStateLabel(
  pixel: PixelInfoNotifier
): string | undefined {
  const [face, setFace] = React.useState(pixel.currentFace);
  const [rollState, setRollState] = React.useState(pixel.rollState);
  React.useEffect(() => {
    const onFace = () => setFace(pixel.currentFace);
    onFace();
    pixel.addPropertyListener("currentFace", onFace);
    const onRoll = () => setRollState(pixel.rollState);
    onRoll();
    pixel.addPropertyListener("rollState", onRoll);
    return () => {
      pixel.removePropertyListener("currentFace", onFace);
      pixel.removePropertyListener("rollState", onRoll);
    };
  }, [pixel]);
  return rollState !== "unknown"
    ? `${getRollStateLabel(rollState)} ${face}`
    : undefined;
}