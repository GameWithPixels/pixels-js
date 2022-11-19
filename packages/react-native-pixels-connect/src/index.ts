import { Central } from "@systemic-games/react-native-bluetooth-le";

import PixelScanner, { PixelScannerEventMap } from "./PixelScanner";
import type ScannedPixel from "./ScannedPixel";
import getPixel from "./getPixel";

export { type ScannedPixel };
export { PixelScanner, PixelScannerEventMap };
export { getPixel };

export * from "@systemic-games/pixels-core-connect";
export * from "@systemic-games/pixels-core-animation";

export async function initializeBle() {
  await Central.initialize();
}

export async function shutdownBle() {
  await Central.shutdown();
}
