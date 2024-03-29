import { usePixelValue } from "@systemic-games/react-native-pixels-connect";
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

import { PairedDie } from "~/app/PairedDie";
import { useAppSelector } from "~/app/hooks";
import { Card, CardProps } from "~/components/Card";
import { AnimatedText } from "~/components/animated";
import { makeTransparent } from "~/components/colors";
import { usePairedPixel } from "~/hooks";

function useLastRolls({
  pixelId,
}: Pick<PairedDie, "pixelId">): { key: number; roll: number }[] {
  const rolls = useAppSelector(
    (state) => state.diceRolls.dice.find((d) => d.pixelId === pixelId)?.rolls
  );
  return React.useMemo(() => {
    const count = rolls?.length ?? 0;
    return [-1, -1, -1, -1] // We want at least 4 rolls
      .concat(rolls ?? [])
      .slice(count)
      .map((roll, i) => ({
        key: count + i,
        roll,
      }));
  }, [rolls]);
}

function PixelRollState({
  pairedDie,
  ...props
}: {
  pairedDie: PairedDie;
} & Omit<TextProps<string>, "children">) {
  const pixel = usePairedPixel(pairedDie);
  const [rollState] = usePixelValue(pixel, "rollState");
  const rolling =
    rollState?.state === "rolling" || rollState?.state === "handling";
  return <Text {...props}>{rolling ? "Die is rolling" : "Last rolls"}</Text>;
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
  pairedDie,
  ...props
}: {
  pairedDie: PairedDie;
} & Omit<CardProps, "contentStyle">) {
  const lastRolls = useLastRolls(pairedDie);
  const { colors } = useTheme();
  return (
    <Card
      contentStyle={{
        flexGrow: 1,
        padding: 10,
        alignItems: "flex-start",
        justifyContent: "space-around",
      }}
      {...props}
    >
      {lastRolls.some(({ roll }) => roll >= 0) ? (
        <>
          <PixelRollState pairedDie={pairedDie} variant="labelSmall" />
          <View
            style={{
              flexDirection: "row",
              width: "100%",
              alignItems: "center",
              justifyContent: "flex-end",
              gap: 8,
            }}
          >
            {lastRolls.map(
              ({ key, roll }, i) =>
                roll >= 0 && (
                  <AnimatedDieIcon
                    key={key}
                    value={roll}
                    size={15 + 4 * i}
                    color={colors.onSurface}
                    backgroundColor={makeTransparent(
                      colors.primary,
                      (i + 1) * 0.1
                    )}
                  />
                )
            )}
          </View>
        </>
      ) : (
        <Text>Rolls will be displayed here</Text>
      )}
    </Card>
  );
}
