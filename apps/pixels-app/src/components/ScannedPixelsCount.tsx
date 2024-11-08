import React from "react";
import { View, ViewProps } from "react-native";
import { ActivityIndicator, Text } from "react-native-paper";

import { usePixelScannerStatus } from "~/hooks";

export function ScannedPixelsCount({
  diceCount,
  style,
  ...props
}: { diceCount: number; largeText?: boolean } & ViewProps) {
  const isScanning = usePixelScannerStatus() === "scanning";
  return (
    <View
      style={[{ flexDirection: "row", alignItems: "center", gap: 20 }, style]}
      {...props}
    >
      <View>
        {diceCount > 0 && (
          <Text variant="bodyLarge" style={{ flexShrink: 1 }}>
            Found {diceCount} available Pixels {diceCount <= 1 ? "die" : "dice"}
            .
          </Text>
        )}
        <Text variant="bodyLarge">
          Scanning for {diceCount > 0 ? "more" : "Pixels"} dice...
        </Text>
      </View>
      <ActivityIndicator animating={isScanning} />
    </View>
  );
}
