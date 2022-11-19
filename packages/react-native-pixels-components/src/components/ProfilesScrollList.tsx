import { Card } from "@systemic-games/react-native-base-components";
import {
  Center,
  ScrollView,
  Image,
  VStack,
  HStack,
  Text,
  Box,
  Pressable,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "native-base";
import {
  ColorType,
  SizeType,
} from "native-base/lib/typescript/components/types";
import React from "react";
// eslint-disable-next-line import/namespace
import { ImageSourcePropType } from "react-native";

interface ProfileCardProps {
  profileName: string;
  //Temporary
  imageRequirePath?: ImageSourcePropType;
  bg?: ColorType;
  w?: number | string;
  h?: number | string;
  p?: number | string;
  verticalSpace?: number;
  borderWidth?: number;
  imageSize?: number | SizeType | string;
  textSize?: number | SizeType | string;
  onPress?: (() => void) | null | undefined;
  //To be used with the list in which the cards are placed and displayed for selection highlight
  profileIndexInList?: number; // The card profile index within all the currently available profiles in the list
  selectedProfileIndex?: number; // the index of the currently selected profile in the list
  selectable?: boolean; // used to disable the selection highlight (used until actual selection system is done)
  onSelected?: React.Dispatch<React.SetStateAction<number | undefined>>; // set the currently selected profile with the profile card index
}
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
        {/* <HStack h="15px">
          <Spacer />
          {isSelected && (
            <AntDesign name="checkcircleo" size={12} color="white" />
          )}
        </HStack> */}
        <Center>
          <VStack space={props.verticalSpace} alignItems="center">
            {/* PlaceHolderImage : would be replaced by 3d render of dice */}
            <Image
              size={props.imageSize}
              //source={require("../../../../apps/pixels-app/assets/DieImageTransparent.png")}
              source={props.imageRequirePath}
              alt="placeHolder"
            />
            <Text isTruncated fontSize={props.textSize} bold>
              {props.profileName}
            </Text>
          </VStack>
        </Center>
      </Card>
    </Pressable>
  );
}

export interface ProfileInfo {
  profileName: string;
  //Temporary for image until 3d render
  imageRequirePath?: ImageSourcePropType;
}

export interface ProfilesScrollListProps {
  availableProfiles: ProfileInfo[];
}
export function ProfilesScrollList(props: ProfilesScrollListProps) {
  const [selectedProfile, SetSelectedProfile] = React.useState<number>();
  return (
    <VStack space={2}>
      <Center bg="pixelColors.highlightGray" h="125px" rounded="lg" p={2}>
        <HStack alignItems="center">
          <ChevronLeftIcon />
          <Box w="360">
            <ScrollView
              horizontal
              width="100%"
              snapToAlignment="start"
              snapToInterval={115}
              fadingEdgeLength={20}
              decelerationRate="normal"
            >
              <HStack space={2}>
                {props.availableProfiles.map((profile, i) => (
                  <ProfileCard
                    key={i}
                    w="110px"
                    h="100px"
                    verticalSpace={2}
                    imageSize="12"
                    textSize="xs"
                    profileName={profile.profileName}
                    profileIndexInList={i}
                    onSelected={SetSelectedProfile}
                    selectedProfileIndex={selectedProfile}
                    selectable
                    imageRequirePath={profile.imageRequirePath}
                  />
                ))}
              </HStack>
            </ScrollView>
          </Box>
          <ChevronRightIcon />
        </HStack>
      </Center>
    </VStack>
  );
}
