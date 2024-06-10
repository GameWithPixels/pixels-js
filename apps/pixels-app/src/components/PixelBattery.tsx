import {
  PixelInfoNotifier,
  usePixelInfoProp,
} from "@systemic-games/react-native-pixels-connect";

import { BatteryIcon } from "./icons";

export function PixelBattery({
  pixel,
  size,
  disabled,
}: {
  pixel?: PixelInfoNotifier;
  size: number;
  disabled?: boolean;
}) {
  const level = usePixelInfoProp(pixel, "batteryLevel");
  return (
    <BatteryIcon value={level} size={size} disabled={!pixel || disabled} />
  );
}
