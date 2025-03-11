import { PixelDieType } from "@systemic-games/react-native-pixels-connect";
import React from "react";
import { TextProps, View, ViewProps } from "react-native";
import { useTheme } from "react-native-paper";
import Animated, {
  AnimatedProps,
  FadeIn,
  useDerivedValue,
} from "react-native-reanimated";

import { AnimatedRollCardText } from "./RollCardText";

import { AnimatedDieWireframe } from "~/components/icons";

export function AnimatedRolledDie({
  dieType,
  value,
  size,
  faded,
  textStyle,
  ...props
}: {
  dieType: PixelDieType;
  value?: number;
  faded?: boolean;
} & AnimatedProps<
  {
    size: number;
    textStyle?: TextProps["style"];
  } & ViewProps
>) {
  const lineHeight = useDerivedValue(
    () => (typeof size === "number" ? size : size.value) * 0.8
  );
  const { colors } = useTheme();
  return (
    <Animated.View {...props}>
      <View>
        <AnimatedDieWireframe
          entering={FadeIn}
          dieType={dieType}
          size={size}
          mode={value === undefined ? "normal" : "empty"}
        />
        {value !== undefined && (
          <View
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <AnimatedRollCardText
              lineHeight={lineHeight}
              style={[
                {
                  width: lineHeight,
                  color: faded ? colors.onSurfaceDisabled : colors.onSurface,
                  borderRadius: size,
                },
                textStyle,
              ]}
            >
              {value}
            </AnimatedRollCardText>
          </View>
        )}
      </View>
    </Animated.View>
  );
}
