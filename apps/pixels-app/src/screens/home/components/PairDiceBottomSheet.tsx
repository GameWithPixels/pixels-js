import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
} from "@gorhom/bottom-sheet";
import { ScannedPixel } from "@systemic-games/react-native-pixels-connect";
import React from "react";
import { View } from "react-native";
import {
  ActivityIndicator,
  Text,
  ThemeProvider,
  useTheme,
} from "react-native-paper";
import { FadeIn } from "react-native-reanimated";

import { useAppDispatch } from "~/app/hooks";
import { DieStaticInfo } from "~/components/ScannedDieStatus";
import { AnimatedText } from "~/components/animated";
import { GradientButton, SelectionButton } from "~/components/buttons";
import { DieWireframe } from "~/components/icons";
import { addPairedDie } from "~/features/store/pairedDiceSlice";
import { usePixelScanner, useBottomSheetPadding } from "~/hooks";
import { useBottomSheetBackHandler } from "~/hooks/useBottomSheetBackHandler";
import { AppStyles } from "~/styles";
import { getBottomSheetBackgroundStyle } from "~/themes";
import { withAnimated } from "~/withAnimated";

const AnimatedSelectionButton = withAnimated(SelectionButton);

function SelectPixels({
  pixels,
  onPairDice,
}: {
  pixels: ScannedPixel[];
  onPairDice: (pixels: ScannedPixel[]) => void;
}) {
  const dieCount = pixels.length;
  const noAvailableDie = dieCount === 0;

  const [showNoDie, setShowNoDie] = React.useState(false);
  React.useEffect(() => {
    if (noAvailableDie) {
      const id = setTimeout(() => setShowNoDie(true), 3000);
      return () => clearTimeout(id);
    } else {
      setShowNoDie(false);
    }
  }, [noAvailableDie]);

  const [selection, setSelection] = React.useState<ScannedPixel[]>([]);

  return (
    <>
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
          <Text variant="titleSmall">
            {dieCount
              ? `${dieCount} available Pixels ${
                  dieCount <= 1 ? "die" : "dice"
                }, scanning for more...`
              : "Looking for Pixels dice..."}
          </Text>
          <ActivityIndicator />
        </View>
        {showNoDie && dieCount === 0 && (
          <AnimatedText
            entering={FadeIn.duration(300)}
            style={{ marginLeft: 10 }}
          >
            No available dice found so far. Check that your available dice are
            turned on and not connected to another device.{"\n\n"}
            For help about turning on your dice go in the "More" tab.
          </AnimatedText>
        )}
        {pixels.map((sp, i) => (
          <AnimatedSelectionButton
            key={sp.pixelId}
            icon={() => <DieWireframe dieType={sp.dieType} size={40} />}
            selected={selection.includes(sp)}
            noTopBorder={i > 0}
            squaredTopBorder={i > 0}
            squaredBottomBorder={i < dieCount - 1}
            entering={FadeIn.duration(300)}
            onPress={() => {
              setSelection((selected) =>
                selected.includes(sp)
                  ? selected.filter((other) => other !== sp)
                  : [...selected, sp]
              );
            }}
          >
            <DieStaticInfo pixel={sp} />
          </AnimatedSelectionButton>
        ))}
      </BottomSheetScrollView>
      <GradientButton
        disabled={!selection.length}
        sentry-label="pair-dice"
        style={{ marginBottom: 20 }}
        onPress={() => onPairDice(selection)}
      >
        {!selection.length
          ? "No Die Selected"
          : selection.length === 1
            ? "Pair 1 Pixels Die"
            : `Pair ${selection.length} Pixels Dice`}
      </GradientButton>
    </>
  );
}

export function PairDiceBottomSheet({
  visible,
  onDismiss,
}: {
  visible: boolean;
  onDismiss?: (pixels?: ScannedPixel[]) => void;
}) {
  const appDispatch = useAppDispatch();
  const { availablePixels, isScanning, startScan, stopScan } =
    usePixelScanner();

  React.useEffect(() => {
    if (visible) {
      // Start scanning for dice
      startScan();
    }
  }, [startScan, visible]);

  const dismiss = React.useCallback(
    (pixels?: ScannedPixel[]) => {
      stopScan();
      onDismiss?.(pixels);
    },
    [onDismiss, stopScan]
  );

  const pairDice = React.useCallback(
    (pixels: ScannedPixel[]) => {
      for (const pixel of pixels) {
        appDispatch(
          addPairedDie({
            systemId: pixel.systemId,
            pixelId: pixel.pixelId,
            name: pixel.name,
            dieType: pixel.dieType,
            colorway: pixel.colorway,
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
  return (
    <BottomSheetModal
      ref={sheetRef}
      snapPoints={["50%"]}
      onDismiss={dismiss}
      onChange={onChange}
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
          <Text variant="titleMedium" style={AppStyles.selfCentered}>
            Select Pixels Dice to Pair
          </Text>
          {visible && isScanning ? (
            <SelectPixels pixels={availablePixels} onPairDice={pairDice} />
          ) : (
            <Text>{isScanning ? "Scanning" : "Stopped"}</Text>
          )}
        </View>
      </ThemeProvider>
    </BottomSheetModal>
  );
}
