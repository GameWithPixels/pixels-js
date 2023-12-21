import { useActionSheet } from "@expo/react-native-action-sheet";
import { MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
} from "@gorhom/bottom-sheet";
import { useFocusEffect } from "@react-navigation/native";
import {
  Pixel,
  ScannedPixel,
  useScannedPixelNotifiers,
} from "@systemic-games/react-native-pixels-connect";
import React from "react";
import { ScrollView, View } from "react-native";
import {
  ActivityIndicator,
  Divider,
  IconButton,
  Menu,
  Text,
  ThemeProvider,
  useTheme,
} from "react-native-paper";
import {
  cancelAnimation,
  FadeIn,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

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
import { DieStaticInfo } from "~/components/ScannedDieStatus";
import {
  SortBottomSheet,
  SortBottomSheetSortIcon,
} from "~/components/SortBottomSheet";
import { AnimatedMaterialCommunityIcons } from "~/components/animated";
import { Banner, PromoBanner } from "~/components/banners";
import {
  AnimatedGradientButton,
  SelectionButton,
  TightTextButton,
} from "~/components/buttons";
import { DiceGrid, DiceList } from "~/components/dice";
import { DieWireframe } from "~/components/icons";
import {
  DiceGrouping,
  DiceGroupingList,
  getDiceGroupingLabel,
  getSortModeIcon,
  getSortModeLabel,
  SortMode,
  SortModeList,
} from "~/features/sortingOptions";
import {
  setDiceGrouping,
  setDiceSortMode,
  setShowFocusModeHelp,
  setShowPromoBanner,
} from "~/features/store/appSettingsSlice";
import { usePairedPixels } from "~/hooks";
import { useBottomSheetPadding } from "~/hooks/useBottomSheetPadding";
import { DiceListScreenProps } from "~/navigation";
import { AppStyles } from "~/styles";
import { getBottomSheetBackgroundStyle } from "~/themes";

type DiceViewMode = "focus" | "list" | "grid";

function PairDieBottomSheet({
  availablePixels,
  visible,
  onDismiss,
}: {
  availablePixels: readonly ScannedPixel[];
  visible: boolean;
  onDismiss: (pixels?: ScannedPixel[]) => void;
}) {
  const sheetRef = React.useRef<BottomSheetModal>(null);
  React.useEffect(() => {
    if (visible) {
      sheetRef.current?.present();
    } else {
      sheetRef.current?.dismiss();
    }
  }, [visible]);

  const [selected, setSelected] = React.useState<ScannedPixel[]>([]);
  const paddingBottom = useBottomSheetPadding(0);
  const theme = useTheme();
  return (
    <BottomSheetModal
      ref={sheetRef}
      snapPoints={["50%", "92%"]}
      onDismiss={onDismiss}
      backgroundStyle={getBottomSheetBackgroundStyle()}
      backdropComponent={(props) => (
        <BottomSheetBackdrop
          appearsOnIndex={0}
          disappearsOnIndex={-1}
          pressBehavior="close"
          {...props}
        />
      )}
    >
      <ThemeProvider theme={theme}>
        <View
          style={{
            flex: 1,
            flexGrow: 1,
            paddingHorizontal: 10,
            paddingBottom,
            gap: 20,
          }}
        >
          <Text variant="titleMedium" style={{ alignSelf: "center" }}>
            Select Pixels Dice to Add
          </Text>
          <BottomSheetScrollView>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginLeft: 10,
                marginBottom: 20,
                gap: 20,
              }}
            >
              <Text variant="titleSmall">Looking for Pixels...</Text>
              <ActivityIndicator />
            </View>
            {availablePixels.map((sp, i) => (
              <SelectionButton
                key={sp.pixelId}
                icon={() => <DieWireframe dieType={sp.dieType} size={40} />}
                selected={selected.includes(sp)}
                noTopBorder={i > 0}
                squaredTopBorder={i > 0}
                squaredBottomBorder={i < availablePixels.length - 1}
                onPress={() => {
                  setSelected((selected) =>
                    selected.includes(sp)
                      ? selected.filter((p1) => p1 !== sp)
                      : [...selected, sp]
                  );
                }}
              >
                <DieStaticInfo pixel={sp} />
              </SelectionButton>
            ))}
          </BottomSheetScrollView>
          {availablePixels.length > 0 && selected.length > 0 && (
            <AnimatedGradientButton
              entering={FadeIn.duration(300)}
              exiting={FadeOut.duration(300)}
              style={{ marginBottom: 20 }}
              onPress={() => onDismiss(selected)}
            >
              Pair {selected.length} Pixels
            </AnimatedGradientButton>
          )}
        </View>
      </ThemeProvider>
    </BottomSheetModal>
  );
}

function PageActions({
  viewMode,
  onSelectViewMode,
}: {
  viewMode: DiceViewMode;
  onSelectViewMode: (viewMode: DiceViewMode) => void;
}) {
  const appDispatch = useAppDispatch();
  const [visible, setVisible] = React.useState(false);
  const [sortVisible, setSortVisible] = React.useState(false);
  const [discoMode, setDiscoMode] = React.useState(false);
  const groupBy = useAppSelector((state) => state.appSettings.diceGrouping);
  const sortMode = useAppSelector((state) => state.appSettings.diceSortMode);
  const { colors } = useTheme();
  return (
    <>
      <HeaderBar
        visible={visible}
        contentStyle={{ width: 220 }}
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
        />
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

function getMissingDiceText(
  missingDice: readonly { name: string }[]
): React.ReactNode {
  return `${missingDice.reduce((acc, d, i) => {
    if (i === 0) {
      return d.name;
    } else {
      return acc + (i >= missingDice.length - 1 ? " and " : ", ") + d.name;
    }
  }, "")} ${missingDice.length > 1 ? "are" : "is"} missing!`;
}

function DiceListPage({
  navigation,
}: {
  navigation: DiceListScreenProps["navigation"];
}) {
  const appDispatch = useAppDispatch();

  // Dice
  const [scannedPixels, scannerDispatch, scannerStatus] =
    useScannedPixelNotifiers();
  const { pixels, missingDice, availablePixels, pairDie, unpairDie } =
    usePairedPixels(scannedPixels);

  // Selection
  const [selectedPixel, setSelectedPixel] = React.useState<Pixel>();
  React.useEffect(() => {
    if (!pixels.length) {
      // Unselect Pixel
      setSelectedPixel(undefined);
    } else if (!selectedPixel || !pixels.includes(selectedPixel)) {
      // Select first Pixel
      setSelectedPixel(pixels[0]);
    }
  }, [pixels, selectedPixel]);

  // Scan & Reconnect
  const [scanTimeout, setScanTimeout] =
    React.useState<ReturnType<typeof setTimeout>>(); // TODO keeping this value in a state generates unnecessary re-renders
  const [showScanList, setShowScanList] = React.useState(false);
  React.useEffect(
    () => scannerDispatch(scanTimeout || showScanList ? "start" : "stop"),
    [scanTimeout, scannerDispatch, showScanList]
  );
  const tryReconnectDice = React.useCallback(() => {
    // Set a timeout to stop scanning in 10s
    setScanTimeout((id) => {
      clearTimeout(id);
      return setTimeout(() => setScanTimeout(undefined), 10000);
    });
  }, []);
  // Auto connect on showing page
  useFocusEffect(
    React.useCallback(() => tryReconnectDice(), [tryReconnectDice])
  );

  // Reconnect animation
  const connectProgress = useSharedValue(0);
  React.useEffect(() => {
    if (scannerStatus === "scanning") {
      connectProgress.value = withRepeat(
        withTiming(360, { duration: 2000 }),
        -1
      );
    } else {
      cancelAnimation(connectProgress);
      connectProgress.value = 0;
    }
  }, [connectProgress, scannerStatus]);
  const connectAnimStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: connectProgress.value + "deg" }],
  }));

  // View Mode
  const [viewMode, setViewMode] = React.useState<DiceViewMode>("focus");
  const isFocus = viewMode === "focus";
  const showDetails = (pixel: Pixel) => {
    setSelectedPixel(pixel);
    if (!isFocus) {
      navigation.navigate("dieDetails", { pixelId: pixel.pixelId });
    }
  };

  // Banners
  const showPromo = useAppSelector(
    (state) => state.appSettings.showPromoBanner
  );
  const showFocusModeHelp = useAppSelector(
    (state) => state.appSettings.showFocusModeHelp
  );

  const { colors } = useTheme();

  // Pair and unpair
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
        {isFocus && (
          <PixelFocusViewHeader
            pixel={selectedPixel}
            onUnpair={unpairDieWithConfirmation}
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
          {isFocus && (
            <PromoBanner
              visible={showPromo}
              collapsedMarginBottom={-10}
              onHide={() => appDispatch(setShowPromoBanner(false))}
            />
          )}
          {isFocus && selectedPixel && (
            <PixelFocusView
              pixel={selectedPixel}
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
          )}
          {viewMode === "list" ? (
            <>
              {missingDice.length + pixels.length === 0 && (
                <Text>Tap on the (+) button to pair a die</Text>
              )}
              <DiceList
                pixels={pixels}
                onSelectDie={showDetails}
                onPressNewDie={() => setShowScanList(true)}
                style={{ marginTop: 40 }}
              />
            </>
          ) : (
            <View style={{ gap: 10 }}>
              {isFocus && missingDice.length > 0 && (
                <>
                  <Text>{getMissingDiceText(missingDice)}</Text>
                  <TightTextButton
                    icon={({ size, color }) => (
                      <AnimatedMaterialCommunityIcons
                        name="refresh"
                        size={size}
                        color={color}
                        style={connectAnimStyle}
                      />
                    )}
                    style={{ alignSelf: "flex-start", marginTop: -5 }}
                    onPress={tryReconnectDice}
                  >
                    {scannerStatus === "scanning"
                      ? "Trying to connect..."
                      : "Tap to try to connect."}
                  </TightTextButton>
                </>
              )}
              {missingDice.length + pixels.length === 0 && (
                <Text>Tap on the (+) button to pair a die</Text>
              )}
              <DiceGrid
                selection={isFocus ? selectedPixel : undefined}
                numColumns={isFocus ? 4 : 2}
                miniCards={isFocus}
                pixels={pixels}
                onSelectDie={showDetails}
                onPressNewDie={() => setShowScanList(true)}
                style={isFocus ? undefined : { marginTop: 40 }}
              />
              {isFocus && (
                <Banner
                  visible={showFocusModeHelp && pixels.length > 0}
                  style={{ marginTop: 10 }}
                  onDismiss={() => appDispatch(setShowFocusModeHelp(false))}
                >
                  Focus mode shows information about the selected die. Tap on
                  the 3D die to make your Pixels wave. Only connected dice are
                  displayed in this view mode.
                </Banner>
              )}
            </View>
          )}
        </ScrollView>
      </View>
      <PageActions
        viewMode={viewMode}
        onSelectViewMode={(vm) => setViewMode(vm)}
      />
      <PairDieBottomSheet
        availablePixels={availablePixels}
        visible={showScanList}
        onDismiss={(scannedPixels) => {
          scannedPixels?.forEach(pairDie);
          setShowScanList(false);
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
