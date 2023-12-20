import { PixelInfo } from "@systemic-games/react-native-pixels-connect";
import { View, ViewProps } from "react-native";
import { Text } from "react-native-paper";

import { getDieTypeLabel, getColorwayLabel } from "~/descriptions";

export function DieStaticInfo({
  pixel,
  style,
  ...props
}: { pixel: PixelInfo } & ViewProps) {
  return (
    <View
      style={[{ flex: 1, justifyContent: "space-around" }, style]}
      {...props}
    >
      <Text variant="bodyLarge">{pixel.name}</Text>
      <Text>
        {getDieTypeLabel(pixel.dieType)}, {getColorwayLabel(pixel.colorway)}
      </Text>
    </View>
  );
}
