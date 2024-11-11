import { useActionSheet } from "@expo/react-native-action-sheet";
import React from "react";
import { ScrollView, View } from "react-native";
import { ActivityIndicator, Button, Text, useTheme } from "react-native-paper";

import { useAppSelector } from "~/app/hooks";
import { FirmwareUpdateScreenProps } from "~/app/navigation";
import { AppBackground } from "~/components/AppBackground";
import { BluetoothStateWarning } from "~/components/BluetoothWarning";
import { DebugConnectionStatusesBar } from "~/components/DebugConnectionStatusesBar";
import { DfuFilesGate } from "~/components/DfuFilesGate";
import { PageHeader } from "~/components/PageHeader";
import { PixelDfuList } from "~/components/PixelDfuList";
import { GradientButton } from "~/components/buttons";
import {
  getKeepAllDiceUpToDate,
  getKeepDiceNearDevice,
} from "~/features/profiles";
import {
  useBottomSheetPadding,
  useIsAppUpdatingFirmware,
  useOutdatedPixelsCount,
  usePixelsCentral,
  useUpdateDice,
} from "~/hooks";

export function useConfirmStopUpdatingActionSheet(
  onConfirm?: () => void,
  onCancel?: () => void
): () => void {
  const { showActionSheetWithOptions } = useActionSheet();
  const { colors } = useTheme();
  return () => {
    showActionSheetWithOptions(
      {
        title: "Stop updating dice?",
        message:
          "The update process will stop after the current dice is finished updating.",
        options: ["Stop", "Continue"],
        destructiveButtonIndex: 0,
        cancelButtonIndex: 1,
        destructiveColor: colors.error,
        containerStyle: { backgroundColor: colors.background },
        titleTextStyle: { color: colors.onSurface },
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

function usePreventRemovingScreen(
  navigation: FirmwareUpdateScreenProps["navigation"],
  updating: boolean
) {
  React.useEffect(() => {
    if (updating) {
      const onRemove = (e: { preventDefault: () => void }) =>
        e.preventDefault();
      navigation.addListener("beforeRemove", onRemove);
      return () => {
        navigation.removeListener("beforeRemove", onRemove);
      };
    }
  }, [navigation, updating]);
}

function FirmwareUpdatePage({
  navigation,
}: {
  navigation: FirmwareUpdateScreenProps["navigation"];
}) {
  const pairedDice = useAppSelector((state) => state.pairedDice.paired);

  const central = usePixelsCentral();
  const [stopScan, setStopScan] = React.useState<() => void>();
  React.useEffect(() => {
    const stop = central.scanForPixels();
    setStopScan(() => stop);
    return stop;
  }, [central]);

  const updating = useIsAppUpdatingFirmware();
  const updateDice = useUpdateDice();
  const [stopRequester, setStopRequester] = React.useState<() => void>();
  const cancelUpdating = useConfirmStopUpdatingActionSheet(() =>
    stopRequester?.()
  );

  const outdatedCount = useOutdatedPixelsCount();

  usePreventRemovingScreen(navigation, updating);

  const bottom = useBottomSheetPadding();
  return (
    <View style={{ height: "100%", gap: 10 }}>
      <PageHeader
        rightElement={
          !updating
            ? () => <Button onPress={() => navigation.goBack()}>Close</Button>
            : undefined
        }
      >
        Update Dice Firmware
      </PageHeader>
      <DebugConnectionStatusesBar />
      <ScrollView
        alwaysBounceVertical={false}
        style={{ flex: 1, marginHorizontal: 20 }}
        contentContainerStyle={{ paddingBottom: bottom, gap: 20 }}
      >
        <BluetoothStateWarning>
          <Text variant="bodyLarge">{getKeepAllDiceUpToDate()}</Text>
          <Text variant="bodyLarge">
            {getKeepDiceNearDevice(pairedDice.length)}
          </Text>
          <DfuFilesGate>
            {({ dfuFilesInfo }) => (
              <GradientButton
                outline={updating}
                disabled={!outdatedCount || (updating && !stopRequester)}
                icon={() =>
                  updating && !stopRequester ? <ActivityIndicator /> : undefined
                }
                onPress={() => {
                  stopScan?.();
                  if (updating) {
                    cancelUpdating();
                  } else if (outdatedCount) {
                    let stop = false;
                    setStopRequester(() => () => {
                      stop = true;
                      setStopRequester(undefined);
                    });
                    updateDice(
                      pairedDice.map((d) => d.pixelId),
                      dfuFilesInfo,
                      { stopRequested: () => stop }
                    ).finally(() => {
                      setStopRequester(undefined);
                      // Reconnect to dice
                      for (const d of pairedDice) {
                        central.tryConnect(d.pixelId);
                      }
                    });
                  }
                }}
              >
                {updating
                  ? "Stop Updating"
                  : outdatedCount
                    ? `Start Updating`
                    : "All Dice Up-to-date"}
              </GradientButton>
            )}
          </DfuFilesGate>
          <PixelDfuList pairedDice={pairedDice} />
        </BluetoothStateWarning>
      </ScrollView>
    </View>
  );
}

export function FirmwareUpdateScreen({
  navigation,
}: FirmwareUpdateScreenProps) {
  return (
    <AppBackground>
      <FirmwareUpdatePage navigation={navigation} />
    </AppBackground>
  );
}
