import {
  PixelDieType,
  Profiles,
} from "@systemic-games/react-native-pixels-connect";
import React from "react";
import { View, ViewProps } from "react-native";
import { ScrollView as GHScrollView } from "react-native-gesture-handler";
import { Text } from "react-native-paper";
import Animated, {
  useAnimatedRef,
  useScrollViewOffset,
} from "react-native-reanimated";

import {
  AnimatedProfileSearchbar,
  profileSearchbarMinHeight,
} from "./AnimatedProfileSearchbar";
import { TabsHeaders } from "./TabsHeaders";
import { ProfilesList } from "./profile";

import { useAppStore } from "~/app/hooks";
import { getDieTypeLabel } from "~/features/dice";
import {
  createProfileTemplates,
  getCompatibleDieTypes,
} from "~/features/profiles";
import { useFilteredProfiles, useProfilesList } from "~/hooks";

const tabsNames = ["Builtin", /*"Dice",*/ "Library"] as const;

export function ProfilePicker({
  dieType,
  onSelectProfile,
  ...props
}: {
  dieType: PixelDieType;
  onSelectProfile: (profile: Readonly<Profiles.Profile>) => void;
} & Omit<ViewProps, "hitSlop">) {
  const { library: libraryProfiles, dice: diceProfiles } = useProfilesList();

  const [tab, setTab] = React.useState<(typeof tabsNames)[number]>(
    tabsNames[0]
  );
  const store = useAppStore();
  const templates = React.useMemo(
    () =>
      createProfileTemplates(
        dieType,
        store.getState().library // TODO
      ),
    [dieType, store]
  );
  const compatibleDieTypes = React.useMemo(
    () => getCompatibleDieTypes(dieType),
    [dieType]
  );
  const profiles = React.useMemo(
    () =>
      (tab === "Builtin"
        ? templates
        : // : tab === "Dice"
          //   ? diceProfiles
          libraryProfiles
      )
        .filter(
          (p) =>
            p.dieType === "unknown" || compatibleDieTypes.includes(p.dieType)
        )
        .sort((a, b) => a.name.localeCompare(b.name)),
    [compatibleDieTypes, libraryProfiles, tab, templates]
  );

  const [filter, setFilter] = React.useState("");
  const filteredProfiles = useFilteredProfiles(profiles, filter, dieType);

  const aref = useAnimatedRef<Animated.ScrollView>();
  const scrollHandler = useScrollViewOffset(aref);
  const searchbarHeight = profileSearchbarMinHeight;

  return (
    <GHScrollView
      ref={aref}
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{ paddingBottom: 10, gap: 20 }}
      scrollEventThrottle={16}
      contentOffset={{ x: 0, y: searchbarHeight }}
      snapToOffsets={[0, searchbarHeight]}
      snapToEnd={false}
      {...props}
    >
      <View style={{ height: searchbarHeight }}>
        <AnimatedProfileSearchbar
          filter={filter}
          setFilter={setFilter}
          positionY={scrollHandler}
          headerHeight={searchbarHeight}
        />
      </View>
      <TabsHeaders keys={tabsNames} selected={tab} onSelect={setTab} />
      {filteredProfiles.length ? (
        <ProfilesList
          profiles={filteredProfiles}
          onSelectProfile={onSelectProfile}
        />
      ) : (
        <Text
          variant="bodyLarge"
          style={{ marginTop: 10, marginHorizontal: 10 }}
        >
          {tab === "Library"
            ? "You do not have any saved profile" +
              (dieType ? ` for ${getDieTypeLabel(dieType)}'s` : "") +
              " in your library.\n" +
              "To create one, save your die's profile or go to the Profiles tab."
            : // : tab === "Dice"
              //   ? `No other ${getDieTypeLabel(dieType)} die.`
              ""}
        </Text>
      )}
    </GHScrollView>
  );
}
