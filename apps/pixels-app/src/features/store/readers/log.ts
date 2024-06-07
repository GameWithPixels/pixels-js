import { getTimeStringMs } from "~/features/utils";

export function log(
  action: "create" | "update",
  type: "profile" | "animation" | "pattern" | "gradient" | "audioClip",
  uuid: string,
  message?: string
) {
  if (__DEV__) {
    console.log(
      `[${getTimeStringMs()}] Store Load ${action} ${type}: ${uuid} ${
        message ?? ""
      }`
    );
  }
}
