import {
  PxAppPage,
  BatteryLevel,
  Card,
  ColorSelection,
  FaceMask,
  ProgressBar,
  Pxtheme,
  SliderComponent,
  Toggle,
  UsePxTheme,
  PopUpModal,
} from "@systemic-games/react-native-pixels-components";
import { Box, HStack, Text, VStack } from "native-base";
import React from "react";

const newThemeParameters = {
  theme: Pxtheme,
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

export default function HomeScreen() {
  const newtheme = UsePxTheme(newThemeParameters);
  return (
    <PxAppPage theme={newtheme}>
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
        <PopUpModal
          trigger={
            <Box rounded="lg" p={2} bg="primary.700">
              <Text>Open popup</Text>
            </Box>
          }
        />
        <SliderComponent />
        <ProgressBar value={30} loadingText="Progress : " />
        <FaceMask diceFaces={20} />
      </VStack>
    </PxAppPage>
  );
}
