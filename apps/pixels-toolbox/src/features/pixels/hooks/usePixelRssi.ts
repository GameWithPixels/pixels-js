import {
  Pixel,
  MessageOrType,
  MessageTypeValues,
  Rssi,
} from "@systemic-games/react-native-pixels-connect";
import { useCallback, useEffect, useState } from "react";

// Returned dispatch function is stable
export default function (
  pixel?: Pixel,
  refreshPeriod = 1000,
  alwaysActive = false
): [Rssi | undefined, (action: "start" | "stop") => void, Error?] {
  const [lastError, setLastError] = useState<Error>();
  const [rssi, setRssi] = useState<Rssi>();
  const [active, setActive] = useState(false);
  const dispatch = useCallback(
    (action: "start" | "stop") => setActive(action === "start"),
    []
  );

  useEffect(() => {
    setLastError(undefined);
    if (pixel && (active || alwaysActive)) {
      const rssiListener = (msg: MessageOrType) => setRssi(msg as Rssi);
      pixel.addMessageListener("rssi", rssiListener);
      const id = setInterval(() => {
        if (pixel.status === "ready") {
          // Send request and ignore any error as the connection state
          // might change at any moment and make sendMessage throw an exception
          pixel.sendMessage(MessageTypeValues.requestRssi).catch(setLastError);
        }
      }, refreshPeriod);
      return () => {
        clearInterval(id);
        pixel.removeMessageListener("rssi", rssiListener);
        setRssi(undefined);
      };
    }
  }, [active, alwaysActive, pixel, refreshPeriod]);

  return [rssi, dispatch, lastError];
}
