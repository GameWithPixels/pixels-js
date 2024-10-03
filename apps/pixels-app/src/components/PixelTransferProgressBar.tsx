import {
  Pixel,
  usePixelProp,
} from "@systemic-games/react-native-pixels-connect";
import React from "react";
import { StyleProp, View, ViewStyle } from "react-native";
import { useTheme } from "react-native-paper";

import { useSelectedPairedDie, useRegisteredPixel } from "~/hooks";

export function PixelTransferProgressBar({
  pixel,
  style,
}: {
  pixel: Pixel;
  style?: StyleProp<ViewStyle>;
}) {
  const progress =
    usePixelProp(pixel, "transferProgress")?.progressPercent ?? -1;
  const { colors } = useTheme();
  return (
    progress >= 0 &&
    progress < 100 && (
      <View
        style={[
          {
            backgroundColor: colors.surfaceDisabled,
          },
          style,
        ]}
      >
        <View
          style={{
            alignSelf: "center",
            height: "100%",
            width: `${progress}%`,
            backgroundColor: colors.primary,
            opacity: 0.2 + progress / 80,
          }}
        />
      </View>
    )
  );
}

export function SelectedPixelTransferProgressBar({
  style,
}: {
  style?: ViewStyle;
}) {
  const pixel = useRegisteredPixel(useSelectedPairedDie());
  return pixel ? (
    <PixelTransferProgressBar
      style={[
        {
          position: "absolute",
          top: 50,
          height: 5,
          width: "99%",
          alignSelf: "center",
          padding: 1,
        },
        style,
      ]}
      pixel={pixel}
    />
  ) : null;
}
