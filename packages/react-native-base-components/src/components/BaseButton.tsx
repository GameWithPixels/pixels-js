import React from "react";
import { ColorValue, View } from "react-native";
import {
  Text,
  TextProps,
  TouchableRipple,
  TouchableRippleProps,
  useTheme,
} from "react-native-paper";

import { BaseBoxProps } from "./BaseBox";
import { expandShorthandStyle } from "../expandShorthandStyle";
import { getBorderRadius } from "../getBorderRadius";

export interface BaseButtonProps
  extends Omit<BaseBoxProps, "bg" | "backgroundColor">,
    Omit<TouchableRippleProps, "children"> {
  color?: ColorValue;
  _text?: Omit<TextProps<string>, "children">;
}

/**
 * Simple "contained tonal" button using Paper theme.
 * Wrap in a flex:1 view when rendered in a ScrollView.
 */
export function BaseButton({
  children,
  color,
  _text,
  ...props
}: BaseButtonProps) {
  const { colors, roundness } = useTheme();
  const borderRadius = getBorderRadius(roundness);
  const childrenNode = React.useMemo(
    () =>
      typeof children === "string" || typeof children === "number" ? (
        <Text
          style={{
            color: colors.onSecondaryContainer,
            textAlign: "center",
          }}
        >
          {children}
        </Text>
      ) : (
        children ?? (
          <View
          // style={{ width: theme.fonts.bodyMedium.fontSize, aspectRatio: 1 }}
          />
        )
      ),
    [children, colors.onSecondaryContainer]
  );
  return (
    <TouchableRipple
      rippleColor={colors.surface}
      style={[
        {
          backgroundColor: color ?? colors.secondaryContainer,
          borderRadius,
          minWidth: 64,
          paddingVertical: 10,
          paddingHorizontal: 24,
          alignContent: "center",
          justifyContent: "center",
        },
        expandShorthandStyle(props),
        props.style,
      ]}
      {...props}
    >
      {childrenNode}
    </TouchableRipple>
  );
}
