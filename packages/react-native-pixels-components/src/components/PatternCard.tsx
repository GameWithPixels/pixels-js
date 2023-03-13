import { Card, CardProps } from "@systemic-games/react-native-base-components";
import { Pressable, Text, Box, IBoxProps, ITextProps } from "native-base";
import React from "react";

export interface PatternCardProps extends CardProps {
  patternName: string;
  dieRenderer?: () => React.ReactNode;
  space?: number; // vertical spacing between elements in the profile card
  borderWidth?: number;
  imageSize?: IBoxProps["size"];
  fontSize?: ITextProps["fontSize"];
  onPress?: (() => void) | null | undefined; // function to be executed when pressing the card
  //To be used with the list in which the cards are placed and displayed for selection highlight
  patternIndexInList?: number; // the card profile index within all the currently available profiles in the list
  selectedPatternIndex?: number; // the index of the currently selected profile in the list
  selectable?: boolean; // used to disable the selection highlight (used until actual selection system is done)
  onSelected?: React.Dispatch<React.SetStateAction<number | undefined>>; // set the currently selected profile with the profile card index
}

export function PatternCard({
  patternName,
  dieRenderer,
  borderWidth,
  imageSize,
  fontSize = "lg",
  onPress,
  patternIndexInList,
  selectedPatternIndex,
  selectable,
  onSelected,
  ...flexProps
}: PatternCardProps) {
  const isSelected = selectable
    ? selectedPatternIndex === patternIndexInList
    : false;
  return (
    <Pressable
      onPress={() => {
        onSelected?.(patternIndexInList);
        onPress?.();
      }}
    >
      <Card borderWidth={isSelected ? 3 : borderWidth} {...flexProps}>
        {dieRenderer && <Box size={imageSize}>{dieRenderer()}</Box>}
        <Text fontSize={fontSize}>{patternName}</Text>
      </Card>
    </Pressable>
  );
}
