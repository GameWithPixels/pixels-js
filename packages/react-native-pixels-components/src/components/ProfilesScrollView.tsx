import { EditProfile } from "@systemic-games/pixels-edit-animation";
import {
  ScrollView,
  HStack,
  Box,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "native-base";
import React from "react";

import { sr } from "../utils";
import { ProfileCard } from "./ProfileCard";
import { ProfilesActionSheet } from "./ProfilesActionSheet";

/**
 * Props for the {@link ProfilesScrollView}.
 * @param profiles list of available profiles.
 * @param onPress function given to all the profiles to execute when pressed.
 */
export interface ProfilesScrollViewProps {
  profiles: EditProfile[];
  dieRender: (profile: EditProfile) => React.ReactNode;
  onPress?: ((profile: EditProfile) => void) | null | undefined;
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
            {props.profiles.slice(0, 8).map((profile, i) => (
              <ProfileCard
                key={i}
                w={sr(110)}
                verticalSpace={sr(4)}
                imageSize={sr(50)}
                textSize="xs"
                p={sr(4)}
                profileName={profile.name}
                profileIndexInList={i}
                onSelected={setSelectedProfile}
                onPress={() => props.onPress?.(profile)}
                selectedProfileIndex={selectedProfile}
                selectable
                dieRender={() => props.dieRender(profile)}
              />
            ))}
            <ProfilesActionSheet
              w={sr(110)}
              profiles={props.profiles}
              dieRender={props.dieRender}
            />
          </HStack>
        </ScrollView>
      </Box>
      <ChevronRightIcon />
    </HStack>
  );
}
