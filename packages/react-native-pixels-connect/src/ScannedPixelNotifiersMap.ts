import { ScannedPixelNotifier } from "./ScannedPixelNotifier";

// Keep list of notifiers a separate file so it is not reloaded by Fast Refresh after a change in Central
export const ScannedPixelNotifiersMap = new Map<number, ScannedPixelNotifier>();
