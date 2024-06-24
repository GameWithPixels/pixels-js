import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { getBorderRadius } from "@systemic-games/react-native-pixels-components";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { ScrollView, StyleProp, View, ViewStyle } from "react-native";
import {
  Card,
  Icon,
  Text,
  TouchableRipple,
  useTheme,
} from "react-native-paper";

import { PairDiceBottomSheet } from "./components/PairDiceBottomSheet";

import PairIcon from "#/icons/dice/pair";
import RollerIcon from "#/icons/dice/roller";
import GridIcon from "#/icons/items-view/grid-gradient";
import ListIcon from "#/icons/items-view/list-gradient";
import { useAppDispatch, useAppSelector } from "~/app/hooks";
import { AppBackground } from "~/components/AppBackground";
import { BluetoothStateWarning } from "~/components/BluetoothWarning";
import {
  SortBottomSheet,
  SortBottomSheetSortIcon,
} from "~/components/SortBottomSheet";
import { Banner } from "~/components/banners";
import { DiceGrid, DiceList } from "~/components/dice";
import {
  DiceGrouping,
  DiceGroupingList,
  getDiceGroupingLabel,
  getFirmwareUpdateAvailable,
  getKeepAllDiceUpToDate,
  getSortModeIcon,
  getSortModeLabel,
  SortMode,
  SortModeList,
} from "~/features/profiles";
import {
  setDiceGrouping,
  setDiceSortMode,
  setDiceViewMode,
} from "~/features/store";
import { useConnectToMissingPixels, useOutdatedPixelsCount } from "~/hooks";
import { DiceListScreenProps } from "~/navigation";

export type DiceViewMode = "list" | "grid";

function NoPairedDie({ style }: { style?: StyleProp<ViewStyle> }) {
  return (
    // Set view height so Pair Die button is not clipped during exit animation
    <View style={[{ height: 400, alignItems: "center", gap: 20 }, style]}>
      <Card style={{ width: "100%" }}>
        <Card.Title title="No die paired with the app" />
        <Card.Content style={{ gap: 10 }}>
          <Text variant="bodyMedium">
            In order to customize your Pixels dice you need to pair them with
            the app.
          </Text>
          <Text variant="bodyMedium">
            Tap on the "Add Die" button above to get started.
          </Text>
        </Card.Content>
      </Card>
    </View>
  );
}

function LargeHeader({
  onShowPairDice,
  onShowDiceRoller,
}: {
  showPairDice?: boolean;
  onShowPairDice: () => void;
  onShowDiceRoller: () => void;
}) {
  const { colors, roundness } = useTheme();
  const borderRadius = getBorderRadius(roundness);
  return (
    <View
      style={{
        width: "100%",
        flexDirection: "row",
        borderBottomLeftRadius: borderRadius,
        borderBottomRightRadius: borderRadius,
        padding: 15,
        paddingVertical: 10,
        justifyContent: "space-between",
        backgroundColor: colors.background,
      }}
    >
      <Icon source={require("#/images/systemic-icon.png")} size={60} />
      <View
        style={{
          flexDirection: "row",
          alignSelf: "flex-end",
          alignItems: "flex-end",
        }}
      >
        <TouchableRipple
          style={{ alignItems: "center", gap: 5 }}
          onPress={onShowPairDice}
        >
          <>
            <PairIcon
              size={26}
              color={colors.onPrimary}
              style={{ paddingHorizontal: 30 }}
            />
            <Text>Add Die</Text>
          </>
        </TouchableRipple>
        <TouchableRipple
          style={{ alignItems: "center", gap: 5 }}
          onPress={onShowDiceRoller}
        >
          <>
            <RollerIcon
              size={26}
              color={colors.onPrimary}
              style={{ paddingHorizontal: 30 }}
            />
            <Text>Roller</Text>
          </>
        </TouchableRipple>
      </View>
    </View>
  );
}

function GridListSelector({
  viewMode,
  onChangeViewMode,
}: {
  viewMode: DiceViewMode;
  onChangeViewMode: (viewMode: DiceViewMode) => void;
}) {
  const appDispatch = useAppDispatch();
  const [sortVisible, setSortVisible] = React.useState(false);
  const groupBy = useAppSelector((state) => state.appSettings.diceGrouping);
  const sortMode = useAppSelector((state) => state.appSettings.diceSortMode);
  const { colors } = useTheme();
  return (
    <>
      <View
        style={{
          width: "100%",
          flexDirection: "row",
          alignItems: "center",
          padding: 10,
        }}
      >
        <LinearGradient
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          colors={[colors.primary, colors.secondary]}
          style={{
            flexGrow: 1,
            height: 2,
            borderRadius: 1,
            backgroundColor: colors.secondary,
          }}
        />
        <TouchableRipple
          onPress={() => onChangeViewMode("grid")}
          style={{ padding: 5 }}
        >
          <GridIcon
            size={28}
            startColor={viewMode === "grid" ? colors.primary : colors.onPrimary}
            stopColor={
              viewMode === "grid" ? colors.secondary : colors.onPrimary
            }
          />
        </TouchableRipple>
        <TouchableRipple
          onPress={() => onChangeViewMode("list")}
          style={{ padding: 5 }}
        >
          <ListIcon
            size={28}
            startColor={viewMode === "list" ? colors.primary : colors.onPrimary}
            stopColor={
              viewMode === "list" ? colors.secondary : colors.onPrimary
            }
          />
        </TouchableRipple>
        <TouchableRipple onPress={() => setSortVisible(true)}>
          <MaterialCommunityIcons
            name="dots-horizontal"
            size={28}
            color={colors.onPrimary}
          />
        </TouchableRipple>
      </View>
      <SortBottomSheet
        groups={DiceGroupingList}
        groupBy={groupBy}
        getGroupingLabel={getDiceGroupingLabel as (g: string) => string}
        onChangeGroupBy={(group) =>
          appDispatch(setDiceGrouping(group as DiceGrouping))
        }
        sortModes={SortModeList}
        getSortModeLabel={getSortModeLabel as (g: string) => string}
        getSortModeIcon={
          getSortModeIcon as (mode: string) => SortBottomSheetSortIcon
        }
        sortMode={sortMode}
        onChangeSortMode={(mode) =>
          appDispatch(setDiceSortMode(mode as SortMode))
        }
        visible={sortVisible}
        onDismiss={() => setSortVisible(false)}
      />
    </>
  );
}

function FirmwareUpdateBanner({
  diceCount,
  onUpdate,
}: {
  diceCount: number;
  onUpdate?: () => void;
}) {
  return (
    diceCount > 0 && (
      <Banner
        visible
        title="Update Available"
        actionText="Update Now"
        style={{ margin: 10 }}
        onAction={onUpdate}
      >
        {getFirmwareUpdateAvailable(diceCount)}
        {"\n"}
        {getKeepAllDiceUpToDate()}
      </Banner>
    )
  );
}

function DiceListPage({
  navigation,
}: {
  navigation: DiceListScreenProps["navigation"];
}) {
  const appDispatch = useAppDispatch();
  const pairedDice = useAppSelector((state) => state.pairedDice.paired);

  // Pairing
  const [showPairDice, setShowPairDice] = React.useState(false);

  // Scan for missing dice on showing page
  useFocusEffect(useConnectToMissingPixels());

  // Firmware update
  const outdatedCount = useOutdatedPixelsCount();

  // Sort options & view mode
  const groupBy = useAppSelector((state) => state.appSettings.diceGrouping);
  const sortMode = useAppSelector((state) => state.appSettings.diceSortMode);
  const viewMode = useAppSelector((state) => state.appSettings.diceViewMode);

  return (
    <>
      <View style={{ height: "100%" }}>
        <LargeHeader
          onShowPairDice={() => setShowPairDice(true)}
          onShowDiceRoller={() => navigation.navigate("diceRoller")}
        />
        <FirmwareUpdateBanner
          diceCount={outdatedCount}
          onUpdate={() => navigation.navigate("firmwareUpdate")}
        />
        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: 10,
            paddingBottom: 20,
          }}
        >
          <BluetoothStateWarning style={{ marginVertical: 10 }} />
          {!pairedDice.length ? (
            <NoPairedDie style={{ marginVertical: 10 }} />
          ) : (
            <>
              {pairedDice.length > 0 && (
                <GridListSelector
                  viewMode={viewMode}
                  onChangeViewMode={(vm) => appDispatch(setDiceViewMode(vm))}
                />
              )}
              {viewMode === "grid" ? (
                <DiceGrid
                  pairedDice={pairedDice}
                  onSelectDie={(d) =>
                    navigation.navigate("dieFocus", { pixelId: d.pixelId })
                  }
                />
              ) : (
                <DiceList
                  pairedDice={pairedDice}
                  groupBy={groupBy}
                  sortMode={sortMode}
                  onSelectDie={(d) =>
                    navigation.navigate("dieFocus", { pixelId: d.pixelId })
                  }
                />
              )}
            </>
          )}
        </ScrollView>
      </View>
      <PairDiceBottomSheet
        visible={showPairDice}
        onDismiss={() => setShowPairDice(false)}
      />
    </>
  );
}

export function DiceListScreen({ navigation }: DiceListScreenProps) {
  return (
    <AppBackground topLevel>
      <DiceListPage navigation={navigation} />
    </AppBackground>
  );
}
