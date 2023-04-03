import { PixelInfo } from "./PixelInfo";

/**
 * Returns a unique name for a Pixel, mostly to be used for sorting purposes.
 * @param pixel An object representing a Pixel.
 * @returns A name guaranteed to be unique across Pixel peripherals.
 */
export default function (pixel: Pick<PixelInfo, "pixelId" | "name">) {
  return `${pixel.name}$[${pixel.pixelId}]`;
}
