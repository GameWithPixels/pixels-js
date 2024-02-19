import { MaterialCommunityIcons } from "@expo/vector-icons";
import { TextProps } from "react-native";

import { iOSBorderRadiusFix } from "~/fixes";

export function ChevronDownIcon({
  size,
  color,
  backgroundColor,
  style,
  ...props
}: {
  size: number;
  color: string;
  backgroundColor?: string;
} & TextProps) {
  return (
    <MaterialCommunityIcons
      name="chevron-down"
      size={size}
      color={color}
      style={[
        {
          ...iOSBorderRadiusFix,
          borderRadius: size / 2,
          backgroundColor,
          textAlign: "center",
          textAlignVertical: "center",
        },
        style,
      ]}
      {...props}
    />
  );
}
