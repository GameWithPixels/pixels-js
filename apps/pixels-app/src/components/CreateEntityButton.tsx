import { Ionicons } from "@expo/vector-icons";
import {
  Card,
  IFlexProps,
  IPressableProps,
  ITextProps,
  Pressable,
  Text,
} from "native-base";
import React from "react";

interface CreateEntityButtonProps extends IFlexProps {
  onPress?: IPressableProps["onPress"];
  fontSize?: ITextProps["fontSize"];
}

export default function ({
  children,
  onPress,
  fontSize,
  ...props
}: CreateEntityButtonProps) {
  return (
    <Pressable onPress={onPress}>
      <Card bg={null} minW="100%" minH="50px" {...props}>
        <Ionicons name="add-circle-outline" size={24} color="white" />
        <Text isTruncated fontSize={fontSize} bold children={children} />
      </Card>
    </Pressable>
  );
}
