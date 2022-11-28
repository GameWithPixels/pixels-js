import { Icon } from "native-base";
import { ColorType } from "native-base/lib/typescript/components/types";
import React from "react";
// eslint-disable-next-line import/namespace
import { PixelRatio } from "react-native";

export type IconParams = {
  category: any;
  iconName: string;
};

export interface PercentageDisplayProps {
  percentage: number;
  icons: IconParams[]; //icons must be stored as : first icon = empty percentage,[...], last icon = full percentage
  colors?: ColorType[]; //colors must be stored as : first color = empty percentage color,[...], last color = full percentage color
  size: number;
}

// Compute index based on the arraylength and the current percentage value
function computeIndex(percentage: number, arrayLength: number): number {
  const ratio = arrayLength > 0 ? 100 / arrayLength : 1;
  const tempIndex = Math.round(percentage / ratio);
  const index =
    Math.max(0, tempIndex) >= arrayLength
      ? Math.max(arrayLength - 1, 0)
      : tempIndex;
  return index;
}

export function PercentageDisplayComponent({
  colors = ["red.900", "orange.900", "green.900"],
  size,
  percentage,
  icons,
}: PercentageDisplayProps) {
  const NbOfIcons = icons.length;
  const NbOfColors = colors.length;
  const iconIndex = computeIndex(percentage, NbOfIcons);
  const colorIndex = computeIndex(percentage, NbOfColors);

  const iconSize = PixelRatio.getPixelSizeForLayoutSize(size);
  return (
    <Icon
      as={icons[iconIndex].category}
      name={icons[iconIndex].iconName}
      color={colors[colorIndex]}
      size={iconSize}
    />
  );
}
