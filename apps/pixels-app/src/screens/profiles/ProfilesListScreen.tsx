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
import { ProfilesListScreenProps } from "~/app/navigation";
import { AppStyles } from "~/app/styles";
import {
  AnimatedProfileSearchbar,
  profileSearchbarMinHeight,
} from "~/components/AnimatedProfileSearchbar";
import { AppBackground } from "~/components/AppBackground";
import { HeaderMenuButton } from "~/components/HeaderMenuButton";
import {
  SortBottomSheet,
  SortBottomSheetSortIcon,
} from "~/components/SortBottomSheet";
import { FloatingAddButton } from "~/components/buttons";
import { EmptyLibraryCard } from "~/components/cards";
import { ProfilesGrid, ProfilesList } from "~/components/profile";
import {
  getProfilesGroupingLabel,
  getSortModeIcon,
  getSortModeLabel,
  ProfilesGrouping,
  ProfilesGroupingList,
  SortMode,
  SortModeList,
} from "~/features/profiles";
import {
  setProfilesGrouping,
  setProfilesSortMode,
  setProfilesViewMode,
} from "~/features/store";
import { useFilteredProfiles, useProfilesList } from "~/hooks";

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

  const createProfile = () => navigation.navigate("createProfile");
  const editProfile = (profile: Readonly<Profiles.Profile>) =>
    navigation.navigate("editProfileStack", {
      screen: "editProfile",
      params: {
        profileUuid: profile.uuid,
      },
    });

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
        {profiles.length ? (
          <>
            <View style={{ marginTop: 35, height: searchbarHeight }}>
              <AnimatedProfileSearchbar
                filter={filter}
                setFilter={setFilter}
                positionY={scrollHandler}
                headerHeight={searchbarHeight}
              />
            </View>
            {viewMode === "grid" ? (
              <ProfilesGrid
                profiles={filteredProfiles}
                onSelectProfile={editProfile}
              />
            ) : (
              <ProfilesList
                profiles={filteredProfiles}
                onSelectProfile={editProfile}
                groupBy={groupBy}
                sortMode={sortMode}
              />
            )}
          </>
        ) : (
          <EmptyLibraryCard onPress={createProfile} />
        )}
      </GHScrollView>
      {profiles.length > 0 && (
        <>
          <PageHeader
            viewMode={viewMode}
            onSelectViewMode={(vm) => store.dispatch(setProfilesViewMode(vm))}
          />
          <FloatingAddButton
            sentry-label="add-profile"
            onPress={createProfile}
          />
        </>
      )}
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
