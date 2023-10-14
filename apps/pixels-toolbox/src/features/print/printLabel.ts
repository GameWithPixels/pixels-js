import { PixelInfo } from "@systemic-games/react-native-pixels-connect";
import { printHtmlToZpl } from "@systemic-games/react-native-zpl-print";

import { getProductName } from "./getProductName";
import { loadCertificationIds, ProductIds } from "./loadCertificationIds";
import {
  prepareDieLabelHtmlAsync,
  prepareCartonLabelHtmlAsync,
} from "./prepareHtmlAsync";
import { PrintError, PrintStatus, UnknownProductPrintError } from "./types";

import { getDeviceId } from "~/features/pixels/getDeviceId";

export async function printLabelAsync(
  pixelInfo: Pick<PixelInfo, "colorway" | "dieType">,
  getHtml: (productIds: ProductIds) => Promise<string>,
  statusCallback?: (status: PrintStatus) => void
): Promise<void> {
  statusCallback?.("preparing");
  // Read certification ids
  const getProductIds = await loadCertificationIds();
  // Get product ids
  const name = getProductName(pixelInfo);
  const productIds = getProductIds(name);
  if (productIds) {
    // Read HTML file
    const html = await getHtml(productIds);
    // And send to printer
    statusCallback?.("sending");
    console.log("Sending HTML to BLuetooth ZPL printer");
    const result = await printHtmlToZpl("XP-", html, {
      enableJs: true,
      imageWidth: 940,
    });
    const success = result === "success";
    statusCallback?.(success ? "done" : "error");
    if (!success) {
      throw new PrintError(result);
    }
  } else {
    throw new UnknownProductPrintError(name);
  }
}

/**
 * Print customized label for a given Pixels die.
 *
 * Print configuration:
 * Using "Diagnostic Tools" click on "Factory Default" and then "Calibrate Sensor".
 * Once the calibration popup opens, click on "Calibrate" and close the popup.
 *
 * Optional:
 * To set the paper width,  select "mm" in the top bar Unit frame, select the "Z" tab
 * and change "Paper Width" to 800.
 *
 * @param pixelInfo Some information about the Pixel for which to print the label.
 * @param statusCallback An optional callback called with the printing status.
 * @returns A promise resolving when the data has been send to the printer.
 */
export async function printDieBoxLabelAsync(
  pixelInfo: Pick<PixelInfo, "pixelId" | "name" | "colorway" | "dieType">,
  statusCallback?: (status: PrintStatus) => void
): Promise<void> {
  await printLabelAsync(
    pixelInfo,
    (product) =>
      prepareDieLabelHtmlAsync({
        ...product,
        deviceId: getDeviceId(pixelInfo.pixelId),
        deviceName: pixelInfo.name,
        dieTypeImageFilename: "label-icon-" + pixelInfo.dieType + ".png",
      }),
    statusCallback
  );
}

export async function printCartonLabelAsync(
  pixelInfo: Pick<PixelInfo, "colorway" | "dieType">,
  asn: string,
  statusCallback?: (status: PrintStatus) => void
): Promise<void> {
  await printLabelAsync(
    pixelInfo,
    (product) =>
      prepareCartonLabelHtmlAsync({
        ...product,
        dieTypeImageFilename: "label-icon-" + pixelInfo.dieType + ".png",
        asn,
      }),
    statusCallback
  );
}
