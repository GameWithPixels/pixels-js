import React from "react";
import {
  Pressable,
  PressableProps,
  StyleProp,
  Text,
  TextStyle,
  ViewStyle,
  // eslint-disable-next-line import/namespace
} from "react-native";

// https://stackoverflow.com/a/68978207
export function PressableOpacity({
  children,
  style,
  ...props
}: PressableProps) {
  return (
    <Pressable
      style={({ pressed }) => [
        style as ViewStyle,
        { opacity: pressed ? 0.5 : 1.0 },
      ]}
      {...props}
    >
      <>{children}</>
    </Pressable>
  );
}

export interface ButtonProps extends PressableProps {
  textStyle?: StyleProp<TextStyle>;
}

export default function Button({
  children,
  style,
  textStyle,
  ...props
}: ButtonProps) {
  // @ts-expect-error Not sure why we're having an error, may be a mix of React versions
  const renderChildren = () => <Text style={textStyle}>{children}</Text>;

  return (
    <PressableOpacity
      style={[{ alignItems: "center" }, style as ViewStyle]}
      {...props}
    >
      {renderChildren()}
    </PressableOpacity>
  );
}
