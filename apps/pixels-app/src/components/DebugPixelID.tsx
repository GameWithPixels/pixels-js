import { unsigned32ToHex } from "@systemic-games/pixels-core-utils";
import React from "react";
import { Text } from "react-native-paper";

import { useDebugMode, usePixelsCentral } from "~/hooks";

export function DebugPixelID({ pixelId }: { pixelId: number }) {
  const central = usePixelsCentral();
  const [queue, setQueue] = React.useState(central.connectQueue);
  React.useEffect(() => {
    setQueue(central.connectQueue);
    return central.addListener("connectQueue", setQueue);
  }, [central]);
  const devMode = useDebugMode();
  return (
    devMode && (
      <Text
        numberOfLines={1}
        variant="titleSmall"
        style={{ position: "absolute", top: -10, alignSelf: "center" }}
      >
        ID: {unsigned32ToHex(pixelId)}
        {queue.highPriority.includes(pixelId) ? " (High)" : ""}
        {queue.lowPriority.includes(pixelId) ? " (Low)" : ""}
      </Text>
    )
  );
}
