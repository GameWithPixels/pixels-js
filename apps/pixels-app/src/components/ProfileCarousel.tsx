import {
  expandShorthandStyle,
  BaseFlexProps,
  BaseHStack,
} from "@systemic-games/react-native-base-components";
import {
  ProfileCard,
  ProfileSelector,
  ProfileSelectorProps,
} from "@systemic-games/react-native-pixels-components";
import React from "react";
import { ScrollView } from "react-native";

/**
 * Props for the {@link ProfileSelector}.
 * @param profiles list of available profiles.
 * @param onPress function given to all the profiles to execute when pressed.
 */
export interface ProfileCarouselProps
  extends Pick<
      ProfileSelectorProps,
      | "profiles"
      | "profile"
      | "onProfileSelect"
      | "modalTitle"
      | "dieRenderer"
      | "dieViewSize"
    >,
    BaseFlexProps {}

/**
 * A horizontal scroll list of profiles to be selected
 * @param props See {@link ProfileCarouselProps} for props parameters
 */
export function ProfileCarousel({
  profiles,
  profile,
  onProfileSelect,
  modalTitle,
  dieRenderer,
  dieViewSize,
  ...flexProps
}: ProfileCarouselProps) {
  return (
    <ScrollView
      horizontal
      snapToAlignment="start"
      // snapToInterval={115}
      fadingEdgeLength={20}
      style={expandShorthandStyle(flexProps)}
    >
      <BaseHStack>
        {profiles.slice(0, 8).map((p) => (
          <ProfileCard
            key={p.uuid}
            name={p.name}
            smallLabel
            dieRenderer={dieRenderer && (() => dieRenderer(p))}
            dieViewSize={dieViewSize}
            onPress={() => onProfileSelect?.(p)}
            highlighted={p === profile}
          />
        ))}
        <ProfileSelector
          profiles={profiles}
          profile={profile}
          onProfileSelect={onProfileSelect}
          modalTitle={modalTitle}
          dieRenderer={dieRenderer}
          dieViewSize={dieViewSize}
        />
      </BaseHStack>
    </ScrollView>
  );
}
