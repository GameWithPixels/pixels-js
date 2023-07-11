import React from "react";
import { Pressable, PressableProps } from "react-native";
import { useTheme } from "react-native-paper";

import { FastHStack } from "./FastHStack";
import { getBorderRadius } from "../getBorderRadius";

export interface SwipeableButtonsProps {
  width: number;
  buttons: PressableProps[];
}

export const SwipeableButtons = React.memo(function (
  props: SwipeableButtonsProps
) {
  const theme = useTheme();
  const borderRadius = getBorderRadius(theme);
  const w = props.width / props.buttons.length;
  return (
    <FastHStack>
      {props.buttons.map((buttonProps, index) => (
        <Pressable
          key={index}
          style={{
            height: "100%",
            width: w,
            borderTopRightRadius:
              props.buttons.length <= 1 || index === props.buttons.length - 1
                ? borderRadius
                : undefined,
            borderTopLeftRadius:
              props.buttons.length <= 1 || index === 0
                ? borderRadius
                : undefined,
            alignItems: "center",
            justifyContent: "center",
          }}
          {...buttonProps}
        />
      ))}
    </FastHStack>
  );
});
