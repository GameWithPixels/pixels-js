import { range } from "@systemic-games/pixels-core-utils";
import { PixelDieType } from "@systemic-games/react-native-pixels-connect";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { Animated, StyleSheet, View, ViewProps } from "react-native";
import { Text, useTheme } from "react-native-paper";

import { DieIcon } from "./icons";
import { makeTransparent } from "./utils";

export function StatsBarGraph({
  rollStats,
  ...props
}: { rollStats: number[] } & ViewProps) {
  // Animation values
  const max = React.useMemo(() => Math.max(...rollStats), [rollStats]);
  const [values, setValues] = React.useState([
    rollStats.map(() => 1),
    rollStats.map(() => 1),
  ]);
  const anim = React.useRef(new Animated.Value(0)).current;
  React.useEffect(() => {
    setValues((values) => [values[1], rollStats.map((v) => v / max)]);
    anim.resetAnimation();
    Animated.timing(anim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();
  }, [anim, rollStats, max]);

  // Width of the animated bars
  const [width, setWidth] = React.useState(0);

  const { colors } = useTheme();
  return (
    <View {...props}>
      {rollStats.map((n, i) => {
        const newValue = values[1][i];
        const oldValue = values[0][i];
        const scaleX = anim.interpolate({
          inputRange: [0, 1],
          outputRange: [oldValue, newValue],
        });
        const translateX = anim.interpolate({
          inputRange: [0, 1],
          outputRange: [
            -0.5 * width * (1 - oldValue),
            -0.5 * width * (1 - newValue),
          ],
        });
        return (
          <View key={i} style={{ flexDirection: "row", alignItems: "center" }}>
            <Text
              style={{
                width: 20,
                paddingVertical: 2,
                textAlign: "center",
                borderRightWidth: 1,
                borderColor: colors.onSurface,
              }}
            >
              {i + 1}
            </Text>
            <Animated.View
              onLayout={({ nativeEvent: { layout } }) => setWidth(layout.width)}
              style={{
                flexGrow: 1,
                transform: [{ translateX }, { scaleX }],
              }}
            >
              <LinearGradient
                key={i}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                colors={[colors.secondary, colors.primary]}
                style={{ height: 10 }}
              />
            </Animated.View>
            <Animated.View
              style={{
                width: 20,
                marginLeft: 10,
                transform: [{ translateX: Animated.multiply(translateX, 2) }],
              }}
            >
              <Text>{n}</Text>
            </Animated.View>
          </View>
        );
      })}
      <View
        style={{
          flexGrow: 1,
          flexDirection: "row",
          marginLeft: 20,
          borderTopWidth: 1,
          borderColor: colors.onSurface,
        }}
      >
        {range(0, width, 80).map((i) => (
          <Text key={i} style={{ position: "absolute", left: i }}>
            {Math.round((i / width) * max)}
          </Text>
        ))}
      </View>
    </View>
  );
}

export function StatsList({
  rollStats,
  dieType,
  ...props
}: {
  rollStats: number[];
  dieType: PixelDieType;
} & ViewProps) {
  const { colors } = useTheme();
  return (
    <View {...props}>
      {rollStats.map((n, i) => (
        <LinearGradient
          key={i}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          colors={[
            makeTransparent(colors.primary, 0.1),
            makeTransparent(colors.secondary, 0.1),
          ]}
          style={{
            flexDirection: "row",
            alignItems: "center",
            paddingVertical: 5,
            paddingHorizontal: 10,
            gap: 5,
            borderWidth: StyleSheet.hairlineWidth,
            borderColor: colors.outline,
          }}
        >
          <DieIcon dieType={dieType} size={16} />
          <Text>{i + 1}</Text>
          <View style={{ flexGrow: 1 }} />
          <Text>{n}</Text>
        </LinearGradient>
      ))}
    </View>
  );
}

export function StatsGrid({
  rollStats,
  dieType,
  ...props
}: {
  rollStats: number[];
  dieType: PixelDieType;
} & ViewProps) {
  const chunkSize = 6;
  const chunks = [];
  for (let i = 0; i < rollStats.length; i += chunkSize) {
    chunks.push(rollStats.slice(i, i + chunkSize));
  }
  const { colors } = useTheme();
  return (
    <View {...props}>
      {chunks.map((chunk, i) => (
        <View key={i} style={{ flexDirection: "row", width: "100%" }}>
          {chunk.map((n, j) => (
            <View
              key={j}
              style={{
                width: "17%",
                borderWidth: StyleSheet.hairlineWidth,
                borderColor: colors.outline,
              }}
            >
              <LinearGradient
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                colors={[
                  makeTransparent(colors.primary, 0.4),
                  makeTransparent(colors.secondary, 0.4),
                ]}
                style={{
                  flexDirection: "row",
                  gap: 5,
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <DieIcon dieType={dieType} size={16} color={colors.onSurface} />
                <Text style={{ color: colors.onSurface }}>{6 * i + j + 1}</Text>
              </LinearGradient>
              <Text
                style={{
                  alignSelf: "center",
                  margin: 4,
                  backgroundColor: colors.surface,
                }}
              >
                {n}
              </Text>
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}
