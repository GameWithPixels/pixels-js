import { Platform, PermissionsAndroid } from "react-native";

export async function requestPermissions(): Promise<boolean> {
  let granted = false;
  // Ask for permissions on Android
  if (Platform.OS === "android") {
    const bleScan = PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN;
    if (Platform.Version <= 30 || !bleScan) {
      // For SDK 30 and below
      const fineLocation = PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION;
      if (fineLocation) {
        const status = await PermissionsAndroid.request(fineLocation);
        granted = status === PermissionsAndroid.RESULTS.GRANTED;
      }
    } else {
      // For SDK 31 and above
      const bleConnect = PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT;
      if (bleScan && bleConnect) {
        const status = await PermissionsAndroid.requestMultiple([
          bleScan,
          bleConnect,
        ]);
        granted =
          status[bleScan] === PermissionsAndroid.RESULTS.GRANTED &&
          status[bleConnect] === PermissionsAndroid.RESULTS.GRANTED;
      }
    }
  } else if (Platform.OS === "ios") {
    granted = true;
  }
  return granted;
}
