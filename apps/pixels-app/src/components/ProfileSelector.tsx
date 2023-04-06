import { EditProfile } from "@systemic-games/pixels-edit-animation";
import {
  FastBoxProps,
  FastHStack,
} from "@systemic-games/react-native-base-components";
import {
  ProfileCard,
  ProfilesActionsheet,
} from "@systemic-games/react-native-pixels-components";
import { ScrollView, ChevronLeftIcon, ChevronRightIcon } from "native-base";
import React from "react";

/**
 * Props for the {@link ProfileSelector}.
 * @param profiles list of available profiles.
 * @param onPress function given to all the profiles to execute when pressed.
 */
export interface ProfileSelectorProps extends FastBoxProps {
  profiles: Readonly<EditProfile>[];
  dieRenderer: (profile: Readonly<EditProfile>) => React.ReactNode;
  onPress?: ((profile: Readonly<EditProfile>) => void) | null | undefined;
}

/**
 * A horizontal scroll list of profiles to be selected
 * @param props See {@link ProfileSelectorProps} for props parameters
 */
export function ProfileSelector({
  profiles,
  dieRenderer,
  onPress,
  ...flexProps
}: ProfileSelectorProps) {
  const [selectedProfile, setSelectedProfile] = React.useState<number>();
  return (
    <FastHStack alignItems="center" {...flexProps}>
      <ChevronLeftIcon />
      <ScrollView
        horizontal
        h={85}
        w={350}
        snapToAlignment="start"
        snapToInterval={115}
        fadingEdgeLength={20}
        decelerationRate="normal"
      >
        <FastHStack>
          {profiles.slice(0, 8).map((profile, i) => (
            <ProfileCard
              key={i}
              ml={i > 0 ? 2 : 0}
              w={110}
              imageSize={50}
              fontSize="xs"
              p={4}
              name={profile.name}
              profileIndexInList={i}
              onSelected={setSelectedProfile}
              onPress={() => onPress?.(profile)}
              selectedProfileIndex={selectedProfile}
              selectable
              dieRenderer={() => dieRenderer(profile)}
            />
          ))}
          <ProfilesActionsheet
            w={110}
            profiles={profiles}
            dieRenderer={dieRenderer}
          />
        </FastHStack>
      </ScrollView>
      <ChevronRightIcon />
    </FastHStack>
  );
}
