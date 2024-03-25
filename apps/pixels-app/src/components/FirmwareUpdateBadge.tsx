import { Pixel } from "@systemic-games/react-native-pixels-connect";
import { Badge, BadgeProps } from "react-native-paper";

import { useHasFirmwareUpdate } from "~/hooks";

export function FirmwareUpdateBadge({
  pixel,
  ...props
}: { pixel: Pixel } & Omit<BadgeProps, "children">) {
  const hasFirmwareUpdate = useHasFirmwareUpdate(pixel);
  return hasFirmwareUpdate ? <Badge {...props}>!</Badge> : null;
}
