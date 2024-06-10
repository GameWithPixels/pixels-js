import {
  Pixel,
  PixelInfoNotifier,
  usePixelInfoProp,
} from "@systemic-games/react-native-pixels-connect";
import React from "react";

import { RssiIcon } from "./icons";

export function PixelRssi({
  pixel,
  size,
  disabled,
}: {
  pixel?: PixelInfoNotifier;
  size: number;
  disabled?: boolean;
}) {
  React.useEffect(() => {
    if (pixel instanceof Pixel) {
      pixel
        .reportRssi(true, 5000)
        .catch((e) => console.log(`Error to enable RSSI reporting: ${e}`));
      return () => {
        pixel
          .reportRssi(false)
          .catch((e) => console.log(`Error to disable RSSI reporting: ${e}`));
      };
    }
  }, [pixel]);

  const rssi = usePixelInfoProp(pixel, "rssi");
  return <RssiIcon value={rssi} size={size} disabled={!pixel || disabled} />;
}
