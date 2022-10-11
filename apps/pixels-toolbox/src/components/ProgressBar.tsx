// eslint-disable-next-line import/namespace
import { StyleSheet, View } from "react-native";

import { sr } from "~/styles";

export interface ProgressBarProps {
  percent: number;
}

export default function ({ percent }: ProgressBarProps) {
  return (
    <View style={styles.progressBarBackground}>
      <View
        style={[
          styles.progressBarForeground,
          {
            width: `${percent}%`,
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
    margin: sr(10),
  },
  progressBarForeground: {
    backgroundColor: "blue",
    borderRadius: sr(5),
    height: "80%",
    margin: sr(2),
  },
});
