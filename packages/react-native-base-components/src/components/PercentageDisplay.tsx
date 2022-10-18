import { Icon } from "native-base";
import {
  ColorType,
  SizeType,
} from "native-base/lib/typescript/components/types";
import React from "react";

export type IconParams = {
  category: any;
  iconName: string;
};

export interface PercentageDisplayProps {
  percentage: number;
  icons: IconParams[]; //icons must be stored as : first icon = empty percentage,[...], last icon = full percentage
  colors?: ColorType[]; //colors must be stored as : first color = empty percentage color,[...], last color = full percentage color
  size?: SizeType;
}

// Compute index based on the arraylength and the current percentage value
function computeIndex(percentage: number, arrayLength: number): number {
  let tempIndex = 0;
  let ratio = 0;
  let index = 0;

  ratio = 100 / arrayLength;
  tempIndex = Math.ceil(percentage / ratio);
  index = tempIndex >= arrayLength ? tempIndex - 1 : tempIndex;
  return index;
}

export function PercentageDisplayComponent({
  colors = ["green.900", "orange.900", "red.900"],
  size,
  percentage,
  icons,
}: PercentageDisplayProps) {
  const NbOfIcons = icons.length;
  const NbOfColors = colors.length;
  // TODO compute icon and color index based on their respective array length
  const iconIndex = computeIndex(percentage, NbOfIcons);
  const colorIndex = computeIndex(percentage, NbOfColors);
  return (
    <Icon
      as={icons[iconIndex].category}
      name={icons[iconIndex].iconName}
      color={colors[colorIndex]}
      size={size}
    />
  );
}
