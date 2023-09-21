import { assert, assertNever, delay } from "@systemic-games/pixels-core-utils";
import {
  FastBoxProps,
  FastHStack,
  FastVStack,
} from "@systemic-games/react-native-base-components";
import {
  Central,
  Color,
  Pixel,
  PixelColorway,
  PixelColorwayValues,
  PixelConnectError,
  PixelDieType,
  PixelScannerDispatchAction,
  RollEvent,
  ScannedPixel,
  useScannedPixels,
} from "@systemic-games/react-native-pixels-connect";
import { Audio, AVPlaybackSource } from "expo-av";
import React from "react";
import { useTranslation } from "react-i18next";
import { FlatList, Image } from "react-native";
import {
  Button,
  Modal,
  Portal,
  Text,
  TouchableRipple,
} from "react-native-paper";

import chimeSound from "!/sounds/chime.mp3";
import errorSound from "!/sounds/error.mp3";
import { ProgressBar } from "~/components/ProgressBar";
import { TaskChainComponent } from "~/components/TaskChainComponent";
import DfuFilesBundle from "~/features/dfu/DfuFilesBundle";
import { areSameFirmwareDates } from "~/features/dfu/areSameFirmwareDates";
import { unzipFactoryDfuFilesAsync } from "~/features/dfu/unzip";
import { useUpdateFirmware } from "~/features/hooks/useUpdateFirmware";
import PixelDispatcher from "~/features/pixels/PixelDispatcher";
import {
  pixelClearSettings,
  pixelStopAllAnimations,
  pixelStoreValue,
  PixelValueStoreType,
} from "~/features/pixels/extensions";
import { getDefaultProfile } from "~/features/pixels/getDefaultProfile";
import { createTaskStatusContainer } from "~/features/tasks/createTaskContainer";
import { TaskFaultedError, TaskStatus } from "~/features/tasks/useTask";
import { useTaskChain } from "~/features/tasks/useTaskChain";
import { TaskComponentProps } from "~/features/tasks/useTaskComponent";
import { toLocaleDateTimeString } from "~/features/toLocaleDateTimeString";
import {
  getBoardOrDie,
  getSequenceIndex,
  isBoard,
  ValidationSequence,
} from "~/features/validation/ValidationSequences";
import {
  disconnectTimeout,
  ValidationTests,
} from "~/features/validation/ValidationTests";
import {
  withPromise,
  AbortControllerWithReason,
  getSignalReason,
  withTimeoutAndDisconnect,
} from "~/features/validation/signalHelpers";
import gs, { useModalStyle } from "~/styles";

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

function getLEDCount(dieType: PixelDieType): number {
  switch (dieType) {
    case "unknown":
      return 0;
    case "d4":
    case "d6":
    case "d6fudge":
      return 6;
    case "d6pipped":
      return 21;
    case "d8":
      return 8;
    case "d10":
    case "d00":
      return 10;
    case "d12":
      return 12;
    case "d20":
      return 20;
    default:
      assertNever(dieType);
  }
}

function getFudgeFaceDesc(face: number): string {
  switch (face) {
    case 1:
      return " = ➕ (bottom)";
    case 2:
    case 5:
      return " = ➖";
    case 6:
      return " = ➕ (top)";
    default:
      return "";
  }
}

const connectTimeout = 5000; // Ms

async function repeatConnect(
  pixel: Pixel,
  connect: () => Promise<void | Pixel>,
  disconnect: () => Promise<void | Pixel>,
  abortSignal: AbortSignal
) {
  const onAbort = () => {
    disconnect().catch((error) =>
      console.log(`Error while disconnecting on abort: ${error}`)
    );
  };
  abortSignal.addEventListener("abort", onAbort);
  try {
    let retries = 2;

    while (!abortSignal.aborted)
      try {
        await connect();
        break;
      } catch (error) {
        if (retries === 0) {
          if (pixel) {
            throw new PixelConnectError(pixel, error);
          } else {
            throw error;
          }
        }
        --retries;
        if (!abortSignal.aborted) {
          await delay(1000);
          console.log("Try connecting again...");
        }
      }
  } finally {
    abortSignal.removeEventListener("abort", onAbort);
  }
}

interface MessageYesNoProps extends FastBoxProps {
  message: string;
  onYes?: () => void;
  onNo?: () => void;
  hideYesNo?: boolean;
}

function MessageYesNo({
  message,
  onYes,
  onNo,
  hideYesNo,
  ...props
}: MessageYesNoProps) {
  const { t } = useTranslation();
  return (
    <FastVStack gap={10} {...props}>
      <Text variant="bodyLarge">{message}</Text>
      {!hideYesNo && (
        <FastHStack gap={10}>
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
        </FastHStack>
      )}
    </FastVStack>
  );
}

async function scanForPixelWithTimeout(
  pixelId: number,
  scannerDispatch: (action: PixelScannerDispatchAction) => void,
  setResolveScanPromise: (setter: () => void) => void,
  abortSignal: AbortSignal,
  timeout = 10000 // 10s
): Promise<void> {
  if (!pixelId) {
    throw new TaskFaultedError("Empty Pixel Id");
  }
  scannerDispatch("start");
  try {
    await withPromise<void>(abortSignal, "scan", (resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(
          new TaskFaultedError(
            `Timeout scanning for Pixel with id ${pixelId.toString(16)}`
          )
        );
      }, timeout);
      setResolveScanPromise(() => () => {
        clearTimeout(timeoutId);
        resolve();
      });
    });
  } finally {
    scannerDispatch("stop");
  }
}

export interface ValidationTestsSettings {
  sequence: ValidationSequence;
  dieType: PixelDieType;
}

export interface ValidationTestProps extends TaskComponentProps {
  pixel: Pixel;
  settings: ValidationTestsSettings;
}

interface ValidationTestScanProps extends Omit<ValidationTestProps, "pixel"> {
  pixelId: number;
  onPixelFound?: (pixel: Pixel) => void;
  onFirmwareUpdated?: () => void;
}

export function UpdateFirmware({
  action,
  onTaskStatus,
  pixelId,
  onPixelFound,
  onFirmwareUpdated,
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
      // Make sure that we have a PixelDispatcher instance so messages are logged
      pixelRef.current = PixelDispatcher.getDispatcher(scannedPixels[0]).pixel;
      scannedPixelRef.current = scannedPixels[0];
      onPixelFound?.(pixelRef.current);
      resolveScanPromise();
    }
  }, [onPixelFound, resolveScanPromise, scannedPixels]);

  React.useEffect(() => {
    return () => {
      if (pixelRef.current) {
        Central.disconnectPeripheral(pixelRef.current.systemId).catch((error) =>
          console.log(`Error disconnecting: ${error}`)
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
        onFirmwareUpdated?.();
        resolve();
      }
    }
  }, [dfuLastError, dfuState, onFirmwareUpdated, resolveRejectDfuPromise]);

  const taskChain = useTaskChain(
    action,
    React.useCallback(
      async (abortSignal) =>
        await scanForPixelWithTimeout(
          pixelId,
          scannerDispatch,
          setResolveScanPromise,
          abortSignal
        ),
      [pixelId, scannerDispatch]
    ),
    createTaskStatusContainer(t("bluetoothScan"))
  )
    .chainWith(
      React.useCallback(async (abortSignal) => {
        // Get our Pixel and connect to it
        const pixel = pixelRef.current;
        if (!pixel) {
          throw new TaskFaultedError("Empty scanned Pixel");
        }
        // Try to connect up to 3 times
        await repeatConnect(
          pixel,
          () =>
            Central.connectPeripheral(pixel.systemId, {
              timeoutMs: connectTimeout,
            }),
          () => Central.disconnectPeripheral(pixel.systemId),
          abortSignal
        );
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
    .withStatusChanged(playSoundOnResult)
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
      // Make sure that we have a PixelDispatcher instance so messages are logged
      pixelRef.current = PixelDispatcher.getDispatcher(scannedPixels[0]).pixel;
      onPixelFound?.(pixelRef.current);
      resolveScanPromise();
    }
  }, [onPixelFound, resolveScanPromise, scannedPixels]);

  // Pixel is disconnected by parent component
  // React.useEffect(() => {
  //   return () => {
  //     pixelRef.current?.disconnect().catch(console.log);
  //   };
  // }, []);

  const taskChain = useTaskChain(
    action,
    React.useCallback(
      async (abortSignal) =>
        await scanForPixelWithTimeout(
          pixelId,
          scannerDispatch,
          setResolveScanPromise,
          abortSignal
        ),
      [pixelId, scannerDispatch]
    ),
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
        pixelRef.current._changeType(settings.dieType);
      }, [settings.dieType]),
      createTaskStatusContainer(t("checkDieType"))
    )
    .chainWith(
      React.useCallback(async (abortSignal) => {
        // Get our Pixel and connect to it
        const pixel = pixelRef.current;
        if (!pixel) {
          throw new TaskFaultedError("Empty scanned Pixel");
        }
        await repeatConnect(
          pixel,
          () => pixel.connect(connectTimeout),
          () => pixel.disconnect(),
          abortSignal
        );
        // Make sure we don't have any animation playing
        await pixelStopAllAnimations(pixel);
      }, []),
      createTaskStatusContainer(t("connect"))
    )
    .withStatusChanged(playSoundOnResult)
    .withStatusChanged(onTaskStatus);

  return (
    <TaskChainComponent title={t("scanAndConnect")} taskChain={taskChain} />
  );
}

interface ValidationTestCheckBoardProps extends ValidationTestProps {
  firmwareUpdated: boolean;
}

export function CheckBoard({
  action,
  onTaskStatus,
  pixel,
  settings,
  firmwareUpdated,
}: ValidationTestCheckBoardProps) {
  const { t } = useTranslation();

  const taskChain = useTaskChain(
    action,
    React.useCallback(
      () => ValidationTests.checkAccelerationValid(pixel),
      [pixel]
    ),
    createTaskStatusContainer(t("accelerometer"))
  ).chainWith(
    React.useCallback(
      () => ValidationTests.checkBatteryVoltage(pixel),
      [pixel]
    ),
    createTaskStatusContainer(t("batteryVoltage"))
  );
  if (!isBoard(settings.sequence)) {
    taskChain.chainWith(
      // eslint-disable-next-line react-hooks/rules-of-hooks
      React.useCallback(() => ValidationTests.checkRssi(pixel), [pixel]),
      createTaskStatusContainer(t("rssi"))
    );
  }
  taskChain.chainWith(
    React.useCallback(async () => {
      if (firmwareUpdated) {
        await pixelClearSettings(pixel);
      }
    }, [pixel, firmwareUpdated]),
    createTaskStatusContainer(t("clearSettings"))
  );
  taskChain
    .withStatusChanged(playSoundOnResult)
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
  const [lastState, setLastState] = React.useState<{
    state?: string;
    vCoil: number;
  }>();

  const taskChain = useTaskChain(
    action,
    React.useCallback(
      async (abortSignal) =>
        ValidationTests.waitCharging(
          pixel,
          !notCharging,
          notCharging ? Color.dimGreen : Color.dimOrange,
          abortSignal,
          setLastState
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
          {lastState && (
            <Text variant="bodyLarge">
              {t("chargingState")}
              {t("colonSeparator")}
              {lastState.state ?? ""}
              {t("commaSeparator")}
              {t("coil")}
              {t("colonSeparator")}
              {t("voltageWithValue", {
                value: lastState.vCoil ?? 0,
              })}
            </Text>
          )}
        </>
      ),
    })
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
        const abortController = new AbortControllerWithReason();
        setUserAbort(() => () => {
          abortController.abortWithReason(new Error("Some LEDs are not white"));
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
            count: getLEDCount(settings.dieType),
          })}
          hideYesNo={!resolvePromise}
          onYes={() => resolvePromise?.()}
          onNo={() => userAbort?.()}
        />
      ),
    })
  )
    .withStatusChanged(playSoundOnResult)
    .withStatusChanged(onTaskStatus);

  return <TaskChainComponent title={t("checkLEDs")} taskChain={taskChain} />;
}

function ColorwayImage({ name }: { name: PixelColorway }) {
  switch (name) {
    default:
      return <Image source={require("!images/colorways/unknown.png")} />;
    case "onyxBlack":
      return <Image source={require("!images/colorways/onyxBlack.png")} />;
    case "hematiteGrey":
      return <Image source={require("!images/colorways/hematiteGrey.png")} />;
    case "midnightGalaxy":
      return <Image source={require("!images/colorways/midnightGalaxy.png")} />;
    case "auroraSky":
      return <Image source={require("!images/colorways/auroraSky.png")} />;
    case "auroraClear":
      return <Image source={require("!images/colorways/auroraClear.png")} />;
  }
}

export function RequestColorway({
  visible,
  onSelect,
}: {
  visible: boolean;
  onSelect?: (colorway: PixelColorway) => void;
}) {
  // Values for UI
  const modalStyle = useModalStyle();
  const { t } = useTranslation();
  const colors = (Object.keys(PixelColorwayValues) as [PixelColorway]).filter(
    (c) => c !== "unknown" && c !== "custom"
  );
  colors.push("unknown");
  return (
    <Portal>
      <Modal
        visible={visible}
        contentContainerStyle={modalStyle}
        dismissable={false}
      >
        <FastVStack paddingVertical={10} gap={20}>
          <Text style={{ alignSelf: "center" }} variant="headlineMedium">
            {t("selectColorway")}
          </Text>
          <FlatList
            style={gs.fullWidth}
            contentContainerStyle={{
              ...gs.listContentContainer,
              gap: 20,
            }}
            columnWrapperStyle={{
              justifyContent: "space-around",
            }}
            numColumns={2}
            data={colors}
            renderItem={({ item: c }) => (
              <TouchableRipple onPress={() => onSelect?.(c)}>
                <ColorwayImage name={c} />
              </TouchableRipple>
            )}
          />
        </FastVStack>
      </Modal>
    </Portal>
  );
}

export function StoreSettings({
  action,
  onTaskStatus,
  pixel,
  settings,
}: ValidationTestProps) {
  const { t } = useTranslation();

  const [resolveConfirmPromise, setResolveConfirmPromise] =
    React.useState<(keepSettings: boolean) => void>();
  const [resolveColorwayPromise, setResolveColorwayPromise] =
    React.useState<(colorway: PixelColorway) => void>();
  const taskChain = useTaskChain(
    action,
    React.useCallback(
      (abortSignal) =>
        withTimeoutAndDisconnect(
          abortSignal,
          pixel,
          async (abortSignal) => {
            let keepSettings = false;
            let colorway = pixel.designAndColor;
            console.log(`Initial colorway: ${colorway}`);
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
            if (colorway !== "unknown") {
              console.log(`Storing colorway: ${colorway}`);
              const value = PixelColorwayValues[colorway];
              assert(value);
              await pixelStoreValue(pixel, PixelValueStoreType.Colorway, value);
            }
          },
          disconnectTimeout
        ),
      [pixel]
    ),
    createTaskStatusContainer({
      children: (
        <FastHStack gap={20}>
          <ColorwayImage name={pixel.designAndColor} />
          <MessageYesNo
            justifyContent="center"
            message={t("keepColorway")}
            hideYesNo={!resolveConfirmPromise}
            onYes={() => resolveConfirmPromise?.(true)}
            onNo={() => resolveConfirmPromise?.(false)}
          />
          <RequestColorway
            visible={!!resolveColorwayPromise}
            onSelect={(c) => resolveColorwayPromise?.(c)}
          />
        </FastHStack>
      ),
    })
  )
    .chainWith(
      React.useCallback(
        () =>
          pixelStoreValue(
            pixel,
            PixelValueStoreType.ValidationTimestampStart +
              getSequenceIndex(settings.sequence),
            get24BitsTimestamp()
          ),
        [pixel, settings.sequence]
      ),
      createTaskStatusContainer(t("writeTimestamp"))
    )
    .withStatusChanged(playSoundOnResult)
    .withStatusChanged(onTaskStatus);

  return (
    <TaskChainComponent title={t("storeSettings")} taskChain={taskChain} />
  );
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

export function WaitFaceUp({
  action,
  onTaskStatus,
  pixel,
}: ValidationTestProps) {
  const { t } = useTranslation();
  const [lastRoll, setRoll] = React.useState<RollEvent>();
  const FaceUpText = () => (
    <>
      {!!lastRoll && (
        <Text variant="bodyLarge">
          {t(lastRoll.state)}
          {t("colonSeparator")}
          {lastRoll.face}
          {pixel.dieType === "d6fudge" ? getFudgeFaceDesc(lastRoll.face) : ""}
        </Text>
      )}
    </>
  );

  const taskChain = useTaskChain(
    action,
    React.useCallback(
      (abortSignal) =>
        ValidationTests.waitFaceUp(
          pixel,
          getFaceUp(pixel, "1"),
          Color.dimMagenta,
          abortSignal,
          setRoll
        ),
      [pixel]
    ),
    createTaskStatusContainer({
      title: t("placeBlinkingFaceUp"),
      children: <FaceUpText />,
    })
  )
    .withStatusChanged(playSoundOnResult)
    .chainWith(
      React.useCallback(
        (abortSignal) =>
          ValidationTests.waitFaceUp(
            pixel,
            getFaceUp(pixel, "2"),
            Color.dimYellow,
            abortSignal,
            setRoll
          ),
        [pixel]
      ),
      createTaskStatusContainer({
        title: t("placeNewBlinkingFaceUp"),
        children: <FaceUpText />,
      })
    )
    .withStatusChanged(playSoundOnResult)
    .chainWith(
      React.useCallback(
        (abortSignal) =>
          ValidationTests.waitFaceUp(
            pixel,
            getFaceUp(pixel, "3"),
            Color.dimCyan,
            abortSignal,
            setRoll
          ),
        [pixel]
      ),
      createTaskStatusContainer({
        title: t("placeNewBlinkingFaceUp"),
        children: <FaceUpText />,
      })
    )
    .withStatusChanged(playSoundOnResult)
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
    React.useCallback(async () => {
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
    .chainWith(
      React.useCallback(
        () => ValidationTests.renameDie(pixel, `Pixel ${settings.dieType}`),
        [pixel, settings.dieType]
      ),
      createTaskStatusContainer(t("setDieName"))
    )
    .chainWith(
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
    .withStatusChanged(playSoundOnResult)
    .withStatusChanged(onTaskStatus);

  return (
    <TaskChainComponent title={t("waitDieInCase")} taskChain={taskChain} />
  );
}
