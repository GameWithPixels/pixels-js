import {
  Pixel,
  MessageOrType,
  RollState,
  PixelRollStateValues,
  getPixelEnumName,
  PixelRollStateNames,
} from "@systemic-games/react-native-pixels-connect";
import { useEffect, useState } from "react";

export default function (pixel?: Pixel): [number, PixelRollStateNames] {
  const [rollState, setRollState] = useState<RollState>();
  useEffect(() => {
    if (pixel) {
      const rollListener = (msg: MessageOrType) =>
        setRollState(msg as RollState);
      pixel.addMessageListener("rollState", rollListener);
      return () => {
        pixel.removeMessageListener("rollState", rollListener);
        setRollState(undefined);
      };
    }
  }, [pixel]);

  return [
    rollState ? rollState.faceIndex + 1 : 0,
    getPixelEnumName(
      rollState?.state ?? PixelRollStateValues.unknown,
      PixelRollStateValues
    ) ?? "unknown",
  ];
}
