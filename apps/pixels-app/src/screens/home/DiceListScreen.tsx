import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { openURL } from "expo-linking";
import React from "react";
import { Alert, ScrollView, StyleProp, View, ViewStyle } from "react-native";
import { Icon, Text, TouchableRipple, useTheme } from "react-native-paper";

import { PairDiceBottomSheet } from "./components/PairDiceBottomSheet";

import PairIcon from "#/icons/dice/pair";
import RollerIcon from "#/icons/dice/roller";
import GridIcon from "#/icons/items-view/grid-gradient";
import ListIcon from "#/icons/items-view/list-gradient";
import { useAppDispatch, useAppSelector } from "~/app/hooks";
import { DiceListScreenProps } from "~/app/navigation";
import { AppBackground } from "~/components/AppBackground";
import { BluetoothStateWarning } from "~/components/BluetoothWarning";
import { DebugConnectionStatusesBar } from "~/components/DebugConnectionStatusesBar";
import { RotatingGradientBorderCard } from "~/components/GradientBorderCard";
import {
  SortBottomSheet,
  SortBottomSheetSortIcon,
} from "~/components/SortBottomSheet";
import { Banner } from "~/components/banners";
import { GradientButton } from "~/components/buttons";
import { DiceGrid, DiceList } from "~/components/dice";
import {
  getFirmwareUpdateAvailable,
  getKeepAllDiceUpToDate,
} from "~/features/dice";
import { getBorderRadius } from "~/features/getBorderRadius";
import {
  DiceGrouping,
  DiceGroupingList,
  getDiceGroupingLabel,
  getSortModeIcon,
  getSortModeLabel,
  SortMode,
  SortModeList,
} from "~/features/profiles";
import {
  hideAnnouncement,
  setDiceGrouping,
  setDiceSortMode,
  setDiceViewMode,
} from "~/features/store";
import { useOutdatedPixelsCount, usePixelsCentral } from "~/hooks";

export type DiceViewMode = "list" | "grid";

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
              color={colors.onSurface}
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
              color={colors.onSurface}
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
          }}
        />
        <TouchableRipple
          onPress={() => onChangeViewMode("grid")}
          style={{ padding: 5 }}
        >
          <GridIcon
            size={28}
            startColor={viewMode === "grid" ? colors.primary : colors.onSurface}
            stopColor={
              viewMode === "grid" ? colors.secondary : colors.onSurface
            }
          />
        </TouchableRipple>
        <TouchableRipple
          onPress={() => onChangeViewMode("list")}
          style={{ padding: 5 }}
        >
          <ListIcon
            size={28}
            startColor={viewMode === "list" ? colors.primary : colors.onSurface}
            stopColor={
              viewMode === "list" ? colors.secondary : colors.onSurface
            }
          />
        </TouchableRipple>
        <TouchableRipple
          onPress={() => setSortVisible(true)}
          style={{ padding: 5 }}
        >
          <MaterialCommunityIcons
            name="dots-horizontal"
            size={28}
            color={colors.onSurface}
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
  style,
}: {
  diceCount: number;
  onUpdate?: () => void;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    diceCount > 0 && (
      <Banner
        visible
        title="Firmware Update Available"
        actionText="Update Now"
        style={style}
        onAction={onUpdate}
      >
        {getFirmwareUpdateAvailable(diceCount)}
        {"\n"}
        {getKeepAllDiceUpToDate()}
      </Banner>
    )
  );
}

function AnnouncementBanner({ style }: { style?: StyleProp<ViewStyle> }) {
  const appDispatch = useAppDispatch();
  const visible = useAppSelector(
    (state) => state.appSettings.showAnnouncement === "survey#1"
  );
  const dismiss = () => appDispatch(hideAnnouncement());
  return (
    <Banner
      visible={visible}
      title="Before You Roll..."
      actionText="Take Survey"
      altActionText="Dismiss"
      style={style}
      onAction={() => {
        openURL("https://form.typeform.com/to/A4Hd8Wfi");
        setTimeout(dismiss, 500);
      }}
      onAltAction={dismiss}
      onDismiss={dismiss}
    >
      We're still wrapping up rewards, building new features, and expanding
      integrations!{"\n\n"}Answer 3 quick questions about why you backed Pixels
      and get $5 credit to use or share.
    </Banner>
  );
}

function useCheckForDiceInBootloader(
  enabled: boolean,
  onRestoreDice: () => void
) {
  const central = usePixelsCentral();
  const alertShownRef = React.useRef(false);
  React.useEffect(() => {
    if (enabled) {
      alertShownRef.current = false;
      return central.addListener(
        "onPixelBootloaderScanned",
        ({ status, notifier: { pixelId } }) => {
          if (
            !alertShownRef.current &&
            !central.isRegistered(pixelId) &&
            status === "scanned"
          ) {
            alertShownRef.current = true;
            Alert.alert(
              "Unpaired die with invalid firmware",
              "One or more unpaired Pixels dice were found to be programmed with an incomplete or invalid firmware.\n\n" +
                "Would you like to try restore their firmware now?",
              [
                {
                  text: "No",
                  style: "cancel",
                },
                {
                  text: "Yes",
                  onPress: onRestoreDice,
                },
              ]
            );
          }
        }
      );
    }
  }, [central, enabled, onRestoreDice]);
  return null;
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
  const central = usePixelsCentral();
  useFocusEffect(
    React.useCallback(() => {
      central.tryReconnectDice();
      return () => setShowPairDice(false);
    }, [central])
  );

  // Show restore firmware dialog for unpaired dice in bootloader
  useCheckForDiceInBootloader(showPairDice, () => {
    setShowPairDice(false);
    navigation.navigate("restoreFirmware");
  });

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
        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: 10,
            paddingBottom: 20,
          }}
        >
          <AnnouncementBanner />
          {pairedDice.length ? (
            <BluetoothStateWarning style={{ marginVertical: 10 }}>
              <GridListSelector
                viewMode={viewMode}
                onChangeViewMode={(vm) => appDispatch(setDiceViewMode(vm))}
              />
              <FirmwareUpdateBanner
                diceCount={outdatedCount}
                onUpdate={() => navigation.navigate("firmwareUpdate")}
                style={{ marginVertical: 10 }}
              />
              <DebugConnectionStatusesBar />
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
            </BluetoothStateWarning>
          ) : (
            <RotatingGradientBorderCard
              style={{
                width: "80%",
                marginTop: 20,
                alignSelf: "center",
              }}
              contentStyle={{
                paddingVertical: 40,
                paddingHorizontal: 20,
                gap: 40,
              }}
            >
              <Text variant="titleLarge">Welcome!</Text>
              <Text variant="bodyMedium" style={{ alignSelf: "stretch" }}>
                In order to customize your Pixels dice you need to pair them
                with the app.
              </Text>
              <Text variant="bodyMedium" style={{ alignSelf: "stretch" }}>
                Tap on the "Add Die" button to get started.
              </Text>
              <GradientButton onPress={() => setShowPairDice(true)}>
                Add Die
              </GradientButton>
            </RotatingGradientBorderCard>
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
