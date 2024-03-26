import { AntDesign } from "@expo/vector-icons";
import { TextProps } from "react-native";
import { useTheme } from "react-native-paper";

import { PairedDie } from "~/app/PairedDie";
import { useHasFirmwareUpdate } from "~/hooks";

export function FirmwareUpdateBadge({
  pairedDie,
  ...props
}: {
  pairedDie: Pick<PairedDie, "pixelId">;
} & Omit<TextProps, "children">) {
  const { colors } = useTheme();
  return useHasFirmwareUpdate(pairedDie) ? (
    <AntDesign
      name="exclamationcircle"
      size={20}
      color={colors.onErrorContainer}
      {...props}
    />
  ) : null;
}
