import {
  Pixel,
  PixelRollStateNames,
} from "@systemic-games/react-native-pixels-connect";
import { useEffect, useReducer } from "react";

export default function (pixel?: Pixel): [number, PixelRollStateNames] {
  const [_, forceUpdate] = useReducer((b) => !b, false);

  useEffect(() => {
    if (pixel) {
      pixel.addMessageListener("rollState", forceUpdate);
      return () => {
        pixel.removeMessageListener("rollState", forceUpdate);
      };
    }
  }, [pixel]);

  return pixel ? [pixel.currentFace, pixel.rollState] : [0, "unknown"];
}
