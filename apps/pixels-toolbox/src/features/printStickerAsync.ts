import { Asset } from "expo-asset";
import * as FileSystem from "expo-file-system";
import * as Print from "expo-print";
import { Platform } from "react-native";
import RNFS from "react-native-fs";

// By default the sticker HTML is loaded from the same zip file that contain's the page
// other resources.
// However to speed up testing, when running the app in dev with Metro, it is possible
// to work on the HTML file directly by specifying it's path in the import just below.
// Uncomment the line and the piece of code using it.
// import htmlModule from "!/stickers/sticker.html";

import stickerZip from "!/stickers/single-die-sticker.zip";
import Pathname from "~/features/files/Pathname";
import { requestUserFileAsync } from "~/features/files/requestUserFileAsync";
import { unzipAssetAsync } from "~/features/files/unzipAssetAsync";
import { shareFileAsync } from "~/features/shareFileAsync";

/**
 * Print label with actual printer or to PDF file.
 * @param opt.width Width of the single page in pixels.
 *                  Defaults to `612` which is the width of US Letter paper format with 72 PPI.
 * @param opt.height Height of the single page in pixels.
 *                   Defaults to `792` which is the height of US Letter paper format with 72 PPI.
 * @param opt.pdf Whether to print to a PDF file instead of using an actual printer.
 */
export async function printStickerAsync(opt?: {
  width?: number;
  height?: number;
  pdf?: boolean;
}): Promise<void> {
  const width = opt?.width;
  const height = opt?.height;
  const pdf = opt?.pdf ?? false;

  if (!FileSystem.cacheDirectory) {
    throw new Error(`printLabelAsync: FileSystem.cacheDirectory is null`);
  }

  // Load zip file and unzip
  console.log("Unzipping sticker asset");
  const assets = await Asset.loadAsync(stickerZip);
  if (!assets[0]) {
    throw new Error("printLabelAsync: no asset loaded for sticker zip file");
  }

  // HTML contents
  let html = "";

  // Temporary directory for unzipping files
  const tempDir = await Pathname.generateTempPathnameAsync("/");
  try {
    await unzipAssetAsync(assets[0], tempDir);

    // Get list of files
    const files = await FileSystem.readDirectoryAsync(tempDir);

    // Get HTML file
    const htmlFile = files.find((f) => f.endsWith(".html"));
    if (!htmlFile) {
      throw new Error("printLabelAsync: HTML file not found");
    }

    // And load it
    console.log("Reading " + htmlFile);
    html = await FileSystem.readAsStringAsync(tempDir + htmlFile);
    // Comment line above and uncomment below to load HTML from embedded asset
    // const htmlAssets = await Asset.loadAsync(htmlModule);
    // const uri = htmlAssets[0].localUri;
    // if (!uri) {
    //   throw new Error("printLabelAsync: no asset loaded for HTML file");
    // }
    // html = await FileSystem.readAsStringAsync(uri);

    // Embed external files in HTML as base61 string
    const embedFiles = async (prefix: string, dataType: string) => {
      let pos = 0;
      while (true) {
        pos = html.indexOf(prefix + '"', pos);
        if (pos < 0) {
          break;
        }
        const start = pos + prefix.length + 1;
        const end = html.indexOf('"', start);
        const filename = html.substring(start, end);
        if (files.includes(filename)) {
          console.log("Embedding " + filename);
          const uri = tempDir + filename;
          const data = await FileSystem.readAsStringAsync(uri, {
            encoding: FileSystem.EncodingType.Base64,
          });
          const imageData = `data:${dataType};base64,` + data;
          html = html.substring(0, start) + imageData + html.substring(end);
          pos += imageData.length + end - start;
        } else {
          console.warn(filename + " not found");
        }
      }
    };

    // Replace file references by base64 data
    await embedFiles("src=", "image/png");
    await embedFiles("url(", "font/ttf");
  } finally {
    // Clean up temp folder
    await FileSystem.deleteAsync(tempDir, { idempotent: true });
  }

  // Print
  console.log("Printing");
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
