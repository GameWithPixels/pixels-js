import { useActionSheet } from "@expo/react-native-action-sheet";
import { useFocusEffect } from "@react-navigation/native";
import React from "react";
import { ScrollView, View } from "react-native";
import { Card, Divider, IconButton, Text, useTheme } from "react-native-paper";
import { FadeIn, FadeOut } from "react-native-reanimated";

import { PairDiceBottomSheet } from "./components/PairDiceBottomSheet";
import {
  PixelFocusView,
  PixelFocusViewHeader,
} from "./components/PixelFocusView";

import FocusIcon from "#/icons/home/focus";
import GridIcon from "#/icons/items-view/grid";
import ListIcon from "#/icons/items-view/list";
import { PairedDie } from "~/app/PairedDie";
import { useAppDispatch, useAppSelector } from "~/app/hooks";
import { AppBackground } from "~/components/AppBackground";
import { BluetoothStateWarning } from "~/components/BluetoothWarning";
import { HeaderBar } from "~/components/HeaderBar";
import {
  SortBottomSheet,
  SortBottomSheetSortIcon,
} from "~/components/SortBottomSheet";
import { AnimatedGradientButton } from "~/components/buttons";
import { DiceGrid, DiceList } from "~/components/dice";
import { blinkDie } from "~/features/dice";
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
  setDiceGrouping,
  setDiceSortMode,
} from "~/features/store/appSettingsSlice";
import { removePairedDie } from "~/features/store/pairedDiceSlice";
import { useConnectToMissingPixels } from "~/hooks";
import { DiceListScreenProps } from "~/navigation";
import { AppStyles } from "~/styles";

type DiceViewMode = "focus" | "list" | "grid";

function PageHeader({
  viewMode,
  onSelectViewMode,
}: {
  viewMode: DiceViewMode;
  onSelectViewMode: (viewMode: DiceViewMode) => void;
}) {
  const appDispatch = useAppDispatch();
  const [visible, setVisible] = React.useState(false);
  const [sortVisible, setSortVisible] = React.useState(false);
  const groupBy = useAppSelector((state) => state.appSettings.diceGrouping);
  const sortMode = useAppSelector((state) => state.appSettings.diceSortMode);
  return (
    <>
      <HeaderBar
        visible={visible}
        contentStyle={{ width: 220 }}
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
          {(["focus", "list", "grid"] as DiceViewMode[]).map((vm, i) => {
            const Icon = i === 0 ? FocusIcon : i === 1 ? ListIcon : GridIcon;
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
        {/* <Menu.Item
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
          title={`Auto Connect ${discoMode ? "Off" : "On"}`}
          trailingIcon={() => (
            <MaterialIcons
              name={discoMode ? "bluetooth-disabled" : "bluetooth-connected"}
              size={24}
              color={colors.onSurface}
            />
          )}
          contentStyle={AppStyles.menuItemWithIcon}
          onPress={() => setDiscoMode((d) => !d)}
        /> */}
      </HeaderBar>
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

function NoPairedDie({
  showPairDice,
  onPairDice,
}: {
  showPairDice?: boolean;
  onPairDice: () => void;
}) {
  return (
    // Set view height so Pair Die button is not clipped during exit animation
    <View style={{ height: 400, alignItems: "center", gap: 20 }}>
      <Card style={{ width: "100%" }}>
        <Card.Title title="No dice is paired with the app" />
        <Card.Content>
          <Text variant="bodyMedium">
            In order to customize your Pixels dice you need to pair them with
            the app.{"\n"}
            Tap on the button below to get started.
          </Text>
        </Card.Content>
      </Card>
      {!showPairDice && (
        <AnimatedGradientButton
          entering={FadeIn.duration(300)}
          exiting={FadeOut.duration(300).delay(200)}
          onPress={onPairDice}
        >
          Scan For Dice
        </AnimatedGradientButton>
      )}
    </View>
  );
}

function useUnpairActionSheet(pairedDie?: PairedDie): () => void {
  const appDispatch = useAppDispatch();
  const { showActionSheetWithOptions } = useActionSheet();

  const { colors } = useTheme();
  const unpairDieWithConfirmation = React.useCallback(() => {
    console.log("UNPAIR " + JSON.stringify(pairedDie));
    showActionSheetWithOptions(
      {
        options: [`Unpair ${pairedDie?.name}`, "Keep Die"],
        destructiveButtonIndex: 0,
        cancelButtonIndex: 1,
        destructiveColor: colors.error,
        containerStyle: { backgroundColor: colors.background },
        textStyle: { color: colors.onBackground },
      },
      (selectedIndex?: number) => {
        if (pairedDie && selectedIndex === 0) {
          appDispatch(removePairedDie(pairedDie.pixelId));
        }
      }
    );
  }, [appDispatch, colors, pairedDie, showActionSheetWithOptions]);

  return unpairDieWithConfirmation;
}

function DiceListPage({
  navigation,
}: {
  navigation: DiceListScreenProps["navigation"];
}) {
  const [showPairDice, setShowPairDice] = React.useState(false);
  const pairedDice = useAppSelector((state) => state.pairedDice).paired;

  // Pairing
  const hasPairedDice = pairedDice.length > 0;
  useFocusEffect(
    React.useCallback(() => {
      if (!hasPairedDice) {
        setShowPairDice(true);
      }
    }, [hasPairedDice])
  );

  // Reconnect
  const connectToMissingPixels = useConnectToMissingPixels();

  // Scan for missing dice on showing page
  useFocusEffect(
    React.useCallback(() => {
      connectToMissingPixels();
    }, [connectToMissingPixels])
  );

  // Selection (we keep an index to be sure to use the latest values from pairedDice)
  const [lastSelectedDie, setSelectedDie] = React.useState(0);
  // We don't want to show a Pixel that no longer exists
  const selectedDie =
    pairedDice.find((d) => d.pixelId === lastSelectedDie) ??
    // Select first Pixel
    pairedDice[0];

  // View Mode
  const [viewMode, setViewMode] = React.useState<DiceViewMode>("focus");
  const isFocus = viewMode === "focus";
  const selectAndShowDetails = (pairedDie: PairedDie, showDetails = true) => {
    setSelectedDie(pairedDie.pixelId);
    blinkDie(pairedDie);
    connectToMissingPixels(pairedDie.pixelId);
    if (showDetails) {
      navigation.navigate("dieDetails", { pixelId: pairedDie.pixelId });
    }
  };

  // Unpair
  const showUnpairActionSheet = useUnpairActionSheet(selectedDie);

  return (
    <>
      <View style={{ height: "100%" }}>
        {isFocus && selectedDie && (
          <PixelFocusViewHeader
            pairedDie={selectedDie}
            onUnpair={showUnpairActionSheet}
            onFirmwareUpdate={() => navigation.navigate("firmwareUpdate")}
          />
        )}
        <ScrollView
          contentContainerStyle={{
            padding: 10,
            paddingBottom: 20,
            gap: 10,
          }}
        >
          <BluetoothStateWarning />
          {isFocus && selectedDie ? (
            <PixelFocusView
              pairedDie={selectedDie}
              onPress={() => connectToMissingPixels(selectedDie.pixelId)}
              onShowDetails={() => selectAndShowDetails(selectedDie)}
              onShowRollsHistory={() =>
                navigation.navigate("rollsHistory", {
                  pixelId: selectedDie.pixelId,
                })
              }
              onEditProfile={() =>
                navigation.navigate("editDieProfileStack", {
                  screen: "editDieProfile",
                  params: { pixelId: selectedDie.pixelId },
                })
              }
            />
          ) : (
            <View style={{ marginTop: 30 }} />
          )}
          {!pairedDice.length ? (
            <NoPairedDie
              showPairDice={showPairDice}
              onPairDice={() => setShowPairDice(true)}
            />
          ) : viewMode === "list" ? (
            <DiceList
              dice={pairedDice}
              onSelectDie={selectAndShowDetails}
              onPressNewDie={() => setShowPairDice(true)}
            />
          ) : (
            <DiceGrid
              selection={isFocus ? selectedDie : undefined}
              numColumns={isFocus ? 4 : 2}
              miniCards={isFocus}
              dice={pairedDice}
              onSelectDie={(d) => selectAndShowDetails(d, !isFocus)}
              onPressNewDie={() => setShowPairDice(true)}
            />
          )}
        </ScrollView>
      </View>
      <PageHeader
        viewMode={viewMode}
        onSelectViewMode={(vm) => setViewMode(vm)}
      />
      <PairDiceBottomSheet
        visible={showPairDice}
        onDismiss={() => setShowPairDice(false)}
      />
    </>
  );
}

export function DiceListScreen({ navigation }: DiceListScreenProps) {
  return (
    <AppBackground>
      <DiceListPage navigation={navigation} />
    </AppBackground>
  );
}
