import {
  Pixel,
  MessageOrType,
  Telemetry,
  RequestTelemetry,
} from "@systemic-games/react-native-pixels-connect";
import { useCallback, useEffect, useRef, useState } from "react";

import usePixelStatus from "./usePixelStatus";

// Returned dispatch function is stable
export default function (
  pixel?: Pixel,
  options?: {
    refreshInterval?: number;
    alwaysActive?: boolean;
  }
): [
  Telemetry | undefined,
  (action: "start" | "stop") => void,
  Error | undefined
] {
  const [lastError, setLastError] = useState<Error>();
  const [telemetry, setTelemetry] = useState<Telemetry>();
  const telemetryRef = useRef<Telemetry>();
  const [active, setActive] = useState(false);
  const status = usePixelStatus(pixel);
  const dispatch = useCallback(
    (action: "start" | "stop") => setActive(action === "start"),
    []
  );

  // Options default values
  const refreshInterval = options?.refreshInterval ?? 1000;
  const alwaysActive = options?.alwaysActive ?? false;

  useEffect(() => {
    if (pixel && status === "ready" && (active || alwaysActive)) {
      setLastError(undefined);
      const telemetryListener = (msg: MessageOrType) =>
        (telemetryRef.current = msg as Telemetry);
      pixel.addMessageListener("telemetry", telemetryListener);
      // Send request and ignore any error as the connection state
      // might change at any moment and make sendMessage throw an exception
      const msg = new RequestTelemetry();
      msg.activate = true;
      pixel.sendMessage(msg).catch(setLastError);
      // Setup batch updates
      const intervalId = setInterval(() => {
        if (telemetryRef.current) {
          setTelemetry(telemetryRef.current);
        }
      }, refreshInterval);
      return () => {
        clearInterval(intervalId);
        pixel.removeMessageListener("telemetry", telemetryListener);
        pixel.sendMessage(new RequestTelemetry()).catch(setLastError);
        setTelemetry(undefined);
      };
    }
  }, [active, alwaysActive, pixel, refreshInterval, status]);

  return [telemetry, dispatch, lastError];
}
