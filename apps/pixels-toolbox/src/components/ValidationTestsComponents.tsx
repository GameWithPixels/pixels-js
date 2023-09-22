import { assert, assertNever, delay } from "@systemic-games/pixels-core-utils";
import {
  FastBoxProps,
  FastHStack,
  FastVStack,
} from "@systemic-games/react-native-base-components";
import {
  DfuCommunicationError,
  DfuState,
} from "@systemic-games/react-native-nordic-nrf5-dfu";
import {
  Central,
  Color,
  Pixel,
  PixelColorway,
  PixelColorwayValues,
  PixelDieType,
  PixelDieTypeValues,
  PixelScanner,
  RollEvent,
  ScannedPixel,
} from "@systemic-games/react-native-pixels-connect";
import { Audio, AVPlaybackSource } from "expo-av";
import React from "react";
import { useTranslation, TFunction } from "react-i18next";
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
import { updateFirmware } from "~/features/dfu/updateFirmware";
import {
  PrintStatus,
  printLabelAsync,
} from "~/features/labels/printLabelAsync";
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

function printLabel(
  pixel: Pixel,
  statusCallback: (status: PrintStatus | Error) => void
): void {
  printLabelAsync(pixel, statusCallback).catch(statusCallback);
  // async function testPrintLabelAsync(
  //   pixel: Pixel,
  //   statusCallback?: (status: PrintStatus) => void
  // ) {
  //   console.log("TEST PRINTING");
  //   statusCallback?.("preparing");
  //   setTimeout(() => statusCallback?.("sending"), 1000);
  //   setTimeout(() => statusCallback?.("done"), 2000);
  // }
}

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
          await delay(1000);
          console.log("Try connecting again...");
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
  try {
    const scannedPixel = await withPromise<ScannedPixel>(
      abortSignal,
      "scan",
      (resolve, reject) => {
        // Setup timeout
        const timeoutId = setTimeout(
          () => reject(new TaskFaultedError(t("scanTimeoutTryAgain"))),
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
      }
    );
    return scannedPixel;
  } finally {
    scanner.stop();
  }
}

interface MessageYesNoProps extends FastBoxProps {
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

export interface ValidationTestsSettings {
  sequence: ValidationSequence;
  dieType: PixelDieType;
}

export interface ValidationTestProps extends TaskComponentProps {
  pixel: Pixel;
  settings: ValidationTestsSettings;
}

interface UpdateFirmwareProps extends Omit<ValidationTestProps, "pixel"> {
  pixelId: number;
  onPixelFound?: (pixel: Pixel) => void;
  onFirmwareUpdated?: () => void;
}

// Note: Pixel should be disconnected by parent component
export function UpdateFirmware({
  action,
  onTaskStatus,
  pixelId,
  onPixelFound,
  onFirmwareUpdated,
}: UpdateFirmwareProps) {
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
          if (onPixelFound) {
            // We use a PixelDispatcher to get our Pixel instance so to enable message logging
            onPixelFound(PixelDispatcher.getDispatcher(scannedPixel).pixel);
          }
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
          // Try to connect up to 3 times
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
              } else if (dfuState === "completed") {
                onFirmwareUpdated?.();
              }
            };
            // Update firmware
            try {
              await updateFW();
            } catch (error) {
              if (dfuTarget.address && error instanceof DfuCommunicationError) {
                console.log("Error updating firmware, trying again...");
                setDfuState(undefined);
                setDfuProgress(0);
                // Switch to bootloader address (only available on Android)
                await updateFW(dfuTarget.address + 1);
              } else {
                throw error;
              }
            }
          } else {
            console.log("Skipping firmware update");
          }
        } finally {
          // Pixel is already disconnected if DFU has proceeded
          await Central.disconnectPeripheral(dfuTarget.systemId);
        }
      }, [scannedPixel, onFirmwareUpdated]),
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

interface ConnectPixelProps extends Omit<ValidationTestProps, "pixel"> {
  pixelId: number;
  onPixelFound?: (pixel: Pixel) => void;
  pixel?: Pixel;
}

// Note: Pixel should be disconnected by parent component
export function ConnectPixel({
  action,
  onTaskStatus,
  pixel: givenPixel,
  pixelId,
  settings,
  onPixelFound,
}: ConnectPixelProps) {
  const { t } = useTranslation();

  // Our Pixel
  const [pixel, setPixel] = React.useState(givenPixel);

  const taskChain = useTaskChain(action)
    .withTask(
      React.useCallback(
        async (abortSignal) => {
          if (!pixel) {
            // Start scanning for our Pixel
            const scannedPixel = await scanForPixelWithTimeout(
              abortSignal,
              t,
              pixelId
            );
            // We use a PixelDispatcher to get our Pixel instance so to enable message logging
            const pixel = PixelDispatcher.getDispatcher(scannedPixel).pixel;
            setPixel(pixel); // TODO setting the Pixel changes the dependency list and restarts the task
            // Notify parent
            onPixelFound?.(pixel);
          }
        },
        [onPixelFound, pixel, pixelId, t]
      ),
      createTaskStatusContainer(t("bluetoothScan"))
    )
    .withTask(
      React.useCallback(async () => {
        // Get our Pixel and check LED count
        if (!pixel) {
          throw new TaskFaultedError("No scanned Pixel");
        }
        if (pixel.ledCount !== getLEDCount(settings.dieType)) {
          throw new TaskFaultedError(
            t("dieTypeMismatch", {
              dieType: t(settings.dieType),
              ledCount: pixel.ledCount,
            })
          );
        }
      }, [pixel, settings.dieType, t]),
      createTaskStatusContainer(t("checkDieType"))
    )
    .withTask(
      React.useCallback(
        async (abortSignal) => {
          // Get our Pixel and connect to it
          if (!pixel) {
            throw new TaskFaultedError("No scanned Pixel");
          }
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
  pixel,
  settings,
  notCharging,
}: ValidationTestProps & { notCharging?: boolean }) {
  const { t } = useTranslation();
  const [lastState, setLastState] = React.useState<{
    state?: string;
    vCoil: number;
  }>();

  const taskChain = useTaskChain(action)
    .withTask(
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
              count: getLEDCount(settings.dieType),
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

  const taskChain = useTaskChain(action)
    .withTask(
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
    .withTask(
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
    .withTask(
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

  const storeTimestamp = React.useCallback(
    () =>
      pixelStoreValue(
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
      await pixelStoreValue(pixel, PixelValueStoreType.DieType, value);
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
                await pixelStoreValue(
                  pixel,
                  PixelValueStoreType.Colorway,
                  value
                );
              }
            },
            disconnectTimeout
          ),
        [pixel]
      ),
      createTaskStatusContainer({
        title: t("storeColorway"),
        children: (
          <FastHStack gap={20}>
            {resolveConfirmPromise && (
              <>
                <ColorwayImage name={pixel.colorway} />

                <MessageYesNo
                  justifyContent="center"
                  message={t("keepColorway")}
                  onYes={() => resolveConfirmPromise?.(true)}
                  onNo={() => resolveConfirmPromise?.(false)}
                />
              </>
            )}
            <RequestColorway
              visible={!!resolveColorwayPromise}
              onSelect={(c) => resolveColorwayPromise?.(c)}
            />
          </FastHStack>
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

export interface PrintStatusProp {
  onPrintStatus: (status: PrintStatus | Error | undefined) => void;
}

export function PrepareDie({
  action,
  onTaskStatus,
  pixel,
  settings,
  onPrintStatus,
}: ValidationTestProps & PrintStatusProp) {
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
        // Start printing ahead of time
        printLabel(pixel, onPrintStatus);
      }, [onPrintStatus, pixel, settings.dieType]),
      createTaskStatusContainer({
        title: t("updateProfile"),
        children: <>{progress >= 0 && <ProgressBar percent={progress} />}</>,
      })
    )
    .withTask(
      React.useCallback(() => ValidationTests.renameDie(pixel), [pixel]),
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

export interface CheckLabelProps extends ValidationTestProps, PrintStatusProp {
  printResult: PrintStatus | Error | undefined;
}

export function LabelPrinting({
  action,
  onTaskStatus,
  pixel,
  printResult,
  onPrintStatus,
}: CheckLabelProps) {
  const { t } = useTranslation();

  // Print result
  const [resolveRejectResultPromise, setResolveRejectResultPromise] =
    React.useState<{ resolve: () => void; reject: (error: Error) => void }>();
  React.useEffect(() => {
    console.log(`Print result: ${printResult}`);
    if (resolveRejectResultPromise) {
      if (printResult === "done") {
        resolveRejectResultPromise.resolve();
      } else if (printResult instanceof Error) {
        resolveRejectResultPromise.reject(printResult);
      }
    }
  }, [printResult, resolveRejectResultPromise]);

  // Print check
  const [resolvePrintOkPromise, setResolvePrintOkPromise] =
    React.useState<(ok: boolean) => void>();

  // Reset task chain
  const [reset, setReset] = React.useState(false);
  React.useEffect(() => setReset(false), [reset]);

  const taskChain = useTaskChain(reset ? "reset" : action)
    .withTask(
      React.useCallback(
        (abortSignal) =>
          withPromise<void>(
            abortSignal,
            "labelPrinting",
            (resolve, reject) =>
              setResolveRejectResultPromise({ resolve, reject }),
            () => setResolveRejectResultPromise(undefined)
          ),
        []
      ),
      createTaskStatusContainer(t("waitingOnPrint"))
    )
    .withStatusChanged(playSoundOnResult)
    .withTask(
      React.useCallback(
        async (abortSignal) => {
          const printOk = await withPromise<boolean>(
            abortSignal,
            "labelPrinting",
            (resolve) => setResolvePrintOkPromise(() => resolve),
            () => setResolvePrintOkPromise(undefined)
          );
          if (!printOk) {
            console.log("Reprinting label");
            onPrintStatus(undefined);
            setReset(true);
            printLabel(pixel, onPrintStatus);
          }
        },
        [onPrintStatus, pixel]
      ),
      createTaskStatusContainer({
        children: (
          <MessageYesNo
            message={t("isLabelPrinted")}
            hideButtons={!resolvePrintOkPromise}
            onYes={() => resolvePrintOkPromise?.(true)}
            onNo={() => resolvePrintOkPromise?.(false)}
          />
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
  pixel,
  settings,
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
