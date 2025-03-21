import { PixelInfo } from "@systemic-games/react-native-pixels-connect";
import * as Application from "expo-application";

export type WebRequestParams = Readonly<{
  timestamp: string;
  appVersion: string;
  appBuild: string;
  profileName: string;
  actionValue: string;
  pixelName: string;
  faceValue: number;
  faceIndex: number;
  firmwareTimestamp: number;
}> &
  Pick<
    PixelInfo,
    | "pixelId"
    | "ledCount"
    | "colorway"
    | "dieType"
    | "rssi"
    | "batteryLevel"
    | "isCharging"
    | "rollState"
  >;

export function buildWebRequestParams(
  pixel: Omit<PixelInfo, "systemId">,
  profileName: string,
  actionValue: string
): WebRequestParams {
  return {
    timestamp: new Date().toISOString(),
    appVersion: Application.nativeApplicationVersion ?? "0",
    appBuild: Application.nativeBuildVersion ?? "0",
    profileName,
    actionValue,
    pixelName: pixel.name,
    pixelId: pixel.pixelId,
    faceValue: pixel.currentFace,
    faceIndex: pixel.currentFaceIndex,
    ledCount: pixel.ledCount,
    colorway: pixel.colorway,
    dieType: pixel.dieType,
    firmwareTimestamp: pixel.firmwareDate.getTime(),
    rssi: pixel.rssi,
    batteryLevel: pixel.batteryLevel,
    isCharging: pixel.isCharging,
    rollState: pixel.rollState,
  };
}
