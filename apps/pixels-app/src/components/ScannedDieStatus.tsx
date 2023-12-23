import { PixelInfo } from "@systemic-games/react-native-pixels-connect";
import { View, ViewProps } from "react-native";
import { Text } from "react-native-paper";

import { getDieTypeAndColorwayLabel } from "~/descriptions";

export function DieStaticInfo({
  pixel,
  style,
  ...props
}: { pixel: Pick<PixelInfo, "name" | "dieType" | "colorway"> } & Omit<
  ViewProps,
  "children"
>) {
  return (
    <View
      style={[{ flex: 1, justifyContent: "space-around" }, style]}
      {...props}
    >
      <Text variant="bodyLarge">{pixel.name}</Text>
      <Text>{getDieTypeAndColorwayLabel(pixel)}</Text>
    </View>
  );
}
