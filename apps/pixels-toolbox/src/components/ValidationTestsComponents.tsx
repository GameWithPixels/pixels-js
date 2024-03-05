import { assert, assertNever, delay } from "@systemic-games/pixels-core-utils";
import {
  createDataSetForProfile,
  createLibraryProfile,
  PrebuildProfileName,
  PrebuildProfilesNames,
} from "@systemic-games/pixels-edit-animation";
import {
  BaseBoxProps,
  BaseHStack,
  BaseVStack,
  useVisibility,
} from "@systemic-games/react-native-base-components";
import {
  DfuCommunicationError,
  DfuState,
} from "@systemic-games/react-native-nordic-nrf5-dfu";
import {
  Central,
  Color,
  DiceUtils,
  Pixel,
  PixelColorway,
  PixelColorwayValues,
  PixelDieType,
  PixelDieTypeValues,
  PixelScanner,
  ScannedPixel,
} from "@systemic-games/react-native-pixels-connect";
import { Audio, AVPlaybackSource } from "expo-av";
import React from "react";
import { useTranslation, TFunction } from "react-i18next";
import { View } from "react-native";
import { Button, Menu, Text } from "react-native-paper";

import chimeSound from "!/sounds/chime.mp3";
import errorSound from "!/sounds/error.mp3";
import { useAppDispatch, useAppSelector } from "~/app/hooks";
import { ColorwayImage } from "~/components/ColorwayImage";
import { ProgressBar } from "~/components/ProgressBar";
import { SelectColorwayModal } from "~/components/SelectColorwayModal";
import { TaskChainComponent } from "~/components/TaskChainComponent";
import { areSameFirmwareDates } from "~/features/dfu/areSameFirmwareDates";
import { DfuFileInfo } from "~/features/dfu/getDfuFileInfo";
import { updateFirmware } from "~/features/dfu/updateFirmware";
import PixelDispatcher from "~/features/pixels/PixelDispatcher";
import {
  pixelResetAllSettings,
  pixelStopAllAnimations,
  pixelStoreValue,
  PixelValueStoreType,
} from "~/features/pixels/extensions";
import { getDefaultName } from "~/features/pixels/getDefaultName";
import { PrintStatus, printDieBoxLabelAsync } from "~/features/print";
import {
  selectCustomFirmwareAndProfile,
  selectProfileName,
  selectSkipBatteryLevel,
} from "~/features/store/validationSelectors";
import { setFactoryProfile } from "~/features/store/validationSettingsSlice";
import { createTaskStatusContainer } from "~/features/tasks/createTaskContainer";
import {
  TaskCanceledError,
  TaskFaultedError,
  TaskStatus,
} from "~/features/tasks/useTask";
import { useTaskChain } from "~/features/tasks/useTaskChain";
import { TaskComponentProps } from "~/features/tasks/useTaskComponent";
import { toLocaleDateTimeString } from "~/features/toLocaleDateTimeString";
import {
  AbortControllerWithReason,
  getBoardOrDie,
  getSequenceIndex,
  getSignalReason,
  isBoard,
  testTimeout,
  ValidationSequence,
  ValidationTests,
  withPromise,
  withTimeout,
  withTimeoutAndDisconnect,
} from "~/features/validation";

export function getPixelThroughDispatcher(scannedPixel: ScannedPixel): Pixel {
  // We use a PixelDispatcher to get our Pixel instance so to enable message logging
  return PixelDispatcher.getDispatcher(scannedPixel).pixel;
}

function printLabel(
  pixel: Pixel,
  dieType: PixelDieType,
  statusCallback: (status: PrintStatus | Error) => void
): void {
  printDieBoxLabelAsync(
    {
      pixelId: pixel.pixelId,
      name: pixel.name,
      colorway: pixel.colorway,
      dieType,
    },
    (status) => status !== "error" && statusCallback(status)
  ).catch(statusCallback);
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

function playSoundOnResult(result: TaskStatus) {
  if (result === "succeeded") {
    playSoundAsync(chimeSound);
  } else if (result === "canceled" || result === "faulted") {
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
      faces = [2, 3, 4];
      break;
    case "d6":
    case "d6pipped":
    case "d6fudge":
      faces = [2, 3, 6];
      break;
    case "d8":
      faces = [2, 4, 8];
      break;
    case "d10":
      faces = [1, 4, 0];
      break;
    case "d00":
      faces = [10, 40, 0];
      break;
    case "d12":
      faces = [3, 6, 12];
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
  t: TFunction,
  connect: (timeout: number) => Promise<void | Pixel>,
  disconnect: () => Promise<void | Pixel>
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
          throw new TaskFaultedError(
            t("connectionErrorTryAgain") + " " + String(error)
          );
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

async function scanForPixelWithTimeout(
  abortSignal: AbortSignal,
  t: TFunction,
  pixelId: number,
  timeout = 10000 // 10s
): Promise<ScannedPixel> {
  assert(pixelId, "Empty Pixel Id");

  // Setup scanner
  const scanner = new PixelScanner();
  scanner.scanFilter = (pixel: ScannedPixel) => pixel.pixelId === pixelId;
  scanner.minNotifyInterval = 0;

  // Wait until we find our Pixel or timeout
  const scannedPixel = await withPromise<ScannedPixel>(
    abortSignal,
    "scan",
    (resolve, reject) => {
      // Setup timeout
      const timeoutId = setTimeout(
        () =>
          reject(
            new TaskFaultedError(
              t("timeoutScanningTryAgainWithId", {
                id: pixelId.toString(16).padStart(8, "0"),
              })
            )
          ),
        timeout
      );
      // Setup our scan listener
      scanner.addEventListener("scannedPixels", (scannedPixels) => {
        const scannedPixel = scannedPixels[0];
        if (scannedPixel) {
          clearTimeout(timeoutId);
          resolve(scannedPixel);
        }
      });
      // Start scanning
      console.log(`Scanning for Pixel with id ${pixelId.toString(16)}`);
      scanner.startAsync();
    },
    () => scanner.stopAsync()
  );
  console.log(
    `Found Pixel with id ${pixelId.toString(16)}: ${scannedPixel.name}`
  );
  return scannedPixel;
}

async function storeValueChecked(
  pixel: Pixel,
  valueType: number,
  value: number,
  opt?: { allowNotPermitted?: boolean }
): Promise<void> {
  const result = await pixelStoreValue(pixel, valueType, value);
  if (result !== "success") {
    const msg = `Failed to store value, got response ${result}`;
    if (!opt?.allowNotPermitted || result !== "notPermitted") {
      throw new Error(msg);
    } else {
      console.log("Ignoring error: " + msg);
    }
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

export interface FactoryDfuFilesBundle {
  readonly bootloader?: DfuFileInfo;
  readonly firmware: DfuFileInfo;
  readonly date: Date;
}

export interface ValidationTestsSettings {
  readonly sequence: ValidationSequence;
  readonly dieType: PixelDieType;
  readonly dfuFilesBundle: FactoryDfuFilesBundle;
}

export interface ValidationTestProps extends TaskComponentProps {
  settings: ValidationTestsSettings;
  pixel: Pixel;
}

export type UpdateFirmwareStatus = "updating" | "success" | "error";

// Note: Pixel should be disconnected by parent component
export function UpdateFirmware({
  action,
  onTaskStatus,
  settings,
  pixelId,
  onPixelFound,
  onFirmwareUpdate,
}: Omit<ValidationTestProps, "pixel"> & {
  pixelId: number;
  onPixelFound?: (scannedPixel: ScannedPixel) => void;
  onFirmwareUpdate?: (status: UpdateFirmwareStatus) => void;
}) {
  const { t } = useTranslation();

  // Our Pixel
  const [scannedPixel, setScannedPixel] = React.useState<ScannedPixel>();

  // Firmware update state and progress
  const [dfuState, setDfuState] = React.useState<DfuState>();
  const [dfuProgress, setDfuProgress] = React.useState(0);

  const taskChain = useTaskChain(action, "UpdateFirmware")
    .withTask(
      React.useCallback(
        async (abortSignal) => {
          // Start scanning for our Pixel
          const scannedPixel = await scanForPixelWithTimeout(
            abortSignal,
            t,
            pixelId
          );
          setScannedPixel(scannedPixel);
          // Notify parent
          onPixelFound?.(scannedPixel);
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
            (timeout) =>
              Central.connectPeripheral(sysId, {
                timeout,
              }),
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
        // Get our Pixel and prepare for DFU
        const dfuTarget = scannedPixel;
        try {
          // Use firmware date from scanned data as it is the most up-to-date
          console.log(
            "Validation firmware build timestamp is",
            toLocaleDateTimeString(settings.dfuFilesBundle.date)
          );
          console.log(
            "On device firmware build timestamp is",
            toLocaleDateTimeString(dfuTarget.firmwareDate)
          );
          // Start DFU
          if (
            !areSameFirmwareDates(
              settings.dfuFilesBundle.date,
              dfuTarget.firmwareDate
            ) &&
            settings.dfuFilesBundle.date > dfuTarget.firmwareDate
          ) {
            onFirmwareUpdate?.("updating");
            // Prepare for updating firmware
            const blPath = settings.dfuFilesBundle.bootloader?.pathname;
            const fwPath = settings.dfuFilesBundle.firmware.pathname;
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
                throw new Error("Firmware update aborted");
              }
              onFirmwareUpdate?.("success");
            };
            // Update firmware
            try {
              await updateFW();
            } catch (error) {
              let lastError: any = error;
              if (dfuTarget.address && error instanceof DfuCommunicationError) {
                console.log(
                  "Error updating FW, trying again with BL address..."
                );
                setDfuState(undefined);
                setDfuProgress(0);
                // Switch to bootloader address (only available on Android)
                try {
                  await updateFW(dfuTarget.address + 1);
                  lastError = undefined;
                } catch (error) {
                  lastError = error;
                }
              }
              if (lastError) {
                onFirmwareUpdate?.("error");
                throw new TaskFaultedError(`${t("dfuErrorTryAgain")} ${error}`);
              }
            }
          } else {
            console.log("Skipping firmware update");
          }
        } finally {
          // Leave Pixel connected to save time on the next connected test
          //await Central.disconnectPeripheral(dfuTarget.systemId);
        }
      }, [scannedPixel, settings.dfuFilesBundle, onFirmwareUpdate, t]),
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
  pixelId,
  pixel,
  onPixelFound,
  ledCount,
  dieType,
}: Omit<ValidationTestProps, "pixel"> & {
  pixelId?: number;
  pixel?: Pixel;
  ledCount: number;
  dieType?: PixelDieType;
  onPixelFound?: (scannedPixel: ScannedPixel) => void;
  onFirmwareUpdate?: (status: UpdateFirmwareStatus) => void;
}) {
  const { t } = useTranslation();

  const [resolveUpdateDieTypePromise, setResolveUpdateDieTypePromise] =
    React.useState<(updateDieType: boolean) => void>();

  const taskChain = useTaskChain(action, "ConnectPixel")
    .withTask(
      React.useCallback(
        async (abortSignal) => {
          if (!pixel) {
            assert(pixelId, "No Pixel instance and no Pixel id");
            // Start scanning for our Pixel
            const scannedPixel = await scanForPixelWithTimeout(
              abortSignal,
              t,
              pixelId
            );
            // Notify parent
            onPixelFound?.(scannedPixel);
          }
        },
        [onPixelFound, pixel, pixelId, t]
      ),
      createTaskStatusContainer(t("bluetoothScan"))
    )
    .withTask(
      React.useCallback(async () => {
        if (ledCount <= 0) {
          throw new TaskFaultedError(
            t("invalidLedCountWithValue", { value: ledCount })
          );
        }
        // Check LED count
        if (ledCount !== DiceUtils.getLEDCount(settings.dieType)) {
          throw new TaskFaultedError(
            t("dieTypeMismatchWithTypeAndLedCount", {
              dieType: t(settings.dieType),
              ledCount,
            })
          );
        }
      }, [ledCount, settings.dieType, t]),
      createTaskStatusContainer(t("checkLEDCount"))
    )
    .withTask(
      React.useCallback(
        async (abortSignal) => {
          assert(pixel, "No Pixel instance");
          // Try to connect with a few attempts
          await repeatConnect(
            abortSignal,
            t,
            (timeout) => pixel.connect(timeout),
            () => pixel.disconnect()
          );
          // Make sure we don't have any animation playing
          await pixelStopAllAnimations(pixel);
        },
        [pixel, t]
      ),
      createTaskStatusContainer(t("connect"))
    )
    .withTask(
      React.useCallback(
        async (abortSignal) => {
          assert(pixel, "No Pixel instance");
          if (
            dieType &&
            dieType !== "unknown" &&
            dieType !== settings.dieType
          ) {
            const update = await withTimeoutAndDisconnect<boolean>(
              abortSignal,
              pixel,
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
              throw new TaskFaultedError(
                t("dieTypeMismatchWithExpectedAndReceived", {
                  expected: t(settings.dieType),
                  received: t(dieType),
                })
              );
            }
          }
        },
        [dieType, pixel, settings.dieType, t]
      ),
      createTaskStatusContainer({
        title: t("checkDieType"),
        children: (
          <>
            {dieType && resolveUpdateDieTypePromise && (
              <MessageYesNo
                message={t("updateDieTypeWithFromAndTo", {
                  from: t(dieType),
                  to: t(settings.dieType),
                })}
                hideButtons={!resolveUpdateDieTypePromise}
                onYes={() => resolveUpdateDieTypePromise(true)}
                onNo={() => resolveUpdateDieTypePromise(false)}
              />
            )}
          </>
        ),
      })
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
  const { t } = useTranslation();

  const setEmptyProfile = useAppSelector(selectCustomFirmwareAndProfile);
  const [progress, setProgress] = React.useState(-1);
  const taskChain = useTaskChain(action, "CheckBoard")
    .withTask(
      React.useCallback(async () => {
        await pixelResetAllSettings(pixel);
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
            createLibraryProfile("empty", settings.dieType)
          ).toDataSet(),
          setProgress
        );
      }, [pixel, settings.dieType]),
      createTaskStatusContainer({
        title: t("resetProfile"),
        children: <>{progress >= 0 && <ProgressBar percent={progress} />}</>,
      }),
      { skip: !setEmptyProfile }
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
  const { t } = useTranslation();

  const skipBatteryLevel = useAppSelector(selectSkipBatteryLevel);
  const taskChain = useTaskChain(action, "WaitCharging")
    .withTask(
      React.useCallback(
        async (abortSignal) =>
          ValidationTests.waitCharging(
            pixel,
            settings.dieType,
            !notCharging,
            notCharging ? Color.dimGreen : Color.dimOrange,
            abortSignal
          ),
        [notCharging, pixel, settings.dieType]
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
        if (!skipBatteryLevel && pixel.batteryLevel < 75) {
          throw new TaskCanceledError(
            "WaitCharging",
            t("lowBatteryPleaseCharge")
          );
        }
      }, [pixel, skipBatteryLevel, t]),
      createTaskStatusContainer(t("batteryLevel")),
      { skip: !notCharging || settings.sequence !== "dieFinal" }
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
            playSoundOnResult("succeeded");
          } finally {
            abortSignal.removeEventListener("abort", onAbort);
          }
        },
        [pixel, settings.sequence]
      ),
      createTaskStatusContainer({
        children: (
          <MessageYesNo
            message={t("areAllLEDsWhite", {
              count: pixel.ledCount,
            })}
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
  const { t } = useTranslation();

  const taskChain = useTaskChain(action, "WaitFaceUp")
    .withTask(
      React.useCallback(
        (abortSignal) =>
          ValidationTests.waitFaceUp(
            pixel,
            settings.dieType,
            getFaceUp(settings.dieType, "1"),
            Color.dimMagenta,
            abortSignal
          ),
        [pixel, settings.dieType]
      ),
      createTaskStatusContainer(t("placeBlinkingFaceUp"))
    )
    .withStatusChanged(playSoundOnResult)
    .withTask(
      React.useCallback(
        (abortSignal) =>
          ValidationTests.waitFaceUp(
            pixel,
            settings.dieType,
            getFaceUp(settings.dieType, "2"),
            Color.dimYellow,
            abortSignal
          ),
        [pixel, settings.dieType]
      ),
      createTaskStatusContainer(t("placeNewBlinkingFaceUp"))
    )
    .withStatusChanged(playSoundOnResult)
    .withTask(
      React.useCallback(
        (abortSignal) =>
          ValidationTests.waitFaceUp(
            pixel,
            settings.dieType,
            getFaceUp(settings.dieType, "3"),
            Color.dimCyan,
            abortSignal
          ),
        [pixel, settings.dieType]
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
  const { t } = useTranslation();

  const [resolveConfirmPromise, setResolveConfirmPromise] =
    React.useState<(keepSettings: boolean) => void>();
  const [resolveColorwayPromise, setResolveColorwayPromise] =
    React.useState<(colorway: PixelColorway) => void>();

  const storeTimestamp = React.useCallback(
    () =>
      storeValueChecked(
        pixel,
        PixelValueStoreType.ValidationTimestampStart +
          getSequenceIndex(settings.sequence),
        get24BitsTimestamp(),
        { allowNotPermitted: settings.sequence === "dieFinal" }
      ),
    [pixel, settings.sequence]
  );
  const storeDieType = React.useCallback(async () => {
    if (pixel.dieType !== settings.dieType) {
      console.log(
        `Storing die type: ${settings.dieType} (was ${pixel.dieType})`
      );
      const value = PixelDieTypeValues[settings.dieType];
      assert(value);
      await storeValueChecked(pixel, PixelValueStoreType.DieType, value);
    }
  }, [pixel, settings.dieType]);

  const onlyTimestamp = isBoard(settings.sequence);
  const taskChain = useTaskChain(action, "StoreSettings")
    .withTask(
      onlyTimestamp ? storeTimestamp : storeDieType,
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
                  "storeColorway",
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
                  PixelValueStoreType.Colorway,
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
  onPrintStatus: (status: PrintStatus | Error | undefined) => void;
}

export function PrepareDie({
  action,
  onTaskStatus,
  settings,
  pixel,
  onPrintStatus,
}: ValidationTestProps & Partial<PrintingProp>) {
  const { t } = useTranslation();

  const appDispatch = useAppDispatch();
  const selectProfile = useAppSelector(selectCustomFirmwareAndProfile);
  const profile = useAppSelector(selectProfileName);
  const setProfile = React.useCallback(
    (p: PrebuildProfileName) => appDispatch(setFactoryProfile(p)),
    [appDispatch]
  );

  const [resolveSelectProfilePromise, setResolveSelectProfilePromise] =
    React.useState<() => void>();
  const {
    visible: profileMenuVisible,
    show: showProfileMenu,
    hide: hideProfileMenu,
  } = useVisibility();

  const [progress, setProgress] = React.useState(-1);
  const taskChain = useTaskChain(action, "PrepareDie")
    .withTask(
      React.useCallback(
        (abortSignal) =>
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
      { skip: !selectProfile }
    )
    .withTask(
      React.useCallback(
        // Note: renaming die also reset profile to default
        async () => ValidationTests.renameDie(pixel, getDefaultName(pixel)),
        [pixel]
      ),
      createTaskStatusContainer(t("setDieName"))
    )
    .withTask(
      React.useCallback(async () => {
        console.log(`Programming profile: ${profile}`);
        // Update profile
        await ValidationTests.updateProfile(
          pixel,
          createDataSetForProfile(
            createLibraryProfile(profile, settings.dieType)
          ).toDataSet(),
          setProgress
        );
        // Start printing ahead of time
        if (onPrintStatus) {
          printLabel(pixel, settings.dieType, onPrintStatus);
        }
      }, [onPrintStatus, pixel, profile, settings.dieType]),
      createTaskStatusContainer({
        title: t("updateProfile"),
        children: <>{progress >= 0 && <ProgressBar percent={progress} />}</>,
      })
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

  return <TaskChainComponent title={t("prepareDie")} taskChain={taskChain} />;
}

export function WaitDieInCase({
  action,
  onTaskStatus,
  pixel,
}: ValidationTestProps) {
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
  settings,
  pixel,
  printResult,
  onPrintStatus,
}: ValidationTestProps &
  PrintingProp & {
    printResult: PrintStatus | Error | undefined;
  }) {
  const { t } = useTranslation();

  // Print result
  const [resolveResultPromise, setResolveResultPromise] =
    React.useState<() => void>();
  React.useEffect(() => {
    if (resolveResultPromise && printResult) {
      console.log(`Print result: ${printResult}`);
      if (printResult === "done" || printResult instanceof Error) {
        resolveResultPromise();
      }
    }
  }, [printResult, resolveResultPromise]);

  // Print check
  const [resolvePrintOkPromise, setResolvePrintOkPromise] =
    React.useState<(okOrError: boolean | Error) => void>();

  const printError = printResult instanceof Error ? printResult : undefined;

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
          if (!printOk && onPrintStatus) {
            console.log("Reprinting label");
            onPrintStatus(undefined);
            setReset(true);
            printLabel(pixel, settings.dieType, onPrintStatus);
          } else if (printOk instanceof Error) {
            throw printOk;
          }
        },
        [onPrintStatus, pixel, settings.dieType]
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
