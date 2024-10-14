import * as Application from "expo-application";

export function isDevApp() {
  return Application.applicationId?.includes("dev");
}
