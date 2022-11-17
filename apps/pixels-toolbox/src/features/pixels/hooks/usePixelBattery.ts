import {
  Pixel,
  MessageOrType,
  MessageTypeValues,
  BatteryLevel,
} from "@systemic-games/react-native-pixels-connect";
import { useCallback, useEffect, useState } from "react";

export default function (
  pixel?: Pixel,
  refreshPeriod = 1000,
  alwaysActive = false
): [BatteryLevel | undefined, (action: "start" | "stop") => void] {
  const [batteryLevel, setBatteryLevel] = useState<BatteryLevel>();
  const [active, setActive] = useState(false);
  const dispatch = useCallback(
    (action: "start" | "stop") => setActive(action === "start"),
    [setActive]
  );

  useEffect(() => {
    if (pixel && (active || alwaysActive)) {
      const batteryLevelListener = (msg: MessageOrType) =>
        setBatteryLevel(msg as BatteryLevel);
      pixel.addMessageListener("batteryLevel", batteryLevelListener);
      const id = setInterval(() => {
        if (pixel.status === "ready") {
          // Send request and ignore any error as the connection state
          // might change at any moment and make sendMessage throw an exception
          pixel
            .sendMessage(MessageTypeValues.requestBatteryLevel)
            .catch(() => {});
        }
      }, refreshPeriod);
      return () => {
        clearInterval(id);
        pixel.removeMessageListener("batteryLevel", batteryLevelListener);
        setBatteryLevel(undefined);
      };
    }
  }, [active, alwaysActive, pixel, refreshPeriod]);

  return [batteryLevel, dispatch];
}
