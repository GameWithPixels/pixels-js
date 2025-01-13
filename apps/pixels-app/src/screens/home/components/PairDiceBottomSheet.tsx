import { BottomSheetModal, BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { range } from "@systemic-games/pixels-core-utils";
import {
  ScannedPixelNotifier,
  usePixelInfoProp,
} from "@systemic-games/react-native-pixels-connect";
import React from "react";
import { View } from "react-native";
import { Button, Text, ThemeProvider, useTheme } from "react-native-paper";
import Animated, { FadeIn } from "react-native-reanimated";
import { RootSiblingParent } from "react-native-root-siblings";

import { useAppStore } from "~/app/hooks";
import { getNoAvailableDiceMessage } from "~/app/messages";
import { AppStyles } from "~/app/styles";
import { getBottomSheetProps } from "~/app/themes";
import { BluetoothStateWarning } from "~/components/BluetoothWarning";
import { PixelBattery } from "~/components/PixelBattery";
import { PixelRssi } from "~/components/PixelRssi";
import { ScanningIndicator } from "~/components/ScanningIndicator";
import { TouchableCard } from "~/components/TouchableCard";
import { GradientButton } from "~/components/buttons";
import { DieWireframe } from "~/components/icons";
import { pairDie } from "~/features/dice";
import { TrailingSpaceFix } from "~/fixes";
import {
  usePixelScanner,
  useBottomSheetPadding,
  useRollStateLabel,
  useBottomSheetBackHandler,
} from "~/hooks";

function ScannedPixelCard({
  scannedPixel,
  selected,
  onToggleSelect,
}: {
  scannedPixel: ScannedPixelNotifier;
  selected?: boolean;
  onToggleSelect?: () => void;
}) {
  const name = usePixelInfoProp(scannedPixel, "name");
  const rollLabel = useRollStateLabel(scannedPixel);
  const rollState = scannedPixel.rollState;
  return (
    <TouchableCard
      selected={selected}
      selectable
      gradientBorder="bright"
      flash={rollState === "rolling" || rollState === "handling"}
      onPress={onToggleSelect}
    >
      <DieWireframe dieType={scannedPixel.dieType} size={70} />
      <Text
        numberOfLines={1}
        variant="bodyMedium"
        style={{ marginTop: 6, fontFamily: "LTInternet-Bold" }}
      >
        {name ?? ""}
      </Text>
      <Text numberOfLines={1}>{rollLabel ?? ""}</Text>
      <View
        style={{
          flexDirection: "row",
          gap: 15,
          alignItems: "flex-end",
          justifyContent: "flex-end",
        }}
      >
        <PixelBattery pixel={scannedPixel} size={24} />
        <PixelRssi pixel={scannedPixel} size={24} />
      </View>
    </TouchableCard>
  );
}

function ScannedPixelsColumn({
  scannedPixels,
  selection,
  onToggleSelect,
}: {
  scannedPixels: readonly ScannedPixelNotifier[];
  selection: readonly ScannedPixelNotifier[];
  onToggleSelect: (scannedPixel: ScannedPixelNotifier) => void;
}) {
  return (
    <View style={{ flex: 1, gap: 15 }}>
      {scannedPixels.map((sp) => (
        <ScannedPixelCard
          key={sp.pixelId}
          scannedPixel={sp}
          selected={selection.includes(sp)}
          onToggleSelect={() => onToggleSelect(sp)}
        />
      ))}
    </View>
  );
}

function SelectScannedPixels({
  scannedPixels,
  numColumns = 3,
  onPairDice,
}: {
  scannedPixels: readonly ScannedPixelNotifier[];
  numColumns?: number;
  onPairDice: (scannedPixels: ScannedPixelNotifier[]) => void;
}) {
  const [showNoDie, setShowNoDie] = React.useState(false);
  const noAvailableDie = scannedPixels.length === 0;
  React.useEffect(() => {
    if (noAvailableDie) {
      const id = setTimeout(() => setShowNoDie(true), 3000);
      return () => clearTimeout(id);
    } else {
      setShowNoDie(false);
    }
  }, [noAvailableDie]);

  const [selection, setSelection] = React.useState<ScannedPixelNotifier[]>([]);
  const { colors } = useTheme();

  return (
    <>
      <BottomSheetScrollView
        contentContainerStyle={{
          flexDirection: "row",
          gap: 10,
        }}
      >
        {scannedPixels.length ? (
          range(numColumns).map((col) => (
            <ScannedPixelsColumn
              key={col}
              scannedPixels={scannedPixels.filter(
                (_, i) => i % numColumns === col
              )}
              selection={selection}
              onToggleSelect={(sp) =>
                setSelection((selected) =>
                  selected.includes(sp)
                    ? selected.filter((other) => other !== sp)
                    : [...selected, sp]
                )
              }
            />
          ))
        ) : (
          <View>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginTop: 20,
                marginLeft: 20,
                gap: 30,
              }}
            >
              <ScanningIndicator />
              <Text variant="bodyMedium">Scanning for dice...</Text>
            </View>
            {showNoDie && (
              <Animated.View
                entering={FadeIn.duration(300)}
                style={{
                  marginTop: 30,
                  marginHorizontal: 20,
                  gap: 20,
                }}
              >
                <Text variant="bodyMedium">{getNoAvailableDiceMessage()}</Text>
                <Text variant="bodyMedium">
                  For help about turning on your dice go in the "More" tab.
                </Text>
              </Animated.View>
            )}
          </View>
        )}
      </BottomSheetScrollView>
      {/* Show select/ unselect all when more than 1 line of dice cards */}
      {scannedPixels.length > 3 && (
        <View
          style={{
            flexDirection: "row",
            marginVertical: -10,
            justifyContent: "space-between",
          }}
        >
          <Button
            compact
            textColor={colors.primary}
            sentry-label="select-all-dice"
            onPress={() => setSelection([...scannedPixels])}
          >
            {"Select All" + TrailingSpaceFix}
          </Button>
          <Button
            compact
            textColor={colors.primary}
            sentry-label="unselect-all-dice"
            onPress={() => setSelection([])}
          >
            Unselect All
          </Button>
        </View>
      )}
      <GradientButton
        disabled={!selection.length}
        sentry-label="pair-dice"
        style={{ marginVertical: 10 }}
        onPress={() => onPairDice(selection)}
      >
        {!selection.length
          ? "No Die Selected"
          : `Pair ${selection.length} Pixels ${selection.length <= 1 ? "Die" : "Dice"}`}
      </GradientButton>
    </>
  );
}

export function PairDiceBottomSheet({
  visible,
  onDismiss,
}: {
  visible: boolean;
  onDismiss?: (scannedPixels?: ScannedPixelNotifier[]) => void;
}) {
  const store = useAppStore();
  const { availablePixels, startScan, stopScan, scanError } = usePixelScanner();

  // Start scan on opening bottom sheet
  React.useEffect(() => {
    visible && startScan();
  }, [startScan, visible]);

  // Stop scan on closing bottom sheet
  const dismiss = React.useCallback(
    (scannedPixels?: ScannedPixelNotifier[]) => {
      stopScan();
      onDismiss?.(scannedPixels);
    },
    [onDismiss, stopScan]
  );

  // Pair selected dice
  const pairDice = React.useCallback(
    (scannedPixels: ScannedPixelNotifier[]) => {
      for (const pixel of scannedPixels) {
        pairDie(pixel, store);
      }
      dismiss(scannedPixels);
    },
    [dismiss, store]
  );

  const sheetRef = React.useRef<BottomSheetModal>(null);
  const onChange = useBottomSheetBackHandler(sheetRef);
  React.useEffect(() => {
    if (visible) {
      sheetRef.current?.present();
    } else {
      sheetRef.current?.dismiss();
    }
  }, [startScan, stopScan, visible]);

  const paddingBottom = useBottomSheetPadding(0);
  const theme = useTheme();
  const { colors } = theme;
  return (
    <BottomSheetModal
      ref={sheetRef}
      snapPoints={["60%"]}
      onDismiss={dismiss}
      onChange={onChange}
      {...getBottomSheetProps(colors)}
    >
      <RootSiblingParent>
        <ThemeProvider theme={theme}>
          {visible && (
            <View
              style={{
                flex: 1,
                flexGrow: 1,
                paddingHorizontal: 10,
                paddingBottom,
                gap: 10,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                }}
              >
                <Text variant="titleMedium">Select Pixels Dice to Pair</Text>
                <Text style={AppStyles.selfCentered}>
                  {availablePixels.length <= 3
                    ? ""
                    : ` (${availablePixels.length} available)`}
                </Text>
              </View>
              <BluetoothStateWarning>
                {scanError ? (
                  <Text variant="bodyLarge" style={{ padding: 10 }}>
                    ❌ Error trying to scan for dice!{"\n"}
                    {scanError.message}.
                  </Text>
                ) : (
                  <SelectScannedPixels
                    scannedPixels={availablePixels}
                    onPairDice={pairDice}
                  />
                )}
              </BluetoothStateWarning>
            </View>
          )}
        </ThemeProvider>
      </RootSiblingParent>
    </BottomSheetModal>
  );
}
