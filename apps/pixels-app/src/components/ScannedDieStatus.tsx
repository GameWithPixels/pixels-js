import { PixelInfo } from "@systemic-games/react-native-pixels-connect";
import { View, ViewProps } from "react-native";
import { Text, useTheme } from "react-native-paper";

import { getTextColorStyle } from "./colors";

import { getDieTypeAndColorwayLabel } from "~/features/profiles";

export function DieStaticInfo({
  children,
  pixel,
  disabled,
  style,
  ...props
}: {
  pixel: Pick<PixelInfo, "name" | "dieType" | "colorway">;
  disabled?: boolean;
} & ViewProps) {
  const { colors } = useTheme();
  const textColor = getTextColorStyle(colors, disabled);
  return (
    <View
      style={[{ flex: 1, justifyContent: "space-around" }, style]}
      {...props}
    >
      <Text variant="bodyLarge" style={textColor}>
        {pixel.name}
      </Text>
      <Text style={textColor}>{getDieTypeAndColorwayLabel(pixel)}</Text>
      {children}
    </View>
  );
}
