import { Asset } from "expo-asset";
import * as FileSystem from "expo-file-system";

// By default the sticker HTML is loaded from the same zip file that contain's the page
// other resources.
// However to speed up testing, when running the app in dev with Metro, it is possible
// to work on the HTML file directly by specifying it's path in the import just below.
// Uncomment the line and the piece of code using it.
// import htmlModule from "!/stickers/sticker.html";

import stickerZip from "!/stickers/single-die-sticker.zip";
import Pathname from "~/features/files/Pathname";
import { unzipAssetAsync } from "~/features/files/unzipAssetAsync";

/**
 * Read HTML from sticker file and embed resources.
 */
export async function readStickerHtmlAsync(): Promise<string> {
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
          pos = end;
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

  return html;
}
