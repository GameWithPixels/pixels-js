export function storeLog(
  action: "create" | "update",
  type: "profile" | "animation" | "pattern" | "gradient" | "audioClip",
  uuid: string,
  message?: string
) {
  console.log(`STORE ${action} ${type}: ${uuid} ${message ?? ""}`);
}
