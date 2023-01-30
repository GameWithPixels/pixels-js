import { Central } from "@systemic-games/react-native-bluetooth-le";

export async function initializeBle() {
  await Central.initialize();
}

export async function shutdownBle() {
  await Central.shutdown();
}

export { default as PixelScanner } from "./PixelScanner";
export * from "./PixelScanner";
export { default as PixelScanNotifier } from "./PixelScanNotifier";
export * from "./PixelScanNotifier";
export { type default as ScannedPixel } from "./ScannedPixel";
export { default as getPixel } from "./getPixel";

export { default as useFocusPixelScanner } from "./hooks/useFocusPixelScanner";
export * from "./hooks/useFocusPixelScanner";

export { default as usePixelScanner } from "./hooks/usePixelScanner";
export * from "./hooks/usePixelScanner";

export * from "@systemic-games/pixels-core-connect";
export * from "@systemic-games/pixels-core-animation";
export * from "@systemic-games/pixels-react";
