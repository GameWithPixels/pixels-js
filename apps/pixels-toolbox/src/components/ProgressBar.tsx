import { StyleSheet, View } from "react-native";

export interface ProgressBarProps {
  percent: number;
}

export default function ({ percent }: ProgressBarProps) {
  const clampedPercentage = Math.max(0, Math.min(100, percent));
  return (
    <View style={styles.progressBarBackground}>
      <View
        style={[
          styles.progressBarForeground,
          {
            width: `${clampedPercentage}%`,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  progressBarBackground: {
    backgroundColor: "grey",
    borderRadius: 5,
    height: 20,
    width: "100%",
    padding: 2,
    alignSelf: "center",
  },
  progressBarForeground: {
    backgroundColor: "blue",
    borderRadius: 5,
    height: "100%",
  },
});
