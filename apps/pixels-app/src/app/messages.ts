import {
  BluetoothNotAuthorizedError,
  BluetoothUnavailableError,
} from "@systemic-games/react-native-pixels-connect";
import { Platform } from "react-native";

export function getBluetoothScanErrorMessage(
  scanError: Error,
  opt?: { withContinue?: boolean }
): string {
  return scanError instanceof BluetoothNotAuthorizedError
    ? "❌ The Pixels app does not have Bluetooth access and is unable " +
        "to connect to your dice. Please grant permissions through your " +
        "device settings." +
        (opt?.withContinue ? " Then tap the Continue button." : "")
    : scanError instanceof BluetoothUnavailableError
      ? "❌ Bluetooth doesn't appear to be turned on. Please enable Bluetooth " +
        "through your device settings and grant the Pixels app access." +
        (opt?.withContinue ? " Then tap the Continue button." : "")
      : `❌ Unexpected error trying to scan for Bluetooth devices. ${scanError}.`;
}

export function getNoAvailableDiceMessage(): string {
  return (
    "No available dice found so far. " +
    "Check that your dice are turned on and not connected to another device." +
    (Platform.OS === "android" && Platform.Version <= 10
      ? "\n\nPlease make sure to turn on the Location service on your device " +
        "to allow the app to scan for dice."
      : "")
  );
}
