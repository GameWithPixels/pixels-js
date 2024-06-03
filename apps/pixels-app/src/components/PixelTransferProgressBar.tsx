import { usePixelProp } from "@systemic-games/react-native-pixels-connect";
import React from "react";
import { View, ViewStyle } from "react-native";
import { useTheme } from "react-native-paper";

import { useSelectedPairedDie, useWatchedPixel } from "~/hooks";

export function PixelTransferProgressBar({
  style,
  innerPadding = 1,
}: {
  style?: ViewStyle;
  innerPadding?: number;
}) {
  const pixel = useWatchedPixel(useSelectedPairedDie());
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
            paddingVertical: innerPadding,
          },
          style,
        ]}
      >
        <View
          style={{
            width: `${progress}%`,
            height: "100%",
            backgroundColor: colors.primary,
            opacity: (progress + 20) / 120,
          }}
        />
      </View>
    )
  );
}
