import { getTimeStringMs } from "~/features/utils";

export function log(
  action: "add" | "update" | "remove" | "reset",
  type:
    | "template"
    | "profile"
    | "animation"
    | "pattern"
    | "gradient"
    | "audioClip",
  uuid: string,
  message?: string
) {
  if (__DEV__) {
    console.log(
      `[${getTimeStringMs()}] Store Write ${action} ${type}: ${uuid} ${
        message ?? ""
      }`
    );
  }
}
