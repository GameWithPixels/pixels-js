import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Profiles } from "@systemic-games/react-native-pixels-connect";
import React from "react";
import { View } from "react-native";
import { ScrollView as GHScrollView } from "react-native-gesture-handler";
import { Divider, IconButton, Menu, Text, useTheme } from "react-native-paper";
import Animated, {
  useAnimatedRef,
  useScrollViewOffset,
} from "react-native-reanimated";

import GridIcon from "#/icons/items-view/grid";
import ListIcon from "#/icons/items-view/list";
import { useAppDispatch, useAppSelector, useAppStore } from "~/app/hooks";
import {
  AnimatedProfileSearchbar,
  profileSearchbarMinHeight,
} from "~/components/AnimatedProfileSearchbar";
import { AppBackground } from "~/components/AppBackground";
import { HeaderMenuButton } from "~/components/HeaderMenuButton";
import { PickDieBottomSheet } from "~/components/PickDieBottomSheet";
import {
  SortBottomSheet,
  SortBottomSheetSortIcon,
} from "~/components/SortBottomSheet";
import { CreateProfileBanner } from "~/components/banners";
import { FloatingAddButton } from "~/components/buttons";
import { ProfilesGrid, ProfilesList } from "~/components/profile";
import {
  getCompatibleDiceTypes,
  getProfilesGroupingLabel,
  getSortModeIcon,
  getSortModeLabel,
  ProfilesGrouping,
  ProfilesGroupingList,
  SortMode,
  SortModeList,
} from "~/features/profiles";
import {
  Library,
  readProfile,
  setProfilesGrouping,
  setProfilesSortMode,
  setProfilesViewMode,
} from "~/features/store";
import { useFilteredProfiles, useProfilesList } from "~/hooks";
import { ProfilesListScreenProps } from "~/navigation";
import { AppStyles } from "~/styles";

export type ProfilesViewMode = "list" | "grid";

function PageHeader({
  viewMode,
  onSelectViewMode,
}: {
  viewMode: ProfilesViewMode;
  onSelectViewMode: (viewMode: ProfilesViewMode) => void;
}) {
  const appDispatch = useAppDispatch();
  const [menuVisible, setMenuVisible] = React.useState(false);
  const [sortVisible, setSortVisible] = React.useState(false);
  const groupBy = useAppSelector((state) => state.appSettings.profilesGrouping);
  const sortMode = useAppSelector(
    (state) => state.appSettings.profilesSortMode
  );
  const { colors } = useTheme();
  return (
    <>
      <HeaderMenuButton
        visible={menuVisible}
        contentStyle={{ width: 190 }}
        onShowMenu={() => setMenuVisible(true)}
        onDismiss={() => setMenuVisible(false)}
      >
        <Text variant="labelLarge" style={AppStyles.selfCentered}>
          View Modes
        </Text>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-evenly",
            marginBottom: 5,
          }}
        >
          {(["list", "grid"] as ProfilesViewMode[]).map((vm, i) => {
            const Icon = i ? GridIcon : ListIcon;
            return (
              <IconButton
                key={vm}
                selected={viewMode === vm}
                size={24}
                icon={Icon}
                onPress={() => {
                  setMenuVisible(false);
                  onSelectViewMode(vm);
                }}
              />
            );
          })}
        </View>
        <Divider />
        <Menu.Item
          title="Sort"
          trailingIcon={() => (
            <MaterialCommunityIcons
              name="sort"
              size={24}
              color={colors.onSurface}
            />
          )}
          contentStyle={AppStyles.menuItemWithIcon}
          onPress={() => {
            setMenuVisible(false);
            setSortVisible(true);
          }}
        />
        {/* <Divider />
        <Menu.Item
          title="Recover Profile"
          trailingIcon={() => (
            <MaterialCommunityIcons
              name="delete-restore"
              size={24}
              color={colors.onSurface}
            />
          )}
          contentStyle={AppStyles.menuItemWithIcon}
          onPress={() => {
            setVisible(false);
          }}
        /> */}
      </HeaderMenuButton>
      <SortBottomSheet
        groups={ProfilesGroupingList}
        groupBy={groupBy}
        getGroupingLabel={getProfilesGroupingLabel as (g: string) => string}
        onChangeGroupBy={(group) =>
          appDispatch(setProfilesGrouping(group as ProfilesGrouping))
        }
        sortModes={SortModeList}
        getSortModeLabel={getSortModeLabel as (g: string) => string}
        getSortModeIcon={
          getSortModeIcon as (mode: string) => SortBottomSheetSortIcon
        }
        sortMode={sortMode}
        onChangeSortMode={(mode) =>
          appDispatch(setProfilesSortMode(mode as SortMode))
        }
        visible={sortVisible}
        onDismiss={() => setSortVisible(false)}
      />
    </>
  );
}

function ProfilesListPage({
  navigation,
}: {
  navigation: ProfilesListScreenProps["navigation"];
}) {
  const store = useAppStore();
  const { library: profiles } = useProfilesList();

  const editProfile = (profile: Readonly<Profiles.Profile>) =>
    navigation.navigate("editProfileStack", {
      screen: "editProfile",
      params: {
        profileUuid: profile.uuid,
      },
    });
  const [profileToProgram, setProfileToProgram] =
    React.useState<Readonly<Profiles.Profile>>();

  const viewMode = useAppSelector((state) => state.appSettings.profileViewMode);
  const groupBy = useAppSelector((state) => state.appSettings.profilesGrouping);
  const sortMode = useAppSelector(
    (state) => state.appSettings.profilesSortMode
  );

  const aref = useAnimatedRef<Animated.ScrollView>();
  const scrollHandler = useScrollViewOffset(aref);
  const searchbarHeight = profileSearchbarMinHeight;
  const initialPosition = searchbarHeight + (viewMode === "grid" ? 10 : 50);

  const [filter, setFilter] = React.useState("");
  const filteredProfiles = useFilteredProfiles(profiles, filter);

  const [wasBannerInitiallyVisible, setWasBannerInitiallyVisible] =
    React.useState(!profiles.length);
  React.useEffect(() => {
    if (!profiles.length) {
      setWasBannerInitiallyVisible(true);
    }
  }, [profiles.length]);

  React.useEffect(() => {
    aref.current?.scrollTo({ y: initialPosition, animated: false });
  }, [aref, initialPosition]);

  return (
    <>
      <GHScrollView
        ref={aref}
        style={{ height: "100%" }}
        contentContainerStyle={{
          padding: 10,
          paddingBottom: 90, // Leave room for the FAB "+" button
          gap: 10,
        }}
        scrollEventThrottle={16}
        snapToOffsets={[0, initialPosition]}
        snapToEnd={false}
      >
        <View style={{ marginTop: 35, height: searchbarHeight }}>
          <AnimatedProfileSearchbar
            filter={filter}
            setFilter={setFilter}
            positionY={scrollHandler}
            headerHeight={searchbarHeight}
          />
        </View>
        {wasBannerInitiallyVisible && (
          <CreateProfileBanner
            visible={!profiles.length}
            collapsedMarginBottom={-10}
          />
        )}
        {viewMode === "grid" ? (
          <ProfilesGrid
            profiles={filteredProfiles}
            onSelectProfile={editProfile}
            onProgramDice={setProfileToProgram}
          />
        ) : (
          <ProfilesList
            profiles={filteredProfiles}
            onSelectProfile={editProfile}
            onProgramDice={setProfileToProgram}
            groupBy={groupBy}
            sortMode={sortMode}
          />
        )}
      </GHScrollView>
      <PageHeader
        viewMode={viewMode}
        onSelectViewMode={(vm) => store.dispatch(setProfilesViewMode(vm))}
      />
      <FloatingAddButton
        sentry-label="add-profile"
        onPress={() => navigation.navigate("createProfile")}
      />
      <PickDieBottomSheet
        dieTypes={
          profileToProgram
            ? getCompatibleDiceTypes(profileToProgram.dieType)
            : undefined
        }
        visible={!!profileToProgram}
        onDismiss={(pairedDie) => {
          if (pairedDie && profileToProgram) {
            // Update die profile
            const profileData =
              store.getState().library.profiles.entities[profileToProgram.uuid];
            if (profileData) {
              store.dispatch(
                Library.Profiles.update({
                  ...profileData,
                  uuid: pairedDie.profileUuid,
                  sourceUuid: profileToProgram.uuid,
                })
              );
              // Update profile instance
              readProfile(pairedDie.profileUuid, store.getState().library);
            }
          }
          setProfileToProgram(undefined);
        }}
      />
    </>
  );
}

export function ProfilesListScreen({ navigation }: ProfilesListScreenProps) {
  return (
    <AppBackground topLevel>
      <ProfilesListPage navigation={navigation} />
    </AppBackground>
  );
}
