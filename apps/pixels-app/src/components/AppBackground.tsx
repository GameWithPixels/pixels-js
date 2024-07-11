import { ActionSheetProvider } from "@expo/react-native-action-sheet";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import React from "react";
import { ImageBackground } from "react-native";
import { Portal, useTheme } from "react-native-paper";
import { RootSiblingParent } from "react-native-root-siblings";

import { backgroundImageFromColor } from "~/app/themes";

function ImgBackground({ children }: { children: React.ReactNode }) {
  const { colors } = useTheme();
  return (
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
  );
}

export function AppBackground({
  children,
  topLevel,
}: React.PropsWithChildren<{
  topLevel?: boolean;
}>) {
  return (
    <RootSiblingParent>
      <Portal.Host>
        {topLevel ? (
          <ImgBackground>{children}</ImgBackground>
        ) : (
          <ActionSheetProvider>
            <BottomSheetModalProvider>
              <ImgBackground>{children}</ImgBackground>
            </BottomSheetModalProvider>
          </ActionSheetProvider>
        )}
      </Portal.Host>
    </RootSiblingParent>
  );
}
