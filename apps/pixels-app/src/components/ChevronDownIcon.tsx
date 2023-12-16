import { MaterialCommunityIcons } from "@expo/vector-icons";
import { TextProps } from "react-native";

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
          borderRadius: size / 2,
          overflow: "hidden", // For border radius to work on iOS
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
