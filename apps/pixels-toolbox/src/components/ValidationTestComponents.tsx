import {
  getPixel,
  Pixel,
  ScannedPixel,
} from "@systemic-games/react-native-pixels-connect";
import { Button, Text } from "native-base";
import { useCallback, useEffect, useRef, useState } from "react";

import ProgressBar from "./ProgressBar";
import TaskContainer from "./TaskContainer";
import TaskGroupComponent from "./TaskGroupContainer";

import dfuFiles from "~/../assets/factory-dfu-files.zip";
import delay from "~/delay";
import { DieType, getLedCount } from "~/features/DieType";
import ValidationTests from "~/features/ValidationTests";
import { createTaskStatusContainer } from "~/features/tasks/createTaskContainer";
import { TaskFaultedError } from "~/features/tasks/useTask";
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
  const [resolveScanPromise, setResolveScanPromise] = useState<() => void>();
  const scannedPixelRef = useRef<ScannedPixel>();
  useEffect(() => {
    if (scannedPixels[0] && resolveScanPromise) {
      scannedPixelRef.current = scannedPixels[0];
      resolveScanPromise();
      onPixelScanned(scannedPixels[0]);
    }
  }, [onPixelScanned, resolveScanPromise, scannedPixels]);

  const [pixel, setPixel] = useState<Pixel>();
  useEffect(() => {
    if (pixel && pixel.status === "ready") {
      onPixelConnected(pixel);
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
    createTaskStatusContainer("BLE Scan")
  )
    .chainWith(
      useCallback(async () => {
        if (!scannedPixelRef.current) {
          throw new TaskFaultedError("Empty scanned Pixel");
        }
        const ledCount = scannedPixelRef.current.ledCount;
        if (ledCount !== getLedCount(testInfo.dieType)) {
          throw new TaskFaultedError(
            `Incorrect die type, expected ${testInfo.dieType} but got ${ledCount} LEDs`
          );
        }
      }, [testInfo.dieType]),
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
  testInfo: TestInfo;
}

export function CheckBoard({
  action,
  onTaskStatus,
  pixel,
  testInfo,
}: ValidationTestProps) {
  const taskChain = useTaskChain(
    action,
    useCallback(
      (abortSignal) => ValidationTests.waitCharging(pixel, true, abortSignal),
      [pixel]
    ),
    createTaskStatusContainer(
      "Battery Charging",
      <Text variant="comment">Place coil on charger</Text>
    )
  )
    .chainWith(
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
  if (testInfo.validationRun !== "board") {
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

export function ShakeDevice({
  action,
  onTaskStatus,
  pixel,
  testInfo,
}: ValidationTestProps) {
  const title =
    testInfo.validationRun === "board" ? "Flick Board" : "Shake Die";
  const taskChain = useTaskChain(
    action,
    useCallback(
      (abortSignal) => ValidationTests.waitCharging(pixel, false, abortSignal),
      [pixel]
    ),
    createTaskStatusContainer(
      "Battery Not Charging",
      <Text variant="comment">Remove coil from charger</Text>
    )
  )
    .chainWith(
      useCallback(
        (abortSignal) =>
          ValidationTests.checkAccelerationShake(pixel, abortSignal),
        [pixel]
      ),
      createTaskStatusContainer(
        title,
        <Text variant="comment">Test accelerometer by shaking device</Text>
      )
    )
    .withStatusChanged(onTaskStatus);

  return (
    <TaskGroupComponent title={title} taskStatus={taskChain.status}>
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
  const [resolvePromise, setResolvePromise] = useState<() => void>();
  const taskChain = useTaskChain(
    action,
    useCallback(
      (abortSignal) =>
        ValidationTests.checkLedsWhite(
          pixel,
          (r) => setResolvePromise(() => r),
          abortSignal
        ),
      [pixel]
    ),
    (p) => (
      <TaskContainer taskStatus={p.taskStatus} isSubTask>
        <Text variant="comment">
          Check that all {getLedCount(testInfo.dieType)} LEDs are on and fully
          white
        </Text>
        {resolvePromise && <Button onPress={() => resolvePromise()}>OK</Button>}
      </TaskContainer>
    )
  ).withStatusChanged(onTaskStatus);

  return (
    <TaskGroupComponent title="Check LEDs" taskStatus={taskChain.status}>
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
      (abortSignal) =>
        ValidationTests.waitFaceUp(
          pixel,
          getLedCount(testInfo.dieType),
          abortSignal
        ),
      [pixel, testInfo.dieType]
    ),
    (p) => (
      <TaskContainer taskStatus={p.taskStatus} isSubTask>
        <Text variant="comment">Place die with blinking face up</Text>
      </TaskContainer>
    )
  ).withStatusChanged(onTaskStatus);

  return (
    <TaskGroupComponent title="Wait Face Up" taskStatus={taskChain.status}>
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
      <TaskContainer taskStatus={p.taskStatus} isSubTask>
        <Text variant="comment">DFU State: {dfuState}</Text>
        {dfuProgress >= 0 && <ProgressBar percent={dfuProgress} />}
      </TaskContainer>
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
    createTaskStatusContainer(
      "Update Profile",
      <>{progress >= 0 && <ProgressBar percent={100 * progress} />}</>
    )
  )
    .chainWith(
      useCallback(
        () => ValidationTests.renameDie(pixel, `Pixel ${testInfo.dieType}`),
        [pixel, testInfo.dieType]
      ),
      createTaskStatusContainer("Rename Die")
    )
    .chainWith(
      // TODO for internal testing only: useCallback(() => pixel.disconnect(), [pixel]),
      useCallback(() => ValidationTests.exitValidationMode(pixel), [pixel]),
      createTaskStatusContainer("Exit Validation Mode")
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
    useCallback(
      (abortSignal) => ValidationTests.waitDisconnected(pixel, abortSignal),
      [pixel]
    ),
    (p) => (
      <TaskContainer taskStatus={p.taskStatus} isSubTask>
        <Text variant="comment">
          Place die in charging case and close the lid
        </Text>
      </TaskContainer>
    )
  ).withStatusChanged(onTaskStatus);

  const title = `Wait Turn ${testInfo.validationRun} Off`;
  return (
    <TaskGroupComponent title={title} taskStatus={taskChain.status}>
      {taskChain.render()}
    </TaskGroupComponent>
  );
}
