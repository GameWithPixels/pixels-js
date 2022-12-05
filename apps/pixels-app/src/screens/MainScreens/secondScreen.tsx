import {
  BaseAppPage,
  Card,
  FaceMask,
  PixelTheme,
  RSSIStrength,
  Toggle,
} from "@systemic-games/react-native-pixels-components";
import { VStack, Text, HStack } from "native-base";
import React from "react";

export default function SecondScreen() {
  return (
    <BaseAppPage theme={PixelTheme}>
      <VStack space={4}>
        <Card>
          <Text bold>Screen with default theme from components package</Text>
        </Card>
        <Card>
          <Toggle text="Second screen toggle" />
        </Card>
        <Card>
          <HStack alignItems="center">
            <Text>RSSI strength : </Text>
            <RSSIStrength percentage={20} />
          </HStack>
        </Card>
        <FaceMask dieFaces={20} />
      </VStack>
    </BaseAppPage>
  );
}
