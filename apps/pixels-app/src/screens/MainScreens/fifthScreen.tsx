import {
  BaseAppPage,
  Card,
  PixelTheme,
  Toggle,
} from "@systemic-games/react-native-pixels-components";
import { VStack } from "native-base";
import React from "react";

export default function SecondScreen() {
  return (
    <BaseAppPage theme={PixelTheme}>
      <VStack space={4}>
        <Card />
        <Card />
        <Toggle text="Hello second screen toggle" />
        <Card />
        <Card />
      </VStack>
    </BaseAppPage>
  );
}
