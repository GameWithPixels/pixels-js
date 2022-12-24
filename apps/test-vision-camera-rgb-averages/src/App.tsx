import {
  getImageRgbAverages,
  ImageRgbAverages,
} from "@systemic-games/vision-camera-rgb-averages";
import * as React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
// eslint-disable-next-line import/namespace
import { StyleSheet, View, Text } from "react-native";
import { runOnJS } from "react-native-reanimated";
import {
  Camera,
  CameraPermissionStatus,
  useCameraDevices,
  useFrameProcessor,
} from "react-native-vision-camera";

// Notes:
// - Using alignContent or justifyContent on Camera parent View may cause the Camera to not render
// - Documents required config change to use that package (enableHermes, minSdkVersion, Gradle version, etc.)
//   https://mrousavy.com/react-native-vision-camera/docs/guides/troubleshooting/#android

export default function App() {
  const [cameraPermission, setCameraPermission] =
    useState<CameraPermissionStatus>();
  const devices = useCameraDevices("wide-angle-camera");
  const cameraRef = useRef<Camera>(null);

  useEffect(() => {
    console.log("Requesting camera permission");
    Camera.requestCameraPermission().then((perm) => {
      console.log(`Camera permission: ${perm}`);
      setCameraPermission(perm);
      return perm;
    });
  }, []);

  const processRgbAverages = useCallback((rgbAverages: ImageRgbAverages) => {
    console.log(rgbAverages);
  }, []);

  // Get the average R, G and B for each image captured by the camera
  const frameProcessor = useFrameProcessor(
    (frame) => {
      "worklet";
      try {
        const result = getImageRgbAverages(frame, {
          subSamplingX: 4,
          subSamplingY: 2,
          writeImage: false,
          writePlanes: false,
        });
        runOnJS(processRgbAverages)(result);
      } catch (error) {
        console.error(
          `Exception in frame processor "getImageRgbAverages": ${error}`
        );
      }
    },
    [processRgbAverages]
  );

  const device = devices.back;
  console.log(`Re-rendering Navigator, camera: ${cameraPermission}`);

  if (!cameraPermission || !device) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>Loading...</Text>
      </View>
    );
  } else {
    const showCamera = () => (
      <Camera
        ref={cameraRef}
        style={styles.camera}
        device={device}
        isActive
        frameProcessor={frameProcessor}
      />
    );

    return (
      <View style={styles.container}>
        <Text style={styles.text}>Camera view should be displayed below</Text>
        {showCamera()}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  text: {
    fontSize: 20,
  },
});
