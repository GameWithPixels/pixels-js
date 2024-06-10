import { BottomSheetModal, BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { range } from "@systemic-games/pixels-core-utils";
import { getBorderRadius } from "@systemic-games/react-native-pixels-components";
import {
  PixelDieType,
  usePixelStatus,
  usePixelEvent,
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

import { BluetoothStateWarning } from "./BluetoothWarning";
import { PixelBattery } from "./PixelBattery";
import { PixelRssi } from "./PixelRssi";
import { useFlashAnimationStyle } from "./ViewFlashOnRoll";
import { DieWireframe } from "./icons";

import { PairedDie } from "~/app/PairedDie";
import { useAppSelector } from "~/app/hooks";
import { getDieTypeLabel, getRollStateLabel } from "~/features/profiles";
import { listToText } from "~/features/utils";
import {
  useWatchedPixel,
  useBottomSheetPadding,
  usePixelScanner,
  useBottomSheetBackHandler,
  usePixelsCentral,
} from "~/hooks";
import { AppStyles } from "~/styles";
import { getBottomSheetProps } from "~/themes";

function PairedDieCard({
  pairedDie,
  onSelect,
}: {
  pairedDie: PairedDie;
  onSelect?: (pairedDie: PairedDie) => void;
}) {
  const central = usePixelsCentral();
  const pixel = useWatchedPixel(pairedDie);
  const status = usePixelStatus(pixel);
  const [rollEv] = usePixelEvent(pixel, "roll");
  const face = rollEv?.face;
  const rollState = rollEv?.state;
  const rollLabel =
    face !== undefined && rollState && rollState !== "unknown"
      ? rollState === "onFace"
        ? `Face ${face}`
        : rollState === "rolling" || rollState === "handling"
          ? "Rolling..."
          : getRollStateLabel(rollState)
      : undefined;
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
          borderWidth: 1,
          borderRadius,
          borderColor: colors.onSurface,
        },
      ]}
    >
      <TouchableRipple
        borderless
        onPress={() => {
          if (!pixel?.isReady) {
            central.connectToMissingPixels(pairedDie.pixelId);
          }
          onSelect?.(pairedDie);
        }}
        style={{
          alignItems: "center",
          paddingVertical: 12,
          backgroundColor: Color(colors.secondary).darken(0.5).toString(),
        }}
      >
        <>
          <DieWireframe dieType={pairedDie.dieType} size={70} />
          <Text
            numberOfLines={1}
            variant="bodyMedium"
            style={{ marginTop: 6, fontFamily: "LTInternet-Bold" }}
          >
            {pairedDie.name}
          </Text>
          <Text numberOfLines={1}>
            {pixel && status === "ready" && rollLabel ? rollLabel : ""}
          </Text>
          <View
            style={{
              flexDirection: "row",
              gap: 15,
              alignItems: "flex-end",
              justifyContent: "flex-end",
            }}
          >
            <PixelBattery pixel={pixel} size={24} />
            <PixelRssi pixel={pixel} size={22} />
          </View>
        </>
      </TouchableRipple>
    </Animated.View>
  );
}

function PairedDiceColumn({
  pairedDice,
  onSelect,
}: {
  pairedDice: readonly PairedDie[];
  onSelect?: (pairedDie: PairedDie) => void;
}) {
  return (
    <View style={{ flex: 1, gap: 15 }}>
      {pairedDice.map((d) => (
        <PairedDieCard key={d.pixelId} pairedDie={d} onSelect={onSelect} />
      ))}
    </View>
  );
}

function SelectPairedDie({
  pairedDice,
  numColumns = 3,
  onSelect,
}: {
  pairedDice: readonly PairedDie[];
  numColumns?: number;
  onSelect: (pairedDie: PairedDie) => void;
}) {
  return (
    <BottomSheetScrollView
      contentContainerStyle={{
        flexDirection: "row",
        gap: 15,
      }}
    >
      {range(numColumns).map((col) => (
        <PairedDiceColumn
          key={col}
          pairedDice={pairedDice.filter((_, i) => i % numColumns === col)}
          onSelect={onSelect}
        />
      ))}
    </BottomSheetScrollView>
  );
}

export function PickDieBottomSheet({
  dieTypes,
  visible,
  onDismiss,
}: {
  dieTypes?: readonly PixelDieType[];
  visible: boolean;
  onDismiss: (pairedDie?: PairedDie) => void;
}) {
  const { startScan, stopScan } = usePixelScanner();

  const sheetRef = React.useRef<BottomSheetModal>(null);
  const onChange = useBottomSheetBackHandler(sheetRef);
  React.useEffect(() => {
    if (visible) {
      sheetRef.current?.present();
      // Try to reconnect to all dice while the bottom sheet is open
      startScan();
    } else {
      sheetRef.current?.dismiss();
    }
  }, [startScan, visible]);

  const dismiss = (pairedDie?: PairedDie) => {
    stopScan();
    onDismiss(pairedDie);
  };

  const pairedDice = useAppSelector((state) => state.pairedDice.paired).filter(
    (d) => !dieTypes || dieTypes.includes(d.dieType)
  );

  const dieTypesStrSpace = !dieTypes?.length
    ? ""
    : listToText(dieTypes.map(getDieTypeLabel)) + " ";

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
          <View
            style={{
              flex: 1,
              flexGrow: 1,
              paddingHorizontal: 10,
              paddingBottom,
              gap: 20,
            }}
          >
            <View
              style={{ flexDirection: "row", justifyContent: "space-between" }}
            >
              <Text variant="titleMedium">
                Select a{" "}
                {dieTypes
                  ? listToText(dieTypes.map(getDieTypeLabel), "or")
                  : "Die"}
              </Text>
              {dieTypes && dieTypes.length > 0 && (
                <Text style={AppStyles.selfCentered}>
                  Only{" "}
                  {dieTypes.length === 1
                    ? getDieTypeLabel(dieTypes[0]) + "'s"
                    : dieTypesStrSpace + "dice"}{" "}
                  are shown
                </Text>
              )}
            </View>
            <BluetoothStateWarning>
              {pairedDice.length ? (
                <SelectPairedDie pairedDice={pairedDice} onSelect={dismiss} />
              ) : (
                <Text variant="bodyLarge">
                  {`You don't have any paired ${dieTypesStrSpace}die.`}
                </Text>
              )}
            </BluetoothStateWarning>
          </View>
        </ThemeProvider>
      </RootSiblingParent>
    </BottomSheetModal>
  );
}
