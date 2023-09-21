import { Pixel } from "@systemic-games/react-native-pixels-connect";
import { printHtmlToZpl } from "@systemic-games/react-native-zpl-print";

import { getDeviceId } from "../pixels/getDeviceId";

import {
  ProductIds,
  loadCertificationIds,
} from "~/features/labels/loadCertificationIds";
import { readLabelHtmlAsync } from "~/features/labels/readLabelHtmlAsync";

let _getProductIds: ((name: string) => ProductIds | undefined) | undefined;

/**
 * Print customized label for a given Pixels die.
 *
 * Print configuration:
 * Using "Diagnostic Tools" click on "Factory Default" and then "Calibrate Sensor".
 * Once the calibration popup opens, click on "Calibrate" and close the popup.
 * Then select "mm" in the top bar Unit frame, select the "Z" tab and change "Paper Width" to 800.
 *
 * @param pixel The Pixel to use.
 * @param statusCallback An optional callback called with the printing status.
 * @returns A promise resolving when the data has been send to the printer.
 */
export async function printLabelAsync(
  pixel: Pixel,
  statusCallback?: (status: "preparing" | "sending" | "done") => void
): Promise<void> {
  // Read HTML file
  statusCallback?.("preparing");
  // Read certification ids
  if (!_getProductIds) {
    _getProductIds = await loadCertificationIds();
  }
  // Get product ids
  const showProductName = pixel.dieType + "-midnightgalaxy";
  //  `${pixel.dieType} ${pixel.designAndColor.split(/(?=[A-Z])/).join(" ")}`
  const product = _getProductIds(showProductName);
  if (product) {
    const html = await readLabelHtmlAsync({
      ...product,
      deviceId: getDeviceId(pixel),
      deviceName: pixel.name,
      dieTypeImageFilename: "label-icon-" + pixel.dieType + ".png",
    });
    // And send to printer
    statusCallback?.("sending");
    const result = await printHtmlToZpl("XP-", html, {
      enableJs: true,
      imageWidth: 940,
    });
    if (result !== "success") {
      throw new Error("Print error: " + result);
    }
    statusCallback?.("done");
  } else {
    throw new Error(`Unknown product '${showProductName}'`);
  }
}
