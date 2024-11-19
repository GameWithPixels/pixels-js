import {
  FontAwesome5,
  MaterialCommunityIcons,
  MaterialIcons,
} from "@expo/vector-icons";
import {
  createTypedEventEmitter,
  TypedEventEmitter,
  unsigned32ToHex,
} from "@systemic-games/pixels-core-utils";
import { DfuState } from "@systemic-games/react-native-nordic-nrf5-dfu";
import {
  getDefaultPixelDeviceName,
  ScannedBootloaderNotifier,
} from "@systemic-games/react-native-pixels-connect";
import React from "react";
import { ScrollView, View } from "react-native";
import { ActivityIndicator, Button, Text, useTheme } from "react-native-paper";

import { useConfirmStopUpdatingActionSheet } from "./FirmwareUpdateScreen";

import { useAppSelector } from "~/app/hooks";
import { RestoreFirmwareScreenProps } from "~/app/navigation";
import { AppBackground } from "~/components/AppBackground";
import { BluetoothStateWarning } from "~/components/BluetoothWarning";
import { BouncingView } from "~/components/BouncingView";
import { DfuFilesGate } from "~/components/DfuFilesGate";
import { PageHeader } from "~/components/PageHeader";
import { GradientButton } from "~/components/buttons";
import { updateFirmware } from "~/features/dfu";
import { getKeepDiceNearDevice } from "~/features/profiles";
import { logError } from "~/features/utils";
import { useBottomSheetPadding, usePixelsCentral } from "~/hooks";

type DfuEventMap = Readonly<{
  onDfuState: Readonly<{ pixelId: number; state: DfuState }>;
  onDfuProgress: Readonly<{ pixelId: number; progress: number }>;
}>;

type DfuEvent = { dfuEvent: Omit<TypedEventEmitter<DfuEventMap>, "emit"> };

export const DfuEventContext = React.createContext<DfuEvent>({
  dfuEvent: createTypedEventEmitter<DfuEventMap>(),
});

// Modified version of the original `useUpdateDice()` function
export async function updateBootloaderDice(
  bootloaders: readonly ScannedBootloaderNotifier[],
  opt?: {
    bootloaderPath?: string;
    firmwarePath?: string;
    dfuStateCallback?: (ev: DfuEventMap["onDfuState"]) => void;
    dfuProgressCallback?: (ev: DfuEventMap["onDfuProgress"]) => void;
    maxAttempts?: number;
    stopRequested?: () => boolean;
  }
): Promise<number[]> {
  const failedIds: number[] = [];
  const idsToProcess = new Map(bootloaders.map((b) => [b.pixelId, b]));
  while (idsToProcess.size) {
    if (opt?.stopRequested?.()) {
      break;
    }
    const bootloader = idsToProcess.values().next()
      .value as ScannedBootloaderNotifier;
    const { pixelId } = bootloader;
    let attemptsCount = 0;
    while (true) {
      ++attemptsCount;
      try {
        console.log(
          `Recovering die in bootloader: ${unsigned32ToHex(pixelId)}`
        );
        await updateFirmware({
          systemId: bootloader.systemId,
          pixelId,
          bootloaderPath: opt?.bootloaderPath,
          firmwarePath: opt?.firmwarePath,
          dfuStateCallback: (state) =>
            opt?.dfuStateCallback?.({ pixelId, state }),
          dfuProgressCallback: (progress) =>
            opt?.dfuProgressCallback?.({ pixelId, progress }),
        });
        break;
      } catch (e) {
        logError(`DFU for die in bootloader error #${attemptsCount}: ${e}`);
        if (attemptsCount >= (opt?.maxAttempts ?? 3)) {
          failedIds.push(bootloader.pixelId);
          break;
        }
      }
    }
    // Remove id
    idsToProcess.delete(bootloader.pixelId);
  }
  if (failedIds.length) {
    console.warn(
      "Failed updating dice in bootloader: " +
        failedIds.map(unsigned32ToHex).join(", ")
    );
  }
  return failedIds;
}

function BootloaderItem({ notifier }: { notifier: ScannedBootloaderNotifier }) {
  // Watch RSSI
  const [rssi, setRssi] = React.useState(notifier.rssi);
  React.useEffect(() => {
    const onRssi = () => setRssi(notifier.rssi);
    onRssi();
    notifier.addPropertyListener("rssi", onRssi);
    return () => notifier.removePropertyListener("rssi", onRssi);
  }, [notifier]);
  const { colors } = useTheme();

  // DFU events callbacks
  const [dfuState, setDfuState] = React.useState<DfuState>();
  const [dfuProgress, setDfuProgress] = React.useState<number>();
  const { dfuEvent } = React.useContext(DfuEventContext);
  React.useEffect(() => {
    const onDfuState = ({ pixelId, state }: DfuEventMap["onDfuState"]) => {
      if (pixelId === notifier.pixelId) {
        setDfuState(state);
        // Reset progress when starting
        if (state === "starting") {
          setDfuProgress(0);
        }
      }
    };
    dfuEvent.addListener("onDfuState", onDfuState);
    const onDfuProgress = ({
      pixelId,
      progress,
    }: DfuEventMap["onDfuProgress"]) => {
      if (pixelId === notifier.pixelId) {
        setDfuProgress(progress);
      }
    };
    dfuEvent.addListener("onDfuProgress", onDfuProgress);
    return () => {
      dfuEvent.removeListener("onDfuState", onDfuState);
      dfuEvent.removeListener("onDfuProgress", onDfuProgress);
    };
  }, [dfuEvent, notifier.pixelId]);

  const updating =
    dfuState &&
    dfuState !== "completed" &&
    dfuState !== "aborted" &&
    dfuState !== "errored";
  return (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "space-between",
        paddingHorizontal: 20,
        paddingVertical: 10,
        gap: 10,
        borderWidth: 1,
        borderColor: colors.secondary,
        borderRadius: 10,
      }}
    >
      <View>
        <Text variant="bodyLarge">
          {getDefaultPixelDeviceName(notifier.pixelId)}
        </Text>
        <Text>
          {dfuState ? (
            `Updating: ${dfuState === "uploading" ? `uploading ${dfuProgress ?? 0}%` : dfuState}`
          ) : (
            <>
              <MaterialCommunityIcons name="signal" size={16} /> {rssi} dBm
            </>
          )}
        </Text>
      </View>
      <View style={{ alignSelf: "center" }}>
        {dfuState === "errored" ? (
          <FontAwesome5 name="exclamation-triangle" size={24} color="red" />
        ) : dfuState === "uploading" ? (
          <BouncingView>
            <FontAwesome5 name="download" size={24} color={colors.primary} />
          </BouncingView>
        ) : updating ? (
          <ActivityIndicator />
        ) : !dfuState ? (
          <FontAwesome5 name="download" size={24} color={colors.onSurface} />
        ) : (
          <MaterialIcons
            name="check-circle-outline"
            size={28}
            color="darkgreen"
          />
        )}
      </View>
    </View>
  );
}

function BootloadersList({
  bootloaders,
}: {
  bootloaders: ScannedBootloaderNotifier[];
}) {
  return (
    <>
      {bootloaders.map((notifier) => (
        <BootloaderItem key={notifier.pixelId} notifier={notifier} />
      ))}
    </>
  );
}

function RestoreFirmwarePage({
  navigation,
}: {
  navigation: RestoreFirmwareScreenProps["navigation"];
}) {
  const central = usePixelsCentral();
  const [stopScan, setStopScan] = React.useState<() => void>();
  React.useEffect(() => {
    const stop = central.scanForPixels();
    setStopScan(() => stop);
    return stop;
  }, [central]);

  const [stopRequester, setStopRequester] = React.useState<() => void>();
  const cancelUpdating = useConfirmStopUpdatingActionSheet(() =>
    stopRequester?.()
  );
  const [updateStep, setUpdateState] = React.useState<
    "scanning" | "updating" | "done"
  >("scanning");
  const updating = updateStep === "updating";

  const [bootloaders, setBootloaders] = React.useState<
    ScannedBootloaderNotifier[]
  >([]);
  const freezeListRef = React.useRef(false);
  React.useEffect(() => {
    if (updateStep === "scanning")
      return central.addListener(
        "onPixelBootloader",
        ({ status, notifier }) => {
          setBootloaders((prev) => {
            if (status === "scanned") {
              return prev.includes(notifier) ? prev : [...prev, notifier];
            } else {
              return prev.filter((b) => b !== notifier);
            }
          });
        }
      );
  }, [central, updateStep]);

  const dfuEvent = React.useState(createTypedEventEmitter<DfuEventMap>())[0];
  const updateBootloader = useAppSelector(
    (state) => state.appSettings.updateBootloader
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
        Restore Firmware
      </PageHeader>
      <ScrollView
        alwaysBounceVertical={false}
        style={{ flex: 1, marginHorizontal: 20 }}
        contentContainerStyle={{ paddingBottom: bottom, gap: 20 }}
      >
        <BluetoothStateWarning>
          <Text variant="bodyLarge">
            Only Pixels dice programmed with an incomplete or invalid firmware
            are shown.
          </Text>
          <Text variant="bodyLarge">
            {getKeepDiceNearDevice(bootloaders.length)}
          </Text>
          <DfuFilesGate>
            {({ dfuFilesInfo }) => (
              <GradientButton
                outline={updating}
                disabled={!bootloaders.length || (updating && !stopRequester)}
                icon={() =>
                  updating && !stopRequester ? <ActivityIndicator /> : undefined
                }
                onPress={() => {
                  stopScan?.();
                  freezeListRef.current = true;
                  if (updating) {
                    cancelUpdating();
                  } else if (updateStep === "done") {
                    navigation.goBack();
                  } else if (bootloaders.length) {
                    setUpdateState("updating");
                    let stop = false;
                    setStopRequester(() => () => {
                      stop = true;
                      setStopRequester(undefined);
                    });
                    updateBootloaderDice(bootloaders, {
                      bootloaderPath: updateBootloader
                        ? dfuFilesInfo.bootloaderPath
                        : undefined,
                      firmwarePath: dfuFilesInfo.firmwarePath,
                      dfuStateCallback: ({ pixelId, state }) => {
                        console.log(`DFU state: ${state}`);
                        dfuEvent.emit("onDfuState", { pixelId, state });
                      },
                      dfuProgressCallback: ({ pixelId, progress }) => {
                        dfuEvent.emit("onDfuProgress", { pixelId, progress });
                      },
                      stopRequested: () => stop,
                    }).finally(() => {
                      setUpdateState("done");
                      setStopRequester(undefined);
                    });
                  }
                }}
              >
                {updating
                  ? "Stop Updating"
                  : updateStep === "scanning"
                    ? `Start Updating`
                    : "Done"}
              </GradientButton>
            )}
          </DfuFilesGate>
          <DfuEventContext.Provider value={{ dfuEvent }}>
            <BootloadersList bootloaders={bootloaders} />
          </DfuEventContext.Provider>
        </BluetoothStateWarning>
      </ScrollView>
    </View>
  );
}

export function RestoreFirmwareScreen({
  navigation,
}: RestoreFirmwareScreenProps) {
  return (
    <AppBackground>
      <RestoreFirmwarePage navigation={navigation} />
    </AppBackground>
  );
}
