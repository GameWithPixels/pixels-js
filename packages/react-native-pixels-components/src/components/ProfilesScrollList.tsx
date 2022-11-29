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

import { sr } from "../utils";
// eslint-disable-next-line import/namespace
import { ProfileCard, ProfileInfo } from "./ProfileCard";
import { ProfilesListPopUp } from "./ProfilesListPopUp";

export interface ProfilesScrollListProps {
  availableProfiles: ProfileInfo[];
  onPress?: (() => void) | null | undefined;
}
export function ProfilesScrollList(props: ProfilesScrollListProps) {
  const [selectedProfile, SetSelectedProfile] = React.useState<number>();
  return (
    <VStack space={sr(2)}>
      <Center
        rounded="lg"
        p={sr(9)}
        bg="pixelColors.highlightGray"
        width="100%"
      >
        <HStack alignItems="center">
          <ChevronLeftIcon />
          <Box h={sr(100)} w={sr(350)}>
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
                    w={sr(110)}
                    h={sr(90)}
                    verticalSpace={sr(4)}
                    imageSize={sr(50)}
                    textSize="xs"
                    p={sr(4)}
                    profileName={profile.profileName}
                    profileIndexInList={i}
                    onSelected={SetSelectedProfile}
                    onPress={props.onPress}
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
