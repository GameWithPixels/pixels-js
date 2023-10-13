import { getBorderRadius } from "@systemic-games/react-native-base-components";
import { View } from "react-native";
import { useTheme } from "react-native-paper";

export interface ProgressBarProps {
  percent: number;
}

export function ProgressBar({ percent }: ProgressBarProps) {
  const clampedPercentage = Math.max(0, Math.min(100, percent));
  const { colors, roundness } = useTheme();
  const borderRadius = getBorderRadius(roundness);
  return (
    <View
      style={{
        backgroundColor: colors.onPrimary,
        borderRadius,
        height: 20,
        width: "100%",
        padding: 2,
        alignSelf: "center",
      }}
    >
      <View
        style={{
          backgroundColor: colors.primary,
          borderRadius,
          width: `${clampedPercentage}%`,
          height: "100%",
        }}
      />
    </View>
  );
}
