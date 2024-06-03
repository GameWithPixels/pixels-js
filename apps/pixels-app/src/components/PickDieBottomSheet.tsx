import { BottomSheetModal, BottomSheetScrollView } from "@gorhom/bottom-sheet";
import {
  PixelDieType,
  usePixelStatus,
  usePixelEvent,
} from "@systemic-games/react-native-pixels-connect";
import React from "react";
import { View } from "react-native";
import { IconButton, Text, ThemeProvider, useTheme } from "react-native-paper";
import { RootSiblingParent } from "react-native-root-siblings";

import { BluetoothStateWarning } from "./BluetoothWarning";
import { PixelRollState } from "./PixelRollState";
import { TouchableCard } from "./TouchableCard";
import { DieWireframe } from "./icons";

import { PairedDie } from "~/app/PairedDie";
import { useAppSelector } from "~/app/hooks";
import { getDieTypeLabel, getPixelStatusLabel } from "~/features/profiles";
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
  onSelect?: () => void;
}) {
  const central = usePixelsCentral();
  const pixel = useWatchedPixel(pairedDie);
  const status = usePixelStatus(pixel);
  const [rollEv] = usePixelEvent(pixel, "roll");
  const disabled = status !== "ready";
  const { colors } = useTheme();
  const color = disabled ? colors.onSurfaceDisabled : colors.onPrimary;
  return (
    <TouchableCard
      row
      flash={
        status === "ready" &&
        (rollEv?.state === "rolling" || rollEv?.state === "handling")
      }
      contentStyle={{ padding: 10 }}
      onPress={() => {
        if (pixel?.isReady) {
          onSelect?.();
        } else {
          central.connectToMissingPixels(pairedDie.pixelId);
        }
      }}
    >
      <DieWireframe size={40} dieType={pairedDie.dieType} disabled={disabled} />
      <View
        style={{
          flex: 1,
          justifyContent: "space-between",
          marginHorizontal: 10, // Using padding on the contentStyle moves the views to the right on touch
        }}
      >
        <Text variant="bodyLarge" style={{ color }}>
          {pairedDie.name}
        </Text>
        {pixel && !disabled && <PixelRollState pixel={pixel} />}
      </View>
      <Text style={{ color }}>{getPixelStatusLabel(status)}</Text>
    </TouchableCard>
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

  const pairedDice = useAppSelector((state) => state.pairedDice.paired)
    .filter((d) => !dieTypes || dieTypes.includes(d.die.dieType))
    .map((d) => d.die);

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
            <Text variant="titleMedium" style={AppStyles.selfCentered}>
              Select a{" "}
              {dieTypes
                ? listToText(dieTypes.map(getDieTypeLabel), "or")
                : "Die"}
            </Text>
            <BluetoothStateWarning>
              <BottomSheetScrollView
                contentContainerStyle={{ paddingHorizontal: 10, gap: 10 }}
              >
                {pairedDice.map((d) => (
                  <PairedDieCard
                    key={d.pixelId}
                    pairedDie={d}
                    onSelect={() => dismiss(d)}
                  />
                ))}
                {pairedDice.length ? (
                  <Text
                    style={{ marginTop: 10 }}
                  >{`Only ${dieTypesStrSpace}dice are listed here.`}</Text>
                ) : (
                  <Text variant="bodyLarge">
                    {`You don't have any paired ${dieTypesStrSpace}die.`}
                  </Text>
                )}
              </BottomSheetScrollView>
            </BluetoothStateWarning>
          </View>
          <IconButton
            icon="close"
            iconColor={colors.primary}
            sentry-label="close-pick-die"
            style={{ position: "absolute", right: 0, top: -15 }}
            onPress={() => dismiss()}
          />
        </ThemeProvider>
      </RootSiblingParent>
    </BottomSheetModal>
  );
}
