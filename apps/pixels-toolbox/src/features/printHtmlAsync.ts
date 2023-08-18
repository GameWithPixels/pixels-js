import * as FileSystem from "expo-file-system";
import * as Print from "expo-print";
import { Platform } from "react-native";
import RNFS from "react-native-fs";

import { requestUserFileAsync } from "~/features/files/requestUserFileAsync";
import { shareFileAsync } from "~/features/shareFileAsync";

/**
 * Print label with actual printer or to PDF file.
 * @param opt.width Width of the single page in pixels.
 *                  Defaults to `612` which is the width of US Letter paper format with 72 PPI.
 * @param opt.height Height of the single page in pixels.
 *                   Defaults to `792` which is the height of US Letter paper format with 72 PPI.
 * @param opt.pdf Whether to print to a PDF file instead of using an actual printer.
 */
export async function printHtmlAsync(
  html: string,
  opt?: {
    width?: number;
    height?: number;
    pdf?: boolean;
  }
): Promise<void> {
  const width = opt?.width;
  const height = opt?.height;
  const pdf = opt?.pdf ?? false;

  const print = pdf ? Print.printToFileAsync : Print.printAsync;
  const result = await print({ html, width, height });

  // Export file if printed to pdf
  if (result?.uri) {
    try {
      if (Platform.OS === "android") {
        const uri = await requestUserFileAsync("sticker.pdf");
        await RNFS.copyFile(result.uri, uri);
      } else {
        await shareFileAsync(result.uri);
      }
    } finally {
      // Delete generated file
      await FileSystem.deleteAsync(result.uri, { idempotent: true });
    }
  }
}
