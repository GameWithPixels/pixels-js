import {
  assert,
  assertNever,
  delay,
  unsigned32ToHex,
} from "@systemic-games/pixels-core-utils";
import {
  createDataSetForProfile,
  createLibraryProfile,
  PrebuildProfileName,
  PrebuildProfilesNames,
} from "@systemic-games/pixels-edit-animation";
import {
  DfuState,
  DfuUpdateError,
} from "@systemic-games/react-native-nordic-nrf5-dfu";
import {
  Central,
  Charger,
  Color,
  DiceUtils,
  Pixel,
  PixelColorway,
  PixelColorwayValues,
  PixelDieType,
  PixelDieTypeValues,
  PixelScanner,
  ScannedCharger,
  ScannedDevice,
  ScannedPixel,
} from "@systemic-games/react-native-pixels-connect";
import { Audio, AVPlaybackSource } from "expo-av";
import React from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { Button, Menu, Text } from "react-native-paper";

import { DiceSetImage } from "./DiceSetImage";

import chimeSound from "!/sounds/chime.mp3";
import errorSound from "!/sounds/error.mp3";
import { useAppDispatch, useAppSelector } from "~/app/hooks";
import { BaseBoxProps } from "~/components/BaseBox";
import { BaseHStack } from "~/components/BaseHStack";
import { BaseVStack } from "~/components/BaseVStack";
import { ColorwayImage } from "~/components/ColorwayImage";
import { ProgressBar } from "~/components/ProgressBar";
import { SelectColorwayModal } from "~/components/SelectColorwayModal";
import { TaskChainComponent } from "~/components/TaskChainComponent";
import { areSameFirmwareDates } from "~/features/dfu/areSameFirmwareDates";
import { updateFirmware } from "~/features/dfu/updateFirmware";
import PixelDispatcher from "~/features/pixels/PixelDispatcher";
import {
  pixelResetAllSettings,
  pixelStopAllAnimations,
  pixelStoreValue,
  PixelValueStoreType,
} from "~/features/pixels/extensions";
import {
  printDiceSetBoxLabelAsync,
  printDieBoxLabelAsync,
  PrintStatus,
} from "~/features/print";
import {
  selectCustomFirmwareAndProfile,
  selectProfileName,
  selectSkipBatteryLevel,
} from "~/features/store/validationSelectors";
import { setFactoryProfile } from "~/features/store/validationSettingsSlice";
import {
  createTaskStatusContainer,
  TaskAction,
  TaskComponentProps,
  TaskFaultedError,
  TaskStatus,
  useTaskChain as useTaskChainUntyped,
} from "~/features/tasks";
import { toLocaleDateTimeString } from "~/features/toLocaleDateTimeString";
import { useVisibility } from "~/features/useVisibility";
import {
  AbortControllerWithReason,
  ConnectionError,
  convertSendMessageError,
  DfuAbortedError,
  DeviceTypeMismatchError,
  FirmwareUpdateError,
  getBoardOrDie,
  getPixelValidationName,
  getSequenceIndex,
  getSignalReason,
  InvalidLedCountError,
  isBoard,
  LedCountMismatchError,
  LowBatteryError,
  ProductInfo,
  StoreValueError,
  TaskNames,
  testTimeout,
  ValidationDeviceSelection,
  ValidationSequence,
  ValidationTests,
  withPromise,
  withTimeout,
  withTimeoutAndDisconnect,
  DiceMisplacedError,
  isDieFinal,
} from "~/features/validation";
import { FactoryDfuFilesBundle } from "~/hooks/useFactoryDfuFilesBundle";

const useTaskChain: (
  action: TaskAction,
  name: (typeof TaskNames)[number]
) => ReturnType<typeof useTaskChainUntyped> = useTaskChainUntyped;

function printLabel(
  productInfo: ProductInfo,
  statusCallback: (_: {
    status: PrintStatus | Error;
    productInfo: ProductInfo;
  }) => void,
  opt?: { smallLabel?: boolean }
): void {
  if (productInfo.kind === "dieWithId") {
    printDieBoxLabelAsync(
      productInfo,
      1, // 1 copy
      {
        statusCallback: (status) =>
          status !== "error" && statusCallback({ status, productInfo }),
        smallLabel: opt?.smallLabel,
      }
    ).catch((e) => statusCallback({ status: e, productInfo }));
  } else if (productInfo.kind === "lcc") {
    printDiceSetBoxLabelAsync(
      productInfo,
      1, // 1 copy
      {
        statusCallback: (status) =>
          status !== "error" && statusCallback({ status, productInfo }),
      }
    ).catch((e) => statusCallback({ status: e, productInfo }));
  } else {
    throw new Error(
      `Unsupported product type for printing label: ${productInfo.kind}`
    );
  }
}

const soundMap = new Map<AVPlaybackSource, Audio.Sound>();

async function getSound(source: AVPlaybackSource): Promise<Audio.Sound> {
  let loadedSound = soundMap.get(source);
  if (!loadedSound) {
    const { sound } = await Audio.Sound.createAsync(source);
    soundMap.set(source, sound);
    loadedSound = sound;
  }
  return loadedSound;
}

async function playSoundAsync(source: AVPlaybackSource) {
  try {
    const sound = await getSound(source);
    await sound.setPositionAsync(0);
    return await sound.playAsync();
  } catch (e) {
    console.log(`Error playing sound: ${e}`);
  }
}

function playSoundOnResult({ status }: { status: TaskStatus }) {
  if (status === "succeeded") {
    playSoundAsync(chimeSound);
  } else if (status === "canceled" || status === "faulted") {
    playSoundAsync(errorSound);
  }
}

function getCoilOrDie(settings: ValidationTestsSettings): "coil" | "die" {
  const boardOrDie = getBoardOrDie(settings.sequence);
  return boardOrDie === "board" ? "coil" : boardOrDie;
}

function get24BitsTimestamp(): number {
  // Use the KickStarter date as our epoch
  const ksDate = new Date("Tue, 09 Mar 2021 17:00:00 GMT");
  return Math.floor((Date.now() - ksDate.getTime()) / 60000);
  // function from24BitsTimestamp(timestamp24bits: number): Date {
  //   return new Date(timestamp24bits * 60000 + ksDate.getTime())
  // }
}

// List of faces to test, last face is the one with the copper counter weight
function getFaceUp(dieType: PixelDieType, step: "1" | "2" | "3"): number {
  let faces: number[];
  switch (dieType) {
    case "d4":
      faces = [1, 2, 4];
      break;
    case "d6":
    case "d6pipped":
    case "d6fudge":
      faces = [2, 3, 6];
      break;
    case "d8":
      faces = [4, 2, 8];
      break;
    case "d10":
      faces = [1, 4, 0];
      break;
    case "d00":
      faces = [10, 40, 0];
      break;
    case "d12":
      faces = [6, 3, 12];
      break;
    case "d20":
      faces = [5, 10, 20];
      break;
    default:
      throw new Error(`Unsupported die type ${dieType}`);
  }
  assert(faces.length === 3, "getFaceUp: Need 3 faces");
  switch (step) {
    case "1":
      return faces[0];
    case "2":
      return faces[1];
    case "3":
      return faces[2];
    default:
      assertNever(step);
  }
}

async function repeatConnect(
  abortSignal: AbortSignal,
  t: ReturnType<typeof useTranslation>["t"],
  connect: (timeout: number) => Promise<unknown>,
  disconnect: () => Promise<unknown>
) {
  const onAbort = () => {
    disconnect().catch((error) =>
      console.log(`Error while disconnecting on abort: ${error}`)
    );
  };
  abortSignal.addEventListener("abort", onAbort);
  try {
    let retries = 1;
    while (!abortSignal.aborted)
      try {
        await connect(5000);
        break;
      } catch (error) {
        if (retries === 0) {
          throw new ConnectionError(error);
        }
        --retries;
        if (!abortSignal.aborted) {
          console.log(`Connection error: ${error}`);
          const delayMs = 2000;
          console.log(`Try connecting again in ${delayMs}ms...`);
          await delay(delayMs);
        }
      }
  } finally {
    abortSignal.removeEventListener("abort", onAbort);
  }
}

async function scanForPixelsDeviceWithTimeout(
  abortSignal: AbortSignal,
  t: ReturnType<typeof useTranslation>["t"],
  pixelId: number,
  timeout = 10000 // 10s
): Promise<ScannedDevice> {
  assert(pixelId, "Empty Pixel Id");

  // Setup scanner
  const scanner = new PixelScanner();
  scanner.scanFilter = (device: ScannedDevice) => device.pixelId === pixelId;
  scanner.minNotifyInterval = 0;

  // Wait until we find our Pixel or timeout
  const scannedPixel = await withPromise<ScannedDevice>(
    abortSignal,
    "scan",
    (resolve, reject) => {
      // Setup timeout
      const timeoutId = setTimeout(
        () =>
          reject(
            new TaskFaultedError(
              t("timeoutScanningTryAgainWithId", {
                id: unsigned32ToHex(pixelId),
              })
            )
          ),
        timeout
      );
      // Setup our scan listener
      scanner.addListener("scannedDevices", (scannedDevices) => {
        const scanned = scannedDevices[0];
        if (scanned) {
          clearTimeout(timeoutId);
          resolve(scanned);
        }
      });
      // Start scanning
      console.log(`Scanning for Pixel with id ${unsigned32ToHex(pixelId)}`);
      scanner.startAsync();
    },
    () => scanner.stopAsync()
  );
  console.log(
    `Found Pixel with id ${unsigned32ToHex(pixelId)}: ${scannedPixel.name}`
  );
  return scannedPixel;
}

async function updateFactoryFirmware(
  scannedPixel: ScannedPixel,
  dfuFilesBundle: FactoryDfuFilesBundle,
  setDfuState: (state: DfuState | undefined) => void,
  setDfuProgress: (progress: number) => void,
  onFirmwareUpdate?: (status: UpdateFirmwareStatus) => void,
  reconfigure?: boolean
): Promise<void> {
  // Get our Pixel and prepare for DFU
  // We're using the latest known firmware date (scannedPixel might be outdated)
  const dfuTarget = PixelDispatcher.getOrCreateDispatcher(scannedPixel);
  // Use firmware date from scanned data as it is the most up-to-date
  console.log(
    "Validation firmware build timestamp is",
    toLocaleDateTimeString(dfuFilesBundle.date)
  );
  console.log(
    "On device firmware build timestamp is",
    toLocaleDateTimeString(dfuTarget.firmwareDate)
  );
  // Start DFU
  if (
    !!reconfigure ||
    (!areSameFirmwareDates(dfuFilesBundle.date, dfuTarget.firmwareDate) &&
      dfuFilesBundle.date > dfuTarget.firmwareDate)
  ) {
    onFirmwareUpdate?.("updating");
    // Prepare for updating firmware
    const blPath = reconfigure
      ? undefined
      : dfuFilesBundle.bootloader?.pathname;
    const fwPath = reconfigure
      ? dfuFilesBundle.reconfigFirmware.pathname
      : dfuFilesBundle.firmware.pathname;
    const updateFW = async (blAddr?: number) => {
      let dfuState: DfuState | undefined;
      await updateFirmware(
        blAddr ?? dfuTarget,
        blPath,
        fwPath,
        (s) => {
          dfuState = s;
          setDfuState(s);
        },
        setDfuProgress,
        !!blAddr
      );
      if (dfuState === "aborted") {
        throw new DfuAbortedError();
      }
      onFirmwareUpdate?.("success");
    };
    // Update firmware
    try {
      await updateFW();
    } catch (error) {
      let recovered = false;
      if (dfuTarget.address && error instanceof DfuUpdateError) {
        console.warn(
          `Error updating FW, trying again with BL address: ${error}`
        );
        setDfuState(undefined);
        setDfuProgress(0);
        // Switch to bootloader address (only available on Android)
        try {
          await updateFW(dfuTarget.address + 1);
          recovered = true;
        } catch (e) {
          console.error(`Errored again updating FW: ${error}`);
        }
      }
      if (!recovered) {
        onFirmwareUpdate?.("error");
        // Throw the original error
        throw error;
      }
    }
  } else {
    console.log("Skipping firmware update");
  }
}

async function storeValueChecked(
  pixel: Pixel | Charger,
  valueType: number,
  value: number,
  opt?: { allowNotPermitted?: boolean }
): Promise<void> {
  try {
    const result = await pixelStoreValue(pixel, valueType, value);
    if (result !== "success") {
      if (!opt?.allowNotPermitted || result !== "notPermitted") {
        throw new StoreValueError(result, valueType);
      } else {
        console.log(
          `Ignoring store value permission error for value type ${valueType}`
        );
      }
    }
  } catch (error) {
    throw convertSendMessageError(pixel, error);
  }
}

interface MessageYesNoProps extends BaseBoxProps {
  message: string;
  onYes?: () => void;
  onNo?: () => void;
  hideButtons?: boolean;
}

function MessageYesNo({
  message,
  onYes,
  onNo,
  hideButtons: hideYesNo,
  ...props
}: MessageYesNoProps) {
  const { t } = useTranslation();
  return (
    <BaseVStack gap={10} {...props}>
      <Text variant="bodyLarge">{message}</Text>
      {!hideYesNo && (
        <BaseHStack gap={10}>
          <Button
            mode="contained-tonal"
            onPress={onYes}
            style={{ minWidth: 80 }}
          >
            {t("yes")}
          </Button>
          <Button
            mode="contained-tonal"
            onPress={onNo}
            style={{ minWidth: 80 }}
          >
            {t("no")}
          </Button>
        </BaseHStack>
      )}
    </BaseVStack>
  );
}

export type ValidationTestsSettings = Readonly<{
  sequence: ValidationSequence;
  deviceSelection: ValidationDeviceSelection;
  dfuFilesBundle: FactoryDfuFilesBundle;
}>;

export interface ValidationTestProps extends TaskComponentProps {
  settings: ValidationTestsSettings;
  pixel: Pixel | Charger;
}

export type UpdateFirmwareStatus = "updating" | "success" | "error";

// Note: Pixel should be disconnected by parent component
export function ScanAndUpdateFirmware({
  action,
  onTaskStatus,
  settings,
  pixelId,
  reconfigure,
  onPixelFound,
  onFirmwareUpdate,
}: Omit<ValidationTestProps, "pixel"> & {
  pixelId: number;
  reconfigure?: boolean;
  onPixelFound?: (scannedPixel: ScannedPixel | ScannedCharger) => void;
  onFirmwareUpdate?: (status: UpdateFirmwareStatus) => void;
}) {
  const { t } = useTranslation();

  // Our Pixel
  const [scannedPixel, setScannedPixel] = React.useState<
    ScannedPixel | ScannedCharger
  >();

  // Firmware update state and progress
  const [dfuState, setDfuState] = React.useState<DfuState>();
  const [dfuProgress, setDfuProgress] = React.useState(0);

  const taskChain = useTaskChain(action, "UpdateFirmware")
    .withTask(
      React.useCallback(
        async (abortSignal) => {
          // Start scanning for our Pixel
          const scanned = await scanForPixelsDeviceWithTimeout(
            abortSignal,
            t,
            pixelId
          );
          if (scanned.type === "die" || scanned.type === "charger") {
            setScannedPixel(scanned);
            // Notify parent
            onPixelFound?.(scanned);
          }
        },
        [onPixelFound, pixelId, t]
      ),
      createTaskStatusContainer(t("bluetoothScan"))
    )
    .withTask(
      React.useCallback(
        async (abortSignal) => {
          assert(scannedPixel, "No scanned Pixel");
          // Try to connect with a few attempts
          const sysId = scannedPixel.systemId;
          await repeatConnect(
            abortSignal,
            t,
            (timeout) => Central.connectPeripheral(sysId, timeout),
            () => Central.disconnectPeripheral(sysId)
          );
        },
        [scannedPixel, t]
      ),
      createTaskStatusContainer(t("connect"))
    )
    .withTask(
      React.useCallback(async () => {
        assert(scannedPixel, "No scanned Pixel");
        try {
          if (scannedPixel.type === "die") {
            await updateFactoryFirmware(
              scannedPixel,
              settings.dfuFilesBundle,
              setDfuState,
              setDfuProgress,
              onFirmwareUpdate,
              reconfigure
            );
          }
        } catch (error) {
          throw new FirmwareUpdateError(error);
        }
      }, [
        reconfigure,
        scannedPixel,
        settings.dfuFilesBundle,
        onFirmwareUpdate,
      ]),
      createTaskStatusContainer({
        title: t("firmwareUpdate"),
        children: (
          <>
            {dfuState && dfuState !== "completed" && (
              <Text variant="bodyLarge">
                {t("dfuStateWithStatus", {
                  status: t(dfuState),
                })}
              </Text>
            )}
            {dfuState === "uploading" && <ProgressBar percent={dfuProgress} />}
          </>
        ),
      })
    )
    .withStatusChanged(playSoundOnResult)
    .withStatusChanged(onTaskStatus);

  return (
    <TaskChainComponent title={t("firmwareUpdate")} taskChain={taskChain} />
  );
}

export function UpdateFirmware({
  action,
  onTaskStatus,
  settings,
  scannedPixel,
  onFirmwareUpdate,
}: Omit<ValidationTestProps, "pixel"> & {
  scannedPixel?: ScannedPixel | ScannedCharger;
  onFirmwareUpdate?: (status: UpdateFirmwareStatus) => void;
}) {
  assert(scannedPixel?.type !== "charger", "Only die can be updated");
  const { t } = useTranslation();

  // Firmware update state and progress
  const [dfuState, setDfuState] = React.useState<DfuState>();
  const [dfuProgress, setDfuProgress] = React.useState(0);

  const taskChain = useTaskChain(action, "UpdateFirmware")
    .withTask(
      React.useCallback(async () => {
        assert(scannedPixel, "No scanned Pixel");
        try {
          await updateFactoryFirmware(
            scannedPixel,
            settings.dfuFilesBundle,
            setDfuState,
            setDfuProgress,
            onFirmwareUpdate
          );
        } catch (error) {
          throw new FirmwareUpdateError(error);
        }
      }, [scannedPixel, settings.dfuFilesBundle, onFirmwareUpdate]),
      createTaskStatusContainer({
        title: t("firmwareUpdate"),
        children: (
          <>
            {dfuState && dfuState !== "completed" && (
              <Text variant="bodyLarge">
                {t("dfuStateWithStatus", {
                  status: t(dfuState),
                })}
              </Text>
            )}
            {dfuState === "uploading" && <ProgressBar percent={dfuProgress} />}
          </>
        ),
      })
    )
    .withStatusChanged(playSoundOnResult)
    .withStatusChanged(onTaskStatus);

  return (
    <TaskChainComponent title={t("firmwareUpdate")} taskChain={taskChain} />
  );
}

// Note: Pixel should be disconnected by parent component
export function ConnectPixel({
  action,
  onTaskStatus,
  settings,
  pixel,
  ledCount,
  deviceType,
}: ValidationTestProps & {
  ledCount?: number;
  deviceType?: PixelDieType | "lcc";
}) {
  const { t } = useTranslation();

  const settingsDeviceType =
    settings.deviceSelection.kind === "charger"
      ? "lcc"
      : settings.deviceSelection.dieType;
  const [resolveUpdateDieTypePromise, setResolveUpdateDieTypePromise] =
    React.useState<(updateDieType: boolean) => void>();

  const taskChain = useTaskChain(action, "ConnectPixel")
    .withTask(
      React.useCallback(async () => {
        if (ledCount !== undefined) {
          if (ledCount <= 0) {
            throw new InvalidLedCountError(ledCount);
          }
          // Check LED count
          if (
            settingsDeviceType === "lcc"
              ? ledCount !== 3
              : !DiceUtils.getLEDCountEx(settingsDeviceType).includes(ledCount)
          ) {
            throw new LedCountMismatchError(settingsDeviceType, ledCount);
          }
        }
      }, [ledCount, settingsDeviceType]),
      createTaskStatusContainer(t("checkLEDCount")),
      { skip: ledCount === undefined }
    )
    .withTask(
      React.useCallback(
        async (abortSignal) => {
          if (settingsDeviceType === "lcc" && deviceType !== "lcc") {
            // Can't update charger type
            throw new DeviceTypeMismatchError(
              settingsDeviceType,
              deviceType ?? "unknown"
            );
          } else if (
            deviceType &&
            deviceType !== "unknown" &&
            deviceType !== settingsDeviceType
          ) {
            const update = await withTimeout<boolean>(
              abortSignal,
              testTimeout,
              (abortSignal) =>
                withPromise<boolean>(
                  abortSignal,
                  "updateDieType",
                  (resolve) => {
                    setResolveUpdateDieTypePromise(() => resolve);
                  }
                )
            );
            if (!update) {
              throw new DeviceTypeMismatchError(settingsDeviceType, deviceType);
            }
          }
        },
        [deviceType, settingsDeviceType]
      ),
      createTaskStatusContainer({
        title: t("checkDieType"),
        children: (
          <>
            {deviceType && resolveUpdateDieTypePromise && (
              <MessageYesNo
                message={t("updateDieTypeWithFromAndTo", {
                  from: t(deviceType),
                  to: t(settingsDeviceType),
                })}
                hideButtons={!resolveUpdateDieTypePromise}
                onYes={() => resolveUpdateDieTypePromise(true)}
                onNo={() => resolveUpdateDieTypePromise(false)}
              />
            )}
          </>
        ),
      }),
      { skip: deviceType === undefined }
    )
    .withTask(
      React.useCallback(
        async (abortSignal) => {
          // Try to connect with a few attempts
          await repeatConnect(
            abortSignal,
            t,
            (timeout) => pixel.connect(timeout),
            () => pixel.disconnect()
          );
          // Make sure we don't have any animation playing
          try {
            if (pixel.type === "die") {
              await pixelStopAllAnimations(pixel);
            }
          } catch (error) {
            throw convertSendMessageError(pixel, error);
          }
        },
        [pixel, t]
      ),
      createTaskStatusContainer(t("connect"))
    )
    .withStatusChanged(playSoundOnResult)
    .withStatusChanged(onTaskStatus);

  return <TaskChainComponent title={t("connect")} taskChain={taskChain} />;
}

export function CheckBoard({
  action,
  onTaskStatus,
  settings,
  pixel,
}: ValidationTestProps) {
  const dieType =
    settings.deviceSelection.kind === "die" && settings.deviceSelection.dieType;
  assert(dieType, "CheckBoard not available for LCC");
  assert(pixel.type !== "charger", "CheckBoard not available for LCC");

  const { t } = useTranslation();

  const setEmptyProfileRef = React.useRef(
    useAppSelector(selectCustomFirmwareAndProfile) // May change during the test
  );
  const [progress, setProgress] = React.useState(-1);
  const taskChain = useTaskChain(action, "CheckBoard")
    .withTask(
      React.useCallback(async () => {
        try {
          await pixelResetAllSettings(pixel);
        } catch (error) {
          throw convertSendMessageError(pixel, error);
        }
      }, [pixel]),
      createTaskStatusContainer(t("clearSettings"))
    )
    .withTask(
      React.useCallback(
        () => ValidationTests.checkAccelerationValid(pixel),
        [pixel]
      ),
      createTaskStatusContainer(t("accelerometer"))
    )
    .withTask(
      React.useCallback(
        () => ValidationTests.checkBatteryVoltage(pixel),
        [pixel]
      ),
      createTaskStatusContainer(t("batteryVoltage"))
    )
    .withTask(
      React.useCallback(() => ValidationTests.checkRssi(pixel), [pixel]),
      createTaskStatusContainer(t("rssi")),
      { skip: isBoard(settings.sequence) }
    )
    .withTask(
      React.useCallback(async () => {
        // Set empty profile
        await ValidationTests.updateProfile(
          pixel,
          createDataSetForProfile(
            createLibraryProfile("empty", dieType)
          ).toDataSet(),
          setProgress
        );
      }, [pixel, dieType]),
      createTaskStatusContainer({
        title: t("resetProfile"),
        children: <>{progress >= 0 && <ProgressBar percent={progress} />}</>,
      }),
      { skip: !setEmptyProfileRef.current }
    )
    .withStatusChanged(playSoundOnResult)
    .withStatusChanged(onTaskStatus);

  return <TaskChainComponent title={t("checkBoard")} taskChain={taskChain} />;
}

export function WaitCharging({
  action,
  onTaskStatus,
  settings,
  pixel,
  notCharging,
}: ValidationTestProps & { notCharging?: boolean }) {
  assert(pixel.type !== "charger", "WaitCharging not available for LCC");
  const { t } = useTranslation();

  const dieFinal = isDieFinal(settings.sequence);
  const skipBatteryLevelRef = React.useRef(
    useAppSelector(selectSkipBatteryLevel) // May change during the test
  );
  const taskChain = useTaskChain(action, "WaitCharging")
    .withTask(
      React.useCallback(
        async (abortSignal) =>
          ValidationTests.waitCharging(
            pixel,
            !notCharging,
            isBoard(settings.sequence)
              ? false
              : notCharging
                ? Color.dimGreen
                : Color.dimOrange,
            abortSignal
          ),
        [notCharging, pixel, settings.sequence]
      ),
      createTaskStatusContainer({
        children: (
          <>
            <Text variant="bodyLarge">
              {t(
                notCharging
                  ? "removeFromChargerWithCoilOrDie"
                  : "placeOnChargerWithCoilOrDie",
                { coilOrDie: t(getCoilOrDie(settings)) }
              )}
            </Text>
          </>
        ),
      })
    )
    .withTask(
      React.useCallback(async () => {
        if (!skipBatteryLevelRef.current && pixel.batteryLevel < 75) {
          throw new LowBatteryError(pixel.batteryLevel);
        }
      }, [pixel]),
      createTaskStatusContainer(t("batteryLevel")),
      { skip: !notCharging || !dieFinal }
    )
    .withStatusChanged(playSoundOnResult)
    .withStatusChanged(onTaskStatus);

  return (
    <TaskChainComponent
      title={t(notCharging ? "waitNotCharging" : "waitCharging")}
      taskChain={taskChain}
    />
  );
}

export function CheckLEDs({
  action,
  onTaskStatus,
  settings,
  pixel,
}: ValidationTestProps) {
  assert(pixel.type !== "charger", "CheckLEDs not available for LCC");
  const { t } = useTranslation();

  const [resolvePromise, setResolvePromise] = React.useState<() => void>();
  const [userAbort, setUserAbort] = React.useState<() => void>();
  const taskChain = useTaskChain(action, "CheckLEDs")
    .withTask(
      React.useCallback(
        async (abortSignal) => {
          const abortController = new AbortControllerWithReason();
          setUserAbort(() => () => {
            abortController.abortWithReason(
              new Error("Some LEDs are not white")
            );
          });
          const onAbort = () => {
            abortController.abortWithReason(getSignalReason(abortSignal));
          };
          abortSignal.addEventListener("abort", onAbort);
          try {
            await ValidationTests.checkLEDsLitUp(
              pixel,
              isBoard(settings.sequence)
                ? new Color(0.03, 0.03, 0.03)
                : new Color(0.1, 0.1, 0.1),
              (resolve) => setResolvePromise(() => resolve),
              abortController.signal
            );
            playSoundOnResult({ status: "succeeded" });
          } finally {
            abortSignal.removeEventListener("abort", onAbort);
          }
        },
        [pixel, settings.sequence]
      ),
      createTaskStatusContainer({
        children: (
          <MessageYesNo
            message={t("areAllLEDsWhite")}
            hideButtons={!resolvePromise}
            onYes={() => resolvePromise?.()}
            onNo={() => userAbort?.()}
          />
        ),
      })
    )
    .withStatusChanged()
    .withStatusChanged(onTaskStatus);

  return <TaskChainComponent title={t("checkLEDs")} taskChain={taskChain} />;
}

export function WaitFaceUp({
  action,
  onTaskStatus,
  settings,
  pixel,
}: ValidationTestProps) {
  const dieType =
    settings.deviceSelection.kind === "die" && settings.deviceSelection.dieType;
  assert(dieType, "WaitFaceUp not available for LCC");
  assert(pixel.type !== "charger", "WaitFaceUp not available for LCC");
  const { t } = useTranslation();

  const taskChain = useTaskChain(action, "WaitFaceUp")
    .withTask(
      React.useCallback(
        (abortSignal) =>
          ValidationTests.waitFaceUp(
            pixel,
            dieType,
            getFaceUp(dieType, "1"),
            Color.dimMagenta,
            abortSignal
          ),
        [pixel, dieType]
      ),
      createTaskStatusContainer(t("placeBlinkingFaceUp"))
    )
    .withStatusChanged(playSoundOnResult)
    .withTask(
      React.useCallback(
        (abortSignal) =>
          ValidationTests.waitFaceUp(
            pixel,
            dieType,
            getFaceUp(dieType, "2"),
            Color.dimYellow,
            abortSignal
          ),
        [pixel, dieType]
      ),
      createTaskStatusContainer(t("placeNewBlinkingFaceUp"))
    )
    .withStatusChanged(playSoundOnResult)
    .withTask(
      React.useCallback(
        (abortSignal) =>
          ValidationTests.waitFaceUp(
            pixel,
            dieType,
            getFaceUp(dieType, "3"),
            Color.dimCyan,
            abortSignal
          ),
        [pixel, dieType]
      ),
      createTaskStatusContainer(t("placeNewBlinkingFaceUp"))
    )
    .withStatusChanged(playSoundOnResult)
    .withStatusChanged(onTaskStatus);

  return <TaskChainComponent title={t("waitFaceUp")} taskChain={taskChain} />;
}

export function StoreSettings({
  action,
  onTaskStatus,
  settings,
  pixel,
}: ValidationTestProps) {
  const dieType =
    settings.deviceSelection.kind === "die" && settings.deviceSelection.dieType;

  const { t } = useTranslation();

  const [resolveConfirmPromise, setResolveConfirmPromise] =
    React.useState<(keepSettings: boolean) => void>();
  const [resolveColorwayPromise, setResolveColorwayPromise] =
    React.useState<(colorway: PixelColorway) => void>();

  const storeTimestamp = React.useCallback(
    () =>
      storeValueChecked(
        pixel,
        PixelValueStoreType.validationTimestampStart +
          getSequenceIndex(settings.sequence),
        get24BitsTimestamp(),
        {
          allowNotPermitted: isDieFinal(settings.sequence),
        }
      ),
    [pixel, settings.sequence]
  );
  const storeDeviceType = React.useCallback(async () => {
    assert(pixel.type === "die", "Only die can store device type");
    if (dieType && pixel.dieType !== dieType) {
      console.log(`Storing new die type: ${dieType} (was ${pixel.dieType})`);
      const value = PixelDieTypeValues[dieType];
      assert(value);
      await storeValueChecked(pixel, PixelValueStoreType.dieType, value);
    }
  }, [pixel, dieType]);

  const onlyTimestamp = isBoard(settings.sequence) || !dieType;
  const taskChain = useTaskChain(action, "StoreSettings")
    .withTask(
      onlyTimestamp ? storeTimestamp : storeDeviceType,
      createTaskStatusContainer(
        t(onlyTimestamp ? "storeTimestamp" : "storeDieType")
      )
    )
    .withTask(
      React.useCallback(
        (abortSignal) =>
          withTimeoutAndDisconnect(
            abortSignal,
            pixel,
            testTimeout,
            async (abortSignal) => {
              let keepSettings = false;
              let colorway = pixel.colorway;
              if (colorway && colorway !== "unknown") {
                keepSettings = await withPromise(
                  abortSignal,
                  "storeColorway",
                  (resolve) => setResolveConfirmPromise(() => resolve),
                  () => setResolveConfirmPromise(undefined)
                );
              }
              if (!keepSettings) {
                colorway = await withPromise(
                  abortSignal,
                  "requestColorway",
                  (resolve) => setResolveColorwayPromise(() => resolve),
                  () => setResolveColorwayPromise(undefined)
                );
                console.log(`Selected colorway: ${colorway}`);
              }
              if (colorway !== "unknown" && colorway !== pixel.colorway) {
                console.log(
                  `Storing colorway: ${colorway} (was ${pixel.colorway})`
                );
                const value = PixelColorwayValues[colorway];
                assert(value);
                await storeValueChecked(
                  pixel,
                  PixelValueStoreType.colorway,
                  value
                );
              }
            }
          ),
        [pixel]
      ),
      createTaskStatusContainer({
        title: t("storeColorway"),
        children: (
          <BaseHStack gap={20}>
            {resolveConfirmPromise && (
              <>
                <ColorwayImage colorway={pixel.colorway} />
                <MessageYesNo
                  justifyContent="center"
                  message={t("keepColorway")}
                  onYes={() => resolveConfirmPromise(true)}
                  onNo={() => resolveConfirmPromise(false)}
                />
              </>
            )}
            <SelectColorwayModal
              visible={!!resolveColorwayPromise}
              onSelect={(c) => resolveColorwayPromise?.(c)}
              dismissable={false}
            />
          </BaseHStack>
        ),
      }),
      { skip: onlyTimestamp }
    )
    .withTask(storeTimestamp, createTaskStatusContainer(t("storeTimestamp")), {
      skip: onlyTimestamp,
    })
    .withStatusChanged(playSoundOnResult)
    .withStatusChanged(onTaskStatus);

  return (
    <TaskChainComponent title={t("storeSettings")} taskChain={taskChain} />
  );
}

export interface PrintingProp {
  onPrintStatus: (
    _: { status: PrintStatus | Error; productInfo: ProductInfo } | undefined
  ) => void;
}

export function PrepareDevice({
  action,
  onTaskStatus,
  settings,
  pixel,
  onPrintStatus,
}: ValidationTestProps & Partial<PrintingProp>) {
  const { t } = useTranslation();

  const settingsDeviceType =
    settings.deviceSelection.kind === "charger"
      ? "lcc"
      : settings.deviceSelection.dieType;

  const appDispatch = useAppDispatch();
  const selectProfileRef = React.useRef(
    useAppSelector(selectCustomFirmwareAndProfile) // May change during the test
  );
  const profile = useAppSelector(selectProfileName);
  const setProfile = React.useCallback(
    (p: PrebuildProfileName) => appDispatch(setFactoryProfile(p)),
    [appDispatch]
  );

  const [resolveSelectProfilePromise, setResolveSelectProfilePromise] =
    React.useState<() => void>();
  const [resolveIsSetReadyPromise, setResolveIsSetReadyPromise] =
    React.useState<(ready: boolean | undefined) => void>();
  const {
    visible: profileMenuVisible,
    show: showProfileMenu,
    hide: hideProfileMenu,
  } = useVisibility();

  const smallLabel = useAppSelector(
    (state) => state.validationSettings.dieLabel.smallLabel
  );
  const [progress, setProgress] = React.useState(-1);
  const taskChain = useTaskChain(action, "PrepareDevice")
    .withTask(
      React.useCallback(
        async (abortSignal) =>
          withTimeoutAndDisconnect(
            abortSignal,
            pixel,
            60 * 60 * 1000, // 1h timeout
            (abortSignal) =>
              withPromise(
                abortSignal,
                "selectProfile",
                (resolve) => setResolveSelectProfilePromise(() => resolve),
                () => setResolveSelectProfilePromise(undefined)
              )
          ),
        [pixel]
      ),
      createTaskStatusContainer({
        title: t("selectProfile"),
        children: (
          <BaseHStack w="100%" flex={1} gap={20}>
            <View style={{ flex: 1 }}>
              <Menu
                visible={profileMenuVisible}
                onDismiss={hideProfileMenu}
                anchorPosition="top"
                anchor={
                  <Button mode="outlined" onPress={showProfileMenu}>
                    {profile}
                  </Button>
                }
              >
                {PrebuildProfilesNames.map((p) => (
                  <Menu.Item
                    key={p}
                    title={p}
                    onPress={() => {
                      setProfile(p);
                      hideProfileMenu();
                    }}
                  />
                ))}
              </Menu>
            </View>
            <Button
              mode="contained-tonal"
              onPress={resolveSelectProfilePromise}
            >
              {t("ok")}
            </Button>
          </BaseHStack>
        ),
      }),
      { skip: settingsDeviceType === "lcc" || !selectProfileRef.current }
    )
    .withTask(
      React.useCallback(
        async (abortSignal) => {
          const ready = await withTimeoutAndDisconnect<boolean>(
            abortSignal,
            pixel,
            60 * 60 * 1000, // 1h timeout
            (abortSignal) =>
              withPromise(
                abortSignal,
                "confirmSetReady",
                (resolve) => setResolveIsSetReadyPromise(() => resolve),
                () => setResolveIsSetReadyPromise(undefined)
              )
          );
          if (!ready) {
            throw new DiceMisplacedError();
          }
        },
        [pixel]
      ),
      createTaskStatusContainer({
        title: t("confirmAllDiceProperlyPlaced"),
        children: (
          <BaseVStack w="100%" alignItems="center" gap={20}>
            {settings.deviceSelection.kind === "charger" && (
              <DiceSetImage
                setType={settings.deviceSelection.setType}
                colorway={settings.deviceSelection.colorway}
              />
            )}
            <BaseHStack w="100%" justifyContent="space-around">
              <Button
                mode="outlined"
                onPress={() => resolveIsSetReadyPromise?.(false)}
              >
                {t("cancel")}
              </Button>
              <Button
                mode="contained-tonal"
                onPress={() => resolveIsSetReadyPromise?.(true)}
              >
                {t("ok")}
              </Button>
            </BaseHStack>
          </BaseVStack>
        ),
      }),
      { skip: settingsDeviceType !== "lcc" }
    )
    .withTask(
      React.useCallback(
        // Note: renaming die also reset profile to default
        async () => {
          await ValidationTests.renamePixelsDevice(
            pixel,
            getPixelValidationName(settingsDeviceType)
          );
          // Start printing ahead of time
          if (onPrintStatus && settings.deviceSelection.kind === "charger") {
            const productInfo = {
              kind: "lcc",
              name: pixel.name,
              type: settings.deviceSelection.setType,
              colorway: settings.deviceSelection.colorway,
            } as const;
            printLabel(productInfo, onPrintStatus, { smallLabel });
          }
        },
        [
          onPrintStatus,
          pixel,
          settings.deviceSelection,
          settingsDeviceType,
          smallLabel,
        ]
      ),
      createTaskStatusContainer(t("setDeviceName"))
    )
    .withTask(
      React.useCallback(async () => {
        assert(pixel.type === "die");
        console.log(`Programming profile: ${profile}`);
        // Update profile
        await ValidationTests.updateProfile(
          pixel,
          createDataSetForProfile(
            createLibraryProfile(profile, pixel.dieType)
          ).toDataSet(),
          setProgress
        );
        // Start printing ahead of time
        if (onPrintStatus) {
          const productInfo = {
            kind: "dieWithId",
            pixelId: pixel.pixelId,
            name: pixel.name,
            type: pixel.dieType,
            colorway: pixel.colorway,
          } as const;
          printLabel(productInfo, onPrintStatus, { smallLabel });
        }
      }, [onPrintStatus, pixel, profile, smallLabel]),
      createTaskStatusContainer({
        title: t("updateProfile"),
        children: <>{progress >= 0 && <ProgressBar percent={progress} />}</>,
      }),
      { skip: settingsDeviceType === "lcc" }
    )
    .withTask(
      React.useCallback(
        () => ValidationTests.exitValidationMode(pixel),
        [pixel]
      ),
      createTaskStatusContainer(t("exitValidationMode"))
    )
    .withTask(
      React.useCallback(
        (abortSignal) =>
          ValidationTests.waitDisconnected(
            pixel,
            isBoard(settings.sequence) ? new Color(0, 0.01, 0) : Color.dimGreen,
            abortSignal,
            10000 // 10s timeout
          ),
        [pixel, settings.sequence]
      ),
      createTaskStatusContainer(t("waitingDeviceDisconnect"))
    )
    .withStatusChanged(playSoundOnResult)
    .withStatusChanged(onTaskStatus);

  return (
    <TaskChainComponent title={t("prepareDevice")} taskChain={taskChain} />
  );
}

export function WaitDieInCase({
  action,
  onTaskStatus,
  pixel,
}: ValidationTestProps) {
  assert(pixel.type !== "charger", "WaitDieInCase not available for LCC");
  const { t } = useTranslation();

  const taskChain = useTaskChain(action, "WaitDieInCase")
    .withTask(
      React.useCallback(
        (abortSignal) =>
          ValidationTests.waitDisconnected(pixel, Color.dimGreen, abortSignal),
        [pixel]
      ),
      createTaskStatusContainer({
        children: (
          <Text variant="bodyLarge">{t("placeDieInCaseAndCloseLid")}</Text>
        ),
      })
    )
    .withStatusChanged(playSoundOnResult)
    .withStatusChanged(onTaskStatus);

  return (
    <TaskChainComponent title={t("waitDieInCase")} taskChain={taskChain} />
  );
}

export function LabelPrinting({
  action,
  onTaskStatus,
  printResult,
  onPrintStatus,
}: TaskComponentProps &
  PrintingProp & {
    printResult:
      | { status: PrintStatus | Error; productInfo: ProductInfo }
      | undefined;
  }) {
  const { t } = useTranslation();

  // Print result
  const [resolveResultPromise, setResolveResultPromise] =
    React.useState<() => void>();
  React.useEffect(() => {
    if (resolveResultPromise && printResult) {
      console.log(`Print result: ${JSON.stringify(printResult)}`);
      if (
        printResult.status === "done" ||
        printResult.status instanceof Error
      ) {
        resolveResultPromise();
      }
    }
  }, [printResult, resolveResultPromise]);

  // Print check
  const [resolvePrintOkPromise, setResolvePrintOkPromise] =
    React.useState<(okOrError: boolean | Error) => void>();

  const printError =
    printResult?.status instanceof Error ? printResult.status : undefined;

  // Reset task chain
  const [reset, setReset] = React.useState(false);
  React.useEffect(() => setReset(false), [reset]);

  const taskChain = useTaskChain(reset ? "reset" : action, "LabelPrinting")
    .withTask(
      React.useCallback(
        (abortSignal) =>
          withTimeout(abortSignal, testTimeout, (abortSignal) =>
            withPromise<void>(
              abortSignal,
              "labelPrinting",
              (resolve) => setResolveResultPromise(() => resolve),
              () => setResolveResultPromise(undefined)
            )
          ),
        []
      ),
      createTaskStatusContainer(t("waitingOnPrint"))
    )
    .withStatusChanged(playSoundOnResult)
    .withTask(
      React.useCallback(
        async (abortSignal) => {
          const printOk = await withPromise<boolean | Error>(
            abortSignal,
            "labelPrinting",
            (resolve) => setResolvePrintOkPromise(() => resolve)
          );
          if (!printOk && onPrintStatus && printResult?.productInfo) {
            console.log("Reprinting label");
            onPrintStatus(undefined);
            setReset(true);
            printLabel(printResult.productInfo, onPrintStatus);
          } else if (printOk instanceof Error) {
            throw printOk;
          }
        },
        [onPrintStatus, printResult?.productInfo]
      ),
      createTaskStatusContainer({
        children: (
          <>
            {printError && (
              <Text>
                {t("errorPrintingLabel") +
                  t("colonSeparator") +
                  printError.message}
              </Text>
            )}
            <MessageYesNo
              message={t(
                printError ? "tryPrintingLabelAgain" : "isLabelPrinted"
              )}
              hideButtons={!resolvePrintOkPromise}
              onYes={() => resolvePrintOkPromise?.(!printError)}
              onNo={() => resolvePrintOkPromise?.(printError ?? false)}
            />
          </>
        ),
      })
    )
    .withStatusChanged(onTaskStatus);

  return (
    <TaskChainComponent title={t("labelPrinting")} taskChain={taskChain} />
  );
}

export function TurnOffDevice({
  action,
  onTaskStatus,
  settings,
  pixel,
}: ValidationTestProps) {
  const { t } = useTranslation();

  const taskChain = useTaskChain(action, "TurnOffDevice")
    .withTask(
      React.useCallback(() => pixel.turnOff(), [pixel]),
      createTaskStatusContainer(t("turningOff"))
    )
    .withTask(
      React.useCallback(
        (abortSignal) =>
          ValidationTests.waitDisconnected(
            pixel,
            isBoard(settings.sequence)
              ? new Color(0.003, 0.01, 0)
              : new Color(0.03, 0.1, 0),
            abortSignal,
            10000 // 10s timeout
          ),
        [pixel, settings.sequence]
      ),
      createTaskStatusContainer(t("waitingDeviceDisconnect"))
    )
    .withStatusChanged(playSoundOnResult)
    .withStatusChanged(onTaskStatus);

  return (
    <TaskChainComponent title={t("waitForShutdown")} taskChain={taskChain} />
  );
}
