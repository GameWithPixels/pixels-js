import { Pixel } from "@systemic-games/react-native-pixels-connect";
import { printHtmlToZpl } from "@systemic-games/react-native-zpl-print";

import { getDeviceId } from "../pixels/getDeviceId";

import {
  ProductIds,
  loadCertificationIds,
} from "~/features/stickers/loadCertificationIds";
import { readStickerHtmlAsync } from "~/features/stickers/readStickerHtmlAsync";

let _getProductIds: ((name: string) => ProductIds | undefined) | undefined;

export async function printStickerAsync(
  pixel: Pixel,
  statusCallback: (status: "preparing" | "sending" | "done") => void
): Promise<void> {
  // Read HTML file
  statusCallback("preparing");
  // Read certification ids
  if (!_getProductIds) {
    _getProductIds = await loadCertificationIds();
  }
  // Get product ids
  const showProductName = "d10 aurora sky";
  // `${pixel.dieType} ${pixel.designAndColor.split(/(?=[A-Z])/).join(" ")}`
  const product = _getProductIds(showProductName);
  if (product) {
    const html = await readStickerHtmlAsync({
      ...product,
      deviceId: getDeviceId(pixel),
      deviceName: pixel.name,
    });
    // And send to printer
    statusCallback("sending");
    const result = await printHtmlToZpl("XP-", html, {
      enableJs: true,
      imageWidth: 940,
    });
    if (result !== "success") {
      throw new Error("Printing failed: " + result);
    }
    statusCallback("done");
  } else {
    throw new Error(`Unknown product '${showProductName}'`);
  }
}
