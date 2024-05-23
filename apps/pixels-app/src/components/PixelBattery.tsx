import {
  Pixel,
  usePixelProp,
} from "@systemic-games/react-native-pixels-connect";

import { BatteryIcon } from "./icons";

export function PixelBattery({
  pixel,
  size,
  disabled,
}: {
  pixel: Pixel;
  size: number;
  disabled?: boolean;
}) {
  const level = usePixelProp(pixel, "batteryLevel");
  return <BatteryIcon value={level} size={size} disabled={disabled} />;
}
