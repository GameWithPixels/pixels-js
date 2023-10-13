import { MD3Theme } from "react-native-paper";

export function getBorderRadius(
  roundnessOrTheme: number | MD3Theme,
  opt?: { tight?: boolean; isV3?: boolean }
) {
  const isTheme = typeof roundnessOrTheme !== "number";
  const factor =
    !isTheme || roundnessOrTheme.isV3 || opt?.isV3 ? (opt?.tight ? 2 : 5) : 1;
  return factor * (isTheme ? roundnessOrTheme?.roundness : roundnessOrTheme);
}
