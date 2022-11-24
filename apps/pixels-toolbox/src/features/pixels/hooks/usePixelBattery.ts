import {
  Pixel,
  MessageOrType,
  MessageTypeValues,
  BatteryLevel,
} from "@systemic-games/react-native-pixels-connect";
import { useCallback, useEffect, useState } from "react";

interface BatteryInfo {
  level: number; // Percentage
  isCharging: boolean;
  voltage: number;
}

export default function (
  pixel?: Pixel,
  options?: {
    refreshInterval?: number;
    alwaysActive?: boolean;
  }
): [BatteryInfo | undefined, (action: "start" | "stop") => void] {
  const [batteryLevel, setBatteryLevel] = useState<BatteryInfo>();
  const [active, setActive] = useState(false);
  const dispatch = useCallback(
    (action: "start" | "stop") => setActive(action === "start"),
    [setActive]
  );

  // Options default values
  const refreshInterval = options?.refreshInterval ?? 1000;
  const alwaysActive = options?.alwaysActive ?? false;

  useEffect(() => {
    if (pixel && (active || alwaysActive)) {
      const batteryLevelListener = (msg: MessageOrType) => {
        const bl = msg as BatteryLevel;
        setBatteryLevel({
          level: Math.round(bl.level * 100),
          isCharging: bl.charging,
          voltage: bl.voltage,
        });
      };
      pixel.addMessageListener("batteryLevel", batteryLevelListener);
      const id = setInterval(() => {
        if (pixel.status === "ready") {
          // Send request and ignore any error as the connection state
          // might change at any moment and make sendMessage throw an exception
          pixel
            .sendMessage(MessageTypeValues.requestBatteryLevel)
            .catch(() => {});
        }
      }, refreshInterval);
      return () => {
        clearInterval(id);
        pixel.removeMessageListener("batteryLevel", batteryLevelListener);
        setBatteryLevel(undefined);
      };
    }
  }, [active, alwaysActive, pixel, refreshInterval]);

  return [batteryLevel, dispatch];
}
