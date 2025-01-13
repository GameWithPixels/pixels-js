import React from "react";
import { StyleProp, ViewStyle } from "react-native";
import { ActivityIndicator } from "react-native-paper";

import { usePixelScannerStatus } from "~/hooks";

export function ScanningIndicator({ style }: { style?: StyleProp<ViewStyle> }) {
  const isScanning = usePixelScannerStatus() === "scanning";
  return (
    <ActivityIndicator animating={isScanning} size="small" style={style} />
  );
}
