import {
  PxAppPage,
  BatteryLevel,
  Card,
  ColorSelection,
  FaceMask,
  ProgressBar,
  PixelTheme,
  SliderComponent,
  Toggle,
  createPixelTheme,
  LightingStyleSelection,
  PixelInfoComponent,
  PixelInfo,
} from "@systemic-games/react-native-pixels-components";
import { Button, HStack, Text, VStack } from "native-base";
import React from "react";

import { useAppDispatch, useAppSelector } from "~/app/hooks";
import { setDarkMode, setLightMode } from "~/features/themeModeSlice";

function ReduxExample() {
  const appDispatch = useAppDispatch();
  const { themeMode } = useAppSelector((state) => state.themeMode);
  return (
    <HStack>
      <Text>{themeMode}</Text>
      <Button onPress={() => appDispatch(setLightMode())}>Light</Button>
      <Button onPress={() => appDispatch(setDarkMode())}>Dark</Button>
    </HStack>
  );
}

const greenPixelThemeParams = {
  theme: PixelTheme,
  primaryColors: {
    "50": "#7eff7b",
    "100": "#56ff54",
    "200": "#2fff2c",
    "300": "#10f70c",
    "400": "#0ad507",
    "500": "#0fb80c",
    "600": "#129d10",
    "700": "#148312",
    "800": "#146a13",
    "900": "#135312",
  },
};

const pixel: PixelInfo = {
  name: "Brookly",
  rssi: 100,
  batteryLevel: 100,
  ledCount: 20,
  firmwareDate: new Date(),
  profileName: "Arsène",
};
// const pixels: PixelInfo[] = [
//   {
//     name: "Bob",
//     rssi: -60,
//     batteryLevel: 0.85,
//     ledCount: 20,
//     firmwareDate: new Date(),
//     profileName: "Rainbow",
//   },
//   {
//     name: "Sarah",
//     rssi: -54,
//     batteryLevel: 0.5,
//     ledCount: 8,
//     firmwareDate: new Date(),
//     profileName: "Custom",
//   },
//   {
//     name: "Luke",
//     rssi: -45,
//     batteryLevel: 0.15,
//     ledCount: 12,
//     firmwareDate: new Date(),
//     profileName: "Speak Numbers",
//   },
// ];

const greenPixelTheme = createPixelTheme(greenPixelThemeParams);
export default function HomeScreen() {
  return (
    <PxAppPage theme={greenPixelTheme}>
      <VStack space={4}>
        <Card>
          <Text bold>Screen with custom theme from components package</Text>
        </Card>
        <Card>
          <HStack alignItems="center" space={2}>
            <Text> Battery level : </Text>
            <BatteryLevel percentage={100} iconSize="10" />
          </HStack>
        </Card>
        <Card>
          <Toggle text="First screen toggle" />
        </Card>
        <ColorSelection />
        <PixelInfoComponent pixel={pixel} />
        <ReduxExample />
        <ReduxExample />
        <LightingStyleSelection />
        <SliderComponent />
        <ProgressBar value={30} loadingText="Progress : " />
        <FaceMask diceFaces={20} />
      </VStack>
    </PxAppPage>
  );
}
