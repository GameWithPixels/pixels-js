import {
  ScrollView,
  HStack,
  Box,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "native-base";
import React from "react";

import { sr } from "../utils";
import { ProfileCard, ProfileInfo } from "./ProfileCard";
import { ProfilesActionSheet } from "./ProfilesActionSheet";

/**
 * Props for the profilesScrollview
 * @param availableProfiles array of {@link ProfileInfo} that represent all the list profiles
 * @param onPress function given to all the profiles to execute when pressed
 */
export interface ProfilesScrollViewProps {
  availableProfiles: ProfileInfo[];
  onPress?: (() => void) | null | undefined;
}

/**
 * A horizontal scroll list of profiles to be selected
 * @param props See {@link ProfilesScrollViewProps} for props parameters
 */
export function ProfilesScrollView(props: ProfilesScrollViewProps) {
  const [selectedProfile, setSelectedProfile] = React.useState<number>();
  return (
    <HStack alignItems="center">
      <ChevronLeftIcon />
      <Box h={sr(85)} w={sr(350)}>
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
                verticalSpace={sr(4)}
                imageSize={sr(50)}
                textSize="xs"
                p={sr(4)}
                profileName={profile.profileName}
                profileIndexInList={i}
                onSelected={setSelectedProfile}
                onPress={props.onPress}
                selectedProfileIndex={selectedProfile}
                selectable
                imageRequirePath={profile.imageRequirePath}
              />
            ))}
            <ProfilesActionSheet
              w={sr(110)}
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
  );
}
