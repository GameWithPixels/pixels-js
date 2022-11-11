import { IPixel } from "./Pixel";

/**
 * Returns a unique name for a Pixel, mostly to be used for sorting purposes.
 * @param pixel An object representing a Pixel.
 * @returns A name guaranteed to be unique across Pixel peripherals.
 */
export default function (pixel: Pick<IPixel, "pixelId" | "name">) {
  return `${pixel.name}$[${pixel.pixelId}]`;
}
