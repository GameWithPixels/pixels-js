import { Icon, IIconProps } from "native-base";
import React from "react";
// eslint-disable-next-line import/namespace

export type IconParams = {
  category: any;
  iconName: string;
};

/**
 * Props for generic {@link PercentageDisplay} component.
 */
export interface PercentageDisplayProps {
  percentage: number; // current percentage value (from 0 to 1)
  icons: IconParams[]; //icons must be stored as : first icon = empty percentage,[...], last icon = full percentage
  colors?: IIconProps["color"][]; //colors must be stored as : first color = empty percentage color,[...], last color = full percentage color
  _icon?: Partial<IIconProps>; // parameter for styling icon size
}

/**
 * Compute index based on the arraylength and the current percentage value.
 * @param percentage Current percentage value.
 * @param arrayLength length of the icon array.
 * @returns the index corresponding to the icon or color to display.
 */
function computeIndex(percentage: number, arrayLength: number): number {
  const ratio = arrayLength > 0 ? 100 / arrayLength : 1;
  const tempIndex = Math.round(percentage / ratio);
  const index =
    Math.max(0, tempIndex) >= arrayLength
      ? Math.max(arrayLength - 1, 0)
      : tempIndex;
  return index;
}
/**
 * Generic component for displaying a percentage value with icons and colors.
 * @param props See {@link PercentageDisplayProps} for props parameters.
 */
export function PercentageDisplay({
  colors = ["red.900", "orange.900", "green.900"],
  percentage,
  icons,
  _icon,
}: PercentageDisplayProps) {
  const NbOfIcons = icons.length;
  const NbOfColors = colors.length;
  const iconIndex = computeIndex(percentage, NbOfIcons);
  const colorIndex = computeIndex(percentage, NbOfColors);
  return (
    <Icon
      {..._icon}
      as={icons[iconIndex].category}
      name={icons[iconIndex].iconName}
      color={colors[colorIndex]}
    />
  );
}
