import React from "react";
import { ImageBackground } from "react-native";
import { useTheme } from "react-native-paper";
import { RootSiblingParent } from "react-native-root-siblings";

import { backgroundImageFromColor } from "~/themes";

export function AppBackground({ children }: React.PropsWithChildren) {
  const { colors } = useTheme();
  return (
    <RootSiblingParent>
      <ImageBackground
        style={{
          flex: 1,
          backgroundColor: colors.background,
        }}
        resizeMode="cover"
        source={backgroundImageFromColor(colors.primary)}
        children={children}
      />
    </RootSiblingParent>
  );
}
