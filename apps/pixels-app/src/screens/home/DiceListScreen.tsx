import { useActionSheet } from "@expo/react-native-action-sheet";
import { useFocusEffect } from "@react-navigation/native";
import { getPixel } from "@systemic-games/react-native-pixels-connect";
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
import { useAppDispatch, useAppSelector } from "~/app/hooks";
import { AppBackground } from "~/components/AppBackground";
import { HeaderBar } from "~/components/HeaderBar";
import {
  SortBottomSheet,
  SortBottomSheetSortIcon,
} from "~/components/SortBottomSheet";
import { AnimatedGradientButton } from "~/components/buttons";
import { DiceGrid, DiceList } from "~/components/dice";
import { PairedPixel } from "~/features/dice/PairedPixel";
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
import { usePairedPixels, usePixelsScanner } from "~/hooks";
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

function DiceListPage({
  navigation,
}: {
  navigation: DiceListScreenProps["navigation"];
}) {
  // TODO keeping this value in a state generates unnecessary re-renders
  const [scanTimeout, setScanTimeout] =
    React.useState<ReturnType<typeof setTimeout>>();
  const [showPairDice, setShowPairDice] = React.useState(false);

  // Dice
  const [scannedPixels, scannerStatus] = usePixelsScanner(
    !!scanTimeout || showPairDice
  );
  const { pairedPixels, availablePixels, pairDie, unpairDie } =
    usePairedPixels(scannedPixels);

  // Pairing
  const hasPairedPixels = pairedPixels.length > 0;
  useFocusEffect(
    React.useCallback(() => {
      if (!hasPairedPixels) {
        setShowPairDice(true);
      }
    }, [hasPairedPixels])
  );

  // Reconnect
  const tryReconnectDice = React.useCallback(() => {
    // Set a timeout to stop scanning in 10s
    setScanTimeout((id) => {
      if (id) {
        clearTimeout(id);
      }
      return setTimeout(() => setScanTimeout(undefined), 10000);
    });
  }, []);

  // Scan for missing dice on showing page
  useFocusEffect(
    React.useCallback(() => {
      if (pairedPixels.some((p) => !getPixel(p.pixelId))) {
        tryReconnectDice();
      }
    }, [pairedPixels, tryReconnectDice])
  );
  // Stop scanning on leaving page
  useFocusEffect(
    React.useCallback(() => {
      return () =>
        setScanTimeout((id) => {
          if (id) {
            clearTimeout(id);
          }
          return undefined;
        });
    }, [])
  );

  // Selection
  const [selectedPixel, setSelectedPixel] = React.useState<PairedPixel>();
  React.useEffect(() => {
    if (!pairedPixels.length) {
      // Unselect Pixel
      setSelectedPixel(undefined);
    } else if (!selectedPixel || !pairedPixels.includes(selectedPixel)) {
      // Select first Pixel
      setSelectedPixel(pairedPixels[0]);
    } else if (!getPixel(selectedPixel.pixelId)) {
      // Selected Pixel hasn't been seen so far
      tryReconnectDice();
    }
  }, [pairedPixels, selectedPixel, tryReconnectDice]);

  // View Mode
  const [viewMode, setViewMode] = React.useState<DiceViewMode>("focus");
  const isFocus = viewMode === "focus";
  const showDetails = (pixel: PairedPixel) => {
    setSelectedPixel(pixel);
    if (!isFocus) {
      navigation.navigate("dieDetails", { pixelId: pixel.pixelId });
    }
  };

  const { colors } = useTheme();

  // Unpair
  const { showActionSheetWithOptions } = useActionSheet();
  const unpairDieWithConfirmation = () =>
    showActionSheetWithOptions(
      {
        options: [`Unpair ${selectedPixel?.name}`, "Keep Die"],
        destructiveButtonIndex: 0,
        cancelButtonIndex: 1,
        destructiveColor: colors.error,
        containerStyle: { backgroundColor: colors.background },
        textStyle: { color: colors.onBackground },
      },
      (selectedIndex?: number) => {
        if (selectedPixel && selectedIndex === 0) {
          unpairDie(selectedPixel);
        }
      }
    );

  return (
    <>
      <View style={{ height: "100%" }}>
        {isFocus && selectedPixel && (
          <PixelFocusViewHeader
            pairedPixel={selectedPixel}
            onUnpair={unpairDieWithConfirmation}
            onFirmwareUpdate={() =>
              navigation.navigate("firmwareUpdate", {
                pixelId: selectedPixel?.pixelId,
              })
            }
          />
        )}
        <ScrollView
          contentContainerStyle={{
            padding: 10,
            paddingBottom: 20,
            gap: 10,
          }}
        >
          {isFocus && selectedPixel ? (
            <PixelFocusView
              pairedPixel={selectedPixel}
              onEditProfile={() =>
                navigation.navigate("editDieProfileStack", {
                  screen: "editDieProfile",
                  params: {
                    pixelId: selectedPixel.pixelId,
                  },
                })
              }
              onShowDetails={() =>
                navigation.navigate("dieDetails", {
                  pixelId: selectedPixel.pixelId,
                })
              }
            />
          ) : (
            <View style={{ marginTop: 30 }} />
          )}
          {pairedPixels.length === 0 ? (
            <NoPairedDie
              showPairDice={showPairDice}
              onPairDice={() => setShowPairDice(true)}
            />
          ) : viewMode === "list" ? (
            <DiceList
              pixels={pairedPixels}
              onSelectDie={showDetails}
              onPressNewDie={() => setShowPairDice(true)}
            />
          ) : (
            <DiceGrid
              selection={isFocus ? selectedPixel : undefined}
              numColumns={isFocus ? 4 : 2}
              miniCards={isFocus}
              pixels={pairedPixels}
              onSelectDie={showDetails}
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
        availablePixels={availablePixels}
        visible={showPairDice}
        onDismiss={(scannedPixels) => {
          scannedPixels?.forEach(pairDie);
          setShowPairDice(false);
        }}
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
