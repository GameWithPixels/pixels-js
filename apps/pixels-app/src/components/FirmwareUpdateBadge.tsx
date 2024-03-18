import { AntDesign } from "@expo/vector-icons";
import { Pixel } from "@systemic-games/react-native-pixels-connect";
import { TextProps } from "react-native";
import { useTheme } from "react-native-paper";

import { useHasFirmwareUpdate } from "~/hooks";

export function FirmwareUpdateBadge({
  pixel,
  ...props
}: { pixel: Pixel } & Omit<TextProps, "children">) {
  const { colors } = useTheme();
  return useHasFirmwareUpdate(pixel) ? (
    <AntDesign
      name="exclamationcircle"
      size={20}
      color={colors.onErrorContainer}
      {...props}
    />
  ) : null;
}
