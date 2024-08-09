import { ScannedChargerNotifier } from "./ScannedChargerNotifier";

// Keep list of notifiers a separate file so it is not reloaded by Fast Refresh after a change in Central
export const ScannedChargerNotifiersMap = new Map<
  number,
  ScannedChargerNotifier
>();
