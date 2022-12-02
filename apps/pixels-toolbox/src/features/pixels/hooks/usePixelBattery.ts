import {
  Pixel,
  MessageOrType,
  MessageTypeValues,
  BatteryLevel,
} from "@systemic-games/react-native-pixels-connect";
import { useCallback, useEffect, useState } from "react";

import usePixelStatus from "./usePixelStatus";

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
): [BatteryInfo | undefined, (action: "start" | "stop") => void, Error?] {
  const status = usePixelStatus(pixel);
  const [lastError, setLastError] = useState<Error>();
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
    if (pixel && status === "ready" && (active || alwaysActive)) {
      const batteryLevelListener = (msg: MessageOrType) => {
        const bl = msg as BatteryLevel;
        setBatteryLevel({
          level: Math.round(bl.level * 100),
          isCharging: bl.charging,
          voltage: bl.voltage,
        });
      };
      pixel.addMessageListener("batteryLevel", batteryLevelListener);
      const requestBatteryLevel = () => {
        // Send request and ignore any error as the connection state
        // might change at any moment and make sendMessage throw an exception
        pixel
          .sendMessage(MessageTypeValues.requestBatteryLevel)
          .catch(setLastError);
      };
      requestBatteryLevel();
      const id = setInterval(requestBatteryLevel, refreshInterval);
      return () => {
        clearInterval(id);
        pixel.removeMessageListener("batteryLevel", batteryLevelListener);
        setBatteryLevel(undefined);
      };
    }
  }, [active, alwaysActive, pixel, refreshInterval, status]);

  return [batteryLevel, dispatch, lastError];
}
