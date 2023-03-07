import { IPressableProps, Pressable } from "native-base";
import React from "react";

import { FastHStack } from "./FastHStack";

export interface SwipeableButtonsProps {
  width: number;
  buttons: Omit<
    IPressableProps,
    "key" | "h" | "height" | "w" | "width" | "roundedRight" | "roundedLeft"
  >[];
}

export const SwipeableButtons = React.memo(function (
  props: SwipeableButtonsProps
) {
  const w = props.width / props.buttons.length;
  return (
    <FastHStack>
      {props.buttons.map((buttonProps, index) => (
        <Pressable
          key={index}
          h="100%"
          w={w}
          roundedRight={
            props.buttons.length <= 1
              ? "lg"
              : index === props.buttons.length - 1
              ? "lg"
              : "none"
          }
          roundedLeft={
            props.buttons.length <= 1 ? "lg" : index === 0 ? "lg" : "none"
          }
          alignItems="center"
          justifyContent="center"
          {...buttonProps}
        />
      ))}
    </FastHStack>
  );
});
