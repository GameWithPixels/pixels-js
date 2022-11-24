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
  options?: {
    refreshInterval?: number;
    alwaysActive?: boolean;
  }
): [number | undefined, (action: "start" | "stop") => void, Error?] {
  const [lastError, setLastError] = useState<Error>();
  const [rssi, setRssi] = useState<number>();
  const [active, setActive] = useState(false);
  const dispatch = useCallback(
    (action: "start" | "stop") => setActive(action === "start"),
    []
  );

  // Options default values
  const refreshInterval = options?.refreshInterval ?? 1000;
  const alwaysActive = options?.alwaysActive ?? false;

  useEffect(() => {
    setLastError(undefined);
    if (pixel && (active || alwaysActive)) {
      const rssiListener = (msg: MessageOrType) => setRssi((msg as Rssi).value);
      pixel.addMessageListener("rssi", rssiListener);
      const id = setInterval(() => {
        if (pixel.status === "ready") {
          // Send request and ignore any error as the connection state
          // might change at any moment and make sendMessage throw an exception
          pixel.sendMessage(MessageTypeValues.requestRssi).catch(setLastError);
        }
      }, refreshInterval);
      return () => {
        clearInterval(id);
        pixel.removeMessageListener("rssi", rssiListener);
        setRssi(undefined);
      };
    }
  }, [active, alwaysActive, pixel, refreshInterval]);

  return [rssi, dispatch, lastError];
}
