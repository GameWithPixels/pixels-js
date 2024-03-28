import { logWrite as logWriteUntyped } from "../logWrite";

export function logWrite(
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
  logWriteUntyped(`${action} ${type}: ${uuid} ${message ?? ""}`);
}
