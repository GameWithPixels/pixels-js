import { View } from "react-native";
import { useTheme } from "react-native-paper";

export interface ProgressBarProps {
  percent: number;
}

export function ProgressBar({ percent }: ProgressBarProps) {
  const clampedPercentage = Math.max(0, Math.min(100, percent));
  const theme = useTheme();
  return (
    <View
      style={{
        backgroundColor: theme.colors.onPrimary,
        borderRadius: 5,
        height: 20,
        width: "100%",
        padding: 2,
        alignSelf: "center",
      }}
    >
      <View
        style={{
          backgroundColor: theme.colors.primary,
          borderRadius: 5,
          width: `${clampedPercentage}%`,
          height: "100%",
        }}
      />
    </View>
  );
}
