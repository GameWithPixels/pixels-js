import { AntDesign } from "@expo/vector-icons";
import {
  Card,
  FastHStack,
  FastVStack,
} from "@systemic-games/react-native-base-components";
import { Pressable, Text, Box, IFlexProps } from "native-base";
import { SizeType } from "native-base/lib/typescript/components/types";
import React from "react";
// eslint-disable-next-line import/namespace
import { ImageSourcePropType } from "react-native";
/**
 * Basic profile information for minimal display.
 */
export interface ProfileInfo {
  profileName: string;
  profileKey?: number;
  profileWithSound?: boolean;
  category?: string;

  //Temporary for image until 3d render
  imageRequirePath?: ImageSourcePropType;
}
/**
 * Props for selectable and pressable profile cards
 */
export interface ProfileCardProps extends IFlexProps {
  name: string;
  dieRenderer?: () => React.ReactNode; // TODO dieRenderer
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
export function ProfileCard({
  name,
  dieRenderer,
  borderWidth,
  imageSize,
  textSize,
  onPress,
  profileIndexInList,
  selectedProfileIndex,
  selectable,
  onSelected,
  ...flexProps
}: ProfileCardProps) {
  const isSelected = selectable
    ? selectedProfileIndex === profileIndexInList
    : false;
  return (
    <Pressable
      onPress={() => {
        onSelected?.(profileIndexInList);
        onPress?.();
      }}
    >
      <Card
        bg={null}
        minW="100%"
        minH="50px"
        justifyContent="space-between"
        {...flexProps}
        borderWidth={isSelected ? 2 : borderWidth}
      >
        {dieRenderer && <Box size={imageSize}>{dieRenderer()}</Box>}
        <Text isTruncated fontSize={textSize} bold>
          {name}
        </Text>
      </Card>
    </Pressable>
  );
}

/**
 * Props for {@link DetailedProfileCard}.
 */
export interface DetailedProfileCardProps extends ProfileCardProps {
  hasSound?: boolean;
  description?: string;
}

/**
 * More detailed horizontal profile card for displaying profiles information.
 * @param props See {@link DetailedProfileCardProps} for props params.
 */
export function DetailedProfileCard({
  name,
  dieRenderer,
  borderWidth,
  imageSize,
  textSize = "lg",
  onPress,
  profileIndexInList,
  selectedProfileIndex,
  selectable,
  onSelected,
  hasSound,
  description,
  ...flexProps
}: DetailedProfileCardProps) {
  const isSelected = selectable
    ? selectedProfileIndex === profileIndexInList
    : false;

  return (
    <Pressable
      onPress={() => {
        onSelected?.(profileIndexInList);
        onPress?.();
      }}
    >
      <Card p={3} borderWidth={isSelected ? 2 : borderWidth} {...flexProps}>
        <FastHStack h="100%">
          {/* Die render */}
          {dieRenderer && <Box size={imageSize}>{dieRenderer()}</Box>}
          {/* Profile info */}
          <FastVStack ml={5} justifyContent="space-around" flexGrow={1}>
            <FastHStack>
              <Text pr={hasSound ? 2 : 0} isTruncated fontSize={textSize} bold>
                {name}
              </Text>
              {hasSound && <AntDesign name="sound" size={24} color="white" />}
            </FastHStack>
            {description && description.length > 0 && (
              <Text isTruncated fontSize={textSize} italic>
                {description}
              </Text>
            )}
          </FastVStack>
        </FastHStack>
      </Card>
    </Pressable>
  );
}
