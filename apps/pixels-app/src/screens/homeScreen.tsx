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
} from "@systemic-games/react-native-pixels-components";
import { HStack, Text, VStack } from "native-base";
import React from "react";

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
        <LightingStyleSelection />
        <SliderComponent />
        <ProgressBar value={30} loadingText="Progress : " />
        <FaceMask diceFaces={20} />
      </VStack>
    </PxAppPage>
  );
}
