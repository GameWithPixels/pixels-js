export function storeLog(
  action: "create" | "update",
  type: "profile" | "animation" | "pattern" | "gradient" | "audioClip",
  uuid: string,
  message?: string
) {
  console.log(`FROM STORE ${action} ${type}: ${uuid} ${message ?? ""}`);
}
