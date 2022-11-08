import {
  Color,
  getPixel,
  Pixel,
  ScannedPixel,
} from "@systemic-games/react-native-pixels-connect";
import { Button, Text } from "native-base";
import { useCallback, useEffect, useRef, useState } from "react";

import ProgressBar from "./ProgressBar";
import TaskGroupComponent from "./TaskGroupContainer";

import dfuFiles from "~/../assets/factory-dfu-files.zip";
import { DieType, getLedCount } from "~/features/DieType";
import extractDfuFiles from "~/features/dfu/extractDfuFiles";
import getDfuFileInfo from "~/features/dfu/getDfuFileInfo";
import useUpdateFirmware from "~/features/dfu/useUpdateFirmware";
import { createTaskStatusContainer } from "~/features/tasks/createTaskContainer";
import { TaskFaultedError } from "~/features/tasks/useTask";
import useTaskChain from "~/features/tasks/useTaskChain";
import { TaskComponentProps } from "~/features/tasks/useTaskComponent";
import {
  isBoard,
  ValidationFormFactor,
} from "~/features/validation/ValidationFormFactor";
import ValidationTests from "~/features/validation/ValidationTests";
import standardProfile from "~/standardProfile";
import toLocaleDateTimeString from "~/toLocaleDateTimeString";
import usePixelScanner from "~/usePixelScanner";

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

export function ConnectPixel({
  action,
  onTaskStatus,
  pixelId,
  settings,
  onPixelScanned,
  onPixelConnected,
}: ConnectPixelProps) {
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
      await scannerDispatch("start");
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
        await scannerDispatch("stop");
      }
    }, [pixelId, scannerDispatch]),
    createTaskStatusContainer("Bluetooth Scan")
  )
    .chainWith(
      useCallback(async () => {
        if (!scannedPixelRef.current) {
          throw new TaskFaultedError("Empty scanned Pixel");
        }
        const ledCount = scannedPixelRef.current.ledCount;
        if (ledCount !== getLedCount(settings.dieType)) {
          throw new TaskFaultedError(
            `Incorrect die type, expected ${settings.dieType} but got ${ledCount} LEDs`
          );
        }
      }, [settings.dieType]),
      createTaskStatusContainer("Check Type")
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
      createTaskStatusContainer("Connect")
    )
    .withStatusChanged(onTaskStatus);

  return (
    <TaskGroupComponent title="Scan & Connect" taskStatus={taskChain.status}>
      {taskChain.render()}
    </TaskGroupComponent>
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
  const taskChain = useTaskChain(
    action,
    useCallback(() => ValidationTests.checkLedLoopback(pixel), [pixel]),
    createTaskStatusContainer("LED Loopback")
  )
    .chainWith(
      useCallback(
        (abortSignal) =>
          ValidationTests.checkAccelerationDownward(pixel, abortSignal),
        [pixel]
      ),
      createTaskStatusContainer("Accelerometer")
    )
    .chainWith(
      useCallback(() => ValidationTests.checkBatteryVoltage(pixel), [pixel]),
      createTaskStatusContainer("Battery Voltage")
    );
  if (settings.formFactor === "die") {
    taskChain.chainWith(
      // eslint-disable-next-line react-hooks/rules-of-hooks
      useCallback(() => ValidationTests.checkRssi(pixel), [pixel]),
      createTaskStatusContainer("RSSI")
    );
  }
  taskChain.withStatusChanged(onTaskStatus);

  return (
    <TaskGroupComponent title="Check Board" taskStatus={taskChain.status}>
      {taskChain.render()}
    </TaskGroupComponent>
  );
}

export function WaitCharging({
  action,
  onTaskStatus,
  pixel,
  settings,
  notCharging,
}: ValidationTestProps & { notCharging?: boolean }) {
  const taskChain = useTaskChain(
    action,
    useCallback(
      (abortSignal) =>
        ValidationTests.waitCharging(pixel, !notCharging, abortSignal),
      [notCharging, pixel]
    ),
    createTaskStatusContainer({
      children: (
        <Text variant="comment">
          {isBoard(settings.formFactor)
            ? notCharging
              ? "Remove coil from charger"
              : "Place coil on charger"
            : notCharging
            ? "Remove die From Charger"
            : "Place die On Charger"}
        </Text>
      ),
    })
  ).withStatusChanged(onTaskStatus);

  return (
    <TaskGroupComponent
      title={`Wait ${notCharging ? "Not " : ""}Charging`}
      taskStatus={taskChain.status}
    >
      {taskChain.render()}
    </TaskGroupComponent>
  );
}

export function CheckLeds({
  action,
  onTaskStatus,
  pixel,
  settings,
}: ValidationTestProps) {
  const [resolvePromise, setResolvePromise] = useState<() => void>();
  const taskChain = useTaskChain(
    action,
    useCallback(
      (abortSignal) =>
        ValidationTests.checkLedsLitUp(
          pixel,
          isBoard(settings.formFactor)
            ? new Color(0.03, 0.03, 0.03)
            : new Color(0.1, 0.1, 0.1),
          (r) => setResolvePromise(() => r),
          abortSignal
        ),
      [pixel, settings.formFactor]
    ),
    createTaskStatusContainer({
      children: (
        <>
          <Text variant="comment">
            Check that all {getLedCount(settings.dieType)} LEDs are on and fully
            white
          </Text>
          {resolvePromise && (
            <Button onPress={() => resolvePromise()}>OK</Button>
          )}
        </>
      ),
    })
  ).withStatusChanged(onTaskStatus);

  return (
    <TaskGroupComponent title="Check LEDs" taskStatus={taskChain.status}>
      {taskChain.render()}
    </TaskGroupComponent>
  );
}

export function ShakeDie({
  action,
  onTaskStatus,
  pixel,
  settings,
}: ValidationTestProps) {
  const taskChain = useTaskChain(
    action,
    useCallback(
      (abortSignal) =>
        ValidationTests.checkAccelerationShake(pixel, abortSignal),
      [pixel]
    ),
    createTaskStatusContainer({
      children: (
        <Text variant="comment">Test accelerometer by shaking die</Text>
      ),
    })
  ).withStatusChanged(onTaskStatus);

  return (
    <TaskGroupComponent
      title="Wait For Shake Die"
      taskStatus={taskChain.status}
    >
      {taskChain.render()}
    </TaskGroupComponent>
  );
}

export function TurnOffDevice({
  action,
  onTaskStatus,
  pixel,
  settings,
}: ValidationTestProps) {
  const taskChain = useTaskChain(
    action,
    useCallback(() => pixel.turnOff(), [pixel]),
    createTaskStatusContainer("Turning Off")
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
      createTaskStatusContainer("Waiting For Device To Disconnect")
    )
    .withStatusChanged(onTaskStatus);

  return (
    <TaskGroupComponent title="Wait Shutdown" taskStatus={taskChain.status}>
      {taskChain.render()}
    </TaskGroupComponent>
  );
}

export function WaitFaceUp({
  action,
  onTaskStatus,
  pixel,
  settings,
}: ValidationTestProps) {
  const taskChain = useTaskChain(
    action,
    useCallback(
      (abortSignal) =>
        ValidationTests.waitFaceUp(
          pixel,
          getLedCount(settings.dieType),
          abortSignal
        ),
      [pixel, settings.dieType]
    ),
    createTaskStatusContainer({
      children: <Text variant="comment">Place die with blinking face up</Text>,
    })
  ).withStatusChanged(onTaskStatus);

  return (
    <TaskGroupComponent title="Wait Face Up" taskStatus={taskChain.status}>
      {taskChain.render()}
    </TaskGroupComponent>
  );
}

interface UpdateFirmwareProps extends TaskComponentProps {
  pixelId: number;
}

export function UpdateFirmware({
  action,
  onTaskStatus,
  pixelId,
}: UpdateFirmwareProps) {
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
      await scannerDispatch("start");
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
        await scannerDispatch("stop");
      }
    }, [pixelId, scannerDispatch]),
    createTaskStatusContainer("Bluetooth Scan")
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
          toLocaleDateTimeString(blDate),
          " and bootloader version is",
          toLocaleDateTimeString(blDate)
        );
        const onDeviceFwDate = new Date(scannedPixel.buildTimestamp * 1000);
        console.log(
          "On device firmware build timestamp is",
          toLocaleDateTimeString(onDeviceFwDate)
        );
        // Start DFU
        const mostRecent = Math.max(blDate.getTime(), fwDate.getTime());
        if (mostRecent > onDeviceFwDate.getTime()) {
          await updateFirmware(scannedPixel.address, blPath, fwPath);
        } else {
          console.log("Skipping firmware update");
        }
      }, [updateFirmware]),
      createTaskStatusContainer({
        title: "Firmware Update",
        children: (
          <>
            <Text variant="comment">
              {dfuState ? `DFU State: ${dfuState}` : "Preparing..."}
            </Text>
            {dfuProgress >= 0 && <ProgressBar percent={dfuProgress} />}
          </>
        ),
      })
    )
    .withStatusChanged(onTaskStatus);

  return (
    <TaskGroupComponent title="Update Firmware" taskStatus={taskChain.status}>
      {taskChain.render()}
    </TaskGroupComponent>
  );
}

export function PrepareDie({
  action,
  onTaskStatus,
  pixel,
  settings,
}: ValidationTestProps) {
  const [progress, setProgress] = useState(-1);
  const taskChain = useTaskChain(
    action,
    useCallback(
      () => ValidationTests.updateProfile(pixel, standardProfile, setProgress),
      [pixel]
    ),
    createTaskStatusContainer({
      title: "Update Profile",
      children: (
        <>{progress >= 0 && <ProgressBar percent={100 * progress} />}</>
      ),
    })
  )
    .chainWith(
      useCallback(
        () => ValidationTests.renameDie(pixel, `Pixel ${settings.dieType}`),
        [pixel, settings.dieType]
      ),
      createTaskStatusContainer("Rename Die")
    )
    .chainWith(
      // TODO for internal testing only:
      useCallback(() => pixel.disconnect(), [pixel]),
      //useCallback(() => ValidationTests.exitValidationMode(pixel), [pixel]),
      createTaskStatusContainer("Exit Validation Mode")
    )
    .withStatusChanged(onTaskStatus);

  return (
    <TaskGroupComponent title="Prepare Die" taskStatus={taskChain.status}>
      {taskChain.render()}
    </TaskGroupComponent>
  );
}

export function WaitDieInCase({
  action,
  onTaskStatus,
  pixel,
  settings,
}: ValidationTestProps) {
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
      children: (
        <Text variant="comment">
          Place die in charging case and close the lid
        </Text>
      ),
    })
  ).withStatusChanged(onTaskStatus);

  return (
    <TaskGroupComponent title="Wait Die In Case" taskStatus={taskChain.status}>
      {taskChain.render()}
    </TaskGroupComponent>
  );
}
