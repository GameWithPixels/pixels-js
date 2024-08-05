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

/** Options for {@link printHtmlToZpl} */
interface PrintHtmlToZplOptions {
  /** Generated image width in pixels. */
  imageWidth?: number;
  /** Whether to run the HTML's embedded JavaScript code */
  enableJs?: boolean;
  /** Blackness threshold value, between 0 and 1. */
  blacknessThreshold?: number;
  /** Number of copies to print. */
  numCopies?: number;
}

/**
 * Print the given HTML to a paired Bluetooth printer.
 * @param printerName Prefix for the paired Bluetooth printer's name
 *                    (print will fail if more than one printer has that prefix).
 * @param html The HTML content to print.
 * @param opt See {@link PrintHtmlToZplOptions}.
 * @returns The operation result as a string.
 */
export function printHtmlToZpl(
  printerName: string,
  html: string,
  opt?: PrintHtmlToZplOptions
): Promise<string> {
  return ZplPrint.printHtml(
    printerName,
    html,
    opt?.imageWidth ?? 0,
    opt?.enableJs ?? false,
    opt?.blacknessThreshold ?? 0.3,
    opt?.numCopies ?? 1
  );
}
