import { Pixel } from "@systemic-games/react-native-pixels-connect";
import { Badge, BadgeProps } from "react-native-paper";

import { useHasFirmwareUpdate } from "~/hooks";

export function FirmwareUpdateBadge({
  pixel,
  ...props
}: { pixel: Pixel } & Omit<BadgeProps, "children">) {
  return useHasFirmwareUpdate(pixel) ? <Badge {...props}>!</Badge> : null;
}
