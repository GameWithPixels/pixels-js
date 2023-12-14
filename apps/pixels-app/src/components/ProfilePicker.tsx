import {
  PixelDieType,
  Profiles,
} from "@systemic-games/react-native-pixels-connect";
import React from "react";
import { View, ViewProps } from "react-native";
import Animated, {
  useAnimatedRef,
  useScrollViewOffset,
} from "react-native-reanimated";

import { AnimatedProfileSearchbar } from "./AnimatedProfileSearchbar";
import { ProfilesList } from "./profile";

import { useProfilesList } from "~/hooks";
import { useFilteredProfiles } from "~/hooks/useFilteredProfiles";

export function ProfilePicker({
  selected,
  transferring,
  dieType,
  onSelectProfile,
  style,
  ...props
}: {
  selected?: Readonly<Profiles.Profile>;
  transferring?: boolean;
  dieType?: PixelDieType;
  onSelectProfile: (profile: Readonly<Profiles.Profile>) => void;
} & ViewProps) {
  const profiles = useProfilesList();
  const aref = useAnimatedRef<Animated.ScrollView>();
  const scrollHandler = useScrollViewOffset(aref);
  const searchbarHeight = 100;

  const [filter, setFilter] = React.useState("");
  const [group, setGroup] = React.useState("");
  const toggleGroup = React.useCallback(
    (g: string) => setGroup((group) => (group === g ? "" : g)),
    []
  );
  const filteredProfiles = useFilteredProfiles(profiles, filter, group);

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
        <View style={{ height: searchbarHeight }}>
          <AnimatedProfileSearchbar
            filter={filter}
            setFilter={setFilter}
            selectedGroup={group}
            toggleGroup={toggleGroup}
            positionY={scrollHandler}
            headerHeight={searchbarHeight}
          />
        </View>
        <ProfilesList
          profiles={filteredProfiles}
          selected={selected}
          transferring={transferring ? selected : undefined}
          onSelectProfile={onSelectProfile}
        />
      </Animated.ScrollView>
    </View>
  );
}
