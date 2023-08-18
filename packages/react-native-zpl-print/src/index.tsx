import { NativeModules, Platform } from "react-native";

const LINKING_ERROR =
  `The package '@systemic-games/react-native-zpl-print' doesn't seem to be linked. Make sure: \n\n` +
  Platform.select({ ios: "- You have run 'pod install'\n", default: "" }) +
  "- You rebuilt the app after installing the package\n" +
  "- You are not using Expo Go\n";

const ZplPrint = NativeModules.ZplPrint
  ? NativeModules.ZplPrint
  : new Proxy(
      {},
      {
        get() {
          throw new Error(LINKING_ERROR);
        },
      }
    );

export function printHtmlToZpl(
  printerName: string,
  html: string,
  imageWidth?: number, // In pixels
  blacknessThreshold?: number // 0 to 1
): Promise<string> {
  return ZplPrint.printHtml(
    printerName,
    html,
    imageWidth ?? 0,
    blacknessThreshold ?? 0.3
  );
}
