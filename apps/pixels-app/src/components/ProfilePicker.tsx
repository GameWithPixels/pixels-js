import {
  PixelDieType,
  Profiles,
} from "@systemic-games/react-native-pixels-connect";
import React from "react";
import { View, ViewProps } from "react-native";
import { Text } from "react-native-paper";
import Animated, {
  useAnimatedRef,
  useScrollViewOffset,
} from "react-native-reanimated";

import {
  AnimatedProfileSearchbar,
  profileSearchbarMinHeight,
} from "./AnimatedProfileSearchbar";
import { ProfilesList } from "./profile";

import { getDieTypeLabel } from "~/features/profiles";
import { useFilteredProfiles, useProfilesList } from "~/hooks";

export function ProfilePicker({
  selected,
  dieType,
  onSelectProfile,
  style,
  ...props
}: {
  selected?: Readonly<Profiles.Profile>;
  dieType?: PixelDieType;
  onSelectProfile: (profile: Readonly<Profiles.Profile>) => void;
} & ViewProps) {
  const profiles = useProfilesList();
  const aref = useAnimatedRef<Animated.ScrollView>();
  const scrollHandler = useScrollViewOffset(aref);
  const searchbarHeight = profileSearchbarMinHeight;

  const [filter, setFilter] = React.useState("");
  const filteredProfiles = useFilteredProfiles(profiles, filter, dieType);

  return (
    <View style={[{ gap: 10 }, style]} {...props}>
      <Animated.ScrollView
        ref={aref}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ paddingBottom: 10 }}
        scrollEventThrottle={16}
        contentOffset={{ x: 0, y: searchbarHeight }}
        snapToOffsets={[0, searchbarHeight]}
        snapToEnd={false}
      >
        {filteredProfiles.length ? (
          <>
            {/* <View style={{ height: searchbarHeight }}>
              <AnimatedProfileSearchbar
                filter={filter}
                setFilter={setFilter}
                positionY={scrollHandler}
                headerHeight={searchbarHeight}
              />
            </View> */}
            <ProfilesList
              profiles={filteredProfiles}
              selected={selected}
              onSelectProfile={onSelectProfile}
            />
          </>
        ) : (
          <Text
            variant="bodyLarge"
            style={{ marginTop: 10, marginHorizontal: 10 }}
          >
            There is no existing profile
            {dieType ? ` for ${getDieTypeLabel(dieType)}'s` : ""}, go in the
            Profiles tab to create one.
          </Text>
        )}
      </Animated.ScrollView>
    </View>
  );
}
