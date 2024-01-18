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
import { getDieTypeLabel } from "~/features/profiles";
import { listToText, notEmpty } from "~/features/utils";
import { useBottomSheetPadding } from "~/hooks";
import { useBottomSheetBackHandler } from "~/hooks/useBottomSheetBackHandler";
import { AppStyles } from "~/styles";
import { getBottomSheetBackgroundStyle } from "~/themes";

export function PickDieBottomSheet({
  dieTypes,
  visible,
  onDismiss,
}: {
  dieTypes?: readonly PixelDieType[];
  visible: boolean;
  onDismiss: (pixel?: Pixel) => void;
}) {
  const sheetRef = React.useRef<BottomSheetModal>(null);
  const onChange = useBottomSheetBackHandler(sheetRef);
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
  const pixels = React.useMemo(
    () =>
      pairedDice
        .map((d) => getPixel(d.pixelId))
        .filter(notEmpty)
        .filter(
          (p) => p.isReady && (!dieTypes || dieTypes.includes(p.dieType))
        ),
    [dieTypes, pairedDice]
  );
  const hasPairedDiceType = React.useMemo(
    () => pairedDice.some((p) => !dieTypes || dieTypes.includes(p.dieType)),
    [dieTypes, pairedDice]
  );

  const dieTypesStrSpace = !dieTypes?.length
    ? ""
    : listToText(dieTypes.map(getDieTypeLabel)) + " ";

  const paddingBottom = useBottomSheetPadding(0);
  const theme = useTheme();
  return (
    <BottomSheetModal
      ref={sheetRef}
      snapPoints={["50%"]}
      onDismiss={onDismiss}
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
            Select a{" "}
            {dieTypes ? listToText(dieTypes.map(getDieTypeLabel), "or") : "Die"}
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
              <Text>{`Only connected ${dieTypesStrSpace}dice are listed.`}</Text>
            ) : (
              <Text variant="bodyLarge">
                {hasPairedDiceType
                  ? `No connected ${dieTypesStrSpace}die.`
                  : `You don't have any paired ${
                      pairedDice.length ? dieTypesStrSpace : ""
                    }die.`}
              </Text>
            )}
          </BottomSheetScrollView>
        </View>
      </ThemeProvider>
    </BottomSheetModal>
  );
}
