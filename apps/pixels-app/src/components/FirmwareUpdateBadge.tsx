import { TextProps } from "react-native";

import FirmwareUpdateIcon from "#/icons/dice/firmware-update";
import { PairedDie } from "~/app/PairedDie";
import { useHasFirmwareUpdate } from "~/hooks";

export function FirmwareUpdateBadge({
  pairedDie,
  ...props
}: {
  pairedDie: Pick<PairedDie, "pixelId">;
} & Omit<TextProps, "children">) {
  return useHasFirmwareUpdate(pairedDie) ? (
    <FirmwareUpdateIcon size={20} color="#f3bb02" {...props} />
  ) : null;
}
