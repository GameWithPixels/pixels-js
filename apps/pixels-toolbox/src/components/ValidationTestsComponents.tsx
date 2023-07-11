import { assert, assertNever } from "@systemic-games/pixels-core-utils";
import { FastHStack } from "@systemic-games/react-native-base-components";
import {
  Central,
  Color,
  getPixel,
  Pixel,
  ScannedPixel,
  ScannedPixelNotifier,
  useScannedPixels,
} from "@systemic-games/react-native-pixels-connect";
import { Audio, AVPlaybackSource } from "expo-av";
import React from "react";
import { useTranslation } from "react-i18next";
import { Button, Text } from "react-native-paper";

import ProgressBar from "./ProgressBar";
import TaskChainComponent from "./TaskChainComponent";

import factoryDfuFiles from "!/dfu/factory-dfu-files.zip";
import chimeSound from "!/sounds/chime.mp3";
import errorSound from "!/sounds/error.mp3";
import DfuFilesBundle from "~/features/dfu/DfuFilesBundle";
import { areSameFirmwareDates } from "~/features/dfu/areSameFirmwareDates";
import { unzipDfuFilesFromAssets } from "~/features/dfu/unzip";
import { useUpdateFirmware } from "~/features/hooks/useUpdateFirmware";
import { DieType, getLEDCount } from "~/features/pixels/DieType";
import PixelDispatcher from "~/features/pixels/PixelDispatcher";
import { getDefaultProfile } from "~/features/pixels/getDefaultProfile";
import { createTaskStatusContainer } from "~/features/tasks/createTaskContainer";
import { TaskFaultedError, TaskStatus } from "~/features/tasks/useTask";
import useTaskChain from "~/features/tasks/useTaskChain";
import { TaskComponentProps } from "~/features/tasks/useTaskComponent";
import { toLocaleDateTimeString } from "~/features/toLocaleDateTimeString";
import {
  getBoardOrDie,
  isBoard,
  ValidationSequence,
} from "~/features/validation/ValidationSequences";
import ValidationTests from "~/features/validation/ValidationTests";

const soundMap = new Map<AVPlaybackSource, Audio.Sound>();

async function _getSound(source: AVPlaybackSource): Promise<Audio.Sound> {
  let loadedSound = soundMap.get(source);
  if (!loadedSound) {
    const { sound } = await Audio.Sound.createAsync(source);
    soundMap.set(source, sound);
    loadedSound = sound;
  }
  return loadedSound;
}

async function _playSoundAsync(source: AVPlaybackSource) {
  try {
    const sound = await _getSound(source);
    await sound.setPositionAsync(0);
    return await sound.playAsync();
  } catch (e) {
    console.log(`Error playing sound: ${e}`);
  }
}

function _playSoundOnResult(result: TaskStatus) {
  if (result === "succeeded") {
    _playSoundAsync(chimeSound);
  } else if (result === "canceled" || result === "faulted") {
    _playSoundAsync(errorSound);
  }
}

function _getCoilOrDie(settings: ValidationTestsSettings): "coil" | "die" {
  const boardOrDie = getBoardOrDie(settings.sequence);
  return boardOrDie === "board" ? "coil" : boardOrDie;
}

function _getFaceUp(pixel: Pixel, step: "1" | "2" | "3"): number {
  let faces: number[];
  switch (pixel.ledCount) {
    case 20:
      faces = [5, 10, 20];
      break;
    case 12:
      faces = [3, 6, 12];
      break;
    case 10:
      faces = [2, 5, 10];
      break;
    case 8:
      faces = [2, 4, 8];
      break;
    case 6:
      faces = [2, 3, 6];
      break;
    case 4:
      faces = [2, 3, 4];
      break;
    default:
      throw new Error(`Unsupported LED count ${pixel.ledCount}`);
  }
  assert(faces.length === 3);
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

async function _makeUserCancellable(
  abortSignal: AbortSignal,
  setUserAbort: React.Dispatch<React.SetStateAction<(() => void) | undefined>>,
  task: (abortSignal: AbortSignal) => Promise<void>,
  abortMessage: string
): Promise<void> {
  let userAborted = false;
  const abortController = new AbortController();
  setUserAbort(() => () => {
    userAborted = true;
    abortController.abort();
  });
  const abort = () => abortController.abort();
  abortSignal.addEventListener("abort", abort);
  try {
    await task(abortController.signal);
  } catch (error: any) {
    if (userAborted) {
      throw new Error(abortMessage);
    } else {
      throw error;
    }
  } finally {
    abortSignal.removeEventListener("abort", abort);
  }
}

interface MessageYesNoProps {
  message: string;
  onYes?: () => void;
  onNo?: () => void;
  hideYesNo?: boolean;
}

function MessageYesNo({ message, onYes, onNo, hideYesNo }: MessageYesNoProps) {
  const { t } = useTranslation();
  return (
    <>
      <Text variant="bodyLarge">{message}</Text>
      {!hideYesNo && (
        <FastHStack gap={5}>
          <Button mode="contained-tonal" onPress={onYes}>
            {t("yes")}
          </Button>
          <Button mode="contained-tonal" onPress={onNo}>
            {t("no")}
          </Button>
        </FastHStack>
      )}
    </>
  );
}

export interface ValidationTestsSettings {
  sequence: ValidationSequence;
  dieType: DieType;
}

export interface ValidationTestProps extends TaskComponentProps {
  pixel: Pixel;
  settings: ValidationTestsSettings;
}

interface ValidationTestScanProps extends Omit<ValidationTestProps, "pixel"> {
  pixelId: number;
  onPixelFound?: (pixel: Pixel) => void;
}

export function UpdateFirmware({
  action,
  onTaskStatus,
  pixelId,
  onPixelFound,
}: ValidationTestScanProps) {
  const { t } = useTranslation();

  // BLE Scan
  const scanFilter = React.useCallback(
    (pixel: ScannedPixel) => pixel.pixelId === pixelId,
    [pixelId]
  );
  const [scannedPixels, scannerDispatch] = useScannedPixels({ scanFilter });
  const [resolveScanPromise, setResolveScanPromise] =
    React.useState<() => void>();
  const pixelRef = React.useRef<Pixel>();
  const scannedPixelRef = React.useRef<ScannedPixel>();
  React.useEffect(() => {
    if (scannedPixels[0] && resolveScanPromise) {
      pixelRef.current = getPixel(scannedPixels[0]);
      scannedPixelRef.current = scannedPixels[0];
      onPixelFound?.(pixelRef.current);
      resolveScanPromise();
    }
  }, [onPixelFound, resolveScanPromise, scannedPixels]);

  React.useEffect(() => {
    return () => {
      if (pixelRef.current) {
        Central.disconnectPeripheral(pixelRef.current.systemId).catch(
          console.log
        );
      }
    };
  }, []);

  // Firmware update
  const [updateFirmware, dfuState, dfuProgress, dfuLastError] =
    useUpdateFirmware();
  const [resolveRejectDfuPromise, setResolveRejectDfuPromise] = React.useState<{
    resolve: () => void;
    reject: (error: Error) => void;
  }>();
  React.useEffect(() => {
    if (resolveRejectDfuPromise) {
      const { resolve, reject } = resolveRejectDfuPromise;
      if (dfuLastError) {
        reject(dfuLastError);
      } else if (dfuState === "aborted") {
        reject(new Error("Firmware update aborted"));
      } else if (dfuState === "completed") {
        resolve();
      }
    }
  }, [dfuLastError, dfuState, resolveRejectDfuPromise]);

  const taskChain = useTaskChain(
    action,
    React.useCallback(async () => {
      if (!pixelId) {
        throw new TaskFaultedError("Empty Pixel Id");
      }
      scannerDispatch("start");
      try {
        await new Promise<void>((resolve, reject) => {
          const timeoutId = setTimeout(() => {
            reject(
              new TaskFaultedError(
                `Timeout scanning for Pixel with id ${pixelId}`
              )
            );
          }, 5000);
          setResolveScanPromise(() => () => {
            clearTimeout(timeoutId);
            resolve();
          });
        });
      } finally {
        scannerDispatch("stop");
      }
    }, [pixelId, scannerDispatch]),
    createTaskStatusContainer(t("bluetoothScan"))
  )
    .chainWith(
      React.useCallback(async () => {
        // Get our Pixel and connect to it
        const pixel = pixelRef.current;
        if (!pixel) {
          throw new TaskFaultedError("Empty scanned Pixel");
        }
        await Central.connectPeripheral(pixel.systemId, { timeoutMs: 5000 });
      }, []),
      createTaskStatusContainer(t("connect"))
    )
    .chainWith(
      React.useCallback(async () => {
        const pixel = pixelRef.current;
        const dfuTarget = scannedPixelRef.current;
        if (!pixel || !dfuTarget) {
          throw new TaskFaultedError("No scanned Pixel");
        }
        // Get the DFU files bundles from the zip file
        const dfuBundle = DfuFilesBundle.create({
          pathnames: await unzipDfuFilesFromAssets(factoryDfuFiles),
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
        console.log(
          "On device firmware build timestamp is",
          toLocaleDateTimeString(pixel.firmwareDate)
        );
        // Start DFU
        if (
          !areSameFirmwareDates(dfuBundle.date, pixel.firmwareDate) &&
          dfuBundle.date > pixel.firmwareDate
        ) {
          const dfuPromise = new Promise<void>((resolve, reject) => {
            setResolveRejectDfuPromise({ resolve, reject });
          });
          updateFirmware(
            dfuTarget,
            dfuBundle.bootloader.pathname,
            dfuBundle.firmware.pathname
          );
          await dfuPromise;
        } else {
          console.log("Skipping firmware update");
          await Central.disconnectPeripheral(pixel.systemId);
        }
      }, [updateFirmware]),
      createTaskStatusContainer({
        title: t("firmwareUpdate"),
        children: (
          <>
            {dfuState && (
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
    .withStatusChanged(_playSoundOnResult)
    .withStatusChanged(onTaskStatus);

  return (
    <TaskChainComponent title={t("firmwareUpdate")} taskChain={taskChain} />
  );
}

export function ConnectPixel({
  action,
  onTaskStatus,
  pixelId,
  settings,
  onPixelFound,
}: ValidationTestScanProps) {
  const { t } = useTranslation();

  // BLE Scan
  const scanFilter = React.useCallback(
    (pixel: ScannedPixel) => pixel.pixelId === pixelId,
    [pixelId]
  );
  const [scannedPixels, scannerDispatch] = useScannedPixels({ scanFilter });
  const [resolveScanPromise, setResolveScanPromise] =
    React.useState<() => void>();
  const pixelRef = React.useRef<Pixel>();
  React.useEffect(() => {
    if (scannedPixels[0] && resolveScanPromise) {
      const notifier = new ScannedPixelNotifier(scannedPixels[0]);
      // Make sure that we have a PixelDispatcher instance so messages are logged
      pixelRef.current = PixelDispatcher.getInstance(notifier).pixel;
      onPixelFound?.(pixelRef.current);
      resolveScanPromise();
    }
  }, [onPixelFound, resolveScanPromise, scannedPixels]);

  // Pixel
  React.useEffect(() => {
    return () => {
      pixelRef.current?.disconnect().catch(console.log);
    };
  }, []);

  const taskChain = useTaskChain(
    action,
    React.useCallback(async () => {
      if (!pixelId) {
        throw new TaskFaultedError("Empty Pixel Id");
      }
      scannerDispatch("start");
      try {
        await new Promise<void>((resolve, reject) => {
          const timeoutId = setTimeout(() => {
            reject(
              new TaskFaultedError(
                `Timeout scanning for Pixel with id ${pixelId}`
              )
            );
          }, 5000);
          setResolveScanPromise(() => () => {
            clearTimeout(timeoutId);
            resolve();
          });
        });
      } finally {
        scannerDispatch("stop");
      }
    }, [pixelId, scannerDispatch]),
    createTaskStatusContainer(t("bluetoothScan"))
  )
    .chainWith(
      React.useCallback(async () => {
        if (!pixelRef.current) {
          throw new TaskFaultedError("Empty scanned Pixel");
        }
        const ledCount = pixelRef.current.ledCount;
        if (ledCount !== getLEDCount(settings.dieType)) {
          throw new TaskFaultedError(
            `Incorrect die type, expected ${settings.dieType} but got ${ledCount} LEDs`
          );
        }
      }, [settings.dieType]),
      createTaskStatusContainer(t("checkDieType"))
    )
    .chainWith(
      React.useCallback(async () => {
        // Get our Pixel and connect to it
        const pixel = pixelRef.current;
        if (!pixel) {
          throw new TaskFaultedError("Empty scanned Pixel");
        }
        try {
          // Try connecting
          await pixel.connect(5000);
        } catch {
          // Try a second time
          await pixel.connect(5000);
        }
        // Make sure we don't have any animation playing
        await pixel.stopAllAnimations();
      }, []),
      createTaskStatusContainer(t("connect"))
    )
    .withStatusChanged(_playSoundOnResult)
    .withStatusChanged(onTaskStatus);

  return (
    <TaskChainComponent title={t("scanAndConnect")} taskChain={taskChain} />
  );
}

export function CheckBoard({
  action,
  onTaskStatus,
  pixel,
  settings,
}: ValidationTestProps) {
  const { t } = useTranslation();

  const taskChain = useTaskChain(
    action,
    React.useCallback(() => ValidationTests.checkLEDLoopback(pixel), [pixel]),
    createTaskStatusContainer(t("ledLoopback"))
  )
    .chainWith(
      React.useCallback(
        (abortSignal) =>
          isBoard(settings.sequence)
            ? ValidationTests.checkAccelerationValid(pixel, abortSignal)
            : ValidationTests.checkAccelerationDownward(pixel, abortSignal),
        [pixel, settings.sequence]
      ),
      createTaskStatusContainer(t("accelerometer"))
    )
    .chainWith(
      React.useCallback(
        () => ValidationTests.checkBatteryVoltage(pixel),
        [pixel]
      ),
      createTaskStatusContainer(t("batteryVoltage"))
    );
  if (_getCoilOrDie(settings) === "die") {
    taskChain.chainWith(
      // eslint-disable-next-line react-hooks/rules-of-hooks
      React.useCallback(() => ValidationTests.checkRssi(pixel), [pixel]),
      createTaskStatusContainer(t("rssi"))
    );
  }
  taskChain
    .withStatusChanged(_playSoundOnResult)
    .withStatusChanged(onTaskStatus);

  return <TaskChainComponent title={t("checkBoard")} taskChain={taskChain} />;
}

export function WaitCharging({
  action,
  onTaskStatus,
  pixel,
  settings,
  notCharging,
}: ValidationTestProps & { notCharging?: boolean }) {
  const { t } = useTranslation();

  const taskChain = useTaskChain(
    action,
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
        <Text variant="bodyLarge">
          {t(
            notCharging
              ? "removeFromChargerWithCoilOrDie"
              : "placeOnChargerWithCoilOrDie",
            { coilOrDie: t(_getCoilOrDie(settings)) }
          )}
        </Text>
      ),
    })
  )
    .withStatusChanged(_playSoundOnResult)
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
  pixel,
  settings,
}: ValidationTestProps) {
  const { t } = useTranslation();

  const [resolvePromise, setResolvePromise] = React.useState<() => void>();
  const [userAbort, setUserAbort] = React.useState<() => void>();
  const taskChain = useTaskChain(
    action,
    React.useCallback(
      async (abortSignal) => {
        let userAborted = false;
        const abortController = new AbortController();
        setUserAbort(() => () => {
          userAborted = true;
          abortController.abort();
        });
        const abort = () => abortController.abort();
        abortSignal.addEventListener("abort", abort);
        try {
          await ValidationTests.checkLEDsLitUp(
            pixel,
            isBoard(settings.sequence)
              ? new Color(0.03, 0.03, 0.03)
              : new Color(0.1, 0.1, 0.1),
            (r) => setResolvePromise(() => r),
            abortController.signal
          );
        } catch (error: any) {
          if (userAborted) {
            throw new Error("LEDs not bright enough");
          } else {
            throw error;
          }
        } finally {
          abortSignal.removeEventListener("abort", abort);
        }
      },
      [pixel, settings.sequence]
    ),
    createTaskStatusContainer({
      children: (
        <MessageYesNo
          message={t("areAllLEDsWhiteWithCount", {
            count: getLEDCount(settings.dieType),
          })}
          hideYesNo={!resolvePromise}
          onYes={() => resolvePromise?.()}
          onNo={() => userAbort?.()}
        />
      ),
    })
  )
    .withStatusChanged(_playSoundOnResult)
    .withStatusChanged(onTaskStatus);

  return <TaskChainComponent title={t("checkLEDs")} taskChain={taskChain} />;
}

export function TurnOffDevice({
  action,
  onTaskStatus,
  pixel,
  settings,
}: ValidationTestProps) {
  const { t } = useTranslation();

  const taskChain = useTaskChain(
    action,
    React.useCallback(() => pixel.turnOff(), [pixel]),
    createTaskStatusContainer(t("turningOff"))
  )
    .chainWith(
      React.useCallback(
        (abortSignal) =>
          ValidationTests.waitDisconnected(
            pixel,
            isBoard(settings.sequence)
              ? new Color(0.003, 0.01, 0)
              : new Color(0.03, 0.1, 0),
            abortSignal
          ),
        [pixel, settings.sequence]
      ),
      createTaskStatusContainer(t("waitingDeviceDisconnect"))
    )
    .withStatusChanged(_playSoundOnResult)
    .withStatusChanged(onTaskStatus);

  return (
    <TaskChainComponent title={t("waitForShutdown")} taskChain={taskChain} />
  );
}

export function WaitFaceUp({
  action,
  onTaskStatus,
  pixel,
}: ValidationTestProps) {
  const { t } = useTranslation();

  const taskChain = useTaskChain(
    action,
    React.useCallback(
      (abortSig) =>
        ValidationTests.waitFaceUp(
          pixel,
          _getFaceUp(pixel, "1"),
          Color.dimMagenta,
          abortSig
        ),
      [pixel]
    ),
    createTaskStatusContainer({
      title: t("placeBlinkingFaceUp"),
    })
  )
    .withStatusChanged(_playSoundOnResult)
    .chainWith(
      React.useCallback(
        (abortSig) =>
          ValidationTests.waitFaceUp(
            pixel,
            _getFaceUp(pixel, "2"),
            Color.dimYellow,
            abortSig
          ),
        [pixel]
      ),
      createTaskStatusContainer({
        title: t("placeNewBlinkingFaceUp"),
      })
    )
    .withStatusChanged(_playSoundOnResult)
    .chainWith(
      React.useCallback(
        (abortSig) =>
          ValidationTests.waitFaceUp(
            pixel,
            _getFaceUp(pixel, "3"),
            Color.dimCyan,
            abortSig
          ),
        [pixel]
      ),
      createTaskStatusContainer({
        title: t("placeNewBlinkingFaceUp"),
      })
    )
    .withStatusChanged(_playSoundOnResult)
    .withStatusChanged(onTaskStatus);

  return <TaskChainComponent title={t("waitFaceUp")} taskChain={taskChain} />;
}

export function PrepareDie({
  action,
  onTaskStatus,
  pixel,
  settings,
}: ValidationTestProps) {
  const { t } = useTranslation();

  const [progress, setProgress] = React.useState(-1);
  const taskChain = useTaskChain(
    action,
    React.useCallback(
      () =>
        ValidationTests.updateProfile(
          pixel,
          getDefaultProfile(settings.dieType),
          setProgress
        ),
      [pixel, settings.dieType]
    ),
    createTaskStatusContainer({
      title: t("updateProfile"),
      children: <>{progress >= 0 && <ProgressBar percent={progress} />}</>,
    })
  )
    .chainWith(
      React.useCallback(
        () => ValidationTests.renameDie(pixel, `Pixel ${settings.dieType}`),
        [pixel, settings.dieType]
      ),
      createTaskStatusContainer(t("setDieName"))
    )
    .chainWith(
      // TODO for internal testing only:
      //React.useCallback(() => pixel.disconnect(), [pixel]),
      React.useCallback(
        () => ValidationTests.exitValidationMode(pixel),
        [pixel]
      ),
      createTaskStatusContainer(t("exitValidationMode"))
    )
    .chainWith(
      React.useCallback(
        (abortSignal) =>
          ValidationTests.waitDisconnected(
            pixel,
            isBoard(settings.sequence) ? new Color(0, 0.01, 0) : Color.dimGreen,
            abortSignal
          ),
        [pixel, settings.sequence]
      ),
      createTaskStatusContainer(t("waitingDeviceDisconnect"))
    )
    .withStatusChanged(_playSoundOnResult)
    .withStatusChanged(onTaskStatus);

  return <TaskChainComponent title={t("prepareDie")} taskChain={taskChain} />;
}

export function WaitDieInCase({
  action,
  onTaskStatus,
  pixel,
}: ValidationTestProps) {
  const { t } = useTranslation();

  const taskChain = useTaskChain(
    action,
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
    .withStatusChanged(_playSoundOnResult)
    .withStatusChanged(onTaskStatus);

  return (
    <TaskChainComponent title={t("waitDieInCase")} taskChain={taskChain} />
  );
}
