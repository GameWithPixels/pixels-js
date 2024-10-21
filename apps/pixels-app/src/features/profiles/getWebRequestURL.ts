import { PixelInfo } from "@systemic-games/react-native-pixels-connect";
import * as Application from "expo-application";

export type ActionMakeWebRequestPayload = Readonly<{
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

export function getWebRequestPayload(
  pixel: Omit<PixelInfo, "systemId">,
  profileName: string,
  actionValue: string
): ActionMakeWebRequestPayload {
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

export function getWebRequestURL(
  url: string,
  payload: ActionMakeWebRequestPayload
): string {
  function build(
    url: string,
    value1: string,
    value2: string,
    value3: string,
    value4: string
  ) {
    url = url.trim();
    const params = `value1=${value1}&value2=${value2}&value3=${value3}&value4=${value4}`;
    return `${url}${
      !url.includes("?") ? "?" : !url.endsWith("&") ? "&" : ""
    }${params}`;
  }
  return build(
    url,
    payload.pixelName,
    payload.actionValue,
    payload.faceValue.toString(),
    payload.profileName
  );
}
