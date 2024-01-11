import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Profiles } from "@systemic-games/react-native-pixels-connect";
import React from "react";
import { ScrollView, View } from "react-native";
import { Divider, IconButton, Menu, Text, useTheme } from "react-native-paper";

import GridIcon from "#/icons/items-view/grid";
import ListIcon from "#/icons/items-view/list";
import { useAppDispatch, useAppSelector } from "~/app/hooks";
import { AppBackground } from "~/components/AppBackground";
import { HeaderBar } from "~/components/HeaderBar";
import {
  SortBottomSheet,
  SortBottomSheetSortIcon,
} from "~/components/SortBottomSheet";
import { AnimationsGrid, AnimationsList } from "~/components/animation";
import { FloatingAddButton } from "~/components/buttons";
import {
  AnimationsGrouping,
  AnimationsGroupingList,
  getAnimationsGroupingLabel,
  getSortModeIcon,
  getSortModeLabel,
  SortMode,
  SortModeList,
} from "~/features/profiles";
import {
  setAnimationsGrouping,
  setAnimationsSortMode,
} from "~/features/store/appSettingsSlice";
import { useAnimationsList } from "~/hooks";
import { AnimationsListScreenProps } from "~/navigation";
import { AppStyles } from "~/styles";

type ProfilesViewMode = "list" | "grid";

function PageHeader({
  viewMode,
  onSelectViewMode,
}: {
  viewMode: ProfilesViewMode;
  onSelectViewMode: (viewMode: ProfilesViewMode) => void;
}) {
  const appDispatch = useAppDispatch();
  const [visible, setVisible] = React.useState(false);
  const [sortVisible, setSortVisible] = React.useState(false);
  const groupBy = useAppSelector(
    (state) => state.appSettings.animationsGrouping
  );
  const sortMode = useAppSelector(
    (state) => state.appSettings.animationsSortMode
  );
  const { colors } = useTheme();
  return (
    <>
      <HeaderBar
        visible={visible}
        contentStyle={{ width: 210 }}
        onShowMenu={() => setVisible(true)}
        onDismiss={() => setVisible(false)}
      >
        <Text variant="labelLarge" style={{ alignSelf: "center" }}>
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
          title="Recover Animation"
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
        groups={AnimationsGroupingList}
        getGroupingLabel={getAnimationsGroupingLabel as (g: string) => string}
        groupBy={groupBy}
        onChangeGroupBy={(group) =>
          appDispatch(setAnimationsGrouping(group as AnimationsGrouping))
        }
        sortModes={SortModeList}
        getSortModeLabel={getSortModeLabel as (g: string) => string}
        getSortModeIcon={
          getSortModeIcon as (mode: string) => SortBottomSheetSortIcon
        }
        sortMode={sortMode}
        onChangeSortMode={(mode) =>
          appDispatch(setAnimationsSortMode(mode as SortMode))
        }
        visible={sortVisible}
        onDismiss={() => setSortVisible(false)}
      />
    </>
  );
}

function AnimationsListPage({
  navigation,
}: {
  navigation: AnimationsListScreenProps["navigation"];
}) {
  const animations = useAnimationsList();
  const editAnimation = (animation: Readonly<Profiles.Animation>) => {
    navigation.navigate("editAnimation", { animationUuid: animation.uuid });
  };

  const [viewMode, setViewMode] = React.useState<ProfilesViewMode>("grid");

  return (
    <>
      <AppBackground>
        <ScrollView
          contentContainerStyle={{
            padding: 10,
            paddingBottom: 20,
          }}
        >
          {viewMode === "grid" ? (
            <AnimationsGrid
              animations={animations}
              onSelectAnimation={editAnimation}
              style={{ marginTop: 40 }}
            />
          ) : (
            <AnimationsList
              animations={animations}
              onSelectAnimation={editAnimation}
              style={{ marginTop: 40 }}
            />
          )}
        </ScrollView>
        <PageHeader
          viewMode={viewMode}
          onSelectViewMode={(vm) => setViewMode(vm)}
        />
      </AppBackground>
      <FloatingAddButton
        sentry-label="add-animation"
        onPress={() => navigation.navigate("createAnimation")}
      />
    </>
  );
}

export function AnimationsListScreen({
  navigation,
}: AnimationsListScreenProps) {
  return (
    <AppBackground>
      <AnimationsListPage navigation={navigation} />
    </AppBackground>
  );
}
