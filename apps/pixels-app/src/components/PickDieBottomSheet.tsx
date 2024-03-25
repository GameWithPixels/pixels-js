import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
} from "@gorhom/bottom-sheet";
import {
  Pixel,
  PixelDieType,
  usePixelStatus,
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
import { bottomSheetAnimationConfigFix } from "~/fixes";
import {
  useWatchedPixel,
  useBottomSheetPadding,
  usePixelScanner,
} from "~/hooks";
import { useBottomSheetBackHandler } from "~/hooks/useBottomSheetBackHandler";
import { AppStyles } from "~/styles";
import { getBottomSheetBackgroundStyle } from "~/themes";

function PairedDieCard({
  pairedDie,
  onSelect,
}: {
  pairedDie: PairedDie;
  onSelect?: (pixel: Pixel) => void;
}) {
  const pixel = useWatchedPixel(pairedDie);
  const status = usePixelStatus(pixel);
  const disabled = status !== "ready";
  const { colors } = useTheme();
  const color = disabled ? colors.onSurfaceDisabled : colors.onPrimary;
  return (
    <TouchableCard
      row
      disabled={disabled}
      contentStyle={{ padding: 10 }}
      onPress={() => pixel && onSelect?.(pixel)}
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
  onDismiss: (pixel?: Pixel) => void;
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

  const dismiss = (pixel?: Pixel) => {
    stopScan();
    onDismiss(pixel);
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
                    onSelect={dismiss}
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
