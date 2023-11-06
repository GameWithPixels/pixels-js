import { assert, assertNever, delay } from "@systemic-games/pixels-core-utils";
import {
  BaseBoxProps,
  BaseHStack,
  BaseVStack,
} from "@systemic-games/react-native-base-components";
import {
  DfuCommunicationError,
  DfuState,
} from "@systemic-games/react-native-nordic-nrf5-dfu";
import {
  Central,
  Color,
  getLEDCount,
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
import { Button, Text } from "react-native-paper";

import chimeSound from "!/sounds/chime.mp3";
import errorSound from "!/sounds/error.mp3";
import { store } from "~/app/store";
import { ColorwayImage } from "~/components/ColorwayImage";
import { ProgressBar } from "~/components/ProgressBar";
import { SelectColorwayModal } from "~/components/SelectColorwayModal";
import { TaskChainComponent } from "~/components/TaskChainComponent";
import DfuFilesBundle from "~/features/dfu/DfuFilesBundle";
import { areSameFirmwareDates } from "~/features/dfu/areSameFirmwareDates";
import { unzipFactoryDfuFilesAsync } from "~/features/dfu/unzip";
import { updateFirmware } from "~/features/dfu/updateFirmware";
import PixelDispatcher from "~/features/pixels/PixelDispatcher";
import {
  pixelClearSettings,
  pixelStopAllAnimations,
  pixelStoreValue,
  PixelValueStoreType,
} from "~/features/pixels/extensions";
import { getDefaultProfile } from "~/features/pixels/getDefaultProfile";
import { PrintStatus, printDieBoxLabelAsync } from "~/features/print";
import { createTaskStatusContainer } from "~/features/tasks/createTaskContainer";
import { TaskFaultedError, TaskStatus } from "~/features/tasks/useTask";
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
function getFaceUp(pixel: Pixel, step: "1" | "2" | "3"): number {
  let faces: number[];
  switch (pixel.dieType) {
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
      throw new Error(
        `Unsupported die type ${pixel.dieType} (${pixel.ledCount} LEDs)`
      );
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
  if (!pixelId) {
    throw new TaskFaultedError("Empty Pixel Id");
  }

  // Setup scanner
  const scanner = new PixelScanner();
  scanner.scanFilter = (pixel: ScannedPixel) => pixel.pixelId === pixelId;

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
      scanner.scanListener = () => {
        const scannedPixel = scanner.scannedPixels[0];
        if (scannedPixel) {
          clearTimeout(timeoutId);
          resolve(scannedPixel);
        }
      };
      // Start scanning
      console.log(`Scanning for Pixel with id ${pixelId.toString(16)}`);
      scanner.start();
    },
    () => scanner.stop()
  );
  console.log(
    `Found Pixel with id ${pixelId.toString(16)}: ${scannedPixel.name}`
  );
  return scannedPixel;
}

function getSelectedDfuFilesBundle(): DfuFilesBundle {
  const { selected, available } = store.getState().dfuBundles;
  const files = available[selected];
  if (!files) {
    throw new Error();
  }
  return DfuFilesBundle.create(files);
}

async function storeValueChecked(
  pixel: Pixel,
  valueType: number,
  value: number
): Promise<void> {
  const result = await pixelStoreValue(pixel, valueType, value);
  if (result !== "success") {
    throw new Error(`Failed to store value, got response ${result}`);
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

export interface ValidationTestsSettings {
  sequence: ValidationSequence;
  dieType: PixelDieType;
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
  pixelId,
  useSelectedFirmware,
  onPixelFound,
  onFirmwareUpdate,
}: Omit<ValidationTestProps, "pixel"> & {
  pixelId: number;
  useSelectedFirmware: boolean;
  onPixelFound?: (scannedPixel: ScannedPixel) => void;
  onFirmwareUpdate?: (status: UpdateFirmwareStatus) => void;
}) {
  const { t } = useTranslation();

  // Our Pixel
  const [scannedPixel, setScannedPixel] = React.useState<ScannedPixel>();

  // Firmware update state and progress
  const [dfuState, setDfuState] = React.useState<DfuState>();
  const [dfuProgress, setDfuProgress] = React.useState(0);

  const taskChain = useTaskChain(action)
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
          if (!scannedPixel) {
            throw new TaskFaultedError("No scanned Pixel");
          }
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
        // Get our Pixel and prepare for DFU
        if (!scannedPixel) {
          throw new TaskFaultedError("No scanned Pixel");
        }
        const dfuTarget = scannedPixel;
        try {
          // Get the DFU files bundles from the zip file
          const dfuBundle = useSelectedFirmware
            ? getSelectedDfuFilesBundle()
            : DfuFilesBundle.create({
                pathnames: await unzipFactoryDfuFilesAsync(),
              });
          if (!dfuBundle.bootloader) {
            throw new TaskFaultedError(
              "DFU bootloader file not found or problematic"
            );
          }
          if (!dfuBundle.firmware) {
            throw new TaskFaultedError(
              "DFU firmware file not found or problematic"
            );
          }
          console.log(
            "DFU files loaded, firmware/bootloader build date is",
            toLocaleDateTimeString(dfuBundle.date)
          );
          // Use firmware date from scanned data as it is the most up-to-date
          console.log(
            "On device firmware build timestamp is",
            toLocaleDateTimeString(dfuTarget.firmwareDate)
          );
          // Start DFU
          if (
            !areSameFirmwareDates(dfuBundle.date, dfuTarget.firmwareDate) &&
            dfuBundle.date > dfuTarget.firmwareDate
          ) {
            onFirmwareUpdate?.("updating");
            // Prepare for updating firmware
            const blPath = dfuBundle.bootloader.pathname;
            const fwPath = dfuBundle.firmware.pathname;
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
      }, [scannedPixel, useSelectedFirmware, onFirmwareUpdate, t]),
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

  const taskChain = useTaskChain(action)
    .withTask(
      React.useCallback(
        async (abortSignal) => {
          if (!pixel) {
            if (!pixelId) {
              throw new TaskFaultedError("No Pixel instance and no Pixel id");
            }
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
          throw new TaskFaultedError(`Invalid LED count: ${ledCount}`);
        }
        // Check LED count
        if (ledCount !== getLEDCount(settings.dieType)) {
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
          if (
            dieType &&
            dieType !== "unknown" &&
            dieType !== settings.dieType
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
              throw new TaskFaultedError(
                t("dieTypeMismatchWithExpectedAndReceived", {
                  expected: t(settings.dieType),
                  received: t(dieType),
                })
              );
            }
          }
        },
        [dieType, settings.dieType, t]
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
    .withTask(
      React.useCallback(
        async (abortSignal) => {
          if (!pixel) {
            throw new TaskFaultedError("No Pixel instance");
          }
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
    .withStatusChanged(playSoundOnResult)
    .withStatusChanged(onTaskStatus);

  return <TaskChainComponent title={t("connect")} taskChain={taskChain} />;
}

export function CheckBoard({
  action,
  onTaskStatus,
  settings,
  pixel,
  firmwareUpdated,
}: ValidationTestProps & {
  firmwareUpdated: boolean;
}) {
  const { t } = useTranslation();

  const taskChain = useTaskChain(action)
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
        if (firmwareUpdated) {
          await pixelClearSettings(pixel);
        }
      }, [pixel, firmwareUpdated]),
      createTaskStatusContainer(t("clearSettings"))
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

  const taskChain = useTaskChain(action)
    .withTask(
      React.useCallback(
        async (abortSignal) =>
          ValidationTests.waitCharging(
            pixel,
            !notCharging,
            notCharging ? Color.dimGreen : Color.dimOrange,
            abortSignal
          ),
        [notCharging, pixel]
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
        if (pixel.batteryLevel < 50) {
          throw new TaskFaultedError(
            `Battery level too low: ${pixel.batteryLevel}%`
          );
        }
      }, [pixel]),
      createTaskStatusContainer(t("batteryLevel"))
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
  const taskChain = useTaskChain(action)
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
            message={t("areAllLEDsWhiteWithCount", {
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
  pixel,
}: ValidationTestProps) {
  const { t } = useTranslation();

  const taskChain = useTaskChain(action)
    .withTask(
      React.useCallback(
        (abortSignal) =>
          ValidationTests.waitFaceUp(
            pixel,
            getFaceUp(pixel, "1"),
            Color.dimMagenta,
            abortSignal
          ),
        [pixel]
      ),
      createTaskStatusContainer(t("placeBlinkingFaceUp"))
    )
    .withStatusChanged(playSoundOnResult)
    .withTask(
      React.useCallback(
        (abortSignal) =>
          ValidationTests.waitFaceUp(
            pixel,
            getFaceUp(pixel, "2"),
            Color.dimYellow,
            abortSignal
          ),
        [pixel]
      ),
      createTaskStatusContainer(t("placeNewBlinkingFaceUp"))
    )
    .withStatusChanged(playSoundOnResult)
    .withTask(
      React.useCallback(
        (abortSignal) =>
          ValidationTests.waitFaceUp(
            pixel,
            getFaceUp(pixel, "3"),
            Color.dimCyan,
            abortSignal
          ),
        [pixel]
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
        get24BitsTimestamp()
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
  const taskChain = useTaskChain(action)
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
                pixel._updateColorway(colorway);
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
}: ValidationTestProps & PrintingProp) {
  const { t } = useTranslation();

  const [progress, setProgress] = React.useState(-1);
  const taskChain = useTaskChain(action)
    .withTask(
      React.useCallback(async () => {
        // Update profile
        await ValidationTests.updateProfile(
          pixel,
          getDefaultProfile(settings.dieType),
          setProgress
        );
      }, [pixel, settings.dieType]),
      createTaskStatusContainer({
        title: t("updateProfile"),
        children: <>{progress >= 0 && <ProgressBar percent={progress} />}</>,
      })
    )
    .withTask(
      React.useCallback(async () => {
        await ValidationTests.renameDie(pixel);
        // Start printing ahead of time
        printLabel(pixel, settings.dieType, onPrintStatus);
      }, [onPrintStatus, pixel, settings.dieType]),
      createTaskStatusContainer(t("setDieName"))
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

  const taskChain = useTaskChain(action)
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

  const taskChain = useTaskChain(reset ? "reset" : action)
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
          if (!printOk) {
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

  const taskChain = useTaskChain(action)
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
