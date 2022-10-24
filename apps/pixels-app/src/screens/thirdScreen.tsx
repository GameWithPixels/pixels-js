import {
  AppPage,
  Card,
  Pxtheme,
  Toggle,
} from "@systemic-games/react-native-pixels-components";
import { VStack } from "native-base";
import React from "react";

export default function ThirdScreen() {
  return (
    <AppPage theme={Pxtheme}>
      <VStack space={4}>
        <Card />
        <Card />
        <Toggle text="Hello third screen toggle" />
        <Card />
        <Card />
      </VStack>
    </AppPage>
  );
}
