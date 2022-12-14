import {
  BaseAppPage,
  Card,
  FaceMask,
  PixelTheme,
  RSSIStrength,
  Toggle,
  createPixelTheme,
} from "@systemic-games/react-native-pixels-components";
import { VStack, Text, HStack } from "native-base";
import React from "react";

const purpleThemeParams = {
  theme: PixelTheme,
  primaryColors: {
    "50": "#f67bff",
    "100": "#f454ff",
    "200": "#f12cff",
    "300": "#e80cf7",
    "400": "#c707d5",
    "500": "#ad0cb8",
    "600": "#93109d",
    "700": "#7b1283",
    "800": "#65136a",
    "900": "#4f1253",
  },
};

export default function ThirdScreen() {
  const purpleTheme = createPixelTheme(purpleThemeParams);
  return (
    <BaseAppPage theme={purpleTheme}>
      <VStack space={4}>
        <Card bg="pixelColors.yellow">
          <Text bold>
            Screen with custom theme from components package and custom colors
            overriding props
          </Text>
        </Card>
        <Card>
          <Toggle text="Third screen toggle" />
        </Card>
        <Card>
          <HStack alignItems="center">
            <Text>RSSI strength : </Text>
            <RSSIStrength percentage={92} />
          </HStack>
        </Card>
        <FaceMask bg="pixelColors.green" dieFaces={20} />
      </VStack>
    </BaseAppPage>
  );
}
