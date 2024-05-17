import { PixelInfo } from "@systemic-games/react-native-pixels-connect";

export type ActionMakeWebRequestPayload = Readonly<{
  pixelName: string;
  profileName: string;
  actionValue: string;
  faceValue: number;
}>;

export function getWebRequestPayload(
  pixel: Pick<PixelInfo, "name" | "currentFace">,
  profileName: string,
  actionValue: string
): ActionMakeWebRequestPayload {
  return {
    pixelName: pixel.name,
    profileName,
    actionValue,
    faceValue: pixel.currentFace,
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
