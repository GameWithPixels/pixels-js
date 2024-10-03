import { Charger, Pixel } from "@systemic-games/pixels-core-connect";

import { ScannedBootloaderNotifier } from "./ScannedBootloaderNotifier";
import { ScannedChargerNotifier } from "./ScannedChargerNotifier";
import { ScannedPixelNotifier } from "./ScannedPixelNotifier";

// Keep these lists in a separate file so it is not reloaded by Fast Refresh after a change in Central

// TODO add Bootloader device type
export const DevicesMap = new Map<string, Pixel | Charger>();

export const NotifiersMap = new Map<
  number,
  ScannedPixelNotifier | ScannedChargerNotifier | ScannedBootloaderNotifier
>();
