import { useActionSheet } from "@expo/react-native-action-sheet";
import { Pixel } from "@systemic-games/react-native-pixels-connect";
import React from "react";
import { ScrollView, View } from "react-native";
import { Text, useTheme } from "react-native-paper";

import { AppBackground } from "~/components/AppBackground";
import { PageHeader } from "~/components/PageHeader";
import { GradientButton, OutlineButton } from "~/components/buttons";
import { DiceList } from "~/components/dice";
import {
  PixelDfuStatus,
  PixelDfuStatusesContext,
  usePairedPixels,
} from "~/hooks";
import { FirmwareUpdateScreenProps } from "~/navigation";

export function useConfirmStopUpdatingActionSheet(
  onConfirm?: () => void,
  onCancel?: () => void
): () => void {
  const { showActionSheetWithOptions } = useActionSheet();
  const { colors } = useTheme();
  return () => {
    showActionSheetWithOptions(
      {
        title:
          "Stop updating dice?\nWe still need to finish updating the current one.",
        titleTextStyle: { color: colors.onSurface },
        options: ["Stop", "Continue"],
        destructiveButtonIndex: 0,
        cancelButtonIndex: 1,
        destructiveColor: colors.error,
        containerStyle: { backgroundColor: colors.background },
        textStyle: { color: colors.onBackground },
      },
      (selectedIndex?: number) => {
        switch (selectedIndex) {
          case 0:
            onConfirm?.();
            break;
          case 1:
            onCancel?.();
            break;
        }
      }
    );
  };
}

function FirmwareUpdatePage({
  pixels,
  navigation,
}: {
  pixels: Pixel[];
  navigation: FirmwareUpdateScreenProps["navigation"];
}) {
  const [step, setStep] = React.useState<
    "select" | "update" | "interrupt" | "done"
  >("select");
  const [dfuStatuses, setDfuStatuses] = React.useState<PixelDfuStatus[]>(
    pixels.map((p) => ({ pixel: p, progress: 0 }))
  );
  const selection = React.useMemo(
    () => dfuStatuses.map((s) => s.pixel),
    [dfuStatuses]
  );
  const statusesData = React.useMemo(
    () => ({ statuses: dfuStatuses }),
    [dfuStatuses]
  );
  React.useEffect(() => {
    if (step === "update" || step === "interrupt") {
      const id = setInterval(
        () =>
          setDfuStatuses((statuses) => {
            const p = statuses[0].progress;
            if (p === 1) {
              if (statuses.length === 1) {
                clearInterval(id);
                setStep("done");
                return [];
              } else {
                if (step === "interrupt") {
                  clearInterval(id);
                  setStep("select");
                }
                return statuses.filter((_, i) => i > 0);
              }
            } else {
              const copy = [...statuses];
              copy[0] = {
                pixel: copy[0].pixel,
                progress: Math.min(1, copy[0].progress + 0.05),
              };
              return copy;
            }
          }),
        200
      );
      return () => clearInterval(id);
    }
  }, [step]);
  const showConfirmStop = useConfirmStopUpdatingActionSheet(() =>
    setStep("interrupt")
  );
  return (
    <View style={{ height: "100%", gap: 10 }}>
      <PageHeader mode="chevron-down" onGoBack={() => navigation.goBack()}>
        Select Dice to Update
      </PageHeader>
      <View style={{ flex: 1, flexGrow: 1, marginHorizontal: 10, gap: 20 }}>
        <Text variant="bodyLarge">
          We have a software update for your dice!
        </Text>
        <Text variant="bodyLarge">
          We recommend to update them so they work properly with the app. It
          takes less than 20 seconds per die.
        </Text>
        <Text variant="bodyLarge">
          We've found some dice to update and have selected them in the list
          below.
        </Text>
        {step === "select" || step === "done" ? (
          <GradientButton
            onPress={() =>
              step === "select" ? setStep("update") : navigation.goBack()
            }
          >
            {step === "select" ? `Update ${selection.length} Dice` : "Done!"}
          </GradientButton>
        ) : (
          <OutlineButton
            disabled={step === "update" && dfuStatuses.length <= 1}
            onPress={() =>
              step === "update" ? showConfirmStop() : setStep("update")
            }
          >
            {step === "update" ? "Interrupt" : "Cancel Interrupt"}
          </OutlineButton>
        )}
        <ScrollView contentContainerStyle={{ paddingBottom: 10 }}>
          <PixelDfuStatusesContext.Provider value={statusesData}>
            <DiceList
              pixels={pixels}
              selection={selection}
              onSelectDie={(p) => {
                if (step === "select") {
                  setDfuStatuses((statuses) =>
                    statuses.findIndex((s) => s.pixel === p) >= 0
                      ? statuses.filter((s) => s.pixel !== p)
                      : [...statuses, { pixel: p, progress: 0 }]
                  );
                }
              }}
            />
          </PixelDfuStatusesContext.Provider>
        </ScrollView>
      </View>
    </View>
  );
}

export function FirmwareUpdateScreen({
  navigation,
}: FirmwareUpdateScreenProps) {
  const { pixels } = usePairedPixels();
  return (
    <AppBackground>
      <FirmwareUpdatePage navigation={navigation} pixels={pixels} />
    </AppBackground>
  );
}
