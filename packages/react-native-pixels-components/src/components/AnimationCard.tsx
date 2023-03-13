import {
  Card,
  CardProps,
  FastHStack,
  FastVStack,
} from "@systemic-games/react-native-base-components";
import { Pressable, Text, Box, IBoxProps, ITextProps } from "native-base";
import React from "react";

export interface AnimationCardProps extends CardProps {
  title: string;
  name?: string;
  dieRenderer?: () => React.ReactNode;
  imageSize?: IBoxProps["size"];
  fontSize?: ITextProps["fontSize"];
  onPress?: (() => void) | null | undefined; // function to be executed when pressing the card
  //To be used with the list in which the cards are placed and displayed for selection highlight
}

export function AnimationCard({
  title,
  name,
  dieRenderer,
  imageSize,
  fontSize = "lg",
  onPress,
  ...flexProps
}: AnimationCardProps) {
  return (
    <Pressable onPress={onPress}>
      <Card p={1} {...flexProps}>
        <FastHStack w="100%">
          {/* Die render */}
          {dieRenderer && <Box size={imageSize}>{dieRenderer()}</Box>}
          {/* Animation info */}
          <FastVStack ml={5} justifyContent="space-around" flexGrow={1}>
            <Text isTruncated fontSize={fontSize} bold>
              {name}
            </Text>
            <Text italic>{title}</Text>
          </FastVStack>
        </FastHStack>
      </Card>
    </Pressable>
  );
}
