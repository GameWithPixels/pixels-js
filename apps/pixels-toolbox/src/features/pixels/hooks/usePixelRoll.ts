import {
  Pixel,
  PixelRollStateNames,
} from "@systemic-games/react-native-pixels-connect";
import { useEffect, useReducer } from "react";

export default function (pixel?: Pixel): [number, PixelRollStateNames] {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_, triggerRender] = useReducer((b) => !b, false);

  useEffect(() => {
    if (pixel) {
      pixel.addMessageListener("rollState", triggerRender);
      return () => {
        pixel.removeMessageListener("rollState", triggerRender);
      };
    }
  }, [pixel]);

  return pixel ? [pixel.currentFace, pixel.rollState] : [0, "unknown"];
}
