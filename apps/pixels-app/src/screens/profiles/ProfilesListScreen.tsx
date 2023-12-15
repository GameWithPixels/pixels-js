import { MaterialCommunityIcons } from "@expo/vector-icons";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Profiles } from "@systemic-games/react-native-pixels-connect";
import React from "react";
import { View } from "react-native";
import { Divider, IconButton, Menu, useTheme } from "react-native-paper";
import Animated, {
  useAnimatedRef,
  useScrollViewOffset,
} from "react-native-reanimated";

import GridIcon from "#/icons/items-view/grid";
import ListIcon from "#/icons/items-view/list";
import { useAppDispatch, useAppSelector } from "~/app/hooks";
import {
  AnimatedProfileSearchbar,
  profileSearchbarMinHeight,
} from "~/components/AnimatedProfileSearchbar";
import { AppBackground } from "~/components/AppBackground";
import { HeaderBar } from "~/components/HeaderBar";
import {
  SortBottomSheet,
  SortBottomSheetSortIcon,
} from "~/components/SortBottomSheet";
import { FloatingAddButton } from "~/components/buttons";
import { ProfilesGrid, ProfilesList } from "~/components/profile";
import {
  getProfilesGroupingLabel,
  getSortModeIcon,
  getSortModeLabel,
  ProfilesGrouping,
  ProfilesGroupingList,
  SortMode,
  SortModeList,
} from "~/features/sortingOptions";
import {
  setProfilesGrouping,
  setProfilesSortMode,
} from "~/features/store/appSettingsSlice";
import { useProfilesList } from "~/hooks";
import { useFilteredProfiles } from "~/hooks/useFilteredProfiles";
import { ProfilesListScreenProps, ProfilesStackParamList } from "~/navigation";
import { AppStyles } from "~/styles";

type ProfilesViewMode = "list" | "grid";

function PageActions({
  viewMode,
  onSelectViewMode,
}: {
  viewMode: ProfilesViewMode;
  onSelectViewMode: (viewMode: ProfilesViewMode) => void;
}) {
  const appDispatch = useAppDispatch();
  const [visible, setVisible] = React.useState(false);
  const [sortVisible, setSortVisible] = React.useState(false);
  const groupBy = useAppSelector((state) => state.appSettings.profilesGrouping);
  const sortMode = useAppSelector(
    (state) => state.appSettings.profilesSortMode
  );
  const { colors } = useTheme();
  return (
    <>
      <HeaderBar
        visible={visible}
        contentStyle={{ width: 190 }}
        onShow={() => setVisible(true)}
        onDismiss={() => setVisible(false)}
      >
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-evenly",
            marginBottom: 5,
          }}
        >
          {(["list", "grid"] as ProfilesViewMode[]).map((vm, i) => {
            const Icon = i === 0 ? ListIcon : GridIcon;
            return (
              <IconButton
                key={vm}
                selected={viewMode === vm}
                size={24}
                icon={Icon}
                onPress={() => {
                  setVisible(false);
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
            setVisible(false);
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
      </HeaderBar>
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
  navigation: NativeStackNavigationProp<ProfilesStackParamList, "profilesList">;
}) {
  const profiles = useProfilesList();
  const [viewMode, setViewMode] = React.useState<ProfilesViewMode>("list");
  const groupBy = useAppSelector((state) => state.appSettings.profilesGrouping);
  const sortMode = useAppSelector(
    (state) => state.appSettings.profilesSortMode
  );

  const editProfile = (profile: Readonly<Profiles.Profile>) =>
    navigation.navigate("editProfile", { profileUuid: profile.uuid });

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
      <Animated.ScrollView
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
        {viewMode === "grid" ? (
          <ProfilesGrid
            profiles={filteredProfiles}
            onSelectProfile={editProfile}
          />
        ) : (
          <ProfilesList
            profiles={filteredProfiles}
            expandableItems
            onSelectProfile={editProfile}
            groupBy={groupBy}
            sortMode={sortMode}
          />
        )}
      </Animated.ScrollView>
      <PageActions
        viewMode={viewMode}
        onSelectViewMode={(vm) => setViewMode(vm)}
      />
      <FloatingAddButton onPress={() => navigation.navigate("createProfile")} />
    </>
  );
}

export function ProfilesListScreen({ navigation }: ProfilesListScreenProps) {
  return (
    <AppBackground>
      <ProfilesListPage navigation={navigation} />
    </AppBackground>
  );
}
