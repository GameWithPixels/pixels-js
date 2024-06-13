import { ActionSheetProvider } from "@expo/react-native-action-sheet";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import React from "react";
import { ImageBackground } from "react-native";
import { Portal, useTheme } from "react-native-paper";
import { RootSiblingParent } from "react-native-root-siblings";

import { backgroundImageFromColor } from "~/themes";

export function AppBackground({ children }: React.PropsWithChildren) {
  const { colors } = useTheme();
  return (
    <RootSiblingParent>
      <Portal.Host>
        <ActionSheetProvider>
          <BottomSheetModalProvider>
            <ImageBackground
              style={{
                flex: 1,
                backgroundColor: colors.background,
              }}
              resizeMode="cover"
              source={backgroundImageFromColor(colors.primary)}
            >
              {children}
            </ImageBackground>
          </BottomSheetModalProvider>
        </ActionSheetProvider>
      </Portal.Host>
    </RootSiblingParent>
  );
}
