import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
} from "@gorhom/bottom-sheet";
import { ScannedPixelNotifier } from "@systemic-games/react-native-pixels-connect";
import React from "react";
import { View } from "react-native";
import { IconButton, Text, ThemeProvider, useTheme } from "react-native-paper";
import { FadeIn } from "react-native-reanimated";
import { RootSiblingParent } from "react-native-root-siblings";

import { useAppDispatch } from "~/app/hooks";
import { getNoAvailableDiceMessage } from "~/app/messages";
import { BluetoothStateWarning } from "~/components/BluetoothWarning";
import { ScannedPixelsCount } from "~/components/ScannedPixelsCount";
import { useFlashAnimationStyleOnRoll } from "~/components/ViewFlashOnRoll";
import { AnimatedText } from "~/components/animated";
import { AnimatedSelectionButton, GradientButton } from "~/components/buttons";
import { DieWireframe } from "~/components/icons";
import { getDieTypeAndColorwayLabel } from "~/features/profiles";
import { addPairedDie } from "~/features/store/pairedDiceSlice";
import { bottomSheetAnimationConfigFix } from "~/fixes";
import {
  usePixelScanner,
  useBottomSheetPadding,
  usePixelsCentralOnReady,
} from "~/hooks";
import { useBottomSheetBackHandler } from "~/hooks/useBottomSheetBackHandler";
import { useRollStateLabel } from "~/hooks/useRollStateLabel";
import { AppStyles } from "~/styles";
import { getBottomSheetBackgroundStyle } from "~/themes";

function NoAvailableDice() {
  return (
    <AnimatedText entering={FadeIn.duration(300)} style={{ marginLeft: 10 }}>
      {getNoAvailableDiceMessage()}
      {"\n\n"}For help about turning on your dice go in the "More" tab.
    </AnimatedText>
  );
}

function ScannedPixelItem({
  scannedPixel,
  selected,
  onToggleSelect,
}: {
  scannedPixel: ScannedPixelNotifier;
  selected?: boolean;
  onToggleSelect?: () => void;
}) {
  const [name, setName] = React.useState(scannedPixel.name);
  React.useEffect(() => {
    const onName = () => setName(scannedPixel.name);
    onName();
    scannedPixel.addPropertyListener("name", onName);
    return () => {
      scannedPixel.removePropertyListener("name", onName);
    };
  }, [scannedPixel]);
  const rollLabel = useRollStateLabel(scannedPixel);
  const animStyle = useFlashAnimationStyleOnRoll(scannedPixel);
  return (
    <AnimatedSelectionButton
      icon={() => <DieWireframe dieType={scannedPixel.dieType} size={40} />}
      selected={selected}
      entering={FadeIn.duration(300)}
      style={[animStyle, { marginVertical: 5 }]}
      contentStyle={{ paddingVertical: 5 }}
      onPress={onToggleSelect}
    >
      <View style={{ flex: 1, justifyContent: "space-around" }}>
        <Text variant="bodyLarge">{name}</Text>
        <Text>{getDieTypeAndColorwayLabel(scannedPixel)}</Text>
        <Text>{rollLabel}</Text>
      </View>
    </AnimatedSelectionButton>
  );
}

function SelectPixels({
  pixels,
  onPairDice,
}: {
  pixels: ScannedPixelNotifier[];
  onPairDice: (pixels: ScannedPixelNotifier[]) => void;
}) {
  const diceCount = pixels.length;
  const noAvailableDie = diceCount === 0;

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
      <ScannedPixelsCount
        diceCount={diceCount}
        style={{ marginVertical: 10 }}
      />
      <BottomSheetScrollView>
        <GradientButton
          disabled={!selection.length}
          sentry-label="pair-dice"
          style={{ marginBottom: 10 }}
          onPress={() => onPairDice(selection)}
        >
          {!selection.length
            ? "No Die Selected"
            : selection.length === 1
              ? "Pair 1 Pixels Die"
              : `Pair ${selection.length} Pixels Dice`}
        </GradientButton>
        {showNoDie && diceCount === 0 && <NoAvailableDice />}
        {pixels.map((sp) => (
          <ScannedPixelItem
            key={sp.systemId + sp.pixelId}
            scannedPixel={sp}
            selected={selection.includes(sp)}
            onToggleSelect={() =>
              setSelection((selected) =>
                selected.includes(sp)
                  ? selected.filter((other) => other !== sp)
                  : [...selected, sp]
              )
            }
          />
        ))}
      </BottomSheetScrollView>
    </>
  );
}

export function PairDiceBottomSheet({
  visible,
  onDismiss,
}: {
  visible: boolean;
  onDismiss?: (pixels?: ScannedPixelNotifier[]) => void;
}) {
  const appDispatch = useAppDispatch();
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
    (pixels?: ScannedPixelNotifier[]) => {
      stopScan();
      onDismiss?.(pixels);
    },
    [onDismiss, stopScan]
  );

  // Pair selected dice
  const pairDice = React.useCallback(
    (pixels: ScannedPixelNotifier[]) => {
      for (const pixel of pixels) {
        appDispatch(
          addPairedDie({
            systemId: pixel.systemId,
            pixelId: pixel.pixelId,
            name: pixel.name,
            dieType: pixel.dieType,
            colorway: pixel.colorway,
            firmwareTimestamp: pixel.firmwareDate.getTime(),
          })
        );
      }
      dismiss(pixels);
    },
    [appDispatch, dismiss]
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
      animationConfigs={bottomSheetAnimationConfigFix}
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
      <RootSiblingParent>
        <ThemeProvider theme={theme}>
          <View
            style={{
              flex: 1,
              flexGrow: 1,
              paddingHorizontal: 10,
              paddingBottom,
              gap: 10,
            }}
          >
            <Text variant="titleMedium" style={AppStyles.selfCentered}>
              Select Pixels Dice to Pair
            </Text>
            {visible && (
              <BluetoothStateWarning>
                {scanError ? (
                  <Text variant="bodyLarge" style={{ padding: 10 }}>
                    ❌ Error trying to scan for dice!{"\n"}
                    {scanError.message}.
                  </Text>
                ) : (
                  <SelectPixels
                    pixels={availablePixels}
                    onPairDice={pairDice}
                  />
                )}
              </BluetoothStateWarning>
            )}
          </View>
          <IconButton
            icon="close"
            iconColor={colors.primary}
            sentry-label="close-pair-dice"
            style={{ position: "absolute", right: 0, top: -15 }}
            onPress={() => dismiss()}
          />
        </ThemeProvider>
      </RootSiblingParent>
    </BottomSheetModal>
  );
}
