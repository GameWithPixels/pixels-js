import {
  AppPage,
  BatteryLevel,
  Card,
  Pxtheme,
  Toggle,
} from "@systemic-games/react-native-pixels-components";
import React from "react";

export default function HomeScreen() {
  return (
    <AppPage theme={Pxtheme}>
      <Card />
      <Card />
      <Toggle text="Hello home screen toggle" />
      <BatteryLevel percentage={69} iconSize="16" />
      <Card />
    </AppPage>
  );
}
