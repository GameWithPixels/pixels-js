import {
  Pixel,
  usePixelValue,
} from "@systemic-games/react-native-pixels-connect";

import { RssiIcon } from "./icons";

export function PixelRssi({
  pixel,
  size,
  disabled,
}: {
  pixel: Pixel;
  size: number;
  disabled?: boolean;
}) {
  const [rssi] = usePixelValue(pixel, "rssi");
  return <RssiIcon value={rssi} size={size} disabled={disabled} />;
}
