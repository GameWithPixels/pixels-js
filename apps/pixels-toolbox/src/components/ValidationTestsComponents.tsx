import {
  Color,
  getPixel,
  Pixel,
  ScannedPixel,
  usePixelScanner,
} from "@systemic-games/react-native-pixels-connect";
import { Audio, AVPlaybackSource } from "expo-av";
import { Button, HStack, Text } from "native-base";
import {
  Dispatch,
  SetStateAction,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { useTranslation } from "react-i18next";

import ProgressBar from "./ProgressBar";
import TaskChainComponent from "./TaskChainComponent";

import dfuFiles from "!/factory-dfu-files.zip";
import extractDfuFiles from "~/features/dfu/extractDfuFiles";
import getDfuFileInfo from "~/features/dfu/getDfuFileInfo";
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
  } catch (err) {
    console.log("Error playing sound:", err);
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
  setUserAbort: Dispatch<SetStateAction<(() => void) | undefined>>,
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
  return (
    <>
      <Text variant="comment">{message}</Text>
      {!hideYesNo && (
        <HStack>
          <Button mr="5%" onPress={onYes}>
            ☑️
          </Button>
          <Button onPress={onNo}>❌</Button>
        </HStack>
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
  const scanFilter = useCallback(
    (pixel: ScannedPixel) => pixel.pixelId === pixelId,
    [pixelId]
  );
  const [scannedPixels, scannerDispatch] = usePixelScanner({ scanFilter });
  const [resolveScanPromise, setResolveScanPromise] = useState<() => void>();
  const scannedPixelRef = useRef<ScannedPixel>();
  useEffect(() => {
    if (scannedPixels[0] && resolveScanPromise) {
      scannedPixelRef.current = scannedPixels[0];
      resolveScanPromise();
    }
  }, [resolveScanPromise, scannedPixels]);

  // Firmware update
  const [updateFirmware, dfuState, dfuProgress] = useUpdateFirmware();
  const taskChain = useTaskChain(
    action,
    useCallback(async () => {
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
      useCallback(async () => {
        const scannedPixel = scannedPixelRef.current;
        if (!scannedPixel) {
          throw new TaskFaultedError("No scanned Pixel");
        }
        // DFU files
        const [blPath, fwPath] = await extractDfuFiles(dfuFiles);
        const fwDate = getDfuFileInfo(fwPath).date;
        if (!fwDate) {
          throw new TaskFaultedError(
            "DFU firmware file has no date: " + fwPath
          );
        }
        const blDate = getDfuFileInfo(blPath).date;
        if (!blDate) {
          throw new TaskFaultedError(
            "DFU firmware file has no date: " + blPath
          );
        }
        console.log(
          "DFU files loaded, firmware version is",
          toLocaleDateTimeString(fwDate),
          " and bootloader version is",
          toLocaleDateTimeString(blDate)
        );
        console.log(
          "On device firmware build timestamp is",
          toLocaleDateTimeString(scannedPixel.firmwareDate)
        );
        // Start DFU
        const mostRecent = Math.max(blDate.getTime(), fwDate.getTime());
        if (mostRecent > scannedPixel.firmwareDate.getTime()) {
          await updateFirmware(scannedPixel.address, blPath, fwPath);
        } else {
          console.log("Skipping firmware update");
        }
      }, [updateFirmware]),
      createTaskStatusContainer({
        title: t("firmwareUpdate"),
        children: (
          <>
            <Text variant="comment">
              {dfuState
                ? t("dfuStateWithStatus", { status: t(dfuState) })
                : t("initializing")}
            </Text>
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
  const scanFilter = useCallback(
    (pixel: ScannedPixel) => pixel.pixelId === pixelId,
    [pixelId]
  );
  const [scannedPixels, scannerDispatch] = usePixelScanner({ scanFilter });
  const [resolveScanPromise, setResolveScanPromise] = useState<() => void>();
  const scannedPixelRef = useRef<ScannedPixel>();
  useEffect(() => {
    if (scannedPixels[0] && resolveScanPromise) {
      scannedPixelRef.current = scannedPixels[0];
      resolveScanPromise();
      onPixelScanned?.(scannedPixels[0]);
    }
  }, [onPixelScanned, resolveScanPromise, scannedPixels]);

  // Pixel
  const [pixel, setPixel] = useState<Pixel>();
  useEffect(() => {
    if (pixel && pixel.status === "ready") {
      onPixelConnected?.(pixel);
    }
    return () => {
      pixel?.disconnect().catch(console.log);
    };
  }, [onPixelConnected, pixel]);

  const taskChain = useTaskChain(
    action,
    useCallback(async () => {
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
      useCallback(async () => {
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
      useCallback(async () => {
        if (!scannedPixelRef.current) {
          throw new TaskFaultedError("Empty scanned Pixel");
        }
        const pixel = getPixel(scannedPixelRef.current);
        await pixel.connect();
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
    useCallback(() => ValidationTests.checkLEDLoopback(pixel), [pixel]),
    createTaskStatusContainer(t("ledLoopback"))
  )
    .chainWith(
      useCallback(
        (abortSignal) =>
          ValidationTests.checkAccelerationDownward(pixel, abortSignal),
        [pixel]
      ),
      createTaskStatusContainer(t("accelerometer"))
    )
    .chainWith(
      useCallback(() => ValidationTests.checkBatteryVoltage(pixel), [pixel]),
      createTaskStatusContainer(t("batteryVoltage"))
    );
  if (settings.formFactor === "die") {
    taskChain.chainWith(
      // eslint-disable-next-line react-hooks/rules-of-hooks
      useCallback(() => ValidationTests.checkRssi(pixel), [pixel]),
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
  const [userAbort, setUserAbort] = useState<() => void>();

  const taskChain = useTaskChain(
    action,
    useCallback(
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
        <Text variant="comment">
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

  const [resolvePromise, setResolvePromise] = useState<() => void>();
  const [userAbort, setUserAbort] = useState<() => void>();
  const taskChain = useTaskChain(
    action,
    useCallback(
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
    useCallback(() => pixel.turnOff(), [pixel]),
    createTaskStatusContainer(t("turningOff"))
  )
    .chainWith(
      useCallback(
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
  const [userAbort, setUserAbort] = useState<() => void>();

  const taskChain = useTaskChain(
    action,
    useCallback(
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
        <Text variant="comment">{t("placeBlinkingFaceUp")}</Text>
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
      useCallback(
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
          <Text variant="comment">{t("placeNewBlinkingFaceUp")}</Text>
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

  const [progress, setProgress] = useState(-1);
  const taskChain = useTaskChain(
    action,
    useCallback(
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
      useCallback(
        () => ValidationTests.renameDie(pixel, `Pixel ${settings.dieType}`),
        [pixel, settings.dieType]
      ),
      createTaskStatusContainer(t("setDieName"))
    )
    .chainWith(
      // TODO for internal testing only:
      useCallback(() => pixel.disconnect(), [pixel]),
      //useCallback(() => ValidationTests.exitValidationMode(pixel), [pixel]),
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
    useCallback(
      (abortSignal) =>
        ValidationTests.waitDisconnected(
          pixel,
          new Color(0, 0.03, 0.1),
          abortSignal
        ),
      [pixel]
    ),
    createTaskStatusContainer({
      children: <Text variant="comment">{t("placeDieInCaseAndCloseLid")}</Text>,
    })
  )
    .withStatusChanged(_playSoundOnResult)
    .withStatusChanged(onTaskStatus);

  return (
    <TaskChainComponent title={t("waitDieInCase")} taskChain={taskChain} />
  );
}
