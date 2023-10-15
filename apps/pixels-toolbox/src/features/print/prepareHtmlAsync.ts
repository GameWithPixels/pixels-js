import * as FileSystem from "expo-file-system";

// By default the HTML for the label is loaded from the same zip file that contain's
// the page other resources.
// However to speed up testing, when running the app in dev with Metro, it is possible
// to work on the HTML file directly by specifying it's path in the import just below.
// Uncomment the line and the piece of code using it.
// import htmlModule from "!/labels/index.html";

import { ProductIds } from "./loadCertificationIds";

import cartonLabelHtmlZip from "!/labels/carton-label.zip";
import dieLabelHtmlZip from "!/labels/single-die-label.zip";
import Pathname from "~/features/files/Pathname";
import { loadFileFromModuleAsync } from "~/features/files/loadFileFromModuleAsync";
import { unzipFileAsync } from "~/features/files/unzipFileAsync";

const htmlCache = new Map<number | string, string>();

async function readHtml(htmlModuleId: number | string): Promise<string> {
  if (!FileSystem.cacheDirectory) {
    throw new Error("prepareHtmlAsync: FileSystem.cacheDirectory is null");
  }

  console.log("Unzipping label files");

  // Get file from asset
  const info = await loadFileFromModuleAsync(htmlModuleId, "prepareHtmlAsync");

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
      throw new Error("prepareHtmlAsync: HTML file not found");
    }

    // And load it
    console.log("Reading " + htmlFile);
    html = await FileSystem.readAsStringAsync(tempDir + htmlFile);
    // Comment line above and uncomment below to load HTML from embedded asset
    // const htmlAssets = await Asset.loadAsync(htmlModule);
    // const uri = htmlAssets[0].localUri;
    // if (!uri) {
    //   throw new Error("prepareHtmlAsync: no asset loaded for HTML file");
    // }
    // html = await FileSystem.readAsStringAsync(uri);

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
          if (!filename.includes("barcode")) {
            console.warn(filename + " not found");
          }
          pos = end;
        }
      }
    };

    // Replace file references by base64 data
    await embedFiles("src=", "image/png");
    await embedFiles("url(", "font/ttf");

    // Load barcode scripts
    console.log("Loading barcode script");
    const jsBarcode = await FileSystem.readAsStringAsync(
      tempDir + "JsBarcode.all.min.js"
    );
    // And embed it HTML
    console.log("Inserting barcodes");
    const parts = html.split("</body>");
    if (parts.length !== 2) {
      throw new Error("prepareHtmlAsync: end body tag not found");
    }
    html = parts[0] + `<script>\n${jsBarcode}\n</script>\n</body>` + parts[1];
  } finally {
    // Clean up temp folder
    await FileSystem.deleteAsync(tempDir, { idempotent: true });
  }

  return html;
}

/**
 * Read HTML from label ZIP file and embed resources into it.
 * Using https://lindell.me/JsBarcode/ for generating the barcode.
 */
async function prepareHtmlAsync(
  htmlModuleId: number | string,
  substitutions?: Record<string, string>,
  barcodes?: {
    format: string;
    value: string;
    arguments?: string;
    placeholder: string;
    scale?: number;
  }[]
) {
  let html = htmlCache.get(htmlModuleId) ?? (await readHtml(htmlModuleId));
  htmlCache.set(htmlModuleId, html);

  // Apply substitutions
  if (substitutions) {
    Object.entries(substitutions).forEach(([k, v]) => {
      console.log(`Replacing \`${k}\` by \`${v}\``);
      html = html.replace(k, v);
    });
  }

  // Insert barcodes
  if (barcodes) {
    const parts = html.split("</body>");
    if (parts.length !== 2) {
      throw new Error("prepareHtmlAsync: end body tag not found");
    }
    html =
      parts[0] +
      barcodes
        .map(
          (bc, i) =>
            ` <script>
                JsBarcode("#barcode_${i + 1}", "${bc.value}", {
                  format: "${bc.format}", ${bc.arguments ?? ""}
                })
              </script>\n`
        )
        .join() +
      "</body>" +
      parts[1];

    // Insert barcode SVG element
    barcodes.forEach((bc, i) => {
      // Insert barcode
      const barcodeIndex = html.indexOf(`"${bc.placeholder}"`);
      if (barcodeIndex < 0) {
        throw new Error("prepareHtmlAsync: barcode image not found");
      }
      const barcodeStart = html.lastIndexOf("<img", barcodeIndex);
      const barcodeBeforeClass = html.indexOf("class=", barcodeIndex);
      const barcodeEnd = html.indexOf(">", barcodeIndex) + 1;
      if (barcodeStart < 0 || barcodeEnd <= 0) {
        throw new Error("prepareHtmlAsync: barcode image tag not found");
      }
      const scale = bc.scale;
      html =
        html.substring(0, barcodeStart) +
        // Use 2 nested SVG tags so CSS transform works properly
        "<svg " +
        html.substring(barcodeBeforeClass, barcodeEnd) +
        (scale ? `<g transform="scale(${scale}, ${scale})">` : "") +
        `<svg id="barcode_${i + 1}"></svg>` +
        (scale ? "</g>" : "") +
        "</svg>" +
        html.substring(barcodeEnd);
    });
  }

  return html;
}

export async function prepareDieLabelHtmlAsync(
  product: ProductIds & {
    deviceId: string;
    deviceName: string;
    dieTypeImageFilename: string;
  }
): Promise<string> {
  const substitutions = {
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
  };
  const barcodes = [
    {
      format: "upc",
      value: product.upcCode,
      arguments: `font: "Roboto Condensed", margin: 0, marginLeft: 25`,
      placeholder: "barcode-00850055703353.gif",
    },
    {
      format: "code39",
      value: product.deviceId.toLocaleUpperCase(),
      arguments: "displayValue: false, height: 30, margin: 0, marginLeft: 45",
      placeholder: "pixel-id-barcode.png",
    },
  ];
  return await prepareHtmlAsync(dieLabelHtmlZip, substitutions, barcodes);
}

export async function prepareCartonLabelHtmlAsync(
  product: ProductIds & {
    dieTypeImageFilename: string;
    asn: string;
  }
): Promise<string> {
  const substitutions = {
    "PIPPED D6 - MIDNIGHT GALAXY": product.name.toLocaleUpperCase(),
    "PXL-D10A-OB": product.model,
    "label-icon-d6pipped.png": product.dieTypeImageFilename,
    FASN0000012345: product.asn,
  };
  const barcodes = [
    {
      format: "upc",
      value: product.upcCode,
      arguments: `font: "Roboto Condensed", height: 90, margin: 0, marginLeft: 15`,
      placeholder: "barcode-00850055703353.gif",
      scale: 2,
    },
  ];
  return await prepareHtmlAsync(cartonLabelHtmlZip, substitutions, barcodes);
}
