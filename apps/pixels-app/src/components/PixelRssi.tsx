import {
  Pixel,
  usePixelEvent,
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
  const [rssi] = usePixelEvent(pixel, "rssi");
  return <RssiIcon value={rssi} size={size} disabled={disabled} />;
}
