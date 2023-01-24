import {
  EditAnimation,
  EditPattern,
} from "@systemic-games/pixels-edit-animation/dist/types";
import { Card } from "@systemic-games/react-native-base-components";
import { Pressable, Text, Image } from "native-base";
import {
  ColorType,
  SizeType,
} from "native-base/lib/typescript/components/types";
// eslint-disable-next-line import/namespace
import { ImageSourcePropType } from "react-native";

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

export interface LightingPatternsInfo {
  editAnimation: EditAnimation;
  imageRequirePath: ImageSourcePropType;
}

export interface LightingPatternCardProps {
  patternInfo: EditAnimation;
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
  return (
    <Pressable
      onPress={() => {
        props.onPress?.();
      }}
    >
      <Card {...props} borderWidth={props.borderWidth}>
        {/* <Image
          size={props.imageSize}
          alt={props.patternInfo.editAnimation.name}
          source={props.patternInfo.imageRequirePath}
        /> */}
        <Text>{props.patternInfo.name}</Text>
      </Card>
    </Pressable>
  );
}
