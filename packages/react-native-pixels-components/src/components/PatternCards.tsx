import {
  EditAnimation,
  EditPattern,
} from "@systemic-games/pixels-edit-animation";
import { Card } from "@systemic-games/react-native-base-components";
import { Pressable, Text, Image, Box, HStack, VStack } from "native-base";
import {
  ColorType,
  SizeType,
} from "native-base/lib/typescript/components/types";
import React from "react";
// eslint-disable-next-line import/namespace
import { ImageSourcePropType } from "react-native";

import { AnimationTypeToTitle } from "../animationUtils";

const defaultImageRequirePath = require("../../../../apps/pixels-app/assets/RainbowDice.png");

export interface PatternInfo {
  //Temporary
  imageRequirePath?: ImageSourcePropType;
  //Temporary is a string
  animationType?: string;
  editPattern: EditPattern;
  patternKey?: number;
}

export interface PatternCardProps {
  patternInfo: PatternInfo;
  bg?: ColorType;
  w?: number | string;
  h?: number | string;
  p?: number | string;
  verticalSpace?: number; // vertical spacing between elements in the profile card
  borderWidth?: number;
  imageSize?: number | SizeType | string;
  textSize?: number | SizeType | string;
  onPress?: (() => void) | null | undefined; // function to be executed when pressing the card
  //To be used with the list in which the cards are placed and displayed for selection highlight
  patternIndexInList?: number; // the card profile index within all the currently available profiles in the list
  selectedPatternIndex?: number; // the index of the currently selected profile in the list
  selectable?: boolean; // used to disable the selection highlight (used until actual selection system is done)
  onSelected?: React.Dispatch<React.SetStateAction<number | undefined>>; // set the currently selected profile with the profile card index
}
export function PatternCard(props: PatternCardProps) {
  const selectedPatternIndex = props.selectedPatternIndex;
  const isSelected = props.selectable
    ? selectedPatternIndex === props.patternIndexInList
    : false;
  return (
    <Pressable
      onPress={() => {
        props.onSelected?.(props.patternIndexInList);
        props.onPress?.();
      }}
    >
      <Card {...props} borderWidth={isSelected ? 3 : props.borderWidth}>
        <Image
          size={props.imageSize}
          alt={props.patternInfo.editPattern.name}
          source={props.patternInfo.imageRequirePath}
        />
        <Text>{props.patternInfo.editPattern.name}</Text>
      </Card>
    </Pressable>
  );
}

// export interface LightingPatternsInfo {
//   editAnimation: EditAnimation;
//   imageRequirePath: ImageSourcePropType;
// }

export interface LightingPatternCardProps {
  patternInfo?: EditAnimation;
  bg?: ColorType;
  w?: number | string;
  h?: number | string;
  p?: number | string;
  verticalSpace?: number;
  borderWidth?: number;
  imageSize?: number | SizeType | string;
  textSize?: number | SizeType | string;
  onPress?: (() => void) | null | undefined; // function to be executed when pressing the card
  //To be used with the list in which the cards are placed and displayed for selection highlight
}

export function LightingPatternsCard(props: LightingPatternCardProps) {
  const animationTitle = props.patternInfo
    ? AnimationTypeToTitle(props.patternInfo)
    : "Type";

  return (
    <Pressable
      onPress={() => {
        props.onPress?.();
      }}
    >
      <Card {...props} borderWidth={props.borderWidth}>
        <HStack p={1} h="100%" alignItems="center">
          <Box flex={1} alignItems="center">
            <Text isTruncated fontSize="lg" bold>
              {props.patternInfo?.name}
            </Text>
          </Box>
          <Box flex={1} alignItems="center">
            <Image
              size={props.imageSize}
              source={defaultImageRequirePath}
              alt="placeHolder"
            />
          </Box>
          <VStack flex={1} alignItems="center">
            {/* {props.profileWithSound && (
              <HStack flex={1} alignItems="center">
                <AntDesign name="sound" size={24} color="white" />
              </HStack>
            )} */}
            <HStack flex={1} alignItems="center">
              <Text bold>{animationTitle}</Text>
            </HStack>
          </VStack>
        </HStack>
      </Card>
    </Pressable>
  );
}
