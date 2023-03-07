import { EditProfile } from "@systemic-games/pixels-edit-animation";
import { FastHStack } from "@systemic-games/react-native-base-components";
import { ScrollView, ChevronLeftIcon, ChevronRightIcon } from "native-base";
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
  profiles: Readonly<EditProfile>[];
  dieRenderer: (profile: Readonly<EditProfile>) => React.ReactNode;
  onPress?: ((profile: Readonly<EditProfile>) => void) | null | undefined;
}

/**
 * A horizontal scroll list of profiles to be selected
 * @param props See {@link ProfilesScrollViewProps} for props parameters
 */
export function ProfilesScrollView(props: ProfilesScrollViewProps) {
  const [selectedProfile, setSelectedProfile] = React.useState<number>();
  return (
    <FastHStack alignItems="center">
      <ChevronLeftIcon />
      <ScrollView
        horizontal
        h={sr(85)}
        w={sr(350)}
        snapToAlignment="start"
        snapToInterval={115}
        fadingEdgeLength={20}
        decelerationRate="normal"
      >
        <FastHStack>
          {props.profiles.slice(0, 8).map((profile, i) => (
            <ProfileCard
              key={i}
              ml={i > 0 ? 2 : 0}
              w={sr(110)}
              imageSize={sr(50)}
              textSize="xs"
              p={sr(4)}
              name={profile.name}
              profileIndexInList={i}
              onSelected={setSelectedProfile}
              onPress={() => props.onPress?.(profile)}
              selectedProfileIndex={selectedProfile}
              selectable
              dieRenderer={() => props.dieRenderer(profile)}
            />
          ))}
          <ProfilesActionSheet
            w={sr(110)}
            profiles={props.profiles}
            dieRenderer={props.dieRenderer}
          />
        </FastHStack>
      </ScrollView>
      <ChevronRightIcon />
    </FastHStack>
  );
}
