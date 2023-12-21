import {
  Pixel,
  usePixelValue,
} from "@systemic-games/react-native-pixels-connect";
import React from "react";
import { View } from "react-native";
import { Text, TextProps, useTheme } from "react-native-paper";
import Animated, {
  useSharedValue,
  withTiming,
  Easing,
  useAnimatedStyle,
  CurvedTransition,
  FadeIn,
  FadeOut,
} from "react-native-reanimated";

import { useAppSelector } from "~/app/hooks";
import { Card } from "~/components/Card";
import { AnimatedText } from "~/components/animated";
import {
  getTextColorStyle,
  getIconColor,
  makeTransparent,
} from "~/components/utils";
import { PairedDie } from "~/features/store/pairedDiceSlice";

function useLastRolls(pairedDie?: PairedDie): { key: number; roll: number }[] {
  return React.useMemo(() => {
    const rolls = pairedDie?.rolls ?? [];
    return [-1, -1, -1, -1] // We want at least 4 rolls
      .concat(rolls)
      .slice(rolls.length)
      .map((roll, i) => ({
        key: rolls.length + i,
        roll,
      }));
  }, [pairedDie?.rolls]);
}

function PixelRollState({
  pixel,
  ...props
}: {
  pixel: Pixel;
} & Omit<TextProps<string>, "children">) {
  const [rollState] = usePixelValue(pixel, "rollState");
  const rolling =
    rollState?.state === "rolling" || rollState?.state === "handling";
  return <Text {...props}>Die is{rolling ? " " : " not "}rolling</Text>;
}

function AnimatedDieIcon({
  value,
  size,
  color,
  backgroundColor,
}: {
  value: number;
  size: number;
  color: string;
  backgroundColor: string;
}) {
  const sharedSize = useSharedValue(size);
  React.useEffect(() => {
    sharedSize.value = withTiming(size, {
      easing: Easing.out(Easing.quad),
      duration: 200,
    });
  }, [sharedSize, size]);
  const animStyle = useAnimatedStyle(() => ({
    fontSize: sharedSize.value,
  }));
  return (
    <Animated.View
      layout={CurvedTransition.easingX(Easing.bounce).duration(600)}
      entering={FadeIn.duration(400).delay(200)}
      exiting={FadeOut.duration(200)}
      style={{
        alignItems: "center",
        padding: 5,
        paddingHorizontal: value < 10 ? 10 : 5,
        borderRadius: 10,
        borderCurve: "continuous",
        backgroundColor,
      }}
    >
      <AnimatedText style={[animStyle, { color }]}>
        {value >= 0 ? String(value) : " "}
      </AnimatedText>
    </Animated.View>
  );
}

export function PixelRollCard({
  pixel,
  disabled,
}: {
  pixel: Pixel;
  disabled: boolean;
}) {
  const lastRolls = useLastRolls(
    useAppSelector((state) =>
      state.pairedDice.dice.find((d) => d.pixelId === pixel.pixelId)
    )
  );
  const { colors } = useTheme();
  const textStyle = getTextColorStyle(colors, disabled);
  return (
    <Card
      style={{ flex: 1, flexGrow: 1, justifyContent: "center" }}
      contentStyle={{
        flexGrow: 1,
        padding: 10,
        alignItems: "flex-start",
        justifyContent: "space-around",
      }}
    >
      <PixelRollState pixel={pixel} variant="labelSmall" style={textStyle} />
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
        {lastRolls.map(({ key, roll }, i) => (
          <AnimatedDieIcon
            key={key}
            value={roll}
            size={16 + 4 * i}
            color={getIconColor(colors, disabled)}
            backgroundColor={makeTransparent(colors.primary, 0.2)}
          />
        ))}
      </View>
    </Card>
  );
}
