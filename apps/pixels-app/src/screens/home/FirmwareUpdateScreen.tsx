import { useActionSheet } from "@expo/react-native-action-sheet";
import React from "react";
import { ScrollView, View } from "react-native";
import { Button, Text, useTheme } from "react-native-paper";

import { useAppSelector } from "~/app/hooks";
import { AppBackground } from "~/components/AppBackground";
import { PageHeader } from "~/components/PageHeader";
import { PixelDfuList } from "~/components/PixelDfuList";
import { GradientButton } from "~/components/buttons";
import { DfuFilesInfo } from "~/features/dfu/DfuNotifier";
import {
  useBottomSheetPadding,
  useDfuFiles,
  useDfuNotifier,
  usePixelsCentral,
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

function useUpdateDice(): (
  pixelsIds: readonly number[],
  filesInfo: DfuFilesInfo,
  stopRequested?: () => boolean
) => Promise<void> {
  const central = usePixelsCentral();
  const dfuNotifier = useDfuNotifier();
  const updateBootloader = useAppSelector(
    (state) => state.appSettings.updateBootloader
  );
  return React.useCallback(
    async (
      pixelsIds: readonly number[],
      filesInfo: DfuFilesInfo,
      stopRequested?: () => boolean
    ) => {
      for (const pixelId of pixelsIds) {
        try {
          if (stopRequested?.()) {
            return;
          }
          const pixel = central.getPixel(pixelId);
          if (pixel && dfuNotifier.getDfuAvailability(pixelId) === "outdated") {
            await central.updatePixelAsync({
              pixel,
              bootloaderPath: updateBootloader
                ? filesInfo.bootloaderPath
                : undefined,
              firmwarePath: filesInfo.firmwarePath,
            });
          }
        } catch {
          // Error logged in PixelsCentral and notified as an event
        }
      }
    },
    [central, dfuNotifier, updateBootloader]
  );
}

function useIsUpdatingFirmware(): boolean {
  const central = usePixelsCentral();
  const [updating, setUpdating] = React.useState(!!central.pixelInDFU);
  React.useEffect(() => {
    const onPixelInDFU = () => setUpdating(!!central.pixelInDFU);
    onPixelInDFU();
    central.addEventListener("pixelInDFU", onPixelInDFU);
    return () => {
      central.removeEventListener("pixelInDFU", onPixelInDFU);
    };
  }, [central]);
  return updating;
}

function useOutdatedCount(): number {
  const dfuNotifier = useDfuNotifier();
  const [count, setCount] = React.useState(0);
  React.useEffect(() => {
    const onOutdated = () => setCount(dfuNotifier.outdatedPixels.length);
    onOutdated();
    dfuNotifier.addEventListener("outdatedPixels", onOutdated);
    return () => {
      dfuNotifier.removeEventListener("outdatedPixels", onOutdated);
    };
  }, [dfuNotifier]);
  return count;
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
  const updating = useIsUpdatingFirmware();
  const updateDice = useUpdateDice();
  const { dfuFilesInfo, dfuFilesError } = useDfuFiles();
  const [stopUpdating, setStopUpdating] = React.useState<() => void>();
  const cancelUpdating = useConfirmStopUpdatingActionSheet(
    () => stopUpdating?.()
  );
  const outdatedCount = useOutdatedCount();
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
      <ScrollView
        style={{ flex: 1, marginHorizontal: 20 }}
        contentContainerStyle={{ paddingBottom: bottom, gap: 20 }}
      >
        <Text variant="bodyLarge">
          We recommend to keep all dice up-to-date to ensure that they stay
          compatible with the app.
        </Text>
        <Text variant="bodyLarge">
          Keep the Pixels app opened and your dice near your device during the
          update process. They may stay in open chargers but avoid moving
          charger lids or other magnets as it may turn the dice off.
        </Text>
        {dfuFilesInfo ? (
          <GradientButton
            outline={updating}
            disabled={!outdatedCount}
            onPress={() => {
              if (updating) {
                cancelUpdating();
              } else if (outdatedCount) {
                let stop = false;
                setStopUpdating(() => () => (stop = true));
                updateDice(
                  pairedDice.map((d) => d.pixelId),
                  dfuFilesInfo,
                  () => stop
                );
              }
            }}
          >
            {updating
              ? "Stop Updating"
              : outdatedCount
                ? `Start Updating (${outdatedCount})`
                : "Done"}
          </GradientButton>
        ) : (
          <Text variant="bodyLarge">
            {dfuFilesError
              ? `Error reading firmware file: ${dfuFilesError}`
              : "Preparing firmware file..."}
          </Text>
        )}
        <PixelDfuList pairedDice={pairedDice} />
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
