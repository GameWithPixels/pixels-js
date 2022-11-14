import { AntDesign } from "@expo/vector-icons";
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
  Spacer,
} from "native-base";
import { ColorType } from "native-base/lib/typescript/components/types";
import React from "react";

interface ProfileCardProps {
  profileName: string;
  bg?: ColorType;
  profileIndexInList?: number; // The profile index within all the currently available profiles
  selectedProfileIndex?: number; // the currently selected profile in the list
  onSelected?: React.Dispatch<React.SetStateAction<number | undefined>>; // set the currently selected profile with the profile card index
  onPress?: (() => void) | null | undefined;
}
function ProfileCard(props: ProfileCardProps) {
  const selectedProfileIndex = props.selectedProfileIndex;
  const isSelected = selectedProfileIndex === props.profileIndexInList;
  return (
    <Pressable
      onPress={() => {
        props.onSelected?.(props.profileIndexInList);
        props.onPress?.();
      }}
    >
      <Card
        p={3}
        minW="100px"
        w="140px"
        bg={props.bg}
        borderWidth={isSelected ? 1.5 : 0}
      >
        <HStack h="20px">
          <Spacer />
          {isSelected && (
            <AntDesign name="checkcircleo" size={18} color="white" />
          )}
        </HStack>
        <Center>
          <VStack space={1} alignItems="center">
            {/* PlaceHolderImage : would be replaced by 3d render of dice */}
            <Image
              size={20}
              source={require("../../../../apps/pixels-app/assets/DieImageTransparent.png")}
              alt="placeHolder"
            />
            <Text isTruncated>{props.profileName}</Text>
          </VStack>
        </Center>
      </Card>
    </Pressable>
  );
}

export interface ProfileInfo {
  profileName: string;
}

export interface ProfilesScrollListProps {
  availableProfiles: ProfileInfo[];
}
export function ProfilesScrollList(props: ProfilesScrollListProps) {
  const [selectedProfile, SetSelectedProfile] = React.useState<number>();
  return (
    <VStack space={2}>
      <Text bold>Available profiles</Text>
      <Center bg="pixelColors.highlightGray" rounded="lg" p={2}>
        <Box w="300">
          <ScrollView
            horizontal
            width="100%"
            snapToAlignment="start"
            snapToInterval={150}
            fadingEdgeLength={20}
            decelerationRate="fast"
            persistentScrollbar
          >
            <HStack space={3}>
              {/* <ProfileCard bg="pixelColors.softBlack" />
              <ProfileCard bg="pixelColors.softBlack" />
              <ProfileCard bg="pixelColors.softBlack" />
              <ProfileCard bg="pixelColors.softBlack" />
              <ProfileCard bg="pixelColors.softBlack" /> */}
              {props.availableProfiles.map((profile, i) => (
                <ProfileCard
                  bg="pixelColors.softBlack"
                  profileName={profile.profileName}
                  profileIndexInList={i}
                  onSelected={SetSelectedProfile}
                  selectedProfileIndex={selectedProfile}
                />
              ))}
            </HStack>
          </ScrollView>
        </Box>
      </Center>
    </VStack>
  );
}
