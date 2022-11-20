import {
  Center,
  ScrollView,
  VStack,
  HStack,
  Box,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "native-base";
import React from "react";

// eslint-disable-next-line import/namespace
import { ProfileCard, ProfileInfo } from "./ProfileCard";
import { ProfilesListPopUp } from "./ProfilesListPopUp";

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
                <ProfilesListPopUp
                  ProfilesInfo={[
                    {
                      profileName: "Profile 1",
                      imageRequirePath: require("~/../assets/YellowDice.png"),
                    },
                    {
                      profileName: "Profile 2",
                      imageRequirePath: require("~/../assets/BlueDice.png"),
                    },
                    {
                      profileName: "Profile 3",
                      imageRequirePath: require("~/../assets/BlueDice.png"),
                    },
                    {
                      profileName: "Profile 4",
                      imageRequirePath: require("~/../assets/RainbowDice.png"),
                    },
                    {
                      profileName: "Profile 5",
                      imageRequirePath: require("~/../assets/DieImageTransparent.png"),
                    },
                    {
                      profileName: "Profile 6",
                      imageRequirePath: require("~/../assets/DieImageTransparent.png"),
                    },
                    {
                      profileName: "Profile 7",
                      imageRequirePath: require("~/../assets/BlueDice.png"),
                    },
                    {
                      profileName: "Profile 8",
                      imageRequirePath: require("~/../assets/YellowDice.png"),
                    },
                    {
                      profileName: "Profile 9",
                      imageRequirePath: require("~/../assets/DieImageTransparent.png"),
                    },
                    {
                      profileName: "Profile 10",
                      imageRequirePath: require("~/../assets/RainbowDice.png"),
                    },
                    {
                      profileName: "Profile 11",
                      imageRequirePath: require("~/../assets/DieImageTransparent.png"),
                    },
                    {
                      profileName: "Profile 12",
                      imageRequirePath: require("~/../assets/RainbowDice.png"),
                    },
                    {
                      profileName: "Profile 13",
                      imageRequirePath: require("~/../assets/BlueDice.png"),
                    },
                    {
                      profileName: "Profile 14",
                      imageRequirePath: require("~/../assets/DieImageTransparent.png"),
                    },
                    {
                      profileName: "Profile 15",
                      imageRequirePath: require("~/../assets/YellowDice.png"),
                    },
                  ]}
                />
              </HStack>
            </ScrollView>
          </Box>
          <ChevronRightIcon />
        </HStack>
      </Center>
    </VStack>
  );
}
