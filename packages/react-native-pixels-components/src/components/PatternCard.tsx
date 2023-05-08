import {
  FastButton,
  FrameProps,
} from "@systemic-games/react-native-base-components";
import React from "react";
import { FlexStyle, View } from "react-native";
import { Text, useTheme } from "react-native-paper";

export interface PatternCardProps extends FrameProps {
  name: string;
  dieRenderer?: () => React.ReactNode;
  dieViewSize?: FlexStyle["width"];
  smallLabel?: boolean;
  onPress?: () => void;
  highlighted?: boolean;
}

export function PatternCard({
  children,
  name,
  dieRenderer,
  dieViewSize,
  smallLabel,
  onPress,
  highlighted,
  ...flexProps
}: PatternCardProps) {
  const theme = useTheme();
  return (
    <FastButton
      onPress={onPress}
      borderWidth={highlighted ? 2 : undefined}
      borderColor={theme.colors.primary}
      bg={undefined}
      alignItems="center"
      {...flexProps}
    >
      <>
        {/* Die render */}
        {dieRenderer && (
          <View style={{ width: dieViewSize, aspectRatio: 1 }}>
            {dieRenderer()}
          </View>
        )}
        {/* Name */}
        <Text variant={smallLabel ? undefined : "headlineSmall"}>{name}</Text>
        {children}
      </>
    </FastButton>
  );
}
