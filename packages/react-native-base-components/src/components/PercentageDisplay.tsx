import { assert } from "@systemic-games/pixels-core-utils";
import React from "react";
import { ColorValue } from "react-native";

export interface IconComponentProps {
  color?: ColorValue;
  size?: number;
}

export type IconComponent = React.FC<IconComponentProps>;

/**
 * Props for generic {@link PercentageDisplay} component.
 */
export interface PercentageDisplayProps {
  percent: number; // current percentage value (from 0 to 1)
  icons: IconComponent[]; //icons must be stored as : first icon = empty percentage,[...], last icon = full percentage
  colors?: ColorValue[]; //colors must be stored as : first color = empty percentage color,[...], last color = full percentage color
  iconSize?: number;
}

/**
 * Compute index based on the arraylength and the current percentage value.
 * @param percent Current percentage value.
 * @param numItems length of the icon array.
 * @returns the index corresponding to the icon or color to display.
 */
function computeIndex(percent: number, numItems: number): number {
  const index = Math.round(numItems > 0 ? (percent / 100) * numItems : -1);
  return Math.min(numItems - 1, Math.max(0, index));
}

/**
 * Generic component for displaying a percentage value with icons and colors.
 * @param props See {@link PercentageDisplayProps} for props parameters.
 */
export function PercentageDisplay({
  colors = ["red", "orange", "green"],
  percent,
  icons,
  iconSize,
}: PercentageDisplayProps) {
  assert(icons.length > 0);
  assert(colors.length > 0);
  const icon = icons[computeIndex(percent, icons.length)];
  const color = colors[computeIndex(percent, colors.length)];
  return icon({ size: iconSize, color });
}
