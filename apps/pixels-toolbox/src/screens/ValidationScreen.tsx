import { useFocusEffect, useNavigation } from "@react-navigation/native";
import {
  Color,
  getPixel,
  MessageTypeValues,
  Pixel,
  PixelRollStateValues,
  PixelStatus,
  ScannedPixel,
} from "@systemic-games/react-native-pixels-connect";
import { getImageRgbAverages } from "@systemic-games/vision-camera-rgb-averages";
import {
  extendTheme,
  useColorModeValue,
  NativeBaseProvider,
  Center,
  VStack,
  Text,
  Button,
  Box,
  ScrollView,
  Spinner,
  HStack,
} from "native-base";
import React, {
  FC,
  PropsWithChildren,
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useErrorHandler } from "react-error-boundary";
import { useTranslation } from "react-i18next";
import { runOnJS } from "react-native-reanimated";
import {
  Camera,
  CameraPermissionStatus,
  Frame,
  useCameraDevices,
  useFrameProcessor,
} from "react-native-vision-camera";

import dfuFiles from "~/../assets/factory-dfu-files.zip";
import ValidationTests from "~/ValidationTests";
import assertUnreachable from "~/assertUnreachable";
import AppPage from "~/components/AppPage";
import ProgressBar from "~/components/ProgressBar";
import SelectPixel from "~/components/SelectPixel";
import delay from "~/delay";
import getDfuFileInfo from "~/getDfuFileInfo";
import standardProfile from "~/standardProfile";
import toLocaleDateTimeString from "~/toLocaleDateTimeString";
import useDfuFiles from "~/useDfuFiles";
import usePixelBattery from "~/usePixelBattery";
import usePixelConnector from "~/usePixelConnector";
import usePixelIdDecoder from "~/usePixelIdDecoder";
import usePixelIdDecoderFrameProcessor from "~/usePixelIdDecoderFrameProcessor";
import usePixelRssi from "~/usePixelRssi";
import usePixelScanner from "~/usePixelScanner";
import usePixelTelemetry from "~/usePixelTelemetry";
import useTask, { FaultedError, TaskRenderer, TaskStatus } from "~/useTask";
import useTaskChain from "~/useTaskChain";
import useTestComponent, { TaskComponentProps } from "~/useTaskComponent";
import useUpdateFirmware from "~/useUpdateFirmware";

const DieTypes = ["d4", "d6", "pd6", "d8", "d10", "d12", "d20"] as const;
type DieType = typeof DieTypes[number];

function getLedCount(dieType: DieType) {
  switch (dieType) {
    case "d4":
      return 4;
    case "d6":
      return 6;
    case "pd6":
      return 6;
    case "d8":
      return 8;
    case "d10":
      return 10;
    case "d12":
      return 12;
    case "d20":
      return 20;
    default:
      assertUnreachable(dieType);
  }
}

type ValidationRun = "board" | "die";

interface TestInfo {
  validationRun: ValidationRun;
  dieType: DieType;
}

/*
type AppStatuses =
  | "Initializing..."
  | "Identifying..."
  | "Searching..."
  | "Connecting..."
  | "Testing..."
  | "Test Passed"
  | "Test Failed";

function ValidationPageOld() {
  const errorHandler = useErrorHandler();

  // Camera
  const [cameraPermission, setCameraPermission] =
    useState<CameraPermissionStatus>();
  const devices = useCameraDevices("wide-angle-camera");
  const cameraRef = useRef<Camera>(null);

  // Camera permissions
  useEffect(() => {
    console.log("Requesting camera permission");
    Camera.requestCameraPermission().then((perm) => {
      console.log(`Camera permission: ${perm}`);
      setCameraPermission(perm);
      return perm;
    });
  }, []);

  // We use the back camera
  const device = devices.back;
  const cameraReady = cameraPermission === "authorized" && device;
  useEffect(() => {
    if (cameraReady) {
      setStatusText("Identifying...");
    }
  }, [cameraReady]);

  // PixelId decoder
  const [decoderState, decoderDispatch] = usePixelIdDecoder();

  // Get the average R, G and B for each image captured by the camera
  const frameProcessor = useFrameProcessor(
    (frame) => {
      "worklet";
      try {
        const result = getImageRgbAverages(frame, {
          subSamplingX: 4,
          subSamplingY: 2,
          // writeImage: false,
          // writePlanes: false,
        });
        runOnJS(decoderDispatch)({ rgbAverages: result });
      } catch (error) {
        errorHandler(
          new Error(
            `Exception in frame processor "getImageRgbAverages": ${error}`
          )
        );
      }
    },
    [decoderDispatch, errorHandler]
  );

  // Connection to Pixel
  const [connectorState, connectorDispatch] = usePixelConnector();

  // Reset decoder when status is back to identifying
  // useEffect(() => {
  //   console.log("Status: " + statusText);
  //   if (statusText === "Identifying...") {
  //     console.log("Resetting device id decoding");
  //     decoderDispatch({ reset: true });
  //   }
  // }, [decoderDispatch, statusText]);

  // Connect when pixel id is found
  useEffect(() => {
    const pixelId = decoderState.pixelId;
    if (pixelId) {
      connectorDispatch("connect", { pixelId });
    }
  }, [connectorDispatch, decoderState.pixelId]);

  // And disconnect when loosing focus
  useFocusEffect(
    useCallback(() => {
      return () => {
        connectorDispatch("disconnect");
      };
    }, [connectorDispatch])
  );

  // Overall status
  const [statusText, setStatusText] = useState<AppStatuses>("Initializing...");

  // Refresh battery level and RSSI
  const [rssi, rssiDispatch] = usePixelRssi(connectorState.pixel);
  const [battery, batteryDispatch] = usePixelBattery(connectorState.pixel);
  const [telemetry, telemetryDispatch] = usePixelTelemetry(
    connectorState.pixel
  );

  const telemetryStatsRef = useRef<TelemetryStats>(new TelemetryStats());
  useEffect(() => {
    if (telemetry) {
      telemetryStatsRef.current.push(telemetry);
    }
  }, [telemetry]);

  // Update status text based Pixel connector status
  useEffect(() => {
    switch (connectorState.status) {
      case "scanning":
        setStatusText("Searching...");
        break;
      case "connecting":
        setStatusText("Connecting...");
        break;
      case "connected":
        if (connectorState.pixel && connectorState.scannedPixel) {
          const pixel = connectorState.pixel;
          const firmwareDate = new Date(
            connectorState.scannedPixel.buildTimestamp * 1000
          );
          console.log(
            "Connected to Pixel",
            pixel.name,
            "firmware version is",
            toLocaleDateTimeString(firmwareDate),
            "running validation tests..."
          );
          setStatusText("Testing...");
          runValidationTests(pixel)
            .then((success) => {
              setStatusText((status) => {
                if (status === "Testing...") {
                  return success ? "Test Passed" : "Test Failed";
                }
                return status;
              });
            })
            .catch(errorHandler)
            .then(() => {
              rssiDispatch("start");
              batteryDispatch("start");
              telemetryDispatch("start");
            });
        }
        break;
      case "disconnected":
        setStatusText((statusText) => {
          if (statusText !== "Initializing...") {
            decoderDispatch({ reset: true });
            return "Identifying...";
          }
          return statusText;
        });
        break;
      default: {
        const check: never = connectorState.status;
        throw new Error(check);
      }
    }
  }, [
    batteryDispatch,
    connectorState,
    decoderDispatch,
    errorHandler,
    rssiDispatch,
    telemetryDispatch,
  ]);

  // DFU files
  const [bootloaderPath, firmwarePath] = useDfuFiles(dfuFiles);
  useEffect(() => {
    if (bootloaderPath.length) {
      console.log(
        "DFU files loaded, version is",
        toLocaleDateTimeString(getDfuFileInfo(firmwarePath).date ?? new Date())
      );
    }
  }, [bootloaderPath, firmwarePath]);

  // DFU state and progress
  const [dfuState, setDfuState] = useState<DfuState>("dfuCompleted");
  const [dfuProgress, setDfuProgress] = useState(0);

  // Reset progress when DFU completes
  useEffect(() => {
    if (dfuState === "dfuCompleted" || dfuState === "dfuAborted") {
      setDfuProgress(0);
    }
  }, [dfuState]);

  // Profile transfer
  const [profileTransferProgress, setProfileTransferProgress] = useState(-1);

  const renderMainUI = (device: CameraDevice) => {
    const isConnectingOrConnected =
      connectorState.status === "connecting" ||
      connectorState.status === "connected";
    const pixel = connectorState.pixel;
    const isConnected = pixel && connectorState.status === "connected";
    const testDone =
      statusText === "Test Passed" || statusText === "Test Failed";

    // https://mrousavy.com/react-native-vision-camera/docs/api/interfaces/CameraDeviceFormat/
    // const w = 720; // 1280, 720, 640, 320
    // const h = 480; // 720, 480, 480, 240
    // const format: CameraDeviceFormat = {
    //   photoWidth: w,
    //   photoHeight: h,
    //   videoWidth: w,
    //   videoHeight: h,
    //   frameRateRanges: [{ minFrameRate: 30, maxFrameRate: 30 }],
    //   colorSpaces: ["yuv"],
    //   pixelFormat: "420v",
    // };
    // const arr: number[] = [];
    // device.formats.forEach(f => {
    //   //if (f.videoWidth >= 640 && f.videoWidth <= 1280 && f.colorSpaces[0] === "yuv") {
    //   f.frameRateRanges.forEach(r => {
    //     const c = r.maxFrameRate;
    //     if (!arr.includes(c)) {
    //       arr.push(c)
    //       console.log(c);
    //     }
    //   })
    // });
    return (
      <>
        <Camera
          ref={cameraRef}
          style={styles.camera}
          device={device}
          isActive
          photo
          hdr={false}
          lowLightBoost={false}
          frameProcessor={
            device.supportsParallelVideoProcessing ? frameProcessor : undefined
          }
          videoStabilizationMode="off"
          // format={format} TODO can't get camera to switch to given resolution
        />
        {dfuState !== "dfuCompleted" && dfuState !== "dfuAborted" ? (
          <>
            <Text style={styles.infoText}>{`DFU state: ${dfuState}`}</Text>
            <ProgressBar percent={dfuProgress} />
          </>
        ) : (
          isConnectingOrConnected && (
            <View>
              {profileTransferProgress >= 0 && (
                <ProgressBar percent={100 * profileTransferProgress} />
              )}
              {telemetry && (
                <>
                  <Text style={styles.infoText}>
                    {"Acc: " +
                      telemetry.accX.toFixed(2) +
                      ", " +
                      telemetry.accY.toFixed(2) +
                      ", " +
                      telemetry.accZ.toFixed(2)}
                  </Text>
                  <Text style={styles.infoText}>
                    {" => min=" +
                      telemetryStatsRef.current.minAccMagnitude.toFixed(2) +
                      ", max=" +
                      telemetryStatsRef.current.maxAccMagnitude.toFixed(2)}
                  </Text>
                </>
              )}
              {rssi && (
                <Text
                  style={styles.infoText}
                >{`RSSI: ${rssi.value} dBm, channel: ${rssi.channelIndex}`}</Text>
              )}
              {battery && (
                <Text style={styles.infoText}>
                  {`Battery: ${battery.voltage.toFixed(2)} V, charging:` +
                    ` ${battery.charging ? "yes" : "no"}`}
                </Text>
              )}
              {isConnected ? (
                <View style={styles.containerHoriz}>
                  <Button
                    style={styles.button}
                    textStyle={styles.buttonText}
                    onPress={() =>
                      pixel
                        ?.blink(new Color(0.1, 0.1, 0.1), { duration: 10000 })
                        .catch(errorHandler)
                    }
                  >
                    White
                  </Button>
                  <Button
                    style={styles.button}
                    textStyle={styles.buttonText}
                    onPress={() => checkFaceUp(pixel, 4).catch(errorHandler)}
                  >
                    4 up
                  </Button>
                  <Button
                    style={styles.button}
                    textStyle={styles.buttonText}
                    onPress={() =>
                      finalSetup(pixel, setProfileTransferProgress).catch(
                        errorHandler
                      )
                    }
                  >
                    Setup
                  </Button>
                </View>
              ) : (
                <></>
              )}
              {testDone ? (
                <View style={styles.containerHoriz}>
                  <Button
                    style={styles.button}
                    textStyle={styles.buttonText}
                    onPress={() => {
                      if (connectorState.pixel && connectorState.scannedPixel) {
                        rssiDispatch("stop");
                        batteryDispatch("stop");
                        telemetryDispatch("stop");
                        updateFirmware(
                          connectorState.scannedPixel.address,
                          bootloaderPath,
                          firmwarePath,
                          setDfuState,
                          setDfuProgress
                        ).catch(errorHandler);
                      }
                    }}
                  >
                    DFU
                  </Button>
                  <Button
                    style={styles.button}
                    textStyle={styles.buttonText}
                    onPress={() =>
                      connectorState.pixel?.turnOff().catch(errorHandler)
                    }
                  >
                    Done
                  </Button>
                </View>
              ) : (
                <Button
                  style={styles.button}
                  textStyle={styles.buttonText}
                  onPress={() => connectorDispatch("disconnect")}
                >
                  Cancel
                </Button>
              )}
            </View>
          )
        )}
        <View
          style={[
            styles.scanColorIndicator,
            {
              backgroundColor: decoderState.scanColor
                ? decoderState.scanColor
                : "white",
            },
          ]}
        />
      </>
    );
  };

  return (
    <>
      <Text style={styles.statusText}>{statusText}</Text>
      {cameraReady && renderMainUI(device)}
    </>
  );
}
*/

function SelectValidationRunPage({
  onSelectRun,
  onBack,
}: {
  onSelectRun: (run: ValidationRun) => void;
  onBack?: () => void;
}) {
  const { t } = useTranslation();
  return (
    <VStack w="100%" h="100%" p="5" bg={useBackgroundColor()}>
      <Button h="30%" my="15%" onPress={() => onSelectRun("board")}>
        {t("validateBoard")}
      </Button>
      <Button h="30%" my="15%" onPress={() => onSelectRun("die")}>
        {t("validateDie")}
      </Button>
    </VStack>
  );
}

function SelectDieTypePage({
  onSelectDieType: onSelectType,
  onBack,
}: {
  onSelectDieType: (type: DieType) => void;
  onBack?: () => void;
}) {
  const { t } = useTranslation();
  return (
    <VStack w="100%" h="100%" p="2" bg={useBackgroundColor()}>
      <VStack h="90%" p="2" justifyContent="center">
        {DieTypes.map((dt) => (
          <Button key={dt} my="2" onPress={() => onSelectType(dt)}>
            {t(dt)}
          </Button>
        ))}
      </VStack>
      <Button m="2" onPress={onBack}>
        {t("back")}
      </Button>
    </VStack>
  );
}

type CameraStatus =
  | "initializing"
  | "needPermission"
  | "noParallelVideoProcessing"
  | "ready";

function DecodePage({
  onDecodedPixelId,
  validationRun,
  dieType,
  onBack,
}: {
  onDecodedPixelId: (pixelId: number) => void;
  validationRun: ValidationRun;
  dieType: DieType;
  onBack?: () => void;
}) {
  const { t } = useTranslation();
  const errorHandler = useErrorHandler();

  // TODO
  // - show message if no blinking colors detected
  // - show button to scan
  // - remove timeout
  // setTimeout(() => onDecodedPixelId(1), 5000);

  // Camera
  const [cameraPermission, setCameraPermission] =
    useState<CameraPermissionStatus>();
  const devices = useCameraDevices("wide-angle-camera");
  const cameraRef = useRef<Camera>(null);

  // Camera permissions
  useEffect(() => {
    console.log("Requesting camera permission");
    Camera.requestCameraPermission().then((perm) => {
      console.log(`Camera permission: ${perm}`);
      setCameraPermission(perm);
      return perm;
    });
  }, []);

  // We use the back camera
  const device = devices.back;

  // Camera status
  const [cameraStatus, setCameraStatus] =
    useState<CameraStatus>("initializing");

  useEffect(() => {
    if (cameraPermission === "denied") {
      setCameraStatus("needPermission");
      errorHandler(new Error(t("needCameraPermission")));
    } else if (cameraPermission === "authorized" && device) {
      if (!device.supportsParallelVideoProcessing) {
        setCameraStatus("noParallelVideoProcessing");
        errorHandler(new Error(t("incompatibleCamera")));
      } else {
        setCameraStatus("ready");
      }
    }
  }, [cameraPermission, device, errorHandler, t]);

  // Frame processor for decoding PixelId
  const [frameProcessor, pixelId] = usePixelIdDecoderFrameProcessor();

  useEffect(() => {
    if (pixelId) {
      onDecodedPixelId(pixelId);
    }
  }, [onDecodedPixelId, pixelId]);

  const bg = useBackgroundColor();
  return (
    <>
      <Center w="100%" h="100%" bg={bg}>
        {device && cameraStatus === "ready" ? (
          <Camera
            ref={cameraRef}
            style={{
              width: "100%",
              height: "100%",
            }}
            device={device}
            isActive
            photo
            hdr={false}
            lowLightBoost={false}
            frameProcessor={frameProcessor}
            videoStabilizationMode="off"
            // format={format} TODO can't get camera to switch to given resolution
          />
        ) : (
          <Text>{t("startingCamera")}</Text>
        )}
        <Center position="absolute" top="0" w="94%" left="3" p="2" bg={bg}>
          <Text>Reset board / die using magnet</Text>
          <Text>and point at camera at it</Text>
        </Center>
        <Center position="absolute" bottom="0" w="94%" left="3" p="2" bg={bg}>
          <Text>{`Testing ${t(dieType)} ${validationRun}`}</Text>
          <Button w="100%" onPress={onBack}>
            {t("back")}
          </Button>
        </Center>
      </Center>
    </>
  );
}

interface TaskStatusComponentProps extends PropsWithChildren {
  title: string;
  taskStatus: TaskStatus;
  isSubTask?: boolean;
}

function getTaskResult(
  taskStatus: TaskStatus
): "succeeded" | "faulted" | "canceled" | undefined {
  switch (taskStatus) {
    case "succeeded":
    case "faulted":
    case "canceled":
      return taskStatus;
  }
}

function isTaskCompleted(taskStatus: TaskStatus) {
  return !!getTaskResult(taskStatus);
}

function getTaskStatusEmoji(taskStatus: TaskStatus): string {
  return taskStatus === "succeeded"
    ? "☑️"
    : taskStatus === "faulted"
    ? "❌"
    : taskStatus === "canceled"
    ? "⚠️"
    : "";
}

function TaskStatusComponent({
  children,
  title,
  taskStatus,
  isSubTask,
}: TaskStatusComponentProps) {
  return taskStatus === "pending" ? (
    <></>
  ) : (
    <VStack ml={isSubTask ? "10%" : undefined}>
      <HStack>
        <Center w="10%">
          {taskStatus === "running" ? (
            <Spinner />
          ) : (
            <Text>{getTaskStatusEmoji(taskStatus)}</Text>
          )}
        </Center>
        <Text fontWeight={isSubTask ? "normal" : undefined}>{title}</Text>
      </HStack>
      {children}
    </VStack>
  );
}

function createTaskStatusComponent(
  title: string,
  children?: ReactNode
): TaskRenderer {
  return (props) => (
    <TaskStatusComponent title={title} taskStatus={props.status} isSubTask>
      {children}
    </TaskStatusComponent>
  );
}

interface TaskGroupComponentProps extends PropsWithChildren {
  title: string;
  taskStatus: TaskStatus;
}

function TaskGroupComponent({
  children,
  title,
  taskStatus,
}: TaskGroupComponentProps) {
  return (
    <Center w="100%" py="3">
      <Box
        bg="coolGray.600"
        w="95%"
        borderColor="warmGray.400"
        borderWidth="2"
        p="2"
        rounded="md"
      >
        <TaskStatusComponent title={title} taskStatus={taskStatus} />
        {taskStatus !== "succeeded" && <VStack>{children}</VStack>}
      </Box>
    </Center>
  );
}

interface ConnectPixelProps extends TaskComponentProps {
  pixelId: number;
  testInfo: TestInfo;
  onPixelScanned: (pixel: ScannedPixel) => void;
  onPixelConnected: (pixel: Pixel) => void;
}

function ConnectPixel({
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

interface ValidationTestProps extends TaskComponentProps {
  pixel: Pixel;
  testInfo: TestInfo;
}

function CheckBoard({ action, onTaskStatus, pixel }: ValidationTestProps) {
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

function CheckLeds({
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

function FlickBoard({
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

function WaitFaceUp({
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
          Place Die with blinking face up
        </Text>
      )}
      {taskChain.render()}
    </TaskGroupComponent>
  );
}

function UpdateFirmware({
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

function PrepareDie({
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

function WaitTurnOff({
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

function TestsPage({
  pixelId,
  testInfo,
  onResult,
}: {
  pixelId: number;
  testInfo: TestInfo;
  onResult?: (result: "succeeded" | "faulted" | "canceled") => void;
}) {
  const { t } = useTranslation();
  const [pixel, setPixel] = useState<Pixel>();
  const [scannedPixel, setScannedPixel] = useState<ScannedPixel>();
  const [cancel, setCancel] = useState(false);
  const taskChain = useTaskChain(
    cancel ? "cancel" : "run",
    ...useTestComponent("ConnectPixel", cancel, (p) => (
      <ConnectPixel
        {...p}
        pixelId={pixelId}
        testInfo={testInfo}
        onPixelScanned={setScannedPixel}
        onPixelConnected={setPixel}
      />
    ))
  )
    .chainWith(
      ...useTestComponent("CheckBoard", cancel, (p) => (
        <>{pixel && <CheckBoard {...p} pixel={pixel} testInfo={testInfo} />}</>
      ))
    )
    .chainWith(
      ...useTestComponent("FlickBoard", cancel, (p) => (
        <>{pixel && <FlickBoard {...p} pixel={pixel} testInfo={testInfo} />}</>
      ))
    )
    .chainWith(
      ...useTestComponent("CheckLeds", cancel, (p) => (
        <>{pixel && <CheckLeds {...p} pixel={pixel} testInfo={testInfo} />}</>
      ))
    );
  if (testInfo.validationRun === "board") {
    taskChain.chainWith(
      // eslint-disable-next-line react-hooks/rules-of-hooks
      ...useTestComponent("UpdateFirmware", cancel, (p) => (
        <>
          {scannedPixel && (
            <UpdateFirmware {...p} address={scannedPixel.address} />
          )}
        </>
      ))
    );
  } else {
    taskChain
      .chainWith(
        // eslint-disable-next-line react-hooks/rules-of-hooks
        ...useTestComponent("WaitFaceUp", cancel, (p) => (
          <>
            {pixel && <WaitFaceUp {...p} pixel={pixel} testInfo={testInfo} />}
          </>
        ))
      )
      .chainWith(
        // eslint-disable-next-line react-hooks/rules-of-hooks
        ...useTestComponent("PrepareDie", cancel, (p) => (
          <>
            {pixel && <PrepareDie {...p} pixel={pixel} testInfo={testInfo} />}
          </>
        ))
      )
      .chainWith(
        // eslint-disable-next-line react-hooks/rules-of-hooks
        ...useTestComponent("ConnectPixel", cancel, (p) => (
          <ConnectPixel
            {...p}
            pixelId={pixelId}
            testInfo={testInfo}
            onPixelScanned={setScannedPixel}
            onPixelConnected={setPixel}
          />
        ))
      )
      .chainWith(
        // eslint-disable-next-line react-hooks/rules-of-hooks
        ...useTestComponent("WaitTurnOff", cancel, (p) => (
          <>
            {pixel && <WaitTurnOff {...p} pixel={pixel} testInfo={testInfo} />}
          </>
        ))
      );
  }

  const result = getTaskResult(taskChain.status);
  const onOkCancel = () => {
    if (result) {
      onResult?.(result);
    } else {
      setCancel(true);
      onResult?.("canceled");
    }
  };
  const scrollRef = useRef<any>();
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollToEnd();
    }
  });
  return (
    <Center w="100%" h="100%" p="2%" bg={useBackgroundColor()}>
      <Text>{`Testing ${t(testInfo.dieType)} ${testInfo.validationRun}`}</Text>
      {/* TODO scroll view should expand */}
      <ScrollView w="100%" ref={scrollRef}>
        <>{taskChain.render()}</>
        {result && (
          <Text mb="10%" fontSize={150} textAlign="center">
            {getTaskStatusEmoji(taskChain.status)}
          </Text>
        )}
      </ScrollView>
      <Button w="100%" onPress={onOkCancel}>
        {result ? t("ok") : t("cancel")}
      </Button>
    </Center>
  );
}

function ValidationPage() {
  const [validationRun, setValidationRun] = useState<ValidationRun>();
  const [dieType, setDieType] = useState<DieType>();
  const [pixelId, setPixelId] = useState(0);
  const navigation = useNavigation();

  return !validationRun ? (
    <SelectValidationRunPage
      onSelectRun={setValidationRun}
      onBack={() => navigation.goBack()}
    />
  ) : !dieType ? (
    <SelectDieTypePage
      onSelectDieType={setDieType}
      onBack={() => setValidationRun(undefined)}
    />
  ) : !pixelId ? (
    <DecodePage
      validationRun={validationRun}
      dieType={dieType}
      onDecodedPixelId={(pixelId) => {
        console.log("Decoded PixelId:", pixelId);
        setPixelId(pixelId);
      }}
      onBack={() => setDieType(undefined)}
    />
  ) : (
    <TestsPage
      testInfo={{ validationRun, dieType }}
      pixelId={pixelId}
      onResult={(result) => {
        console.log("Validation tests result:", result);
        setPixelId(0);
      }}
    />
  );
}

function useBackgroundColor() {
  return useColorModeValue("warmGray.100", "coolGray.800");
}

const theme = extendTheme({
  components: {
    Text: {
      baseStyle: {
        fontSize: "2xl",
        fontWeight: "bold",
        _dark: {
          color: "warmGray.200",
        },
        _light: {
          color: "coolGray.700",
        },
      },
    },
    Button: {
      variants: {
        solid: {
          _dark: {
            bg: "coolGray.600",
            _pressed: {
              bg: "coolGray.700",
            },
            _text: {
              color: "warmGray.200",
            },
          },
          _light: {
            bg: "warmGray.300",
            _pressed: {
              bg: "warmGray.200",
            },
            _text: {
              color: "coolGray.700",
            },
          },
        },
      },
      defaultProps: {
        size: "lg",
        _text: {
          fontSize: "2xl",
        },
      },
    },
  },
  config: {
    initialColorMode: "dark",
  },
});

export default function () {
  return (
    <AppPage style={{ flex: 1 }}>
      <NativeBaseProvider theme={theme} config={{ strictMode: "error" }}>
        <ValidationPage />
      </NativeBaseProvider>
    </AppPage>
  );
}
/*
// Our standard colors
const Colors = {
  dark: "#100F1E",
  light: "#1E213A",
  accent: "#6A78FF",
  text: "#8194AE",
  lightText: "#D1D1D1",
  darkText: "#536077",
} as const;

const styles = StyleSheet.create({
  //...globalStyles,
  container: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: Colors.dark,
    padding: sr(8),
  },
  containerHoriz: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  containerFooter: {
    height: sr(50),
    bottom: sr(50),
    width: "100%",
    position: "absolute",
  },
  camera: {
    flex: 1,
  },
  button: {
    flex: 1,
    backgroundColor: Colors.light,
    padding: sr(5),
    margin: sr(5),
    borderRadius: sr(5),
  },
  buttonText: {
    fontSize: sr(22),
    color: Colors.lightText,
  },
  statusText: {
    fontSize: sr(40),
    color: Colors.text,
    alignSelf: "center",
  },
  deviceIdText: {
    fontSize: sr(25),
    color: Colors.lightText,
    fontStyle: "italic",
    alignSelf: "center",
    paddingBottom: sr(10),
  },
  infoText: {
    fontSize: sr(25),
    color: Colors.text,
    alignSelf: "center",
  },
  scanColorIndicator: {
    position: "absolute",
    top: sr(10),
    left: sr(10),
    width: sr(40),
    height: sr(40),
  },
});
*/
