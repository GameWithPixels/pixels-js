import { useActionSheet } from "@expo/react-native-action-sheet";
import { MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
} from "@gorhom/bottom-sheet";
import { StackNavigationProp } from "@react-navigation/stack";
import {
  Pixel,
  ScannedPixel,
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
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { PixelFocusView, PixelFocusViewHeader } from "./PixelFocusView";

import FocusIcon from "#/icons/home/focus";
import GridIcon from "#/icons/items-view/grid";
import ListIcon from "#/icons/items-view/list";
import { AppBackground } from "@/components/AppBackground";
import { HeaderBar } from "@/components/HeaderBar";
import { IntroSlides } from "@/components/IntroSlides";
import { SortBottomSheet } from "@/components/SortBottomSheet";
import { Banner, PromoBanner } from "@/components/banners";
import {
  GradientButton,
  SelectionButton,
  TightTextButton,
} from "@/components/buttons";
import { DieWireframeCard } from "@/components/cards";
import { DiceGrid, DiceList } from "@/components/dice";
import { usePairedPixels, useScannedPixels } from "@/hooks";
import { useSettings } from "@/hooks/useSettings";
import { DiceListScreenProps, HomeStackParamList } from "@/navigation";
import { AppStyles } from "@/styles";
import { getBottomSheetBackgroundStyle } from "@/themes";

type DiceViewMode = "focus" | "list" | "grid";

function PairDieBottomSheet({
  visible,
  onDismiss,
}: {
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

  const { scannedPixels, newScannedPixel, resetScannedList } =
    useScannedPixels();
  const [selected, setSelected] = React.useState<ScannedPixel[]>([]);

  React.useEffect(() => {
    if (visible) {
      const id = setInterval(() => newScannedPixel(), 3000);
      return () => {
        clearInterval(id);
        setSelected([]);
      };
    } else {
      resetScannedList();
    }
  }, [newScannedPixel, resetScannedList, visible]);

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
            {scannedPixels.map((sp, i) => (
              <SelectionButton
                key={sp.pixelId}
                selected={selected.includes(sp)}
                noTopBorder={i > 0}
                squaredTopBorder={i > 0}
                squaredBottomBorder={i < scannedPixels.length - 1}
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
          {scannedPixels.length > 0 && selected.length > 0 && (
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
  const { showIntro, setShowIntro, showPromo, setShowPromo } = useSettings();

  const { pairedPixels, pairDie, unpairDie } = usePairedPixels();
  const [selectedPixel, setSelectedPixel] = React.useState<Pixel>();

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
          unpairDie(selectedPixel);
        }
      }
    );
  }, [colors, selectedPixel, showActionSheetWithOptions, unpairDie]);

  // Update Pixel selection
  React.useEffect(() => {
    if (!pairedPixels.length) {
      // Unselect Pixel
      setSelectedPixel(undefined);
    } else if (!selectedPixel || !pairedPixels.includes(selectedPixel)) {
      // Select first Pixel
      setSelectedPixel(pairedPixels[0]);
    }
  }, [pairedPixels, selectedPixel]);

  const [viewMode, setViewMode] = React.useState<DiceViewMode>("focus");
  const showDetails = (pixel: Pixel) => {
    setSelectedPixel(pixel);
    if (!isFocus) {
      navigation.navigate("dieDetails", { pixelId: pixel.pixelId });
    }
  };

  const [pairVisible, setPairVisible] = React.useState(false);
  const [focusInfoBannerVisible, setFocusInfoBannerVisible] =
    React.useState(true);

  const isFocus = viewMode === "focus";
  return (
    <>
      <View style={{ height: "100%" }}>
        {isFocus && selectedPixel && (
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
              onHide={() => setShowPromo(false)}
            />
          )}
          {isFocus && selectedPixel && (
            <PixelFocusView pixel={selectedPixel} navigation={navigation} />
          )}
          {pairedPixels.length ? (
            viewMode === "list" ? (
              <DiceList
                pixels={pairedPixels}
                onSelectDie={showDetails}
                onPressNewDie={() => setPairVisible(true)}
                style={{ marginTop: 40 }}
              />
            ) : (
              <View style={{ gap: 10 }}>
                {isFocus && (
                  <TightTextButton
                    icon={({ size, color }) => (
                      <MaterialCommunityIcons
                        name="refresh"
                        size={size}
                        color={color}
                      />
                    )}
                    style={{ alignSelf: "flex-start", marginTop: -5 }}
                    onPress={() => {}}
                  >
                    Bulp and Gork are missing! Tap to try to connect to them.
                  </TightTextButton>
                )}
                <DiceGrid
                  selection={isFocus ? selectedPixel : undefined}
                  numColumns={isFocus ? 4 : 2}
                  miniCards={isFocus}
                  pixels={pairedPixels}
                  onSelectDie={showDetails}
                  onPressNewDie={() => setPairVisible(true)}
                  style={isFocus ? undefined : { marginTop: 40 }}
                />
                {isFocus && (
                  <Banner
                    visible={focusInfoBannerVisible && pairedPixels.length > 0}
                    style={{ marginTop: 10 }}
                    onDismiss={() => setFocusInfoBannerVisible(false)}
                  >
                    Focus mode shows information about the selected die. Tap on
                    the 3D die to make your Pixels wave. Only connected dice are
                    displayed in this view mode.
                  </Banner>
                )}
              </View>
            )
          ) : (
            <Text style={{ marginVertical: 40, alignSelf: "flex-start" }}>
              No paired Pixels, press the (+) button on the bottom right corner
              to add a die.
            </Text>
          )}
        </ScrollView>
      </View>
      <PageActions
        viewMode={viewMode}
        onSelectViewMode={(vm) => setViewMode(vm)}
      />
      <IntroSlides
        pixels={pairedPixels}
        visible={showIntro}
        onDismiss={() => setShowIntro(false)}
      />
      <PairDieBottomSheet
        onDismiss={(pixels) => {
          pixels?.forEach((p) => pairDie(p));
          setPairVisible(false);
        }}
        visible={pairVisible}
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
