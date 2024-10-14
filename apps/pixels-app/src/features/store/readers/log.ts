export function log(
  action: "create" | "update",
  type: "profile" | "animation" | "pattern" | "gradient" | "audioClip",
  uuid: string,
  message?: string
) {
  if (__DEV__) {
    console.log(`Store Load ${action} ${type}: ${uuid} ${message ?? ""}`);
  }
}
