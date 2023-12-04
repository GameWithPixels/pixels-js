import React from "react";
import { ImageBackground } from "react-native";
import { useTheme } from "react-native-paper";

import { backgroundImageFromColor } from "~/themes";

export function AppBackground({ children }: React.PropsWithChildren) {
  const { colors } = useTheme();
  return (
    <ImageBackground
      style={{
        flex: 1,
        backgroundColor: colors.background,
      }}
      resizeMode="cover"
      source={backgroundImageFromColor(colors.primary)}
      children={children}
    />
  );
}
