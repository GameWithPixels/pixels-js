import * as FileSystem from "expo-file-system";

// By default the HTML for the label is loaded from the same zip file that contain's
// the page other resources.
// However to speed up testing, when running the app in dev with Metro, it is possible
// to work on the HTML file directly by specifying it's path in the import just below.
// Uncomment the line and the piece of code using it.
// import htmlModule from "!/labels/index.html";

import { ProductIds } from "./loadCertificationIds";

import labelHtmlZip from "!/labels/single-die-label.zip";
import Pathname from "~/features/files/Pathname";
import { loadFileFromModuleAsync } from "~/features/files/loadFileFromModuleAsync";
import { unzipFileAsync } from "~/features/files/unzipFileAsync";

/**
 * Read HTML from label ZIP file and embed resources into it.
 * Using https://lindell.me/JsBarcode/ for generating the barcode.
 */
export async function readLabelHtmlAsync(
  product: ProductIds & {
    deviceId: string;
    deviceName: string;
    dieTypeImageFilename: string;
  }
): Promise<string> {
  if (!FileSystem.cacheDirectory) {
    throw new Error("readLabelHtmlAsync: FileSystem.cacheDirectory is null");
  }

  console.log("Unzipping label files");

  // Get file from asset
  const info = await loadFileFromModuleAsync(
    labelHtmlZip,
    "readLabelHtmlAsync"
  );

  // HTML contents
  let html = "";

  // Temporary directory for unzipping files
  const tempDir = await Pathname.generateTempPathnameAsync("/");
  try {
    // Unzip
    await unzipFileAsync(info.uri, tempDir);

    // Get list of files
    const files = await FileSystem.readDirectoryAsync(tempDir);

    // Get HTML file
    const htmlFile = files.find((f) => f.endsWith(".html"));
    if (!htmlFile) {
      throw new Error("readLabelHtmlAsync: HTML file not found");
    }

    // And load it
    console.log("Reading " + htmlFile);
    html = await FileSystem.readAsStringAsync(tempDir + htmlFile);
    // Comment line above and uncomment below to load HTML from embedded asset
    // const htmlAssets = await Asset.loadAsync(htmlModule);
    // const uri = htmlAssets[0].localUri;
    // if (!uri) {
    //   throw new Error("readLabelHtmlAsync: no asset loaded for HTML file");
    // }
    // html = await FileSystem.readAsStringAsync(uri);

    // Replace product ids
    Object.entries({
      "PIPPED D6 - MIDNIGHT GALAXY": product.name.toLocaleUpperCase(),
      "PXL-DP6A (MG)": product.model,
      "label-icon-d6pipped.png": product.dieTypeImageFilename,
      "-MG-": product.colorInitials,
      "2BB52-PXLDIEA": product.fccId1,
      "2BB52-CHG001A": product.fccId2,
      "31060-PXLDIEA": product.icId1,
      "31060-CHG001A": product.icId2,
      "PXL20-12345678": product.deviceId.toLocaleUpperCase(),
      "GROK STONEBREAKER!": product.deviceName.toLocaleUpperCase(),
    }).forEach(([k, v]) => {
      html = html.replace(k, v);
      console.log(`Replacing \`${k}\` by \`${v}\``);
    });
    // Load barcode scripts
    const jsBarcode = await FileSystem.readAsStringAsync(
      tempDir + "JsBarcode.all.min.js"
    );
    // And embed it HTML
    console.log("Inserting barcode");
    const parts = html.split("</body>");
    if (parts.length !== 2) {
      throw new Error("readLabelHtmlAsync: end body tag not found");
    }
    html =
      parts[0] +
      `<script>\n${jsBarcode}\n</script>\n` +
      `<script>
        JsBarcode("#barcode_upc", "${product.upcCode}", {
          format: "upc", font: "Roboto Condensed", margin: 0, marginLeft: 25
        })
      </script>\n` +
      `<script>
        JsBarcode("#barcode_sn", "${product.deviceId.toLocaleUpperCase()}", {
          format: "code39", displayValue: false, height: 30, margin: 0, marginLeft: 45
        })
      </script>\n` +
      parts[1];

    const replaceBarcode = (
      placeHolderFile: string,
      id: string,
      styleClass: string
    ) => {
      // Insert barcode
      const barcodeIndex = html.indexOf(`"${placeHolderFile}"`);
      if (barcodeIndex < 0) {
        throw new Error("readLabelHtmlAsync: barcode image not found");
      }
      const barcodeStart = html.lastIndexOf("<img", barcodeIndex);
      const barcodeEnd = html.indexOf(">", barcodeIndex) + 1;
      if (barcodeStart < 0 || barcodeEnd <= 0) {
        throw new Error("readLabelHtmlAsync: barcode image tag not found");
      }
      html =
        html.substring(0, barcodeStart) +
        // Use 2 nested SVG tags so CSS transform works properly
        `<svg class="${styleClass}">` +
        `<svg id="${id}"></svg>` + //
        "</svg>" +
        html.substring(barcodeEnd);
    };

    replaceBarcode(
      "barcode-00850055703353.gif",
      "barcode_upc",
      "gwd-img-sq5f gwd-img-u4dl"
    );

    replaceBarcode(
      "pixel-id-barcode.png",
      "barcode_sn",
      "gwd-img-1ui0 gwd-img-17g5"
    );

    // Embed external files in HTML as base64 string
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