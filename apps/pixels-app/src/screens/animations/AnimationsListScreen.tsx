import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Profiles } from "@systemic-games/react-native-pixels-connect";
import React from "react";
import { ScrollView, View } from "react-native";
import { Divider, IconButton, Menu, Text, useTheme } from "react-native-paper";

import GridIcon from "#/icons/items-view/grid";
import ListIcon from "#/icons/items-view/list";
import { useAppDispatch, useAppSelector } from "~/app/hooks";
import { AnimationsListScreenProps } from "~/app/navigation";
import { AppStyles } from "~/app/styles";
import { AnimationsGrid } from "~/components/AnimationsGrid";
import { AnimationsList } from "~/components/AnimationsList";
import { AppBackground } from "~/components/AppBackground";
import { HeaderMenuButton } from "~/components/HeaderMenuButton";
import {
  SortBottomSheet,
  SortBottomSheetSortIcon,
} from "~/components/SortBottomSheet";
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
import { setAnimationsGrouping, setAnimationsSortMode } from "~/features/store";
import { useAnimationsList } from "~/hooks";

export type AnimationsViewMode = "list" | "grid";

function PageHeader({
  viewMode,
  onSelectViewMode,
}: {
  viewMode: AnimationsViewMode;
  onSelectViewMode: (viewMode: AnimationsViewMode) => void;
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
      <HeaderMenuButton
        visible={visible}
        contentStyle={{ width: 210 }}
        onShowMenu={() => setVisible(true)}
        onDismiss={() => setVisible(false)}
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
          {(["list", "grid"] as AnimationsViewMode[]).map((vm, i) => {
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
      </HeaderMenuButton>
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

  const [viewMode, setViewMode] = React.useState<AnimationsViewMode>("grid");

  return (
    <>
      <AppBackground>
        <PageHeader
          viewMode={viewMode}
          onSelectViewMode={(vm) => setViewMode(vm)}
        />
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
    <AppBackground topLevel>
      <AnimationsListPage navigation={navigation} />
    </AppBackground>
  );
}
