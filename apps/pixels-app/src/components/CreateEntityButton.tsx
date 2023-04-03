import { Ionicons } from "@expo/vector-icons";
import { CardProps } from "@systemic-games/react-native-pixels-components";
import {
  Card,
  IPressableProps,
  ITextProps,
  Pressable,
  Text,
} from "native-base";
import React from "react";

interface CreateEntityButtonProps extends CardProps {
  onPress?: IPressableProps["onPress"];
  fontSize?: ITextProps["fontSize"];
}

export default function ({
  children,
  onPress,
  fontSize,
  ...flexProps
}: CreateEntityButtonProps) {
  return (
    <Pressable onPress={onPress}>
      <Card bg={null} w="100%" {...flexProps}>
        <Ionicons name="add-circle-outline" size={24} color="white" />
        <Text isTruncated fontSize={fontSize} bold>
          {children}
        </Text>
      </Card>
    </Pressable>
  );
}
