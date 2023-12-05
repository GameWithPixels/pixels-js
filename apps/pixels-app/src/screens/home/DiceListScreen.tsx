import { useActionSheet } from "@expo/react-native-action-sheet";
import { MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
} from "@gorhom/bottom-sheet";
import { useFocusEffect } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import {
  Pixel,
  ScannedPixel,
  useScannedPixelNotifiers,
} from "@systemic-games/react-native-pixels-connect";
import React, { useEffect } from "react";
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
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

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
import { IntroSlides } from "~/components/IntroSlides";
import { SortBottomSheet } from "~/components/SortBottomSheet";
import { AnimatedMaterialCommunityIcons } from "~/components/animated";
import { Banner, PromoBanner } from "~/components/banners";
import {
  GradientButton,
  SelectionButton,
  TightTextButton,
} from "~/components/buttons";
import { DieWireframeCard } from "~/components/cards";
import { DiceGrid, DiceList } from "~/components/dice";
import { setShowIntro, setShowPromo } from "~/features/store/appSettingsSlice";
import { usePairedPixels } from "~/hooks";
import { DiceListScreenProps, HomeStackParamList } from "~/navigation";
import { AppStyles } from "~/styles";
import { getBottomSheetBackgroundStyle } from "~/themes";

type DiceViewMode = "focus" | "list" | "grid";

function PairDieBottomSheet({
  availablePixels,
  visible,
  onDismiss,
}: {
  availablePixels: ScannedPixel[];
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
  const { bottom } = useSafeAreaInsets();
  const theme = useTheme();
  return (
    <BottomSheetModal
      ref={sheetRef}
      snapPoints={[500]}
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
            marginHorizontal: 10,
            marginBottom: bottom,
            gap: 20,
          }}
        >
          <Text variant="titleMedium" style={{ alignSelf: "center" }}>
            Select Pixels Dice to Add
          </Text>
          <BottomSheetScrollView contentContainerStyle={{ paddingBottom: 20 }}>
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
                <DieWireframeCard dieType={sp.dieType}>
                  {sp.name}, {sp.dieType}
                </DieWireframeCard>
              </SelectionButton>
            ))}
          </BottomSheetScrollView>
          {availablePixels.length > 0 && selected.length > 0 && (
            <GradientButton
              style={{ marginBottom: 20 }}
              onPress={() => onDismiss(selected)}
            >
              Pair {selected.length} Pixels
            </GradientButton>
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
  const [visible, setVisible] = React.useState(false);
  const [sortVisible, setSortVisible] = React.useState(false);
  const [discoMode, setDiscoMode] = React.useState(false);
  const { colors } = useTheme();
  return (
    <>
      <HeaderBar
        visible={visible}
        contentStyle={{ width: 220 }}
        onShow={() => setVisible(true)}
        onSelect={viewMode !== "focus" ? () => {} : undefined}
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
        groups={["All", "Die Type", "Active Profile"]}
        visible={sortVisible}
        onDismiss={() => setSortVisible(false)}
      />
    </>
  );
}

function DiceListPage({
  navigation,
}: {
  navigation: StackNavigationProp<HomeStackParamList>;
}) {
  const appDispatch = useAppDispatch();
  const hideIntro = () => appDispatch(setShowIntro(false));
  const hidePromo = () => appDispatch(setShowPromo(false));
  const showIntro = useAppSelector((state) => state.appSettings.showIntro);
  const showPromo = useAppSelector((state) => state.appSettings.showPromo);

  const reconnectProgress = useSharedValue(0);
  const [reconnect, setReconnect] = React.useState(false);
  const [pairVisible, setPairVisible] = React.useState(false);
  const [focusInfoBannerVisible, setFocusInfoBannerVisible] =
    React.useState(true);

  // We need to scan for dice before connecting to them
  const [scannedPixels, scannerDispatch] = useScannedPixelNotifiers();
  useFocusEffect(
    React.useCallback(() => {
      setReconnect(true);
    }, [])
  );
  React.useEffect(() => {
    if (reconnect || pairVisible) {
      scannerDispatch("start");
      let id: ReturnType<typeof setTimeout>;
      if (!pairVisible) {
        id = setTimeout(() => {
          scannerDispatch("stop");
          setReconnect(false);
          cancelAnimation(reconnectProgress);
        }, 10000);
      }
      return () => {
        scannerDispatch("stop");
        setReconnect(false);
        cancelAnimation(reconnectProgress);
        if (id) {
          clearTimeout(id);
        }
      };
    }
  }, [pairVisible, reconnect, reconnectProgress, scannerDispatch]);

  // Call usePairedPixels() after useScannedPixelNotifiers()
  // so it has access to the latest scanned Pixels
  const { pixels, addDie, removeDie } = usePairedPixels();
  const [selectedPixel, setSelectedPixel] = React.useState<Pixel>();
  React.useEffect(() => {
    for (const pixel of pixels) {
      pixel
        .connect()
        .catch((e: Error) => console.log(`Connection error: ${e}`));
    }
  }, [pixels]);

  // Missing dice
  const diceData = useAppSelector((state) => state.pairedDice.diceData);
  const missingDice = React.useMemo(
    () =>
      diceData
        .filter((d) => pixels.every((p) => p.pixelId !== d.pixelId))
        .map((d) => d.name),
    [diceData, pixels]
  );

  // Filter out Pixels that are already paired
  const availablePixels = React.useMemo(
    () =>
      scannedPixels.filter((sp) =>
        pixels.every((p) => p.pixelId !== sp.pixelId)
      ),
    [pixels, scannedPixels]
  );

  const { showActionSheetWithOptions } = useActionSheet();
  const { colors } = useTheme();
  const unpairDieWithConfirmation = React.useCallback(() => {
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
          removeDie(selectedPixel);
        }
      }
    );
  }, [colors, selectedPixel, showActionSheetWithOptions, removeDie]);

  // Update Pixel selection
  React.useEffect(() => {
    if (!pixels.length) {
      // Unselect Pixel
      setSelectedPixel(undefined);
    } else if (!selectedPixel || !pixels.includes(selectedPixel)) {
      // Select first Pixel
      setSelectedPixel(pixels[0]);
    }
  }, [pixels, selectedPixel]);

  const [viewMode, setViewMode] = React.useState<DiceViewMode>("focus");
  const showDetails = (pixel: Pixel) => {
    setSelectedPixel(pixel);
    if (!isFocus) {
      navigation.navigate("dieDetails", { pixelId: pixel.pixelId });
    }
  };

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: reconnectProgress.value + "deg" }],
  }));
  useEffect(() => {
    if (reconnect) {
      reconnectProgress.value = 0;
      reconnectProgress.value = withRepeat(
        withTiming(360, { duration: 2000 }),
        -1
      );
    }
  }, [reconnect, reconnectProgress]);

  const isFocus = viewMode === "focus";
  return (
    <>
      <View style={{ height: "100%" }}>
        {isFocus && (
          <PixelFocusViewHeader
            pixel={selectedPixel}
            onUnpair={unpairDieWithConfirmation}
            navigation={navigation}
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
              onHide={hidePromo}
            />
          )}
          {isFocus && selectedPixel && (
            <PixelFocusView pixel={selectedPixel} navigation={navigation} />
          )}
          {viewMode === "list" ? (
            <>
              {missingDice.length + pixels.length === 0 && (
                <Text>Tap on the (+) button to pair a die</Text>
              )}
              <DiceList
                pixels={pixels}
                onSelectDie={showDetails}
                onPressNewDie={() => setPairVisible(true)}
                style={{ marginTop: 40 }}
              />
            </>
          ) : (
            <View style={{ gap: 10 }}>
              {isFocus && missingDice.length > 0 && (
                <>
                  <Text>
                    {missingDice.length > 1
                      ? missingDice
                          .slice(0, missingDice.length - 1)
                          .join(", ") +
                        " and " +
                        missingDice.at(-1)
                      : missingDice[0]}{" "}
                    {missingDice.length > 1 ? "are" : "is"} missing!{" "}
                  </Text>
                  <TightTextButton
                    icon={({ size, color }) => (
                      <AnimatedMaterialCommunityIcons
                        name="refresh"
                        size={size}
                        color={color}
                        style={animStyle}
                      />
                    )}
                    style={{ alignSelf: "flex-start", marginTop: -5 }}
                    onPress={() => setReconnect(true)}
                  >
                    {reconnect ? "Reconnecting..." : "Tap to try to connect."}
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
                onPressNewDie={() => setPairVisible(true)}
                style={isFocus ? undefined : { marginTop: 40 }}
              />
              {isFocus && (
                <Banner
                  visible={focusInfoBannerVisible && pixels.length > 0}
                  style={{ marginTop: 10 }}
                  onDismiss={() => setFocusInfoBannerVisible(false)}
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
      <IntroSlides pixels={pixels} visible={showIntro} onDismiss={hideIntro} />
      <PairDieBottomSheet
        availablePixels={availablePixels}
        visible={pairVisible}
        onDismiss={(scannedPixels) => {
          scannedPixels?.forEach(addDie);
          setPairVisible(false);
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
