import { useBluetoothState } from "@systemic-games/react-native-pixels-connect";
import React from "react";
import { StyleProp, ViewStyle } from "react-native";
import { Card, Text } from "react-native-paper";

export function BluetoothStateWarning({
  children,
  style,
}: React.PropsWithChildren<{
  style?: StyleProp<ViewStyle>; // ViewProps["style"]
}>) {
  const bluetoothState = useBluetoothState();
  // Render children if Bluetooth is ready or unknown. The later is reported
  // when the app hasn't yet initialized Central, so we don't want to allow
  // the children to render and try a scan or else that will initialize Central.
  return bluetoothState === "ready" || bluetoothState === "unknown" ? (
    children ? (
      <>{children}</>
    ) : null
  ) : (
    <Card style={[{ width: "100%" }, style]}>
      <Card.Title
        title={
          "❌ " +
          (bluetoothState === "unauthorized"
            ? "Bluetooth is not authorized"
            : "Bluetooth is not enabled")
        }
      />
      <Card.Content>
        <Text variant="bodyMedium">
          {bluetoothState === "unauthorized"
            ? "The Pixels app does not have Bluetooth access and is unable " +
              "to connect to your dice. Please grant permissions through your " +
              "device settings."
            : "Bluetooth doesn't appear to be turned on. Please enable Bluetooth " +
              "through your device settings."}
        </Text>
      </Card.Content>
    </Card>
  );
}
