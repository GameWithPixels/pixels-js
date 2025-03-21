import { assert } from "@systemic-games/pixels-core-utils";
import {
  getPixelsBootloaderAdvertisedName,
  PixelDieType,
} from "@systemic-games/react-native-pixels-connect";
import { printHtmlToZpl } from "@systemic-games/react-native-zpl-print";

import { getProductName } from "./getProductName";
import { loadCertificationIds, ProductIds } from "./loadCertificationIds";
import {
  prepareDieLabelHtmlAsync,
  prepareCartonLabelHtmlAsync,
  prepareDiceSetLabelHtmlAsync,
  prepareSmallDieLabelHtmlAsync,
} from "./prepareHtmlAsync";
import { PrintError, PrintStatus, UnknownProductPrintError } from "./types";

import { getDiceSetDiceList } from "~/features/set";
import { ProductInfo } from "~/features/validation";

function getImageFilename(dieType: PixelDieType): string {
  assert(dieType !== "unknown", "getImageFilename: dieType is unknown");
  return `label-icon-${dieType}.png`;
}

export type PrintOptions = {
  statusCallback?: (status: PrintStatus) => void;
  smallLabel?: boolean;
};

export async function printLabelAsync(
  productInfo: ProductInfo,
  getHtml: (productIds: ProductIds) => Promise<string>,
  numCopies: number,
  opt?: PrintOptions
): Promise<void> {
  const { statusCallback, smallLabel } = opt ?? {};
  statusCallback?.("preparing");
  // Read certification ids
  const getProductIds = await loadCertificationIds();
  // Get product ids
  const name = getProductName(productInfo);
  const productIds = getProductIds(name);
  if (productIds) {
    // Read HTML file
    const html = await getHtml(productIds);
    // And send to printer
    statusCallback?.("sending");
    console.log("Sending HTML to BLuetooth ZPL printer");
    const result = await printHtmlToZpl("XP-", html, {
      enableJs: true,
      imageWidth: smallLabel ? 411 : 940,
      numCopies,
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
 * and change "Paper Width" to 800. 75.95
 *
 * @param pixelInfo Some information about the Pixel for which to print the label.
 * @param statusCallback An optional callback called with the printing status.
 * @param numCopies The number of copies to print.
 * @returns A promise resolving when the data has been send to the printer.
 */
export async function printDieBoxLabelAsync(
  dieInfo: Extract<ProductInfo, { kind: "dieWithId" }>,
  numCopies: number,
  opt?: PrintOptions
): Promise<void> {
  const prepareLabel = opt?.smallLabel
    ? prepareSmallDieLabelHtmlAsync
    : prepareDieLabelHtmlAsync;
  await printLabelAsync(
    dieInfo,
    (product) =>
      prepareLabel({
        ...product,
        deviceId: getPixelsBootloaderAdvertisedName("die", dieInfo.pixelId),
        deviceName: dieInfo.name,
        dieImageFilename: getImageFilename(dieInfo.type),
      }),
    numCopies,
    opt
  );
}

export async function printDiceSetBoxLabelAsync(
  setInfo: Extract<ProductInfo, { kind: "lcc" }>,
  numCopies: number,
  opt?: Omit<PrintOptions, "smallLabel">
): Promise<void> {
  const diceList = getDiceSetDiceList(setInfo.type);
  await printLabelAsync(
    setInfo,
    (product) =>
      prepareDiceSetLabelHtmlAsync({
        ...product,
        diceImageFilenames: diceList.map(getImageFilename),
      }),
    numCopies,
    opt
  );
}

export async function printCartonLabelAsync(
  productInfo: ProductInfo,
  asn: string,
  quantity: number,
  numCopies: number,
  opt?: Omit<PrintOptions, "smallLabel">
): Promise<void> {
  await printLabelAsync(
    productInfo,
    (product) =>
      prepareCartonLabelHtmlAsync({
        ...product,
        asn,
        quantity,
      }),
    numCopies,
    opt
  );
}
