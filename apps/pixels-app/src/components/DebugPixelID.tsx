import { unsigned32ToHex } from "@systemic-games/pixels-core-utils";
import React from "react";
import { Text } from "react-native-paper";

import { useDebugMode, usePixelsCentral } from "~/hooks";

export function DebugPixelID({ pixelId }: { pixelId: number }) {
  const central = usePixelsCentral();
  const [priority, setPriority] = React.useState<"high" | "low">();
  React.useEffect(() => {
    const update = () =>
      setPriority(
        central.connectQueue.highPriority.includes(pixelId)
          ? "high"
          : central.connectQueue.lowPriority.includes(pixelId)
            ? "low"
            : undefined
      );
    update();
    return central.addListener("connectQueue", update);
  }, [central, pixelId]);
  const [limit, setLimit] = React.useState<{ disconnectId?: number }>();
  React.useEffect(() => {
    setLimit(undefined);
    return central.addListener(
      "onConnectionLimitReached",
      ({ disconnectId }) => {
        setLimit({ disconnectId });
      }
    );
  }, [central]);
  const debugMode = useDebugMode();
  return (
    debugMode && (
      <Text
        variant="titleSmall"
        style={{ position: "absolute", top: -10, alignSelf: "center" }}
      >
        ID: {unsigned32ToHex(pixelId)}
        {priority ? ` (${priority})` : ""}
        {limit?.disconnectId
          ? `\ndisco ${unsigned32ToHex(limit.disconnectId)}`
          : ""}
      </Text>
    )
  );
}
