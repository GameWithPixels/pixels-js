import Color from "color";
import { MD3Theme } from "react-native-paper";

export function getTextColorStyle(
  colors: MD3Theme["colors"],
  disabled?: boolean,
  defaultColor?: string
): { color: string } | undefined {
  return disabled
    ? { color: colors.surfaceDisabled }
    : defaultColor
      ? { color: defaultColor }
      : undefined;
}

export function getIconColor(
  colors: MD3Theme["colors"],
  disabled?: boolean
): string {
  return disabled ? colors.surfaceDisabled : colors.onSurface;
}

export function getBorderColor(
  colors: MD3Theme["colors"],
  selected?: boolean
): string {
  return selected ? colors.primary : colors.outline;
}

export function makeTransparent(color: string, alpha: number): string {
  return Color(color).alpha(alpha).string();
}

export function darken(color: string, factor: number): string {
  const c = Color(color);
  return Color.rgb(
    c.red() * factor,
    c.green() * factor,
    c.blue() * factor
  ).string();
}
