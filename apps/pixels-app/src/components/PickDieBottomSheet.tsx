import { BottomSheetModal, BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { range } from "@systemic-games/pixels-core-utils";
import { PixelDieType } from "@systemic-games/react-native-pixels-connect";
import React from "react";
import { View } from "react-native";
import { Text, ThemeProvider, useTheme } from "react-native-paper";
import { RootSiblingParent } from "react-native-root-siblings";

import { PixelCard } from "./cards";

import { PairedDie } from "~/app/PairedDie";
import { useAppSelector } from "~/app/hooks";
import { getDieTypeLabel } from "~/features/profiles";
import { listToText } from "~/features/utils";
import {
  useBottomSheetBackHandler,
  useBottomSheetPadding,
  usePixelScanner,
  usePixelsCentral,
} from "~/hooks";
import { AppStyles } from "~/styles";
import { getBottomSheetProps } from "~/themes";

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
        <PixelCard
          key={d.pixelId}
          vertical
          selectable
          pairedDie={d}
          onPress={() => onSelect?.(d)}
        />
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
        gap: 10,
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
  const central = usePixelsCentral();
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
    pairedDie && central.connectToMissingPixels(pairedDie.pixelId);
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
            {pairedDice.length ? (
              <SelectPairedDie pairedDice={pairedDice} onSelect={dismiss} />
            ) : (
              <Text variant="bodyLarge">
                {`You don't have any paired ${dieTypesStrSpace}die.`}
              </Text>
            )}
          </View>
        </ThemeProvider>
      </RootSiblingParent>
    </BottomSheetModal>
  );
}
