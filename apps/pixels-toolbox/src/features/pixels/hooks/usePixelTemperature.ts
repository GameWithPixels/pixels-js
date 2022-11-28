import {
    Pixel,
    MessageOrType,
    MessageTypeValues,
    Temperature,
  } from "@systemic-games/react-native-pixels-connect";
  import { useCallback, useEffect, useState } from "react";
  
  interface TemperatureInfo {
    temperature: number; // in Celsius
  }
  
  export default function (
    pixel?: Pixel,
    options?: {
      refreshInterval?: number;
      alwaysActive?: boolean;
    }
  ): [TemperatureInfo | undefined, (action: "start" | "stop") => void] {
    const [temperature, setTemperature] = useState<TemperatureInfo>();
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
        const temperatureListener = (msg: MessageOrType) => {
          const tmp = msg as Temperature;
          setTemperature({
            temperature: tmp.temperatureTimes100 / 100,
          });
        };
        pixel.addMessageListener("temperature", temperatureListener);
        const id = setInterval(() => {
          if (pixel.status === "ready") {
            // Send request and ignore any error as the connection state
            // might change at any moment and make sendMessage throw an exception
            pixel
              .sendMessage(MessageTypeValues.requestTemperature)
              .catch(() => {});
          }
        }, refreshInterval);
        return () => {
          clearInterval(id);
          pixel.removeMessageListener("temperature", temperatureListener);
          setTemperature(undefined);
        };
      }
    }, [active, alwaysActive, pixel, refreshInterval]);
  
    return [temperature, dispatch];
  }
  