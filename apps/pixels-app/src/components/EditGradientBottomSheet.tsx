import { BottomSheetModal, BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { Color, Profiles } from "@systemic-games/react-native-pixels-connect";
import React from "react";
import { StyleSheet, View } from "react-native";
import {
  Text,
  ThemeProvider,
  TouchableRipple,
  useTheme,
} from "react-native-paper";
import { RootSiblingParent } from "react-native-root-siblings";

import { ColorWheel } from "./ColorWheel";
import { KeyframeGradient } from "./KeyframeGradient";
import { BottomSheetModalCloseButton } from "./buttons";

import { AppStyles } from "~/app/styles";
import { getBottomSheetProps } from "~/app/themes";
import { getBorderRadius } from "~/features/getBorderRadius";
import { useBottomSheetBackHandler, useBottomSheetPadding } from "~/hooks";

export function EditGradientBottomSheet({
  keyframes,
  onChangeKeyframes,
  visible,
  onDismiss,
}: {
  keyframes: readonly Readonly<Profiles.RgbKeyframe>[];
  onChangeKeyframes?: (color: Profiles.RgbKeyframe[]) => void;
  onDismiss: () => void;
  visible: boolean;
}) {
  const [selectedKeyframe, setSelectedKeyframe] = React.useState(0);
  const color = keyframes[selectedKeyframe]?.color ?? Color.black;

  // Reset selected keyframe when sheet is opened
  React.useEffect(() => setSelectedKeyframe(0), [visible]);

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
  const borderRadius = getBorderRadius(theme.roundness);
  const height = 32;
  const radius = height / 2 + 2;
  return (
    <BottomSheetModal
      ref={sheetRef}
      stackBehavior="push"
      enableDynamicSizing
      onDismiss={onDismiss}
      onChange={onChange}
      {...getBottomSheetProps(colors)}
    >
      <RootSiblingParent>
        <ThemeProvider theme={theme}>
          <BottomSheetScrollView
            contentContainerStyle={{
              paddingHorizontal: 10,
              paddingBottom,
              gap: 10,
            }}
          >
            <Text variant="titleMedium" style={AppStyles.selfCentered}>
              Edit Gradient
            </Text>
            <Text
              style={{ alignSelf: "center", color: colors.onSurfaceDisabled }}
            >
              Tap on circle to modify color
            </Text>
            <View>
              <View
                style={{
                  overflow: "hidden",
                  flexGrow: 1,
                  height,
                  alignItems: "center",
                  justifyContent: "center",
                  margin: 10,
                  borderRadius,
                }}
              >
                <KeyframeGradient keyframes={keyframes} />
              </View>
              <View
                style={{
                  ...StyleSheet.absoluteFillObject,
                  margin: 10,
                }}
              >
                {keyframes.map((kf, i) => (
                  <TouchableRipple
                    key={kf.time}
                    style={{
                      position: "absolute",
                      left: `${kf.time * 100}%`,
                      marginTop: height / 2 - radius,
                      marginLeft: -radius,
                      width: 2 * radius,
                      aspectRatio: 1,
                      borderRadius: radius,
                      borderWidth: 3,
                      borderColor:
                        selectedKeyframe === i
                          ? colors.primary
                          : colors.onSurface,
                    }}
                    onPress={() => setSelectedKeyframe(i)}
                    children={<View />}
                  />
                ))}
              </View>
            </View>
            <ColorWheel
              color={color}
              style={{ width: "100%", alignItems: "center", gap: 20 }}
              onColorChange={(c) => {
                const i = keyframes.indexOf(keyframes[selectedKeyframe]);
                if (onChangeKeyframes && i >= 0) {
                  const newKeyframes = [...keyframes];
                  newKeyframes[i] = {
                    ...newKeyframes[i],
                    color: new Color(c),
                  };
                  onChangeKeyframes(newKeyframes);
                }
              }}
            />
          </BottomSheetScrollView>
          <BottomSheetModalCloseButton onPress={onDismiss} />
        </ThemeProvider>
      </RootSiblingParent>
    </BottomSheetModal>
  );
}
