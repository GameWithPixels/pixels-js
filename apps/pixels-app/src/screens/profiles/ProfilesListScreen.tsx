import { MaterialCommunityIcons } from "@expo/vector-icons";
import { StackNavigationProp } from "@react-navigation/stack";
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
import { AnimatedProfileSearchbar } from "~/components/AnimatedProfileSearchbar";
import { AppBackground } from "~/components/AppBackground";
import { HeaderBar } from "~/components/HeaderBar";
import { SortBottomSheet } from "~/components/SortBottomSheet";
import { FloatingAddButton } from "~/components/buttons";
import { ProfilesGrid, ProfilesList } from "~/components/profile";
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
  const [visible, setVisible] = React.useState(false);
  const [sortVisible, setSortVisible] = React.useState(false);
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
        groups={["Last Activation", "Die Type", "Group Name", "Creation Date"]}
        visible={sortVisible}
        onDismiss={() => setSortVisible(false)}
      />
    </>
  );
}

function ProfilesListPage({
  navigation,
}: {
  navigation: StackNavigationProp<ProfilesStackParamList>;
}) {
  const profiles = useProfilesList();
  const [viewMode, setViewMode] = React.useState<ProfilesViewMode>("list");
  const editProfile = (profile: Readonly<Profiles.Profile>) =>
    navigation.navigate("editProfile", { profileUuid: profile.uuid });

  const aref = useAnimatedRef<Animated.ScrollView>();
  const scrollHandler = useScrollViewOffset(aref);
  const searchbarHeight = 100;
  const initialPosition = searchbarHeight + (viewMode === "grid" ? 10 : 50);

  const [filter, setFilter] = React.useState("");
  const [group, setGroup] = React.useState("");
  const toggleGroup = React.useCallback(
    (g: string) => setGroup((group) => (group === g ? "" : g)),
    []
  );
  const filteredProfiles = useFilteredProfiles(profiles, filter, group);

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
            selectedGroup={group}
            toggleGroup={toggleGroup}
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
