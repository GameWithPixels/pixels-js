import { Card } from "@systemic-games/react-native-base-components";
import { Pressable, Image, Text } from "native-base";
import {
  ColorType,
  SizeType,
} from "native-base/lib/typescript/components/types";
import React from "react";
// eslint-disable-next-line import/namespace
import { ImageSourcePropType } from "react-native";

/**
 * Basic profile informations for minimal display.
 */
export interface ProfileInfo {
  profileName: string;
  //Temporary for image until 3d render
  imageRequirePath?: ImageSourcePropType;
}
/**
 * Props for selectable and pressable profile cards
 */
export interface ProfileCardProps {
  profileName: string;
  //Temporary
  imageRequirePath?: ImageSourcePropType;
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
  profileIndexInList?: number; // the card profile index within all the currently available profiles in the list
  selectedProfileIndex?: number; // the index of the currently selected profile in the list
  selectable?: boolean; // used to disable the selection highlight (used until actual selection system is done)
  onSelected?: React.Dispatch<React.SetStateAction<number | undefined>>; // set the currently selected profile with the profile card index
}
/**
 * A pressable profile card to display dice profiles
 * @param props See {@link ProfileCardProps} for props parameters
 */
export function ProfileCard(props: ProfileCardProps) {
  const selectedProfileIndex = props.selectedProfileIndex;
  const isSelected = props.selectable
    ? selectedProfileIndex === props.profileIndexInList
    : false;
  return (
    <Pressable
      onPress={() => {
        props.onSelected?.(props.profileIndexInList);
        props.onPress?.();
      }}
    >
      <Card
        bg={null}
        p={props.p}
        minW="50px"
        minH="50px"
        w={props.w}
        h={props.h}
        verticalSpace={props.verticalSpace}
        borderWidth={isSelected ? 2 : props.borderWidth}
      >
        <Image
          size={props.imageSize}
          source={props.imageRequirePath}
          alt="placeHolder"
        />
        <Text isTruncated fontSize={props.textSize} bold>
          {props.profileName}
        </Text>
      </Card>
    </Pressable>
  );
}
