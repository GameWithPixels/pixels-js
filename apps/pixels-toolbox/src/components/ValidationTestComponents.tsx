import {
  Color,
  getPixel,
  Pixel,
  PixelStatus,
  ScannedPixel,
} from "@systemic-games/react-native-pixels-connect";
import { Button, Text } from "native-base";
import { useCallback, useEffect, useRef, useState } from "react";

import ProgressBar from "./ProgressBar";
import TaskGroupComponent from "./TaskGroupComponent";
import { createTaskStatusComponent } from "./TaskStatusComponent";

import dfuFiles from "~/../assets/factory-dfu-files.zip";
import delay from "~/delay";
import { DieType, getLedCount } from "~/features/DieType";
import ValidationTests from "~/features/ValidationTests";
import { isTaskCompleted } from "~/features/tasks/TaskResult";
import { FaultedError } from "~/features/tasks/useTask";
import useTaskChain from "~/features/tasks/useTaskChain";
import { TaskComponentProps } from "~/features/tasks/useTaskComponent";
import standardProfile from "~/standardProfile";
import usePixelScanner from "~/usePixelScanner";
import useUpdateFirmware from "~/useUpdateFirmware";

export type ValidationRunType = "board" | "die";

export interface TestInfo {
  validationRun: ValidationRunType;
  dieType: DieType;
}

export interface ConnectPixelProps extends TaskComponentProps {
  pixelId: number;
  testInfo: TestInfo;
  onPixelScanned: (pixel: ScannedPixel) => void;
  onPixelConnected: (pixel: Pixel) => void;
}

export function ConnectPixel({
  action,
  onTaskStatus,
  pixelId,
  testInfo,
  onPixelScanned,
  onPixelConnected,
}: ConnectPixelProps) {
  const scanFilter = useCallback(
    (pixel: ScannedPixel) => pixel.pixelId === pixelId,
    [pixelId]
  );
  const [scannedPixels, scannerDispatch] = usePixelScanner({ scanFilter });
  const [resolveScanPromise, setResolveScanPromise] = useState<(() => void)[]>(
    []
  );
  const scannedPixelRef = useRef<ScannedPixel>();
  useEffect(() => {
    if (scannedPixels[0]) {
      scannedPixelRef.current = scannedPixels[0];
      resolveScanPromise[0]?.();
      onPixelScanned(scannedPixels[0]);
    }
  }, [onPixelScanned, resolveScanPromise, scannedPixels]);

  const [pixel, setPixel] = useState<Pixel>();
  useEffect(() => {
    if (pixel && pixel.status === "ready") {
      onPixelConnected(pixel);
    }
  }, [onPixelConnected, pixel]);

  const taskChain = useTaskChain(
    action,
    useCallback(async () => {
      setPixel(undefined);
      if (!pixelId) {
        throw new FaultedError("Empty Pixel Id");
      }
      await scannerDispatch("start");
      try {
        await new Promise<void>((resolve, reject) => {
          const onTimeout = () => {
            reject(
              new FaultedError(`Timeout scanning for Pixel with id ${pixelId}`)
            );
          };
          const timeoutId = setTimeout(onTimeout, 5000);
          setResolveScanPromise([
            () => {
              clearTimeout(timeoutId);
              resolve();
            },
          ]);
        });
      } finally {
        await scannerDispatch("stop");
      }
    }, [pixelId, scannerDispatch]),
    createTaskStatusComponent("BLE Scan")
  )
    .chainWith(
      useCallback(async () => {
        if (!scannedPixelRef.current) {
          throw new FaultedError("Empty scanned Pixel");
        }
        const ledCount = scannedPixelRef.current.ledCount;
        if (ledCount !== getLedCount(testInfo.dieType)) {
          throw new FaultedError(
            `Incorrect die type, expected ${testInfo.dieType} but got ${ledCount} LEDs`
          );
        }
      }, [testInfo.dieType]),
      createTaskStatusComponent("Check Type")
    )
    .chainWith(
      useCallback(async () => {
        if (!scannedPixelRef.current) {
          throw new FaultedError("Empty scanned Pixel");
        }
        const pixel = getPixel(scannedPixelRef.current);
        await pixel.connect();
        setPixel(pixel);
      }, []),
      createTaskStatusComponent("Connect")
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
  testInfo: TestInfo;
}

export function CheckBoard({
  action,
  onTaskStatus,
  pixel,
}: ValidationTestProps) {
  const taskChain = useTaskChain(
    action,
    useCallback(() => ValidationTests.checkLedLoopback(pixel), [pixel]),
    createTaskStatusComponent("LED Loopback")
  )
    .chainWith(
      useCallback(() => ValidationTests.checkAccelerometer(pixel), [pixel]),
      createTaskStatusComponent("Accelerometer")
    )
    .chainWith(
      useCallback(() => ValidationTests.checkBatteryVoltage(pixel), [pixel]),
      createTaskStatusComponent("Battery Voltage")
    )
    .chainWith(
      useCallback(() => ValidationTests.checkRssi(pixel), [pixel]),
      createTaskStatusComponent("RSSI")
    )
    .withStatusChanged(onTaskStatus);

  // TODO effect to stop sending acc data

  return (
    <TaskGroupComponent title="Check Board" taskStatus={taskChain.status}>
      {taskChain.render()}
    </TaskGroupComponent>
  );
}

export function CheckLeds({
  action,
  onTaskStatus,
  pixel,
  testInfo,
}: ValidationTestProps) {
  const [resolvePromise, setResolvePromise] = useState<(() => void)[]>([]);
  const taskChain = useTaskChain(
    action,
    useCallback(async () => {
      const duration = 20000;
      await pixel.blink(new Color(0.1, 0.1, 0.1), {
        count: 1,
        duration: 2 * duration,
      });
      await new Promise<void>((resolve, reject) => {
        const timeoutId = setTimeout(() => {
          reject(new FaultedError("LEDs blink"));
        }, duration);
        setResolvePromise([
          () => {
            clearTimeout(timeoutId);
            resolve();
          },
        ]);
      });
    }, [pixel]),
    () => (
      <>
        {resolvePromise[0] && (
          <Button onPress={() => resolvePromise[0]()}>OK</Button>
        )}
      </>
    )
  ).withStatusChanged(onTaskStatus);

  // TODO abort task on cancel

  return (
    <TaskGroupComponent title="Check LEDs" taskStatus={taskChain.status}>
      {!isTaskCompleted(taskChain.status) && (
        <Text ml="10%" italic fontWeight="1xl">
          Check that all {getLedCount(testInfo.dieType)} LEDs are on and fully
          white
        </Text>
      )}
      {taskChain.render()}
    </TaskGroupComponent>
  );
}

export function FlickBoard({
  action,
  onTaskStatus,
  pixel,
  testInfo,
}: ValidationTestProps) {
  const taskChain = useTaskChain(
    action,
    useCallback(() => ValidationTests.waitForBoardFlicked(pixel), [pixel]),
    () => <></>
  ).withStatusChanged(onTaskStatus);

  // TODO effect to stop sending acc data

  const title =
    testInfo.validationRun === "board" ? "Flick Board" : "Shake Die";
  const comment =
    testInfo.validationRun === "board" ? "Flick board" : "Shake die";
  return (
    <TaskGroupComponent title={title} taskStatus={taskChain.status}>
      {!isTaskCompleted(taskChain.status) && (
        <Text ml="10%" italic fontWeight="1xl">
          {comment + " to test accelerometer"}
        </Text>
      )}
      {taskChain.render()}
    </TaskGroupComponent>
  );
}

export function WaitFaceUp({
  action,
  onTaskStatus,
  pixel,
  testInfo,
}: ValidationTestProps) {
  const taskChain = useTaskChain(
    action,
    useCallback(
      () => ValidationTests.waitFaceUp(pixel, getLedCount(testInfo.dieType)),
      [pixel, testInfo.dieType]
    ),
    () => <></>
  ).withStatusChanged(onTaskStatus);

  // TODO abort task on cancel

  return (
    <TaskGroupComponent title="Wait Face Up" taskStatus={taskChain.status}>
      {!isTaskCompleted(taskChain.status) && (
        <Text ml="10%" italic fontWeight="1xl">
          Place die with blinking face up
        </Text>
      )}
      {taskChain.render()}
    </TaskGroupComponent>
  );
}

export function UpdateFirmware({
  action,
  onTaskStatus,
  address,
}: TaskComponentProps & { address: number }) {
  // Firmware update
  const [updateFirmware, dfuState, dfuProgress] = useUpdateFirmware(dfuFiles);
  const taskChain = useTaskChain(
    action,
    useCallback(async () => {
      await delay(1000); // TODO wait for file to load
      await updateFirmware(address);
    }, [address, updateFirmware]),
    (p) => (
      <>
        <Text ml="10%" italic fontWeight="1xl">
          DFU State: {dfuState}
        </Text>
        <ProgressBar percent={dfuProgress} />
      </>
    )
  ).withStatusChanged(onTaskStatus);

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
  testInfo,
}: ValidationTestProps) {
  const [progress, setProgress] = useState(-1);
  const taskChain = useTaskChain(
    action,
    useCallback(
      () => ValidationTests.updateProfile(pixel, standardProfile, setProgress),
      [pixel]
    ),
    createTaskStatusComponent(
      "Update Profile",
      <ProgressBar percent={100 * progress} />
    )
  )
    .chainWith(
      useCallback(
        () => ValidationTests.renameDie(pixel, `Pixel ${testInfo.dieType}`),
        [pixel, testInfo.dieType]
      ),
      createTaskStatusComponent("Rename Die")
    )
    .chainWith(
      //useCallback(() => pixel.disconnect(), [pixel]),
      useCallback(() => ValidationTests.exitValidationMode(pixel), [pixel]),
      createTaskStatusComponent("Exit Validation Mode")
    )
    .withStatusChanged(onTaskStatus);

  return (
    <TaskGroupComponent title="Prepare Die" taskStatus={taskChain.status}>
      {taskChain.render()}
    </TaskGroupComponent>
  );
}

export function WaitTurnOff({
  action,
  onTaskStatus,
  pixel,
  testInfo,
}: ValidationTestProps) {
  const taskChain = useTaskChain(
    action,
    useCallback(async () => {
      if (pixel.status !== "ready") {
        throw new FaultedError(`Pixel is not ready, status is ${pixel.status}`);
      }
      await pixel.blink(new Color(0.1, 0.7, 0), {
        count: 1,
        duration: 40000,
      });
      await new Promise<void>((resolve, reject) => {
        const statusListener = (status: PixelStatus) => {
          if (status === "disconnected") {
            pixel.removeEventListener("status", statusListener);
            resolve();
          }
        };
        pixel.addEventListener("status", statusListener);
      });
    }, [pixel]),
    createTaskStatusComponent(`Turn ${testInfo.validationRun} off`)
  ).withStatusChanged(onTaskStatus);

  // TODO effect to stop listening to status events

  return (
    <TaskGroupComponent title="Wait Turn Off" taskStatus={taskChain.status}>
      {!isTaskCompleted(taskChain.status) && (
        <Text ml="10%" italic fontWeight="1xl">
          Place die in charging case and close the lid
        </Text>
      )}
      {taskChain.render()}
    </TaskGroupComponent>
  );
}
