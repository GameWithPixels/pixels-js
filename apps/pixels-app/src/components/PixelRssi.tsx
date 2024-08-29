import {
  Pixel,
  PixelInfoNotifier,
  usePixelInfoProp,
  usePixelStatus,
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
  const status = usePixelStatus(pixel instanceof Pixel ? pixel : undefined);
  React.useEffect(() => {
    if (status === "ready" && pixel instanceof Pixel) {
      pixel
        .reportRssi(true, 5000)
        .catch((e) =>
          console.log(`PixelRssi: Error enabling RSSI reporting: ${e}`)
        );
      return () => {
        pixel.reportRssi(false).catch(() => {}); // Ignore errors
      };
    }
  }, [pixel, status]);

  const rssi = usePixelInfoProp(pixel, "rssi");
  return <RssiIcon value={rssi} size={size} disabled={!pixel || disabled} />;
}
