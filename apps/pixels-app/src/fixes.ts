// FIX this file contain various fixes for React Native or other external libraries

import { Platform } from "react-native";

// https://github.com/facebook/react-native/issues/15114
// https://www.reactnativeschool.com/fix-react-native-text-cutoff-on-oneplus-oppo-devices
export const TrailingSpaceFix = " ";

export const iOSBorderRadiusFix = {
  overflow: "hidden", // For border radius to work on iOS
} as const;

export function fixForScrollViewPadding(padding: number): void {
  console.log("Need this log for padding to work" + padding);
}

export const androidBottomSheetSliderFix = {
  activeOffsetY: Platform.OS === "android" ? [-1, 1] : undefined,
  failOffsetX: Platform.OS === "android" ? [-5, 5] : undefined,
};
