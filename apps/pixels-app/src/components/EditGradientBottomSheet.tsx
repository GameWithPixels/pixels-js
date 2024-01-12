import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
} from "@gorhom/bottom-sheet";
import { getBorderRadius } from "@systemic-games/react-native-pixels-components";
import { Profiles } from "@systemic-games/react-native-pixels-connect";
import React from "react";
import { StyleSheet, View } from "react-native";
import {
  Text,
  ThemeProvider,
  TouchableRipple,
  useTheme,
} from "react-native-paper";

import { ColorWheel } from "./ColorWheel";
import { KeyframeGradient } from "./KeyframeGradient";

import { useBottomSheetPadding } from "~/hooks";
import { useBottomSheetBackHandler } from "~/hooks/useBottomSheetBackHandler";
import { AppStyles } from "~/styles";
import { getBottomSheetBackgroundStyle } from "~/themes";

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
  const filteredKeyframes = React.useMemo(
    () =>
      keyframes.filter(
        (kf) =>
          (kf.time !== 0 && kf.time !== 1) ||
          !kf.color.equals(Profiles.Color.black)
      ),
    [keyframes]
  );
  const [selectedKeyframe, setSelectedKeyframe] = React.useState(0);
  const color =
    filteredKeyframes[selectedKeyframe]?.color ?? Profiles.Color.black;

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
  const borderRadius = getBorderRadius(theme.roundness);
  return (
    <BottomSheetModal
      ref={sheetRef}
      stackBehavior="push"
      enableDynamicSizing
      backgroundStyle={getBottomSheetBackgroundStyle()}
      onDismiss={onDismiss}
      onChange={onChange}
      backdropComponent={(props) => (
        <BottomSheetBackdrop
          appearsOnIndex={0}
          disappearsOnIndex={-1}
          pressBehavior="close"
          {...props}
        />
      )}
    >
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
          <Text style={AppStyles.selfCentered}>
            Tap on circle to modify color
          </Text>
          <View
            style={{
              overflow: "hidden",
              flexGrow: 1,
              height: 32,
              alignItems: "center",
              justifyContent: "center",
              margin: 10,
              borderRadius,
            }}
          >
            <KeyframeGradient keyframes={keyframes} />
            <View style={StyleSheet.absoluteFill}>
              {filteredKeyframes.map((kf, i) => (
                <TouchableRipple
                  key={kf.time}
                  style={{
                    position: "absolute",
                    left: `${kf.time * 100}%`,
                    marginLeft: -16,
                    width: 32,
                    aspectRatio: 1,
                    borderRadius: 16,
                    borderWidth: 2,
                    borderColor:
                      selectedKeyframe === i
                        ? theme.colors.primary
                        : theme.colors.onSurface,
                  }}
                  onPress={() => setSelectedKeyframe(i)}
                >
                  <></>
                </TouchableRipple>
              ))}
            </View>
          </View>
          <ColorWheel
            color={color}
            style={{ width: "100%", alignItems: "center", gap: 20 }}
            onColorChange={(c) => {
              const i = keyframes.indexOf(filteredKeyframes[selectedKeyframe]);
              if (onChangeKeyframes && i >= 0) {
                const newKeyframes = [...keyframes];
                newKeyframes[i] = {
                  ...newKeyframes[i],
                  color: new Profiles.Color(c),
                };
                onChangeKeyframes(newKeyframes);
              }
            }}
          />
        </BottomSheetScrollView>
      </ThemeProvider>
    </BottomSheetModal>
  );
}
