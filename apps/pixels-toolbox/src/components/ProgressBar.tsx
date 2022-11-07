// eslint-disable-next-line import/namespace
import { StyleSheet, View } from "react-native";

import { sr } from "~/styles";

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
    borderRadius: sr(5),
    height: sr(20),
    width: "90%",
    alignSelf: "center",
  },
  progressBarForeground: {
    backgroundColor: "blue",
    borderRadius: sr(5),
    height: "80%",
    margin: sr(2),
  },
});
