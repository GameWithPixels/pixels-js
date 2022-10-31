import {
  BaseAppPage,
  Card,
  FaceMask,
  Pxtheme,
  RSSIStrength,
  Toggle,
} from "@systemic-games/react-native-pixels-components";
import { VStack, Text, HStack } from "native-base";
import React from "react";

export default function SecondScreen() {
  return (
    <BaseAppPage theme={Pxtheme}>
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
        <FaceMask diceFaces={20} />
      </VStack>
    </BaseAppPage>
  );
}
