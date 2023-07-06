import {
  getImageRgbAverages,
  ImageRgbAverages,
} from "@systemic-games/vision-camera-rgb-averages";
import React from "react";
import { StyleSheet, View, Text, Platform, SafeAreaView } from "react-native";
import { runOnJS } from "react-native-reanimated";
import {
  Camera,
  CameraDeviceFormat,
  CameraPermissionStatus,
  FrameProcessorPerformanceSuggestion,
  useCameraDevices,
  useFrameProcessor,
} from "react-native-vision-camera";

function getMaxFps(format: CameraDeviceFormat): number {
  if (!format.frameRateRanges.length) {
    return 0;
  }
  return format.frameRateRanges.reduce((prev, curr) =>
    curr.maxFrameRate > prev.maxFrameRate ? curr : prev
  ).maxFrameRate;
}

function CameraScreen() {
  const [cameraPermission, setCameraPermission] =
    React.useState<CameraPermissionStatus>();
  const devices = useCameraDevices("wide-angle-camera");
  const cameraRef = React.useRef<Camera>(null);

  React.useEffect(() => {
    console.log("Requesting camera permission");
    Camera.requestCameraPermission().then((perm) => {
      console.log(`Camera permission: ${perm}`);
      setCameraPermission(perm);
      return perm;
    });
  }, []);

  const [stats, setStats] = React.useState<
    ImageRgbAverages & { durationAverage: number; fps: number }
  >();
  const trackingDataRef = React.useRef<{
    startTime: number;
    totalDuration: number;
    numFrames: number;
    lastUpdate: number;
  }>();

  const processRgbAverages = React.useCallback(
    (rgbAverages: ImageRgbAverages) => {
      // Store tracking data in React Ref value
      if (!trackingDataRef.current) {
        trackingDataRef.current = {
          startTime: Date.now(),
          totalDuration: 0,
          numFrames: 0,
          lastUpdate: 0,
        };
      }
      // Update tracking
      const data = trackingDataRef.current;
      data.totalDuration += rgbAverages.duration;
      data.numFrames += 1;
      // Update stats every second
      if (data.lastUpdate + 1000 < Date.now()) {
        data.lastUpdate = Date.now();
        setStats({
          ...rgbAverages,
          durationAverage: data.totalDuration / data.numFrames,
          fps: Math.round(
            (1000 * data.numFrames) / (Date.now() - data.startTime)
          ),
        });
      }
    },
    []
  );

  // Get the average R, G and B for each image captured by the camera
  const frameProcessor = useFrameProcessor(
    (frame) => {
      "worklet";
      const result = getImageRgbAverages(frame, {
        maxPixelsToProcess: 480 * 320, // Limit number of processed pixels for performance reason
        writeImage: false,
        writePlanes: false,
      });
      if (typeof result === "string") {
        console.error(
          `Error in frame processor "getImageRgbAverages": ${result}`
        );
      } else {
        runOnJS(processRgbAverages)(result);
      }
    },
    [processRgbAverages]
  );

  const onSuggestion = React.useCallback(
    (suggestion: FrameProcessorPerformanceSuggestion) =>
      console.log(
        `Got FPS suggestion: ${suggestion.type} ${suggestion.suggestedFrameProcessorFps}`
      ),
    []
  );

  const device = devices.back;

  // Select format base on those parameters
  const desiredFPS = 60;
  const desiredWidth = 1280;
  const desiredHeight = 720;
  const format = React.useMemo(() => {
    if (device) {
      const colorSpace = Platform.OS === "android" ? "yuv" : "srgb";
      const checkFormat = (f: CameraDeviceFormat) =>
        f.videoWidth === desiredWidth &&
        f.videoHeight === desiredHeight &&
        f.colorSpaces[0] === colorSpace &&
        getMaxFps(f) >= desiredFPS;
      // Favor 420f (for full) over 420v (for video) because it has a larger range
      const format420f = device.formats
        .filter((f) => checkFormat(f) && f.pixelFormat === "420f")
        .sort((a, b) => getMaxFps(b) - getMaxFps(a))[0];
      const format420v = device.formats
        .filter((f) => checkFormat(f) && f.pixelFormat === "420v")
        .sort((a, b) => getMaxFps(b) - getMaxFps(a))[0];
      const format = format420f ?? format420v;
      if (format && Platform.OS === "android") {
        // Workaround with React Native Camera Vision issue on Android
        // that requires dimensions for portrait rather than landscape
        format.photoWidth = desiredHeight;
        format.photoHeight = desiredWidth;
        format.videoWidth = desiredHeight;
        format.videoHeight = desiredWidth;
      }
      if (format) {
        const f = format;
        console.log(
          `Selected format: video:${f.videoWidth}x${f.videoHeight}, photo=${
            f.photoWidth
          }x${f.photoHeight}, max fps: ${getMaxFps(f)}, pixel format: ${
            f.pixelFormat
          }, color space: ${f.colorSpaces[0]}`
        );
      } else {
        console.warn("Couldn't find a matching format");
      }
      return format;
    }
  }, [device]);

  if (!cameraPermission || !device) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>Loading...</Text>
      </View>
    );
  } else {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>Camera view should be displayed below</Text>
        <Camera
          ref={cameraRef}
          style={styles.camera}
          device={device}
          format={format}
          fps={desiredFPS}
          frameProcessorFps={desiredFPS}
          isActive
          frameProcessor={frameProcessor}
          onFrameProcessorPerformanceSuggestionAvailable={onSuggestion}
        />
        {stats && (
          <View style={styles.statsOverlay}>
            <Text style={styles.text}>{`Red: ${stats.redAverage}`}</Text>
            <Text style={styles.text}>{`Green: ${stats.greenAverage}`}</Text>
            <Text style={styles.text}>{`Blue: ${stats.blueAverage}`}</Text>
            <Text
              style={styles.text}
            >{`Duration: ${stats.durationAverage.toFixed(3)} ms`}</Text>
            <Text style={styles.text}>{`FPS: ${stats.fps}`}</Text>
            <Text
              style={styles.text}
            >{`Image: ${stats.imageWidth}x${stats.imageHeight}`}</Text>
            <Text
              style={styles.text}
            >{`Sub-sampling: ${stats.widthSubSampling}x${stats.heightSubSampling}`}</Text>
          </View>
        )}
      </View>
    );
  }
}

export default function App() {
  return (
    <SafeAreaView style={styles.container}>
      <CameraScreen />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "darkgrey",
  },
  camera: {
    flex: 1,
  },
  text: {
    fontSize: 20,
    color: "black",
  },
  statsOverlay: {
    position: "absolute",
    top: 50,
    left: 10,
    padding: 10,
    backgroundColor: "darkgrey",
  },
});
