import { MaterialCommunityIcons } from "@expo/vector-icons";
import { StackNavigationProp } from "@react-navigation/stack";
import { PixelAnimation } from "@systemic-games/pixels-core-connect";
import React from "react";
import { ScrollView, View } from "react-native";
import { Divider, IconButton, Menu, useTheme } from "react-native-paper";

import GridIcon from "#/icons/items-view/grid";
import ListIcon from "#/icons/items-view/list";
import { AppBackground } from "@/components/AppBackground";
import { HeaderBar } from "@/components/HeaderBar";
import { SortBottomSheet } from "@/components/SortBottomSheet";
import { AnimationsGrid, AnimationsList } from "@/components/animation";
import { FloatingAddButton } from "@/components/buttons";
import { useAnimations } from "@/hooks";
import {
  AnimationsListScreenProps,
  AnimationsStackParamList,
} from "@/navigation";
import { AppStyles } from "@/styles";

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
        contentStyle={{ width: 210 }}
        onShow={() => setVisible(true)}
        onSelect={() => {}}
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
        <Divider />
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
        />
      </HeaderBar>
      <SortBottomSheet
        groups={["All", "Animation Type", "Die Type"]}
        visible={sortVisible}
        onDismiss={() => setSortVisible(false)}
      />
    </>
  );
}

function AnimationsListPage({
  navigation,
}: {
  navigation: StackNavigationProp<AnimationsStackParamList>;
}) {
  const { animations } = useAnimations();
  const editAnimation = (animation: PixelAnimation) => {
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
        <PageActions
          viewMode={viewMode}
          onSelectViewMode={(vm) => setViewMode(vm)}
        />
      </AppBackground>
      <FloatingAddButton
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
