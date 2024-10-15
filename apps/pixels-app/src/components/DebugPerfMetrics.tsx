import React from "react";
import { Text, View } from "react-native";
import PerformanceStats, {
  PerformanceStatsData,
} from "react-native-performance-stats";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useDebugMode } from "~/hooks";

export function DebugPerfMetrics({ disabled }: { disabled?: boolean }) {
  const { top } = useSafeAreaInsets();
  const debugMode = useDebugMode();
  const [stats, setStats] = React.useState<PerformanceStatsData>();
  React.useEffect(() => {
    if (debugMode) {
      const listener = PerformanceStats.addListener(setStats);
      PerformanceStats.start();
      return () => {
        listener.remove();
        PerformanceStats.stop();
      };
    }
  }, [debugMode]);
  return (
    debugMode &&
    !disabled &&
    stats && (
      <View
        pointerEvents="none"
        style={{ position: "absolute", top, right: 5 }}
      >
        <Text style={{ color: "cyan", fontSize: 10 }}>
          JS: {Math.round(stats.jsFps)} / UI: {Math.round(stats.uiFps)} / RAM:{" "}
          {Math.round(stats.usedRam)}
        </Text>
      </View>
    )
  );
}
