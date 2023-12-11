import { getBorderRadius } from "@systemic-games/react-native-base-components";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { StyleSheet, View } from "react-native";
import { Searchbar, Text, TouchableRipple, useTheme } from "react-native-paper";
import Animated, {
  SharedValue,
  useAnimatedStyle,
} from "react-native-reanimated";

import { ProfileGroups } from "~/temp";

export function AnimatedProfileSearchbar({
  positionY,
  headerHeight,
}: {
  positionY: SharedValue<number>;
  headerHeight: number;
}) {
  const animStyle = useAnimatedStyle(() => {
    const v = 1 - Math.min(1, Math.max(0, positionY.value / headerHeight));
    return {
      height: headerHeight * v,
      transform: [{ translateY: headerHeight * (1 - v) * 0.75 }],
      opacity: v,
    };
  }, [headerHeight, positionY]);

  const [filter, setFilter] = React.useState("");
  const [group, setGroup] = React.useState("");
  const toggleGroup = React.useCallback(
    (g: string) => setGroup((group) => (group === g ? "" : g)),
    []
  );

  const { colors, roundness } = useTheme();
  const borderRadius = getBorderRadius(roundness, { tight: true });
  return (
    <Animated.View style={[animStyle, { overflow: "hidden", gap: 10 }]}>
      <Searchbar
        placeholder="Filter by name, description and dice type"
        onChangeText={setFilter}
        value={filter}
      />
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
        {ProfileGroups.map((g, i) => {
          return (
            <LinearGradient
              key={i}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              colors={
                g === group
                  ? [colors.primary, colors.secondary]
                  : [colors.surface, colors.surface]
              }
              style={{ borderRadius }}
            >
              <TouchableRipple
                style={{
                  paddingVertical: 6,
                  borderWidth: StyleSheet.hairlineWidth,
                  borderRadius,
                  borderColor: colors.outline,
                }}
                onPress={() => toggleGroup(g)}
              >
                <Text
                  style={{
                    textAlignVertical: "center",
                    marginHorizontal: 16,
                  }}
                  numberOfLines={1}
                  variant="labelLarge"
                >
                  {g}
                </Text>
              </TouchableRipple>
            </LinearGradient>
          );
        })}
      </View>
    </Animated.View>
  );
}
