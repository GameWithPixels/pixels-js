import { range } from "@systemic-games/pixels-core-utils";
import { PixelDieType } from "@systemic-games/react-native-pixels-connect";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { Animated, StyleSheet, View, ViewProps } from "react-native";
import { Text, useTheme } from "react-native-paper";

import { makeTransparent } from "./colors";
import { DieIcon } from "./icons";

export type RollStats = Readonly<{ [key: number]: number }>;

export function StatsBarGraph({
  rollStats,
  ...props
}: { rollStats: RollStats } & ViewProps) {
  const faces = Object.keys(rollStats).map(Number);
  const rolls = React.useMemo(() => Object.values(rollStats), [rollStats]);
  // Animation values
  const max = React.useMemo(() => Math.max(10, ...rolls), [rolls]);
  const [values, setValues] = React.useState([
    faces.map(() => 1),
    faces.map(() => 1),
  ]);
  const anim = React.useRef(new Animated.Value(0)).current;
  React.useEffect(() => {
    setValues((values) => [values[1], rolls.map((v) => v / max)]);
    anim.resetAnimation();
    Animated.timing(anim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();
  }, [anim, max, rolls]);

  // Width of the animated bars
  const [width, setWidth] = React.useState(0);

  const { colors } = useTheme();
  return (
    <View {...props}>
      {faces.map((f, i) => {
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
              {f}
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
              <Text>{rollStats[f]}</Text>
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
        {range(0, max + 1, Math.ceil(max / 10)).map((i) => (
          <Text
            key={i}
            style={{
              position: i === 0 ? "relative" : "absolute",
              left: (i * width) / max - 5,
            }}
          >
            {i}
          </Text>
        ))}
      </View>
    </View>
  );
}

export function StatsList({
  dieType,
  rollStats,
  ...props
}: {
  dieType: PixelDieType;
  rollStats: RollStats;
} & ViewProps) {
  const faces = Object.keys(rollStats).map(Number);
  const { colors } = useTheme();
  return (
    <View {...props}>
      {faces.map((f, i) => (
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
            paddingRight: 5,
            gap: 5,
            borderWidth: StyleSheet.hairlineWidth,
            borderColor: colors.outline,
          }}
        >
          <DieIcon dieType={dieType} size={16} />
          <Text>{f}</Text>
          <View style={{ flexGrow: 1 }} />
          <Text>{rollStats[f]}</Text>
        </LinearGradient>
      ))}
    </View>
  );
}

export function StatsGrid({
  dieType,
  rollStats,
  ...props
}: {
  dieType: PixelDieType;
  rollStats: RollStats;
} & ViewProps) {
  const faces = Object.keys(rollStats).map(Number);
  const chunkSize = 6;
  const chunks: number[][] = [];
  for (let i = 0; i < faces.length; i += chunkSize) {
    const chunkFaces = faces.slice(i, i + chunkSize);
    while (chunkFaces.length < chunkSize) {
      chunkFaces.push(-1);
    }
    chunks.push(chunkFaces);
  }
  const { colors } = useTheme();
  return (
    <View {...props}>
      {chunks.map((chunk, i) => (
        <View key={i} style={{ flexDirection: "row" }}>
          {chunk.map((f, j) => (
            <View
              key={j}
              style={{
                flex: 1,
                borderWidth: StyleSheet.hairlineWidth,
                borderColor: colors.outline,
              }}
            >
              {f >= 0 && (
                <>
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
                    <DieIcon
                      dieType={dieType}
                      size={16}
                      color={colors.onSurface}
                    />
                    <Text style={{ color: colors.onSurface }}>{f}</Text>
                  </LinearGradient>
                  <Text
                    style={{
                      alignSelf: "center",
                      margin: 4,
                      backgroundColor: colors.surface,
                    }}
                  >
                    {rollStats[f]}
                  </Text>
                </>
              )}
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}
