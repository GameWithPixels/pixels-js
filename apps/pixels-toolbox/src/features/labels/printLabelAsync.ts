import { PixelInfo } from "@systemic-games/react-native-pixels-connect";
import { printHtmlToZpl } from "@systemic-games/react-native-zpl-print";

import { getDeviceId } from "../pixels/getDeviceId";

import {
  ProductIds,
  loadCertificationIds,
} from "~/features/labels/loadCertificationIds";
import { readLabelHtmlAsync } from "~/features/labels/readLabelHtmlAsync";

let _getProductIds: ((name: string) => ProductIds | undefined) | undefined;

export class PrintError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PrintError";
  }
}

export type PrintStatus = "preparing" | "sending" | "done";

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
 * @param pixel The Pixel to use.
 * @param statusCallback An optional callback called with the printing status.
 * @returns A promise resolving when the data has been send to the printer.
 */
export async function printLabelAsync(
  pixel: Pick<PixelInfo, "pixelId" | "name" | "colorway" | "dieType">,
  statusCallback?: (status: PrintStatus) => void
): Promise<void> {
  // Read HTML file
  statusCallback?.("preparing");
  // Read certification ids
  if (!_getProductIds) {
    _getProductIds = await loadCertificationIds();
  }
  // Get product ids
  const showProductName = `${pixel.dieType}-${pixel.colorway}`.toLowerCase();
  const product = _getProductIds(showProductName);
  if (product) {
    const html = await readLabelHtmlAsync({
      ...product,
      deviceId: getDeviceId(pixel.pixelId),
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
      throw new PrintError(result);
    }
    statusCallback?.("done");
  } else {
    throw new PrintError(`Unknown product '${showProductName}'`);
  }
}
