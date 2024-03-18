import { PixelInfoNotifier } from "@systemic-games/react-native-pixels-connect";
import React from "react";

export function useBatteryStateLabel(
  pixel: PixelInfoNotifier
): string | undefined {
  const [battery, setBattery] = React.useState(pixel.batteryLevel);
  const [charging, setCharging] = React.useState(pixel.isCharging);
  React.useEffect(() => {
    const onBattery = () => setBattery(pixel.batteryLevel);
    onBattery();
    pixel.addPropertyListener("batteryLevel", onBattery);
    const onCharging = () => setCharging(pixel.isCharging);
    onCharging();
    pixel.addPropertyListener("isCharging", onCharging);
    return () => {
      pixel.removePropertyListener("batteryLevel", onBattery);
      pixel.removePropertyListener("isCharging", onCharging);
    };
  }, [pixel]);
  // TODO Set battery to -1 on Pixel initial state
  return battery > 0
    ? `Battery: ${battery}%${charging ? "⚡" : ""}`
    : undefined;
}
