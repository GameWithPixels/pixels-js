// eslint-disable-next-line import/namespace
import { Platform, PermissionsAndroid } from "react-native";

export default async function (): Promise<boolean> {
  let granted = false;
  // Ask for permissions on Android
  if (Platform.OS === "android") {
    if (
      Platform.Version <= 30 ||
      !PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN
    ) {
      // For SDK 30 and below
      const status = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
      );
      granted = status === PermissionsAndroid.RESULTS.GRANTED;
    } else {
      // For SDK 31 and above
      const statusScan = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN
      );
      const statusConnect = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT
      );
      granted =
        statusScan === PermissionsAndroid.RESULTS.GRANTED &&
        statusConnect === PermissionsAndroid.RESULTS.GRANTED;
    }
  }
  return granted;
}
