import { BottomSheetModal, BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { range } from "@systemic-games/pixels-core-utils";
import { getBorderRadius } from "@systemic-games/react-native-pixels-components";
import {
  ScannedPixelNotifier,
  usePixelInfoProp,
} from "@systemic-games/react-native-pixels-connect";
import Color from "color";
import React from "react";
import { View } from "react-native";
import {
  Text,
  ThemeProvider,
  TouchableRipple,
  useTheme,
} from "react-native-paper";
import Animated, { FadeIn } from "react-native-reanimated";
import { RootSiblingParent } from "react-native-root-siblings";

import { useAppStore } from "~/app/hooks";
import { getNoAvailableDiceMessage } from "~/app/messages";
import { BluetoothStateWarning } from "~/components/BluetoothWarning";
import { PixelBattery } from "~/components/PixelBattery";
import { PixelRssi } from "~/components/PixelRssi";
import { useFlashAnimationStyle } from "~/components/ViewFlashOnRoll";
import { AnimatedText } from "~/components/animated";
import { GradientButton } from "~/components/buttons";
import { DieWireframe } from "~/components/icons";
import { pairDie } from "~/features/dice";
import {
  usePixelScanner,
  useBottomSheetPadding,
  usePixelsCentralOnReady,
  useRollStateLabel,
  useBottomSheetBackHandler,
} from "~/hooks";
import { AppStyles } from "~/styles";
import { getBottomSheetProps } from "~/themes";

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
  const animStyle = useFlashAnimationStyle(
    rollState === "rolling" || rollState === "handling"
  );

  const { colors, roundness } = useTheme();
  const borderRadius = getBorderRadius(roundness);
  return (
    <Animated.View
      entering={FadeIn.duration(300)}
      style={[
        animStyle,
        {
          overflow: "hidden",
          borderWidth: selected ? 3 : 1,
          borderRadius,
          borderColor: colors.onSurface,
        },
      ]}
    >
      <TouchableRipple
        borderless
        onPress={onToggleSelect}
        style={{
          alignItems: "center",
          paddingVertical: selected ? 10 : 12,
          backgroundColor: Color(colors.secondary)
            .darken(selected ? 0.3 : 0.6)
            .toString(),
        }}
      >
        <>
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
        </>
      </TouchableRipple>
    </Animated.View>
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
  const noAvailableDie = scannedPixels.length === 0;

  const [showNoDie, setShowNoDie] = React.useState(false);
  React.useEffect(() => {
    if (noAvailableDie) {
      const id = setTimeout(() => setShowNoDie(true), 3000);
      return () => clearTimeout(id);
    } else {
      setShowNoDie(false);
    }
  }, [noAvailableDie]);

  const [selection, setSelection] = React.useState<ScannedPixelNotifier[]>([]);

  return (
    <>
      <BottomSheetScrollView
        contentContainerStyle={{
          flexDirection: "row",
          gap: 15,
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
          <AnimatedText
            key={showNoDie ? "no-die" : "searching"}
            entering={FadeIn.duration(300)}
            style={{ marginLeft: 10 }}
          >
            {showNoDie
              ? getNoAvailableDiceMessage() +
                `\n\nFor help about turning on your dice go in the "More" tab`
              : "Searching for dice..."}
            .
          </AnimatedText>
        )}
      </BottomSheetScrollView>
      <GradientButton
        disabled={!selection.length}
        sentry-label="pair-dice"
        style={{ marginBottom: 10 }}
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
  // and resume scan on BLE enabled
  usePixelsCentralOnReady(
    React.useCallback(
      (ready: boolean) => ready && visible && startScan(),
      [startScan, visible]
    )
  );
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
    [store, dismiss]
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
      snapPoints={["50%"]}
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
