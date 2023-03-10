import {
  Card,
  FastHStack,
  FastVStack,
} from "@systemic-games/react-native-base-components";
import { Pressable, Text, Box, IFlexProps } from "native-base";
import { SizeType } from "native-base/lib/typescript/components/types";
import React from "react";

export interface AnimationCardProps extends IFlexProps {
  title: string;
  name?: string;
  dieRenderer?: () => React.ReactNode;
  imageSize?: number | SizeType | string;
  textSize?: number | SizeType | string;
  onPress?: (() => void) | null | undefined; // function to be executed when pressing the card
  //To be used with the list in which the cards are placed and displayed for selection highlight
}

export function AnimationCard({
  title,
  name,
  dieRenderer,
  imageSize,
  textSize = "lg",
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
            <Text isTruncated fontSize={textSize} bold>
              {name}
            </Text>
            <Text italic>{title}</Text>
          </FastVStack>
        </FastHStack>
      </Card>
    </Pressable>
  );
}
