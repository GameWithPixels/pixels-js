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

import { DieStaticInfo } from "~/components/ScannedDieStatus";
import { AnimatedText } from "~/components/animated";
import { GradientButton, SelectionButton } from "~/components/buttons";
import { DieWireframe } from "~/components/icons";
import { useBottomSheetPadding } from "~/hooks";
import { useBottomSheetBackHandler } from "~/hooks/useBottomSheetBackHandler";
import { getBottomSheetBackgroundStyle } from "~/themes";

export function PairDiceBottomSheet({
  availablePixels,
  visible,
  onDismiss,
}: {
  availablePixels: readonly ScannedPixel[];
  visible: boolean;
  onDismiss: (pixels?: ScannedPixel[]) => void;
}) {
  const sheetRef = React.useRef<BottomSheetModal>(null);
  const onChange = useBottomSheetBackHandler(sheetRef);
  const [selection, setSelection] = React.useState<ScannedPixel[]>([]);
  React.useEffect(() => {
    if (visible) {
      sheetRef.current?.present();
    } else {
      sheetRef.current?.dismiss();
      setSelection([]);
    }
  }, [visible]);
  const [showNoDie, setShowNoDie] = React.useState(false);
  React.useEffect(() => {
    if (visible) {
      const id = setTimeout(() => setShowNoDie(true), 3000);
      return () => clearTimeout(id);
    } else {
      setShowNoDie(false);
    }
  }, [visible]);

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
          <Text variant="titleMedium" style={{ alignSelf: "center" }}>
            Select Pixels Dice to Pair
          </Text>
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
                {availablePixels.length
                  ? `${availablePixels.length} available Pixels ${
                      availablePixels.length <= 1 ? "die" : "dice"
                    }, scanning for more...`
                  : "Looking for Pixels dice..."}
              </Text>
              <ActivityIndicator />
            </View>
            {showNoDie && availablePixels.length === 0 && (
              <AnimatedText
                entering={FadeIn.duration(300)}
                style={{ marginLeft: 10 }}
              >
                No available dice found so far. Check that your available dice
                are turned on and not connected to another device.{"\n\n"}
                For help about turning on your dice go in the "More" tab.
              </AnimatedText>
            )}
            {availablePixels.map((sp, i) => (
              <SelectionButton
                key={sp.pixelId}
                icon={() => <DieWireframe dieType={sp.dieType} size={40} />}
                selected={selection.includes(sp)}
                noTopBorder={i > 0}
                squaredTopBorder={i > 0}
                squaredBottomBorder={i < availablePixels.length - 1}
                onPress={() => {
                  setSelection((selected) =>
                    selected.includes(sp)
                      ? selected.filter((other) => other !== sp)
                      : [...selected, sp]
                  );
                }}
              >
                <DieStaticInfo pixel={sp} />
              </SelectionButton>
            ))}
          </BottomSheetScrollView>
          <GradientButton
            disabled={!selection.length}
            style={{ marginBottom: 20 }}
            onPress={() => onDismiss(selection)}
          >
            {!selection.length
              ? "No Die Selected"
              : selection.length === 1
                ? "Pair 1 Pixels Die"
                : `Pair ${selection.length} Pixels Dice`}
          </GradientButton>
        </View>
      </ThemeProvider>
    </BottomSheetModal>
  );
}
