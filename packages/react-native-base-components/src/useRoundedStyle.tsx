import { MD3Theme, useTheme } from "react-native-paper";

import { BaseFlexProps, expandShorthandStyle } from "./expandShorthandStyle";
import { getBorderRadius } from "./getBorderRadius";

export interface RoundedFlexProps extends BaseFlexProps {
  fill?: boolean;
  fillThemeColor?: keyof Omit<MD3Theme["colors"], "elevation">;
  border?: boolean;
  borderThemeColor?: keyof Omit<MD3Theme["colors"], "elevation">;
}

export function useRoundedStyle({
  fill,
  fillThemeColor = "primaryContainer",
  border,
  borderThemeColor = "primary",
  ...props
}: RoundedFlexProps) {
  const theme = useTheme();
  const style = expandShorthandStyle(props);
  if (fill && !Object.hasOwn(style, "backgroundColor")) {
    style.backgroundColor = theme.colors[fillThemeColor];
  }
  if (!Object.hasOwn(style, "borderColor")) {
    style.borderColor = theme.colors[borderThemeColor];
  }
  style.borderRadius = getBorderRadius(theme);
  if (border && !style.borderWidth) {
    style.borderWidth = 1;
  }
  return style;
}
