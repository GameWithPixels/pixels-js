import { useFocusEffect } from "@react-navigation/native";
import { DfuState } from "@systemic-games/react-native-nordic-nrf5-dfu";
import {
  Color,
  MessageTypeValues,
  Pixel,
  PixelRollStateValues,
} from "@systemic-games/react-native-pixels-connect";
import { getImageRgbAverages } from "@systemic-games/vision-camera-rgb-averages";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useErrorHandler } from "react-error-boundary";
import {
  StyleSheet,
  Text,
  View,
  // eslint-disable-next-line import/namespace
} from "react-native";
import { runOnJS } from "react-native-reanimated";
import {
  Camera,
  CameraDevice,
  CameraPermissionStatus,
  useCameraDevices,
  useFrameProcessor,
} from "react-native-vision-camera";

import dfuFiles from "~/../assets/factory-dfu-files.zip";
import TelemetryStats from "~/TelemetryStats";
import AppPage from "~/components/AppPage";
import Button from "~/components/Button";
import ProgressBar from "~/components/ProgressBar";
import delay from "~/delay";
import getDfuFileInfo from "~/getDfuFileInfo";
import runValidationTests from "~/runValidationTests";
import standardProfile from "~/standardProfile";
import { sr } from "~/styles";
import toLocaleDateTimeString from "~/toLocaleDateTimeString";
import updateFirmware from "~/updateFirmware";
import useDfuFiles from "~/useDfuFiles";
import usePixelBattery from "~/usePixelBattery";
import usePixelConnector from "~/usePixelConnector";
import usePixelIdDecoder from "~/usePixelIdDecoder";
import usePixelRssi from "~/usePixelRssi";
import usePixelTelemetry from "~/usePixelTelemetry";

function assert(condition: any, msg?: string): asserts condition {
  if (!condition) {
    throw new Error(msg ?? "Assertion error");
  }
}

async function checkFaceUp(pixel: Pixel, face: number, timeout = 30000) {
  assert(face > 0);
  try {
    const abortTime = Date.now() + timeout;

    await pixel.blink(Color.dimMagenta, {
      count: timeout / 2000,
      duration: 30000,
      faceMask: 1 << (face - 1),
    });

    const checkFace = async () => {
      let rollState = await pixel.getRollState();
      while (
        rollState.state !== PixelRollStateValues.OnFace ||
        rollState.faceIndex !== face - 1
      ) {
        await delay(0.5);
        rollState = await pixel.getRollState();
        if (Date.now() > abortTime) {
          throw new Error(`Timeout waiting for face ${face} up`);
        }
      }
    };
    await checkFace();
  } finally {
    try {
      await pixel.stopAllAnimations();
    } catch {}
  }
}

async function finalSetup(
  pixel: Pixel,
  transferProgressCallback?: (progress: number) => void
) {
  transferProgressCallback?.(-1);

  // Upload profile
  try {
    await pixel.transferDataSet(standardProfile, transferProgressCallback);
  } finally {
    transferProgressCallback?.(-1);
  }

  // Rename
  //await pixel.rename("Pixel");

  // Back out validation mode
  pixel.sendMessage(MessageTypeValues.ExitValidation);
}

type AppStatuses =
  | "Initializing..."
  | "Identifying..."
  | "Searching..."
  | "Connecting..."
  | "Testing..."
  | "Test Passed"
  | "Test Failed";

function ValidationPage() {
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

export default function () {
  return (
    <AppPage style={styles.container}>
      <ValidationPage />
    </AppPage>
  );
}

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
