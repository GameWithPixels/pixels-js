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
      <Text variant="bodyLarge" style={{ flexShrink: 1 }}>
        {diceCount
          ? `Found ${diceCount} available Pixels ${
              diceCount <= 1 ? "die" : "dice"
            } so far, scanning for more...`
          : "Scanning for Pixels dice..."}
      </Text>
      <ActivityIndicator animating={isScanning} />
    </View>
  );
}
