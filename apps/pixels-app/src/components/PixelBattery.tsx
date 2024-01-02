import {
  Pixel,
  usePixelValue,
} from "@systemic-games/react-native-pixels-connect";

import { BatteryIcon } from "./icons";

export function PixelBattery({
  pixel,
  size,
  disabled,
}: {
  pixel: Pixel;
  size: number;
  disabled: boolean;
}) {
  const [battery] = usePixelValue(pixel, "battery");
  return <BatteryIcon value={battery?.level} size={size} disabled={disabled} />;
}
