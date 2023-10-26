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
const embeddedFilesCache = new Map<string, string>();

async function parseHtmlForTagsWithResource(
  html: string,
  prefix: string,
  callback: (start: number, end: number) => Promise<string>
) {
  let pos = 0;
  while (true) {
    // Search for prefix followed by quotes
    pos = html.indexOf(prefix + '"', pos);
    if (pos < 0) {
      break;
    }
    // Search for end quotes
    const start = pos + prefix.length + 1;
    const end = html.indexOf('"', start);
    if (end < 0) {
      throw new Error("parseHtmlForTags: Matching end quotes not found");
    }
    const newHtml = await callback(start, end);
    pos = end + newHtml.length - html.length;
    html = newHtml;
  }
}

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

    // Read external files referenced by HTML as base64 string
    const readFiles = (prefix: string, dataType: string) =>
      parseHtmlForTagsWithResource(html, prefix, async (start, end) => {
        const filename = html.substring(start, end);
        if (files.includes(filename)) {
          console.log("Reading " + filename);
          const uri = tempDir + filename;
          const data = await FileSystem.readAsStringAsync(uri, {
            encoding: FileSystem.EncodingType.Base64,
          });
          embeddedFilesCache.set(filename, `data:${dataType};base64,` + data);
        }
        return html;
      });
    await readFiles("src=", "image/png");
    await readFiles("url(", "font/ttf");

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
  barcodeDescriptors?: {
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
  if (barcodeDescriptors) {
    const parts = html.split("</body>");
    if (parts.length !== 2) {
      throw new Error("prepareHtmlAsync: end body tag not found");
    }
    html =
      parts[0] +
      barcodeDescriptors
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
    barcodeDescriptors.forEach((bc, i) => {
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

  // Embed external files in HTML
  const embedFiles = (prefix: string) =>
    parseHtmlForTagsWithResource(html, prefix, async (start, end) => {
      const filename = html.substring(start, end);
      const base64Data = embeddedFilesCache.get(filename);
      if (base64Data) {
        console.log("Embedding " + filename);
        return html.substring(0, start) + base64Data + html.substring(end);
      } else {
        console.warn(filename + " not found");
        return html;
      }
    });
  await embedFiles("src=");
  await embedFiles("url(");

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
      arguments:
        'font: "Roboto Condensed", width: 2.5, margin: 0, marginLeft: 15',
      placeholder: "barcode-00850055703353.gif",
    },
    {
      format: "code39",
      value: product.deviceId.toLocaleUpperCase(),
      arguments:
        "displayValue: false, width: 2.4, height: 30, margin: 0, marginLeft: 0",
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
      arguments:
        'font: "Roboto Condensed", height: 90, margin: 0, marginLeft: 15',
      placeholder: "barcode-00850055703353.gif",
      scale: 2,
    },
  ];
  return await prepareHtmlAsync(cartonLabelHtmlZip, substitutions, barcodes);
}
