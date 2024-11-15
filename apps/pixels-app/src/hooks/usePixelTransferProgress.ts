import { PixelEventMap } from "@systemic-games/react-native-pixels-connect";
import React from "react";

import { usePixelsCentral } from "./usePixelsCentral";

function getProgress(ev?: PixelEventMap["dataTransfer"] | false): number {
  if (ev) {
    switch (ev.type) {
      case "progress":
        return ev.progressPercent;
      case "preparing":
        return 0;
      case "starting":
        return 0;
      default:
        return -1;
    }
  }
  return -1;
}

export function usePixelTransferProgress(pixel?: { pixelId: number }): number {
  const pixelId = pixel?.pixelId;
  const central = usePixelsCentral();
  const [progress, setProgress] = React.useState(
    getProgress(!!pixelId && central.getDataTransferStatus(pixelId))
  );
  React.useEffect(() => {
    setProgress(
      getProgress(!!pixelId && central.getDataTransferStatus(pixelId))
    );
    if (pixelId) {
      return central.addListener(
        "onDataTransfer",
        (ev) => ev.pixelId === pixelId && setProgress(getProgress(ev))
      );
    }
  }, [central, pixelId]);

  return progress;
}
