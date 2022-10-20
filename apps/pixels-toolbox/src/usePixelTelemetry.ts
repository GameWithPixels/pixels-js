import {
  Pixel,
  MessageOrType,
  Telemetry,
  RequestTelemetry,
} from "@systemic-games/react-native-pixels-connect";
import { useCallback, useEffect, useState } from "react";

import usePixelStatus from "./usePixelStatus";

export default function (
  pixel?: Pixel,
  alwaysActive = false
): [Telemetry | undefined, (action: "start" | "stop") => void] {
  const [telemetry, setTelemetry] = useState<Telemetry>();
  const [active, setActive] = useState(false);
  const status = usePixelStatus(pixel);
  const dispatch = useCallback(
    (action: "start" | "stop") => setActive(action === "start"),
    [setActive]
  );

  useEffect(() => {
    if (pixel && status === "ready" && (active || alwaysActive)) {
      const telemetryListener = (msg: MessageOrType) =>
        setTelemetry(msg as Telemetry);
      pixel.addMessageListener("Telemetry", telemetryListener);
      // Send request and ignore any error as the connection state
      // might change at any moment and make sendMessage throw an exception
      const msg = new RequestTelemetry();
      msg.activate = true;
      pixel.sendMessage(msg).catch(() => {});
      return () => {
        pixel.removeMessageListener("Telemetry", telemetryListener);
        pixel.sendMessage(new RequestTelemetry()).catch(() => {});
        setTelemetry(undefined);
      };
    }
  }, [active, alwaysActive, pixel, status]);

  return [telemetry, dispatch];
}
