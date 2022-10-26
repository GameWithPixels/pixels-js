import {
  ActionSheetComponent,
  AppPage,
  BatteryLevel,
  Card,
  ColorSelection,
  FaceMask,
  ProgressBar,
  Pxtheme,
  Toggle,
  UsePxTheme,
} from "@systemic-games/react-native-pixels-components";
import { HStack, Text, VStack } from "native-base";
import React from "react";

const primaryColors = {
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
};

export default function HomeScreen() {
  const newtheme = UsePxTheme(Pxtheme, primaryColors);
  return (
    <AppPage theme={newtheme}>
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
        <ProgressBar value={30} loadingText="Progress : " />
        <ActionSheetComponent title="Test sheet" />
        <FaceMask diceFaces={20} />
      </VStack>
    </AppPage>
  );
}
