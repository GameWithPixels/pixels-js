import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
} from "@gorhom/bottom-sheet";
import {
  getPixel,
  Pixel,
  PixelDieType,
} from "@systemic-games/react-native-pixels-connect";
import React from "react";
import { View } from "react-native";
import { Text, ThemeProvider, useTheme } from "react-native-paper";

import { useAppSelector } from "~/app/hooks";
import { DieStaticInfo } from "~/components/ScannedDieStatus";
import { TouchableCard } from "~/components/TouchableCard";
import { DieWireframe } from "~/components/icons";
import { getDieTypeLabel } from "~/descriptions";
import { notEmpty } from "~/features/utils";
import { useBottomSheetPadding } from "~/hooks";
import { getBottomSheetBackgroundStyle } from "~/themes";

export function PickDieBottomSheet({
  dieType,
  visible,
  onDismiss,
}: {
  dieType?: PixelDieType;
  visible: boolean;
  onDismiss: (pixel?: Pixel) => void;
}) {
  const sheetRef = React.useRef<BottomSheetModal>(null);
  React.useEffect(() => {
    if (visible) {
      sheetRef.current?.present();
    } else {
      sheetRef.current?.dismiss();
    }
  }, [visible]);

  const pairedDice = useAppSelector((state) => state.pairedDice.dice).filter(
    (d) => d.isPaired
  );
  // TODO update on dice connect/disconnect
  const pixels = React.useMemo(
    () =>
      pairedDice
        .map((d) => getPixel(d.pixelId))
        .filter(notEmpty)
        .filter((p) => p.isReady && (!dieType || p.dieType === dieType)),
    [dieType, pairedDice]
  );
  const hasPairedDiceType = React.useMemo(
    () => pairedDice.some((p) => !dieType || p.dieType === dieType),
    [dieType, pairedDice]
  );

  const dieTypeStr = dieType ? getDieTypeLabel(dieType) + " " : "";

  const paddingBottom = useBottomSheetPadding(0);
  const theme = useTheme();
  return (
    <BottomSheetModal
      ref={sheetRef}
      snapPoints={["50%"]}
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
            paddingHorizontal: 10,
            paddingBottom,
            gap: 20,
          }}
        >
          <Text variant="titleMedium" style={{ alignSelf: "center" }}>
            Select a {dieType ? getDieTypeLabel(dieType) : "Die"}
          </Text>
          <BottomSheetScrollView
            contentContainerStyle={{ paddingHorizontal: 10, gap: 20 }}
          >
            {pixels.map((p) => (
              <TouchableCard
                key={p.pixelId}
                row
                contentStyle={{ padding: 10, gap: 10 }}
                onPress={() => onDismiss(p)}
              >
                <DieWireframe size={40} dieType={p.dieType} />
                <DieStaticInfo pixel={p} />
              </TouchableCard>
            ))}
            {pixels.length > 0 ? (
              <Text>{`Only connected ${dieTypeStr}dice are listed.`}</Text>
            ) : (
              <Text variant="bodyLarge">
                {hasPairedDiceType
                  ? `No connected ${dieTypeStr}die.`
                  : `You don't have any paired ${
                      pairedDice.length ? dieTypeStr : ""
                    }die.`}
              </Text>
            )}
          </BottomSheetScrollView>
        </View>
      </ThemeProvider>
    </BottomSheetModal>
  );
}
