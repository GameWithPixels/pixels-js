import { Asset } from "expo-asset";
import * as FileSystem from "expo-file-system";

// By default the sticker HTML is loaded from the same zip file that contain's the page
// other resources.
// However to speed up testing, when running the app in dev with Metro, it is possible
// to work on the HTML file directly by specifying it's path in the import just below.
// Uncomment the line and the piece of code using it.
// import htmlModule from "!/stickers/sticker.html";

import { ProductIds } from "./loadCertificationIds";

import stickerZip from "!/stickers/single-die-sticker.zip";
import Pathname from "~/features/files/Pathname";
import { unzipAssetAsync } from "~/features/files/unzipAssetAsync";

/**
 * Read HTML from sticker file and embed resources.
 * Using https://lindell.me/JsBarcode/ for generating the barcode.
 */
export async function readStickerHtmlAsync(
  product: ProductIds & { deviceId: string; deviceName: string }
): Promise<string> {
  if (!FileSystem.cacheDirectory) {
    throw new Error("readStickerHtmlAsync: FileSystem.cacheDirectory is null");
  }

  // Load zip file and unzip
  console.log("Unzipping sticker asset");
  const assets = await Asset.loadAsync(stickerZip);
  if (!assets[0]) {
    throw new Error(
      "readStickerHtmlAsync: No asset loaded for sticker zip file"
    );
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
      throw new Error("readStickerHtmlAsync: HTML file not found");
    }

    // And load it
    console.log("Reading " + htmlFile);
    html = await FileSystem.readAsStringAsync(tempDir + htmlFile);
    // Comment line above and uncomment below to load HTML from embedded asset
    // const htmlAssets = await Asset.loadAsync(htmlModule);
    // const uri = htmlAssets[0].localUri;
    // if (!uri) {
    //   throw new Error("readStickerHtmlAsync: no asset loaded for HTML file");
    // }
    // html = await FileSystem.readAsStringAsync(uri);

    // Replace product ids
    Object.entries({
      "PIPPED D6 - MIDNIGHT GALAXY": product.name,
      "PXL-DP6A-MG-040-4023": product.model,
      "2BB52-PXLDP6A": product.fccId,
      "2BB52-PXLDP6B": product.icId,
      "PXL20-12345678": product.deviceId,
      "GROK STONEBREAKER": product.deviceName,
    }).forEach(([k, v]) => {
      html = html.replace(k, v.toLocaleUpperCase());
      console.log(`Replacing ${k} by ${v}`);
    });
    // Load barcode script
    const jsBarcode = await FileSystem.readAsStringAsync(
      tempDir + "JsBarcode.ean-upc.min.js"
    );
    // And embed it HTML
    console.log("Inserting barcode");
    const parts = html.split("</body>");
    if (parts.length !== 2) {
      throw new Error("readStickerHtmlAsync: end body tag not found");
    }
    html =
      parts[0] +
      `<script>\n${jsBarcode}\n</script>\n` +
      `<script>
        JsBarcode("#barcode", "${product.upcCode}", {
          format: "upc", font: "Roboto Condensed"
        })
      </script>\n` +
      parts[1];

    // Insert barcode
    const barcodeIndex = html.indexOf('"barcode-00850055703353.gif"');
    if (barcodeIndex < 0) {
      throw new Error("readStickerHtmlAsync: barcode image not found");
    }
    const barcodeStart = html.lastIndexOf("<img", barcodeIndex);
    const barcodeEnd = html.indexOf(">", barcodeIndex) + 1;
    if (barcodeStart < 0 || barcodeEnd <= 0) {
      throw new Error("readStickerHtmlAsync: barcode image tag not found");
    }
    html =
      html.substring(0, barcodeStart) +
      '<svg id="barcode" class="gwd-img-sq5f gwd-img-u4dl"></svg>' +
      html.substring(barcodeEnd);

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