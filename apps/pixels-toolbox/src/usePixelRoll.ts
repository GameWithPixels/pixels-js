import {
  Pixel,
  MessageOrType,
  RollState,
  PixelRollState,
  PixelRollStateValues,
  PixelStatus,
} from "@systemic-games/react-native-pixels-connect";
import { useEffect, useState } from "react";

export default function (pixel?: Pixel): [number, PixelRollState] {
  const [rollState, setRollState] = useState<RollState>();
  useEffect(() => {
    if (pixel) {
      const rollListener = (msg: MessageOrType) =>
        setRollState(msg as RollState);
      pixel.addMessageListener("RollState", rollListener);
      const statusListener = (status: PixelStatus) => {
        if (status === "ready") {
          pixel.getRollState().catch(() => {});
        }
      };
      pixel.addEventListener("status", statusListener);
      return () => {
        pixel.removeMessageListener("RollState", rollListener);
        pixel.removeEventListener("status", statusListener);
        setRollState(undefined);
      };
    }
  }, [pixel]);

  return [
    rollState ? rollState.faceIndex + 1 : 0,
    rollState?.state ?? PixelRollStateValues.Unknown,
  ];
}
