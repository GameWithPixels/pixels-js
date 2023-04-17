import { FastHStack } from "@systemic-games/react-native-base-components";
import {
  Color,
  getPixel,
  Pixel,
  ScannedPixel,
  useScannedPixels,
} from "@systemic-games/react-native-pixels-connect";
import { Audio, AVPlaybackSource } from "expo-av";
import React from "react";
import { useTranslation } from "react-i18next";
import { Button, Text } from "react-native-paper";

import ProgressBar from "./ProgressBar";
import TaskChainComponent from "./TaskChainComponent";

import factoryDfuFiles from "!/dfu/factory-dfu-files.zip";
import DfuFilesBundle from "~/features/dfu/DfuFilesBundle";
import {
  listUnzippedDfuFiles,
  unzipDfuFilesFromAssets,
} from "~/features/dfu/unzip";
import useUpdateFirmware from "~/features/dfu/useUpdateFirmware";
import useTimeout from "~/features/hooks/useTimeout";
import { DieType, getLEDCount } from "~/features/pixels/DieType";
import { createTaskStatusContainer } from "~/features/tasks/createTaskContainer";
import { TaskFaultedError, TaskStatus } from "~/features/tasks/useTask";
import useTaskChain from "~/features/tasks/useTaskChain";
import { TaskComponentProps } from "~/features/tasks/useTaskComponent";
import {
  getBoardOrDie,
  isBoard,
  ValidationFormFactor,
} from "~/features/validation/ValidationFormFactor";
import ValidationTests from "~/features/validation/ValidationTests";
import getDefaultProfile from "~/getDefaultProfile";
import toLocaleDateTimeString from "~/utils/toLocaleDateTimeString";

const chimeSound = require("!/sounds/chime.mp3");
const errorSound = require("!/sounds/error.mp3");

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
  const boardOrDie = getBoardOrDie(settings.formFactor);
  return boardOrDie === "board" ? "coil" : boardOrDie;
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
      <Text variant="labelLarge">{message}</Text>
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
  formFactor: ValidationFormFactor;
  dieType: DieType;
}

export interface ConnectPixelProps extends TaskComponentProps {
  pixelId: number;
  settings: ValidationTestsSettings;
  onPixelScanned?: (pixel: ScannedPixel) => void;
  onPixelConnected?: (pixel: Pixel) => void;
}

export function UpdateFirmware({
  action,
  onTaskStatus,
  pixelId,
}: UpdateFirmwareProps) {
  const { t } = useTranslation();

  // BLE Scan
  const scanFilter = React.useCallback(
    (pixel: ScannedPixel) => pixel.pixelId === pixelId,
    [pixelId]
  );
  const [scannedPixels, scannerDispatch] = useScannedPixels({ scanFilter });
  const [resolveScanPromise, setResolveScanPromise] =
    React.useState<() => void>();
  const scannedPixelRef = React.useRef<ScannedPixel>();
  React.useEffect(() => {
    if (scannedPixels[0] && resolveScanPromise) {
      scannedPixelRef.current = scannedPixels[0];
      resolveScanPromise();
    }
  }, [resolveScanPromise, scannedPixels]);

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
      } else if (dfuState === "dfuAborted") {
        reject(new Error("Firmware update aborted"));
      } else if (dfuState === "dfuCompleted") {
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
          const onTimeout = () => {
            reject(
              new TaskFaultedError(
                `Timeout scanning for Pixel with id ${pixelId}`
              )
            );
          };
          const timeoutId = setTimeout(onTimeout, 5000);
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
        const scannedPixel = scannedPixelRef.current;
        if (!scannedPixel) {
          throw new TaskFaultedError("No scanned Pixel");
        }
        // DFU files
        await unzipDfuFilesFromAssets([factoryDfuFiles]);
        // Read the DFU files bundles
        const dfuFiles = await listUnzippedDfuFiles();
        const dfuBundle = (await DfuFilesBundle.makeBundles(dfuFiles))[0];
        if (!dfuBundle) {
          throw new TaskFaultedError("DFU files not found or problematic");
        }
        const bl = dfuBundle.bootloader;
        if (!bl) {
          throw new TaskFaultedError(
            "DFU bootloader file not found or problematic"
          );
        }
        const fw = dfuBundle.firmware;
        if (!fw) {
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
          toLocaleDateTimeString(scannedPixel.firmwareDate)
        );
        // Start DFU
        if (dfuBundle.date > scannedPixel.firmwareDate) {
          const dfuPromise = new Promise<void>((resolve, reject) => {
            setResolveRejectDfuPromise({ resolve, reject });
          });
          updateFirmware(
            scannedPixel.address,
            dfuBundle.bootloader.pathname,
            dfuBundle.firmware.pathname
          );
          await dfuPromise;
        } else {
          console.log("Skipping firmware update");
        }
      }, [updateFirmware]),
      createTaskStatusContainer({
        title: t("firmwareUpdate"),
        children: (
          <>
            {dfuState && (
              <Text variant="labelLarge">
                {t("dfuStateWithStatus", {
                  status: t(dfuState),
                })}
              </Text>
            )}
            {dfuProgress >= 0 && <ProgressBar percent={dfuProgress} />}
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
  onPixelScanned,
  onPixelConnected,
}: ConnectPixelProps) {
  const { t } = useTranslation();

  // BLE Scan
  const scanFilter = React.useCallback(
    (pixel: ScannedPixel) => pixel.pixelId === pixelId,
    [pixelId]
  );
  const [scannedPixels, scannerDispatch] = useScannedPixels({ scanFilter });
  const [resolveScanPromise, setResolveScanPromise] =
    React.useState<() => void>();
  const scannedPixelRef = React.useRef<ScannedPixel>();
  React.useEffect(() => {
    if (scannedPixels[0] && resolveScanPromise) {
      scannedPixelRef.current = scannedPixels[0];
      resolveScanPromise();
      onPixelScanned?.(scannedPixels[0]);
    }
  }, [onPixelScanned, resolveScanPromise, scannedPixels]);

  // Pixel
  const [pixel, setPixel] = React.useState<Pixel>();
  React.useEffect(() => {
    if (pixel && pixel.status === "ready") {
      onPixelConnected?.(pixel);
    }
    return () => {
      pixel?.disconnect().catch(console.log);
    };
  }, [onPixelConnected, pixel]);

  const taskChain = useTaskChain(
    action,
    React.useCallback(async () => {
      setPixel(undefined);
      if (!pixelId) {
        throw new TaskFaultedError("Empty Pixel Id");
      }
      scannerDispatch("start");
      try {
        await new Promise<void>((resolve, reject) => {
          const onTimeout = () => {
            reject(
              new TaskFaultedError(
                `Timeout scanning for Pixel with id ${pixelId}`
              )
            );
          };
          const timeoutId = setTimeout(onTimeout, 5000);
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
        if (!scannedPixelRef.current) {
          throw new TaskFaultedError("Empty scanned Pixel");
        }
        const ledCount = scannedPixelRef.current.ledCount;
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
        if (!scannedPixelRef.current) {
          throw new TaskFaultedError("Empty scanned Pixel");
        }
        // Get our Pixel and connect to it
        const pixel = getPixel(scannedPixelRef.current);
        await pixel.connect();
        // Make sure we don't have any animation that are playing
        await pixel.stopAllAnimations();
        setPixel(pixel);
      }, []),
      createTaskStatusContainer(t("connect"))
    )
    .withStatusChanged(_playSoundOnResult)
    .withStatusChanged(onTaskStatus);

  return (
    <TaskChainComponent title={t("scanAndConnect")} taskChain={taskChain} />
  );
}

export interface ValidationTestProps extends TaskComponentProps {
  pixel: Pixel;
  settings: ValidationTestsSettings;
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
          ValidationTests.checkAccelerationDownward(pixel, abortSignal),
        [pixel]
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
  if (settings.formFactor === "die") {
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

  // Timeout before showing option to abort
  const [hasElapsed, resetTimeout] = useTimeout(20000);
  const [userAbort, setUserAbort] = React.useState<() => void>();

  const taskChain = useTaskChain(
    action,
    React.useCallback(
      async (abortSignal) =>
        _makeUserCancellable(
          abortSignal,
          setUserAbort,
          (abortSignal) =>
            ValidationTests.waitCharging(pixel, !notCharging, abortSignal),
          "Aborted wait for charging"
        ),
      [notCharging, pixel]
    ),
    createTaskStatusContainer({
      children: !hasElapsed ? (
        <Text variant="labelLarge">
          {t(
            notCharging
              ? "removeFromChargerWithCoilOrDie"
              : "placeOnChargerWithCoilOrDie",
            { coilOrDie: t(_getCoilOrDie(settings)) }
          )}
        </Text>
      ) : (
        <MessageYesNo
          message={t(
            notCharging
              ? "isRemovedFromChargerWithCoilOrDie"
              : "isPlacedOnChargerWithCoilOrDie",
            { coilOrDie: t(_getCoilOrDie(settings)) }
          )}
          onYes={() => userAbort?.()}
          onNo={() => resetTimeout()}
        />
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
            isBoard(settings.formFactor)
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
      [pixel, settings.formFactor]
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
            isBoard(settings.formFactor)
              ? new Color(0.003, 0.01, 0)
              : new Color(0.03, 0.1, 0),
            abortSignal
          ),
        [pixel, settings.formFactor]
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

  // Timeout before showing option to abort
  const [hasElapsed, resetTimeout] = useTimeout(5000);
  const [userAbort, setUserAbort] = React.useState<() => void>();

  const taskChain = useTaskChain(
    action,
    React.useCallback(
      (abortSignal) =>
        _makeUserCancellable(
          abortSignal,
          setUserAbort,
          (abortSignal) =>
            ValidationTests.waitFaceUp(
              pixel,
              5, // Fixme, this should be different for each die type
              Color.magenta,
              abortSignal
            ),
          `Aborted wait for face 5 up`
        ),
      [pixel]
    ),
    createTaskStatusContainer({
      children: !hasElapsed ? (
        <Text variant="labelLarge">{t("placeBlinkingFaceUp")}</Text>
      ) : (
        <MessageYesNo
          message={t("isBlinkingFaceUp")}
          onYes={() => userAbort?.()}
          onNo={() => resetTimeout()}
        />
      ),
    })
  )
    .chainWith(
      React.useCallback(
        (abortSignal) =>
          _makeUserCancellable(
            abortSignal,
            setUserAbort,
            (abortSignal) =>
              ValidationTests.waitFaceUp(
                pixel,
                10, // Fixme, this should be different for each die type
                Color.yellow,
                abortSignal
              ),
            "Aborted wait for face 10 up"
          ),
        [pixel]
      ),
      createTaskStatusContainer({
        children: !hasElapsed ? (
          <Text variant="labelLarge">{t("placeNewBlinkingFaceUp")}</Text>
        ) : (
          <MessageYesNo
            message={t("isBlinkingFaceUp")}
            onYes={() => userAbort?.()}
            onNo={() => resetTimeout()}
          />
        ),
      })
    )
    .withStatusChanged(_playSoundOnResult)
    .withStatusChanged(onTaskStatus);

  return <TaskChainComponent title={t("waitFaceUp")} taskChain={taskChain} />;
}

interface UpdateFirmwareProps extends TaskComponentProps {
  pixelId: number;
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
      React.useCallback(() => pixel.disconnect(), [pixel]),
      //React.useCallback(() => ValidationTests.exitValidationMode(pixel), [pixel]),
      createTaskStatusContainer(t("exitValidationMode"))
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
        ValidationTests.waitDisconnected(
          pixel,
          new Color(0, 0.03, 0.1),
          abortSignal
        ),
      [pixel]
    ),
    createTaskStatusContainer({
      children: (
        <Text variant="labelLarge">{t("placeDieInCaseAndCloseLid")}</Text>
      ),
    })
  )
    .withStatusChanged(_playSoundOnResult)
    .withStatusChanged(onTaskStatus);

  return (
    <TaskChainComponent title={t("waitDieInCase")} taskChain={taskChain} />
  );
}
