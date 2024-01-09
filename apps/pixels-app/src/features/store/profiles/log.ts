export function log(
  action: "create" | "update",
  type: "profile" | "animation" | "pattern" | "gradient" | "audioClip",
  uuid: string,
  message?: string
) {
  console.log(`STORE LOAD ${action} ${type}: ${uuid} ${message ?? ""}`);
}
