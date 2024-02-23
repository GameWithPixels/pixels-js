// FIX this file contain various fixes for React Native or other external libraries

import { ANIMATION_CONFIGS } from "@gorhom/bottom-sheet";
import * as Updates from "expo-updates";
import { Platform } from "react-native";
import { ReduceMotion } from "react-native-reanimated";

// https://github.com/facebook/react-native/issues/15114
// https://www.reactnativeschool.com/fix-react-native-text-cutoff-on-oneplus-oppo-devices
export const TrailingSpaceFix = " ";

export const iOSBorderRadiusFix = {
  overflow: "hidden", // For border radius to work on iOS
} as const;

export function fixForScrollViewPadding(padding: number): void {
  console.log("Need this log for padding to work" + padding);
}

// https://github.com/gorhom/react-native-bottom-sheet/issues/372#issuecomment-808793366
export const androidBottomSheetSliderFix = {
  activeOffsetY: Platform.OS === "android" ? [-1, 1] : undefined,
  failOffsetX: Platform.OS === "android" ? [-5, 5] : undefined,
};

// https://github.com/gorhom/react-native-bottom-sheet/issues/1674#issuecomment-1959923945
export const bottomSheetAnimationConfigFix = {
  ...ANIMATION_CONFIGS,
  reduceMotion: ReduceMotion.Never,
};

export function isErrorNoUpdatePublished(error?: string): boolean {
  // We get this error is there is no published update for this build
  return (
    Updates.isEmbeddedLaunch &&
    !!error?.startsWith("Failed to download manifest from URL")
  );
}
