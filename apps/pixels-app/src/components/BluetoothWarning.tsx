import { useBluetoothState } from "@systemic-games/react-native-pixels-connect";
import React from "react";
import { Card, Text } from "react-native-paper";

export function BluetoothStateWarning({ children }: React.PropsWithChildren) {
  const bluetoothState = useBluetoothState();
  const unauthorized = bluetoothState === "unauthorized";
  return bluetoothState === "ready" ? (
    children ? (
      <>{children}</>
    ) : null
  ) : (
    <Card style={{ width: "100%" }}>
      <Card.Title
        title={
          "❌ " +
          (unauthorized
            ? "Bluetooth is not authorized"
            : "Bluetooth is not enabled")
        }
      />
      <Card.Content>
        <Text variant="bodyMedium">
          {unauthorized
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
