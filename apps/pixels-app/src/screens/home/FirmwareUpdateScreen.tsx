import { useActionSheet } from "@expo/react-native-action-sheet";
import { DfuState } from "@systemic-games/react-native-nordic-nrf5-dfu";
import { getPixel, Pixel } from "@systemic-games/react-native-pixels-connect";
import { makeAutoObservable, runInAction } from "mobx";
import { observer } from "mobx-react-lite";
import React from "react";
import { ScrollView, View } from "react-native";
import {
  Button,
  Text as PaperText,
  TextProps,
  useTheme,
} from "react-native-paper";
import { FadeIn, FadeOut } from "react-native-reanimated";

import { useAppSelector } from "~/app/hooks";
import { AppBackground } from "~/components/AppBackground";
import { PageHeader } from "~/components/PageHeader";
import { AnimatedText } from "~/components/animated";
import { AnimatedGradientButton, SelectionButton } from "~/components/buttons";
import { DieWireframe } from "~/components/icons";
import { updateFirmware } from "~/features/dfu/updateFirmware";
import { DfuPathnamesBundle } from "~/features/store/appDfuFilesSlice";
import { PairedDie } from "~/features/store/pairedDiceSlice";
import { useBottomSheetPadding, useDfuBundle, useForceUpdate } from "~/hooks";
import { FirmwareUpdateScreenProps } from "~/navigation";

function Text(props: Omit<TextProps<never>, "variant">) {
  return <PaperText variant="bodyLarge" {...props} />;
}

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

type ExtendedDfuState = DfuState | "pending" | "unknown";

interface TargetDfuStatus {
  pairedDie: PairedDie;
  state: ExtendedDfuState;
  progress: number;
}

async function updateDiceAsync(
  statuses: TargetDfuStatus[],
  dfuBundle: DfuPathnamesBundle,
  updateBootloader: boolean,
  onUpdated?: (target: TargetDfuStatus) => void
): Promise<void> {
  console.log(
    `DFU bundle date: ${new Date(dfuBundle.timestamp).toLocaleDateString()}`
  );
  let i = 0;
  while (i < statuses.length) {
    const targetStatus = statuses[i++];
    try {
      await updateFirmware({
        target: targetStatus.pairedDie,
        bootloaderPath: updateBootloader ? dfuBundle.bootloader : undefined,
        firmwarePath: dfuBundle.firmware,
        dfuStateCallback: (state: DfuState) =>
          runInAction(() => (targetStatus.state = state)),
        dfuProgressCallback: (progress: number) =>
          runInAction(() => (targetStatus.progress = progress)),
      });
      try {
        onUpdated?.(targetStatus);
      } catch {}
    } catch (e) {
      console.log(`DFU error with ${targetStatus.pairedDie.name}: ${e}`);
    }
  }
}

function getDfuStatusText(targetStatus: TargetDfuStatus): string {
  const state = targetStatus.state;
  return state === "unknown"
    ? "Not Connected"
    : state === "pending"
      ? "Update Required"
      : state === "completed"
        ? "Up-To-Date"
        : state === "aborted" || state === "errored"
          ? "Update Failed"
          : `State ${state}, ${targetStatus?.progress ?? 0}%`;
}

const DieInfo = observer(function DieInfo({
  targetStatus,
}: {
  targetStatus: TargetDfuStatus;
}) {
  return (
    <View style={{ flex: 1, justifyContent: "space-around" }}>
      <Text>{targetStatus.pairedDie.name}</Text>
      <PaperText>{getDfuStatusText(targetStatus)}</PaperText>
    </View>
  );
});

function getInitialDfuState(
  pixel?: Pixel,
  timestamp?: number
): ExtendedDfuState {
  if (!pixel) {
    return "unknown";
  }
  if (!timestamp || pixel.firmwareDate.getTime() >= timestamp) {
    return "completed";
  }
  return "pending";
}

function FirmwareUpdatePage({
  pixelId,
  navigation,
}: {
  pixelId?: number;
  navigation: FirmwareUpdateScreenProps["navigation"];
}) {
  // TODO we refresh every 3 seconds to pick up newly connected dice
  const forceUpdate = useForceUpdate();
  React.useEffect(() => {
    const id = setInterval(forceUpdate, 3000);
    return () => clearInterval(id);
  }, [forceUpdate]);

  // Get list of paired dice
  const allPairedDice = useAppSelector((state) => state.pairedDice.dice);

  // Build DFU statuses
  const [dfuBundle, error] = useDfuBundle();
  const targetStatusesRef = React.useRef(new Map<number, TargetDfuStatus>());
  const targetStatuses = React.useMemo(
    () =>
      allPairedDice
        .filter((d) => d.isPaired)
        .map((d) => {
          const target =
            targetStatusesRef.current.get(d.pixelId) ??
            makeAutoObservable({
              pairedDie: d,
              state: getInitialDfuState(
                getPixel(d.pixelId),
                dfuBundle?.timestamp
              ),
              progress: 0,
            } as TargetDfuStatus);
          targetStatusesRef.current.set(d.pixelId, target);
          return target;
        }),
    [allPairedDice, dfuBundle?.timestamp]
  );
  const [selection, setSelection] = React.useState<TargetDfuStatus[]>(() => {
    const targetStatus = targetStatusesRef.current.get(pixelId ?? 0);
    return targetStatus?.state === "pending" ? [targetStatus] : [];
  });

  // Update function
  const updateBootloader = useAppSelector(
    (state) => state.appSettings.updateBootloader
  );
  const [updating, setUpdating] = React.useState(false);
  const update = () => {
    if (dfuBundle) {
      setUpdating(true);
      updateDiceAsync([...selection], dfuBundle, updateBootloader, (t) =>
        setSelection((selection) => selection.filter((other) => other !== t))
      ).then(() => setUpdating(false));
    }
  };

  const pendingCount = targetStatuses.filter(
    (t) => t.state === "pending"
  ).length;
  const allUpdated = targetStatuses.every(
    (t) => t.state === "completed" || t.state === "unknown"
  );
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
        Select Dice to Update
      </PageHeader>
      <ScrollView
        style={{ flex: 1, marginHorizontal: 20 }}
        contentContainerStyle={{ paddingBottom: bottom, gap: 10 }}
      >
        <Text>
          We recommend to keep all dice up-to-date to ensure that they stay
          compatible with the app.
        </Text>
        <Text>
          Keep your dice near your device during the update process. They may
          stay in open chargers but avoid moving charger lids or other magnets
          as it may turn the dice off.
        </Text>
        <View style={{ height: 70, width: "100%", justifyContent: "center" }}>
          {!allUpdated ? (
            <AnimatedGradientButton
              exiting={FadeOut.duration(300)}
              disabled={updating || !pendingCount || !selection.length}
              onPress={update}
            >
              Update Selected {selection.length <= 1 ? "Die" : "Dice"}
            </AnimatedGradientButton>
          ) : (
            <AnimatedText
              entering={FadeIn.duration(300).delay(200)}
              variant="bodyLarge"
              style={{ alignSelf: "center" }}
            >
              {`Your${
                targetStatuses.filter((t) => t.state === "unknown").length
                  ? " connected"
                  : ""
              } ${
                targetStatuses.length <= 1 ? "die is" : "dice are"
              } up-to-date!`}
            </AnimatedText>
          )}
        </View>
        {dfuBundle ? (
          <View>
            {targetStatuses.map((t, i) => (
              <SelectionButton
                key={t.pairedDie.pixelId}
                icon={() => (
                  <DieWireframe dieType={t.pairedDie.dieType} size={40} />
                )}
                selected={selection.includes(t)}
                noTopBorder={i > 0}
                squaredTopBorder={i > 0}
                squaredBottomBorder={i < targetStatuses.length - 1}
                onPress={
                  t.state === "pending"
                    ? () =>
                        setSelection((selection) =>
                          selection.includes(t)
                            ? selection.filter((other) => other !== t)
                            : [...selection, t]
                        )
                    : undefined
                }
              >
                <DieInfo targetStatus={t} />
              </SelectionButton>
            ))}
          </View>
        ) : (
          <Text>
            {error ? `Error reading files: ${error}` : "Preparing files..."}
          </Text>
        )}
      </ScrollView>
    </View>
  );
}

export function FirmwareUpdateScreen({
  route: {
    params: { pixelId },
  },
  navigation,
}: FirmwareUpdateScreenProps) {
  return (
    <AppBackground>
      <FirmwareUpdatePage navigation={navigation} pixelId={pixelId} />
    </AppBackground>
  );
}
