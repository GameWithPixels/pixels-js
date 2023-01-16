import { Central } from "@systemic-games/react-native-bluetooth-le";

export { default as PixelScanner } from "./PixelScanner";
export * from "./PixelScanner";
export { type default as ScannedPixel } from "./ScannedPixel";
export { default as getPixel } from "./getPixel";

export * from "@systemic-games/pixels-core-connect";
export * from "@systemic-games/pixels-core-animation";

export async function initializeBle() {
  await Central.initialize();
}

export async function shutdownBle() {
  await Central.shutdown();
}
