import { MD3Theme } from "react-native-paper";

export function getBorderRadius(theme: MD3Theme) {
  return (theme.isV3 ? 5 : 1) * theme.roundness;
}
