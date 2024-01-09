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
  console.log(`STORE WRITE ${action} ${type}: ${uuid} ${message ?? ""}`);
}
