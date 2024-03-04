import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
} from "@gorhom/bottom-sheet";
import { ColorUtils } from "@systemic-games/react-native-pixels-connect";
import React from "react";
import { IconButton, Text, ThemeProvider, useTheme } from "react-native-paper";
import { RootSiblingParent } from "react-native-root-siblings";

import { ColorWheel } from "./ColorWheel";

import { bottomSheetAnimationConfigFix } from "~/fixes";
import { useBottomSheetPadding } from "~/hooks";
import { useBottomSheetBackHandler } from "~/hooks/useBottomSheetBackHandler";
import { AppStyles } from "~/styles";
import { getBottomSheetBackgroundStyle } from "~/themes";

export function PickColorBottomSheet({
  color,
  onSelectColor,
  visible,
  onDismiss,
}: {
  color?: Readonly<ColorUtils.IColor>;
  onSelectColor?: (color: ColorUtils.IColor) => void;
  onDismiss: () => void;
  visible: boolean;
}) {
  const sheetRef = React.useRef<BottomSheetModal>(null);
  const onChange = useBottomSheetBackHandler(sheetRef);
  React.useEffect(() => {
    if (visible) {
      sheetRef.current?.present();
    } else {
      sheetRef.current?.dismiss();
    }
  }, [visible]);
  const paddingBottom = useBottomSheetPadding();
  const theme = useTheme();
  const { colors } = theme;
  return (
    <BottomSheetModal
      ref={sheetRef}
      stackBehavior="push"
      enableDynamicSizing
      onDismiss={onDismiss}
      onChange={onChange}
      animationConfigs={bottomSheetAnimationConfigFix}
      backgroundStyle={getBottomSheetBackgroundStyle()}
      backdropComponent={(props) => (
        <BottomSheetBackdrop
          appearsOnIndex={0}
          disappearsOnIndex={-1}
          pressBehavior="close"
          {...props}
        />
      )}
    >
      <RootSiblingParent>
        <ThemeProvider theme={theme}>
          <BottomSheetScrollView
            contentContainerStyle={{
              paddingHorizontal: 10,
              paddingBottom,
              gap: 20,
            }}
          >
            <Text variant="titleMedium" style={AppStyles.selfCentered}>
              Select Color
            </Text>
            <ColorWheel
              color={color}
              style={{ width: "100%", alignItems: "center", gap: 20 }}
              onColorChange={onSelectColor}
            />
          </BottomSheetScrollView>
          <IconButton
            icon="close"
            iconColor={colors.primary}
            sentry-label="close-pick-color"
            style={{ position: "absolute", right: 0, top: -15 }}
            onPress={onDismiss}
          />
        </ThemeProvider>
      </RootSiblingParent>
    </BottomSheetModal>
  );
}
